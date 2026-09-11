import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { Colors, Fonts, Radii, Shadows, Spacing } from '@/constants/theme';

type ToastListener = (message: string) => void;

let toastListener: ToastListener | null = null;

/** Show a transient bottom toast from any screen (survives navigation). */
export function showKomiToast(message: string) {
  toastListener?.(message);
}

/** Distance from the top of a sticky bottom element to the bottom of the window. */
const stickyClearances = new Map<string, number>();
const clearanceSubscribers = new Set<() => void>();

function notifyClearance() {
  for (const subscriber of clearanceSubscribers) {
    subscriber();
  }
}

function getMaxStickyClearance() {
  let max = 0;
  for (const value of stickyClearances.values()) {
    if (value > max) max = value;
  }
  return max;
}

function setStickyClearance(id: string, clearance: number) {
  const next = Math.max(0, Math.round(clearance));
  if (stickyClearances.get(id) === next) return;
  stickyClearances.set(id, next);
  notifyClearance();
}

function clearStickyClearance(id: string) {
  if (!stickyClearances.delete(id)) return;
  notifyClearance();
}

function useStickyBottomClearance() {
  const [clearance, setClearance] = useState(getMaxStickyClearance);

  useEffect(() => {
    const sync = () => setClearance(getMaxStickyClearance());
    clearanceSubscribers.add(sync);
    sync();
    return () => {
      clearanceSubscribers.delete(sync);
    };
  }, []);

  return clearance;
}

/**
 * Registers a bottom sticky region so success toasts sit just above it.
 * `extraTop` covers visual overflow above the layout box (e.g. raised tab FAB).
 */
export function ToastBottomAnchor({
  id,
  children,
  style,
  extraTop = 0,
}: {
  id: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  extraTop?: number;
}) {
  const ref = useRef<View>(null);

  const report = useCallback(() => {
    requestAnimationFrame(() => {
      ref.current?.measureInWindow((_x, y) => {
        const windowHeight = Dimensions.get('window').height;
        setStickyClearance(id, windowHeight - y + extraTop);
      });
    });
  }, [extraTop, id]);

  useEffect(() => () => clearStickyClearance(id), [id]);

  return (
    <View ref={ref} collapsable={false} style={style} onLayout={report}>
      {children}
    </View>
  );
}

const VISIBLE_MS = 2700;
const FADE_IN_MS = 180;
const FADE_OUT_MS = 320;
const TOAST_GAP = Spacing.two;

export function KomiToastHost() {
  const insets = useSafeAreaInsets();
  const stickyClearance = useStickyBottomClearance();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    toastListener = (next) => {
      animationRef.current?.stop();
      setMessage(next);
    };
    return () => {
      if (toastListener) toastListener = null;
    };
  }, []);

  useEffect(() => {
    if (!message) return;

    opacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: FADE_IN_MS,
        useNativeDriver: true,
      }),
      Animated.delay(VISIBLE_MS),
      Animated.timing(opacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }),
    ]);
    animationRef.current = animation;
    animation.start(({ finished }) => {
      if (finished) setMessage(null);
    });

    return () => {
      animation.stop();
    };
  }, [message, opacity]);

  if (!message) return null;

  const bottomClearance =
    stickyClearance > 0 ? stickyClearance : Math.max(insets.bottom, Spacing.three);

  return (
    <View pointerEvents="none" style={styles.host}>
      <Animated.View
        style={[
          styles.toast,
          {
            opacity,
            bottom: bottomClearance + TOAST_GAP,
          },
        ]}>
        <View style={styles.iconWrap}>
          <CheckmarkIcon />
        </View>
        <Text style={styles.label}>{message}</Text>
      </Animated.View>
    </View>
  );
}

function CheckmarkIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12.5L10 17.5L19 7"
        stroke={Colors.white}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    maxWidth: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Radii.pill,
    backgroundColor: Colors.text,
    ...Shadows.card,
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: Radii.pill,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.white,
  },
});
