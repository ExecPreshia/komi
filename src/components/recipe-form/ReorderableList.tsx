import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { Colors, Radii, Shadows } from '@/constants/theme';

type RenderArgs<T> = {
  item: T;
  index: number;
  isActive: boolean;
};

/** Parent scroll metrics + programmatic scroll for edge auto-scroll while dragging. */
export type DragScrollController = {
  getOffset: () => number;
  getViewportHeight: () => number;
  getContentHeight: () => number;
  scrollTo: (y: number) => void;
};

type ReorderableListProps<T extends { id: string }> = {
  data: T[];
  onReorder: (next: T[]) => void;
  onDragStateChange?: (dragging: boolean) => void;
  scrollController?: DragScrollController | null;
  renderItem: (args: RenderArgs<T>) => ReactElement;
};

type DragHandleGesture = ReturnType<typeof Gesture.Pan>;

const DragHandleContext = createContext<DragHandleGesture | null>(null);

const EDGE_ZONE = 72;
const AUTO_SCROLL_SPEED = 4.6;
const RELEASE_MS = 140;
const SHIFT_MS = 120;
const RELEASE_EASING = Easing.out(Easing.cubic);
const DRAG_SCALE = 0.75;

function resolveHoverIndex(from: number, effective: number, heights: number[]): number {
  let target = from;
  let traveled = 0;

  if (effective > 0) {
    for (let i = from; i < heights.length - 1; i += 1) {
      const nextHeight = heights[i + 1] ?? 120;
      if (traveled + nextHeight / 2 < effective) {
        traveled += nextHeight;
        target = i + 1;
      } else {
        break;
      }
    }
  } else if (effective < 0) {
    for (let i = from; i > 0; i -= 1) {
      const prevHeight = heights[i - 1] ?? 120;
      if (traveled + prevHeight / 2 < -effective) {
        traveled += prevHeight;
        target = i - 1;
      } else {
        break;
      }
    }
  }

  return target;
}

/**
 * Move the reserved drop hole with transforms only.
 * The active slot always keeps `height` in layout; neighbors slide into / out of
 * that hole so total list height stays stable and cards below never collapse.
 */
function getPackedShift(index: number, from: number, hover: number, height: number): number {
  if (index === from || hover === from) return 0;
  if (hover > from) {
    // Hole moves down: items between origin and hover slide up into the reserved space.
    return index > from && index <= hover ? -height : 0;
  }
  // Hole moves up: items between hover and origin slide down.
  return index >= hover && index < from ? height : 0;
}

/** Top of the dashed drop indicator — matches the visual hole created by getPackedShift. */
function getPlaceholderTop(from: number, hover: number, heights: number[]): number {
  const reserved = heights[from] ?? 120;
  if (hover <= from) {
    let y = 0;
    for (let i = 0; i < hover; i += 1) {
      y += heights[i] ?? 120;
    }
    return y;
  }
  let y = 0;
  for (let i = 0; i <= hover; i += 1) {
    y += heights[i] ?? 120;
  }
  return y - reserved;
}

/**
 * Long-press-on-handle reorder for recipe form cards.
 */
