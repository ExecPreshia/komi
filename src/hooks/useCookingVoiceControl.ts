import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import * as Speech from 'expo-speech';

import type { AppLocale } from '@/i18n/types';
import { useKomiStore } from '@/store/komi-store';
import {
  matchCookingVoiceCommand,
  VOICE_CONTEXTUAL_STRINGS,
  VOICE_SPEECH_LANG,
} from '@/utils/cooking-voice-commands';

type VoiceHandlers = {
  onNext: () => void;
  onPrev: () => void;
  onReadInstruction: () => string;
  onStartTimer: () => void;
};

type SpeechRecognitionResultEvent = {
  isFinal: boolean;
  results: { transcript?: string }[];
};

type SpeechRecognitionErrorEvent = {
  error: string;
  message?: string;
};

type SpeechRecognitionNativeModule = {
  isRecognitionAvailable: () => boolean;
  start: (options: Record<string, unknown>) => void;
  abort: () => void;
  stop: () => void;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  addListener: (
    eventName: string,
    listener: (event: never) => void,
  ) => { remove: () => void };
};

/**
 * Optional native module — null in Expo Go where expo-speech-recognition is not linked.
 * Avoid importing `expo-speech-recognition` directly; that calls requireNativeModule and throws.
 */
const SpeechRecognition = requireOptionalNativeModule(
  'ExpoSpeechRecognition',
) as SpeechRecognitionNativeModule | null;

function isSpeechRecognitionAvailable(): boolean {
  if (!SpeechRecognition) return false;
  try {
    return SpeechRecognition.isRecognitionAvailable();
  } catch {
    return false;
  }
}

/**
 * Hands-free Cooking Mode voice loop: listen → match → act → keep listening.
 * Recognition language and command phrases follow the app locale (FR / EN).
 * No-ops safely when the native speech-recognition module is unavailable (Expo Go).
 */
export function useCookingVoiceControl(enabled: boolean, handlers: VoiceHandlers) {
  const locale = useKomiStore((state) => state.locale);
  const [listening, setListening] = useState(false);
  const [unavailable, setUnavailable] = useState(() => !SpeechRecognition);
  const enabledRef = useRef(enabled);
  const localeRef = useRef<AppLocale>(locale);
  const speakingRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCommandAtRef = useRef(0);
  const handlersRef = useRef(handlers);
  const scheduleRestartRef = useRef<() => void>(() => undefined);
  const stopListeningRef = useRef<() => void>(() => undefined);
  handlersRef.current = handlers;
  enabledRef.current = enabled;
  localeRef.current = locale;

  const clearRestart = useCallback(() => {
    if (restartTimerRef.current != null) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!enabledRef.current || speakingRef.current || !SpeechRecognition) return;
    if (!isSpeechRecognitionAvailable()) {
      setUnavailable(true);
      return;
    }
    const activeLocale = localeRef.current;
    try {
      SpeechRecognition.start({
        lang: VOICE_SPEECH_LANG[activeLocale],
        interimResults: false,
        continuous: Platform.OS === 'ios',
        addsPunctuation: false,
        contextualStrings: VOICE_CONTEXTUAL_STRINGS[activeLocale],
      });
    } catch {
      setUnavailable(true);
      setListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    clearRestart();
    if (SpeechRecognition) {
      try {
        SpeechRecognition.abort();
      } catch {
        // Already stopped or unavailable.
      }
    }
    setListening(false);
  }, [clearRestart]);

  const scheduleRestart = useCallback(() => {
    clearRestart();
    if (!enabledRef.current || speakingRef.current || !SpeechRecognition) return;
    restartTimerRef.current = setTimeout(() => {
      restartTimerRef.current = null;
      startListening();
    }, 280);
  }, [clearRestart, startListening]);

  scheduleRestartRef.current = scheduleRestart;
  stopListeningRef.current = stopListening;

  useEffect(() => {
    if (!SpeechRecognition) {
      setUnavailable(true);
      return;
    }

    const onStart = () => {
      if (enabledRef.current) setListening(true);
    };
    const onEnd = () => {
      setListening(false);
      if (enabledRef.current && !speakingRef.current) {
        scheduleRestartRef.current();
      }
    };
    const onError = (event: SpeechRecognitionErrorEvent) => {
      setListening(false);
      if (event.error === 'aborted') return;
      if (enabledRef.current && !speakingRef.current) {
        scheduleRestartRef.current();
      }
    };
    const onResult = (event: SpeechRecognitionResultEvent) => {
      if (!enabledRef.current || speakingRef.current) return;
      if (event.isFinal === false) return;

      const transcript = event.results?.[0]?.transcript?.trim() ?? '';
      if (!transcript) return;

      const command = matchCookingVoiceCommand(transcript, localeRef.current);
      if (!command) return;

      const now = Date.now();
      if (now - lastCommandAtRef.current < 700) return;
      lastCommandAtRef.current = now;

      const current = handlersRef.current;
      if (command === 'next') {
        current.onNext();
        return;
      }
      if (command === 'prev') {
        current.onPrev();
        return;
      }
      if (command === 'timer') {
        current.onStartTimer();
        return;
      }

      const text = current.onReadInstruction().trim();
      if (!text) return;

      speakingRef.current = true;
      stopListeningRef.current();
      void Speech.stop().finally(() => {
        Speech.speak(text, {
          language: VOICE_SPEECH_LANG[localeRef.current],
          rate: 0.95,
          onDone: () => {
            speakingRef.current = false;
            if (enabledRef.current) scheduleRestartRef.current();
          },
          onStopped: () => {
            speakingRef.current = false;
            if (enabledRef.current) scheduleRestartRef.current();
          },
          onError: () => {
            speakingRef.current = false;
            if (enabledRef.current) scheduleRestartRef.current();
          },
        });
      });
    };

    const subscriptions = [
      SpeechRecognition.addListener('start', onStart as (event: never) => void),
      SpeechRecognition.addListener('end', onEnd as (event: never) => void),
      SpeechRecognition.addListener('error', onError as (event: never) => void),
      SpeechRecognition.addListener('result', onResult as (event: never) => void),
    ];

    return () => {
      for (const subscription of subscriptions) {
        subscription.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      speakingRef.current = false;
      void Speech.stop();
      stopListening();
      return;
    }

    if (!SpeechRecognition) {
      setUnavailable(true);
      return;
    }

    let cancelled = false;

    (async () => {
      if (!isSpeechRecognitionAvailable()) {
        setUnavailable(true);
        return;
      }
      try {
        const permission = await SpeechRecognition.requestPermissionsAsync();
        if (cancelled) return;
        if (!permission.granted) {
          setUnavailable(true);
          return;
        }
        setUnavailable(false);
        // Restart so recognition language matches the current app locale.
        stopListening();
        startListening();
      } catch {
        if (!cancelled) setUnavailable(true);
      }
    })();

    return () => {
      cancelled = true;
      speakingRef.current = false;
      void Speech.stop();
      stopListening();
    };
  }, [enabled, locale, startListening, stopListening]);

  return { listening, unavailable };
}
