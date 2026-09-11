import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { Vibration } from 'react-native';

const TIMER_COMPLETE_SOUND = require('../../assets/sounds/timer-complete.mp3');

/** Short one-shot pulse — not a repeating pattern tied to SFX length. */
const VIBRATION_MS = 400;

let audioModeReady: Promise<void> | null = null;

function ensureAudioMode(): Promise<void> {
  if (!audioModeReady) {
    audioModeReady = setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
    }).catch(() => {
      // Playback may still work with the default session.
    });
  }
  return audioModeReady;
}

/**
 * Plays the timer-complete SFX and a single short vibration pulse.
 * Safe to call once per completed timer (including concurrent completions).
 */
export function playTimerCompleteFeedback(): void {
  Vibration.vibrate(VIBRATION_MS);

  void (async () => {
    try {
      await ensureAudioMode();
      const player = createAudioPlayer(TIMER_COMPLETE_SOUND, {
        keepAudioSessionActive: true,
      });

      const releasePlayer = () => {
        try {
          player.remove();
        } catch {
          // Already released on some platforms.
        }
        try {
          player.release();
        } catch {
          // Ignore double-release.
        }
      };

      const subscription = player.addListener('playbackStatusUpdate', (status) => {
        if (!status.didJustFinish) return;
        subscription.remove();
        clearTimeout(fallback);
        releasePlayer();
      });

      // Safety net if status events are missed.
      const fallback = setTimeout(() => {
        subscription.remove();
        releasePlayer();
      }, 15_000);

      player.play();
    } catch {
      // Ignore playback failures so cooking continues uninterrupted.
    }
  })();
}