export function ReorderableList<T extends { id: string }>({
  data,
  onReorder,
  onDragStateChange,
  scrollController,
  renderItem,
}: ReorderableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fromIndex, setFromIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState(0);
  const [activeHeight, setActiveHeight] = useState(120);

  const heightsRef = useRef<Record<string, number>>({});
  const dataRef = useRef(data);
  dataRef.current = data;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const onDragStateChangeRef = useRef(onDragStateChange);
  onDragStateChangeRef.current = onDragStateChange;
  const scrollControllerRef = useRef(scrollController);
  scrollControllerRef.current = scrollController;

  const scrollCompensation = useSharedValue(0);
  const scrollAtStartRef = useRef(0);
  const absoluteYRef = useRef(0);
  const translationYRef = useRef(0);
  const fromIndexRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const heightsList = useMemo(
    () => data.map((item) => heightsRef.current[item.id] ?? activeHeight),
    // Recompute when drag metrics or data identity change
    [data, activeHeight, activeId, hoverIndex],
  );

  const updateHoverFromTranslation = useCallback((translationY: number) => {
    translationYRef.current = translationY;
    const scrollDelta =
      (scrollControllerRef.current?.getOffset() ?? scrollAtStartRef.current) -
      scrollAtStartRef.current;
    const effective = translationY + scrollDelta;
    const heights = dataRef.current.map(
      (item) => heightsRef.current[item.id] ?? activeHeight,
    );
    const nextHover = resolveHoverIndex(fromIndexRef.current, effective, heights);
    setHoverIndex((current) => (current === nextHover ? current : nextHover));
  }, [activeHeight]);

  const stopAutoScroll = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const tickAutoScroll = useCallback(() => {
    rafRef.current = null;
    if (!draggingRef.current) return;

    const controller = scrollControllerRef.current;
    if (controller) {
      const windowHeight = Dimensions.get('window').height;
      const y = absoluteYRef.current;
      let dy = 0;

      if (y < EDGE_ZONE) {
        const intensity = Math.min(1, (EDGE_ZONE - y) / EDGE_ZONE);
        dy = -AUTO_SCROLL_SPEED * (0.4 + 0.6 * intensity);
      } else if (y > windowHeight - EDGE_ZONE) {
        const intensity = Math.min(1, (y - (windowHeight - EDGE_ZONE)) / EDGE_ZONE);
        dy = AUTO_SCROLL_SPEED * (0.4 + 0.6 * intensity);
      }

      if (dy !== 0) {
        const maxScroll = Math.max(
          0,
          controller.getContentHeight() - controller.getViewportHeight(),
        );
        const current = controller.getOffset();
        const next = Math.max(0, Math.min(maxScroll, current + dy));
        if (next !== current) {
          controller.scrollTo(next);
          scrollCompensation.value = next - scrollAtStartRef.current;
          updateHoverFromTranslation(translationYRef.current);
        }
      }
    }

    rafRef.current = requestAnimationFrame(tickAutoScroll);
  }, [scrollCompensation, updateHoverFromTranslation]);

  const startAutoScroll = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(tickAutoScroll);
  }, [tickAutoScroll]);

  useEffect(() => () => stopAutoScroll(), [stopAutoScroll]);

  const setDragging = useCallback(
    (dragging: boolean, id: string | null, index = 0) => {
      draggingRef.current = dragging;
      setActiveId(id);
      onDragStateChangeRef.current?.(dragging);
      if (dragging && id) {
        const height = heightsRef.current[id] ?? 120;
        fromIndexRef.current = index;
        setFromIndex(index);
        setHoverIndex(index);
        setActiveHeight(height);
        scrollAtStartRef.current = scrollControllerRef.current?.getOffset() ?? 0;
        scrollCompensation.value = 0;
        translationYRef.current = 0;
        startAutoScroll();
      } else {
        stopAutoScroll();
        scrollCompensation.value = 0;
        translationYRef.current = 0;
      }
    },
    [scrollCompensation, startAutoScroll, stopAutoScroll],
  );

  const updateAbsoluteY = useCallback((y: number) => {
    absoluteYRef.current = y;
  }, []);

  const moveItem = useCallback(
    (from: number, translationY: number) => {
      const scrollDelta =
        (scrollControllerRef.current?.getOffset() ?? scrollAtStartRef.current) -
        scrollAtStartRef.current;
      const effective = translationY + scrollDelta;
      const current = dataRef.current;
      const heights = current.map((item) => heightsRef.current[item.id] ?? 120);
      const target = resolveHoverIndex(from, effective, heights);

      if (target !== from) {
        const next = [...current];
        const [item] = next.splice(from, 1);
        next.splice(target, 0, item);
        onReorderRef.current(next);
      }
      setDragging(false, null);
    },
    [setDragging],
  );

  const placeholderTop =
    activeId != null ? getPlaceholderTop(fromIndex, hoverIndex, heightsList) : 0;

  return (
    <View style={styles.list}>
      {activeId != null ? (
        <View
          pointerEvents="none"
          style={[
            styles.placeholder,
            {
              top: placeholderTop,
              height: Math.max(activeHeight, 48),
            },
          ]}
        />
      ) : null}

      {data.map((item, index) => (
        <ReorderableRow
          key={item.id}
          item={item}
          index={index}
          isActive={activeId === item.id}
          fromIndex={fromIndex}
          hoverIndex={hoverIndex}
          activeHeight={activeHeight}
          isDragging={activeId != null}
          scrollCompensation={scrollCompensation}
          onLayoutHeight={(height) => {
            if (activeId === item.id) return;
            heightsRef.current[item.id] = height;
          }}
          onActivate={() => setDragging(true, item.id, index)}
          onAbsoluteY={updateAbsoluteY}
          onTranslationY={updateHoverFromTranslation}
          onFinish={(translationY) => moveItem(index, translationY)}
          onCancel={() => setDragging(false, null)}
          renderItem={renderItem}
        />
      ))}
    </View>
  );
}

