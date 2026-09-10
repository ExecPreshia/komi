import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

type RenderArgs<T> = {
  item: T;
  index: number;
  isActive: boolean;
};

type ReorderableListProps<T extends { id: string }> = {
  data: T[];
  onReorder: (next: T[]) => void;
  onDragStateChange?: (dragging: boolean) => void;
  renderItem: (args: RenderArgs<T>) => ReactElement;
};

type DragHandleGesture = ReturnType<typeof Gesture.Pan>;

const DragHandleContext = createContext<DragHandleGesture | null>(null);

/**
 * Long-press-on-handle reorder for recipe form cards.
 *
 * Root causes avoided vs NestableDraggableFlatList:
 * 1) useNestedAutoScroll always scrolls the outer NestableScrollContainer while
 *    dragging (autoscrollSpeed props never reached that hook) — unexpected jump.
 * 2) DraggableFlatList calls InteractionManager.runAfterInteractions on data
 *    change — deprecated warning on newer RN.
 */
export function ReorderableList<T extends { id: string }>({
  data,
  onReorder,
  onDragStateChange,
  renderItem,
}: ReorderableListProps<T>) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const heightsRef = useRef<Record<string, number>>({});
  const dataRef = useRef(data);
  dataRef.current = data;
  const onReorderRef = useRef(onReorder);
  onReorderRef.current = onReorder;
  const onDragStateChangeRef = useRef(onDragStateChange);
  onDragStateChangeRef.current = onDragStateChange;

  const setDragging = useCallback((dragging: boolean, id: string | null) => {
    setActiveId(id);
    onDragStateChangeRef.current?.(dragging);
  }, []);

  const moveItem = useCallback(
    (from: number, translationY: number) => {
      const current = dataRef.current;
      const heights = current.map((item) => heightsRef.current[item.id] ?? 120);
      let target = from;
      let traveled = 0;

      if (translationY > 0) {
        for (let i = from; i < current.length - 1; i += 1) {
          const nextHeight = heights[i + 1] ?? 120;
          if (traveled + nextHeight / 2 < translationY) {
            traveled += nextHeight;
            target = i + 1;
          } else {
            break;
          }
        }
      } else if (translationY < 0) {
        for (let i = from; i > 0; i -= 1) {
          const prevHeight = heights[i - 1] ?? 120;
          if (traveled + prevHeight / 2 < -translationY) {
            traveled += prevHeight;
            target = i - 1;
          } else {
            break;
          }
        }
      }

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

  return (
    <View>
      {data.map((item, index) => (
        <ReorderableRow
          key={item.id}
          item={item}
          index={index}
          isActive={activeId === item.id}
          onLayoutHeight={(height) => {
            heightsRef.current[item.id] = height;
          }}
          onActivate={() => setDragging(true, item.id)}
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
  onLayoutHeight,
  onActivate,
  onFinish,
  onCancel,
  renderItem,
}: {
  item: T;
  index: number;
  isActive: boolean;
  onLayoutHeight: (height: number) => void;
  onActivate: () => void;
  onFinish: (translationY: number) => void;
  onCancel: () => void;
  renderItem: ReorderableListProps<T>['renderItem'];
}) {
  const translateY = useSharedValue(0);
  const callbacksRef = useRef({ onActivate, onFinish, onCancel });
  callbacksRef.current = { onActivate, onFinish, onCancel };

  const activateJS = useCallback(() => {
    callbacksRef.current.onActivate();
  }, []);
  const finishJS = useCallback((translationY: number) => {
    callbacksRef.current.onFinish(translationY);
  }, []);
  const cancelJS = useCallback(() => {
    callbacksRef.current.onCancel();
  }, []);

  const dragGestureRef = useRef<DragHandleGesture | null>(null);
  if (dragGestureRef.current == null) {
    dragGestureRef.current = Gesture.Pan()
      .activateAfterLongPress(160)
      .onStart(() => {
        runOnJS(activateJS)();
      })
      .onUpdate((event) => {
        translateY.value = event.translationY;
      })
      .onEnd((event) => {
        const ty = event.translationY;
        translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
        runOnJS(finishJS)(ty);
      })
      .onFinalize((_, success) => {
        if (!success) {
          translateY.value = withSpring(0, { damping: 20, stiffness: 220 });
          runOnJS(cancelJS)();
        }
      });
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    zIndex: isActive ? 20 : 0,
    elevation: isActive ? 6 : 0,
  }));

  return (
    <Animated.View
      style={[styles.row, animatedStyle, isActive && styles.rowActive]}
      onLayout={(event) => onLayoutHeight(event.nativeEvent.layout.height)}>
      <DragHandleContext.Provider value={dragGestureRef.current}>
        {renderItem({ item, index, isActive })}
      </DragHandleContext.Provider>
    </Animated.View>
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

const styles = StyleSheet.create({
  row: {
    backgroundColor: 'transparent',
  },
  rowActive: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
});