function ReorderableRow<T extends { id: string }>({
  item,
  index,
  isActive,
  fromIndex,
  hoverIndex,
  activeHeight,
  isDragging,
  scrollCompensation,
  onLayoutHeight,
  onActivate,
  onAbsoluteY,
  onTranslationY,
  onFinish,
  onCancel,
  renderItem,
}: {
  item: T;
  index: number;
  isActive: boolean;
  fromIndex: number;
  hoverIndex: number;
  activeHeight: number;
  isDragging: boolean;
  scrollCompensation: SharedValue<number>;
  onLayoutHeight: (height: number) => void;
  onActivate: () => void;
  onAbsoluteY: (y: number) => void;
  onTranslationY: (y: number) => void;
  onFinish: (translationY: number) => void;
  onCancel: () => void;
  renderItem: ReorderableListProps<T>['renderItem'];
}) {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const slotShift = useSharedValue(0);
  const callbacksRef = useRef({
    onActivate,
    onFinish,
    onCancel,
    onAbsoluteY,
    onTranslationY,
  });
  callbacksRef.current = {
    onActivate,
    onFinish,
    onCancel,
    onAbsoluteY,
    onTranslationY,
  };

  useEffect(() => {
    if (isActive) {
      slotShift.value = 0;
      return;
    }
    const target = isDragging
      ? getPackedShift(index, fromIndex, hoverIndex, activeHeight)
      : 0;
    slotShift.value = withTiming(target, { duration: SHIFT_MS, easing: RELEASE_EASING });
  }, [activeHeight, fromIndex, hoverIndex, index, isActive, isDragging, slotShift]);

  const activateJS = useCallback(() => {
    callbacksRef.current.onActivate();
  }, []);
  const finishJS = useCallback((translationY: number) => {
    callbacksRef.current.onFinish(translationY);
  }, []);
  const cancelJS = useCallback(() => {
    callbacksRef.current.onCancel();
  }, []);
  const absoluteYJS = useCallback((y: number) => {
    callbacksRef.current.onAbsoluteY(y);
  }, []);
  const translationYJS = useCallback((y: number) => {
    callbacksRef.current.onTranslationY(y);
  }, []);

  const dragGestureRef = useRef<DragHandleGesture | null>(null);
  if (dragGestureRef.current == null) {
    dragGestureRef.current = Gesture.Pan()
      .activateAfterLongPress(160)
      .onStart(() => {
        scale.value = withTiming(DRAG_SCALE, { duration: RELEASE_MS, easing: RELEASE_EASING });
        runOnJS(activateJS)();
      })
      .onUpdate((event) => {
        translateY.value = event.translationY;
        runOnJS(absoluteYJS)(event.absoluteY);
        runOnJS(translationYJS)(event.translationY);
      })
      .onEnd((event) => {
        const ty = event.translationY;
        translateY.value = translateY.value + scrollCompensation.value;
        scrollCompensation.value = 0;
        translateY.value = withTiming(0, { duration: RELEASE_MS, easing: RELEASE_EASING });
        scale.value = withTiming(1, { duration: RELEASE_MS, easing: RELEASE_EASING });
        runOnJS(finishJS)(ty);
      })
      .onFinalize((_, success) => {
        if (!success) {
          translateY.value = translateY.value + scrollCompensation.value;
          scrollCompensation.value = 0;
          translateY.value = withTiming(0, { duration: RELEASE_MS, easing: RELEASE_EASING });
          scale.value = withTiming(1, { duration: RELEASE_MS, easing: RELEASE_EASING });
          runOnJS(cancelJS)();
        }
      });
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          (isActive ? translateY.value + scrollCompensation.value : 0) + slotShift.value,
      },
      { scale: scale.value },
    ],
    zIndex: isActive ? 20 : 0,
    elevation: isActive ? 6 : 0,
  }));

  // Always keep the dragged card's measured height in layout. Neighbors only
  // translate to move the visual drop hole — layout space never collapses.
  const activeSlotHeight = isActive && isDragging ? activeHeight : undefined;

  return (
    <View
      style={[
        styles.slot,
        isActive && styles.slotActive,
        activeSlotHeight != null ? { height: activeSlotHeight } : null,
      ]}
      onLayout={(event) => {
        if (!isActive) onLayoutHeight(event.nativeEvent.layout.height);
      }}>
      <Animated.View
        style={[
          styles.row,
          isActive && styles.rowFloating,
          animatedStyle,
          isActive && styles.rowActive,
        ]}>
        <DragHandleContext.Provider value={dragGestureRef.current}>
          {renderItem({ item, index, isActive })}
        </DragHandleContext.Provider>
      </Animated.View>
    </View>
  );
}

/** Wrap the 6-dot handle so long-press + pan reorders without scrolling the parent. */
export function ReorderDragHandle({ children }: { children: ReactNode }) {
  const gesture = useContext(DragHandleContext);
  if (!gesture) return <>{children}</>;
  return (
    <GestureDetector gesture={gesture}>
      <View accessible accessibilityRole="button">
        {children}
      </View>
    </GestureDetector>
  );
}

/** Helper to keep scroll metrics updated for drag edge auto-scroll. */
export function useDragScrollMetrics(
  scrollRef: RefObject<{ scrollTo: (opts: { y: number; animated?: boolean }) => void } | null>,
) {
  const metricsRef = useRef({ offset: 0, viewport: 0, content: 0 });

  const scrollController: DragScrollController = {
    getOffset: () => metricsRef.current.offset,
    getViewportHeight: () => metricsRef.current.viewport,
    getContentHeight: () => metricsRef.current.content,
    scrollTo: (y: number) => {
      metricsRef.current.offset = y;
      scrollRef.current?.scrollTo({ y, animated: false });
    },
  };

  return {
    scrollController,
    onScroll: (offsetY: number) => {
      metricsRef.current.offset = offsetY;
    },
    onLayout: (viewportHeight: number) => {
      metricsRef.current.viewport = viewportHeight;
    },
    onContentSizeChange: (_w: number, contentHeight: number) => {
      metricsRef.current.content = contentHeight;
    },
  };
}

const styles = StyleSheet.create({
  list: {
    position: 'relative',
  },
  placeholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.accent,
    backgroundColor: 'rgba(218, 102, 100, 0.08)',
  },
  slot: {
    // Keeps layout height while the row is not active.
  },
  slotActive: {
    // Height stays equal to the dragged card for the whole gesture so the list
    // does not reflow; getPackedShift only moves the visual drop hole.
    marginBottom: 0,
    overflow: 'visible',
    zIndex: 20,
  },
  row: {
    backgroundColor: 'transparent',
  },
  rowFloating: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  rowActive: {
    ...Shadows.card,
  },
});
