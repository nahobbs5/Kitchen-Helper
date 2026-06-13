import { useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StyleProp,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type ScrollView,
  View,
  type ViewStyle,
} from 'react-native';

import { kitchenStyles as styles } from './kitchen-styles';

const IS_WEB = Platform.OS === 'web';
const USE_NATIVE_DRIVER = !IS_WEB;
const LONG_PRESS_DELAY = 300;
const MOVE_CANCEL_THRESHOLD = 8;
const SHIFT_DURATION = 140;
const AUTO_SCROLL_EDGE = 110;
const AUTO_SCROLL_STEP = 16;

type WebPointerEvent = {
  nativeEvent: { pointerId: number; clientX: number; clientY: number };
  currentTarget: {
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };
};

export type DragRenderInfo = {
  isActive: boolean;
  dragProps: {
    onPress?: (event: GestureResponderEvent) => void;
    onLongPress?: () => void;
    delayLongPress?: number;
    onPressOut?: () => void;
  };
};

type DraggableRecipeListProps<T> = {
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, index: number, info: DragRenderInfo) => ReactNode;
  onReorder: (fromIndex: number, toIndex: number) => void;
  /** Tap handler for a card. A drag never triggers this. */
  onItemPress?: (item: T, index: number, event: GestureResponderEvent) => void;
  enabled?: boolean;
  onPickup?: () => void;
  itemGap?: number;
  containerStyle?: StyleProp<ViewStyle>;
  onDragStateChange?: (dragging: boolean) => void;
  /** Optional parent ScrollView for edge auto-scroll while dragging. */
  scrollRef?: RefObject<ScrollView | null>;
  /** Optional ref holding the parent ScrollView's current Y offset. */
  scrollOffsetRef?: RefObject<number>;
};

export function DraggableRecipeList<T>({
  data,
  keyExtractor,
  renderItem,
  onReorder,
  onItemPress,
  enabled = true,
  onPickup,
  itemGap = 14,
  containerStyle,
  onDragStateChange,
  scrollRef,
  scrollOffsetRef,
}: DraggableRecipeListProps<T>) {
  const [activeIndex, setActiveIndex] = useState(-1);

  const activeIndexRef = useRef(-1);
  const hoverRef = useRef(-1);
  const draggingRef = useRef(false);
  const dragJustEndedRef = useRef(false);
  const dragStartOffsetRef = useRef(0);
  const dragStartClientYRef = useRef(0);
  const lastDyRef = useRef(0);
  const autoScrollDirRef = useRef(0);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStartRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const heightsRef = useRef<number[]>([]);
  const offsetsRef = useRef<number[]>([]);
  const shiftTargetsRef = useRef<number[]>([]);

  const dragAnim = useRef(new Animated.Value(0)).current;
  const shiftsRef = useRef<Animated.Value[]>([]);

  // Ensure one persistent shift value per row.
  if (shiftsRef.current.length < data.length) {
    for (let i = shiftsRef.current.length; i < data.length; i += 1) {
      shiftsRef.current[i] = new Animated.Value(0);
    }
  }

  useEffect(
    () => () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
    },
    []
  );

  const getOffset = () => scrollOffsetRef?.current ?? 0;

  function clearLongPressTimer() {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  function computeOffsets() {
    const offsets: number[] = [];
    let acc = 0;
    for (let i = 0; i < data.length; i += 1) {
      offsets[i] = acc;
      acc += (heightsRef.current[i] ?? 0) + itemGap;
    }
    return offsets;
  }

  function animateShift(index: number, target: number) {
    if (shiftTargetsRef.current[index] === target) {
      return;
    }
    shiftTargetsRef.current[index] = target;
    Animated.timing(shiftsRef.current[index], {
      toValue: target,
      duration: SHIFT_DURATION,
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }

  function applyDrag() {
    const activeIdx = activeIndexRef.current;
    if (activeIdx < 0) {
      return;
    }

    const offsets = offsetsRef.current;
    const heights = heightsRef.current;
    const effective = lastDyRef.current + (getOffset() - dragStartOffsetRef.current);
    dragAnim.setValue(effective);

    const activeCenter = (offsets[activeIdx] ?? 0) + (heights[activeIdx] ?? 0) / 2 + effective;

    let hover = 0;
    for (let i = 0; i < data.length; i += 1) {
      if (i === activeIdx) {
        continue;
      }
      const center = (offsets[i] ?? 0) + (heights[i] ?? 0) / 2;
      if (activeCenter > center) {
        hover += 1;
      }
    }
    hoverRef.current = hover;

    const slot = (heights[activeIdx] ?? 0) + itemGap;
    for (let i = 0; i < data.length; i += 1) {
      if (i === activeIdx) {
        continue;
      }
      let target = 0;
      if (hover > activeIdx && i > activeIdx && i <= hover) {
        target = -slot;
      } else if (hover < activeIdx && i >= hover && i < activeIdx) {
        target = slot;
      }
      animateShift(i, target);
    }
  }

  function stopAutoScroll() {
    autoScrollDirRef.current = 0;
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
  }

  function maybeAutoScroll(viewportY: number) {
    if (!scrollRef || !scrollOffsetRef) {
      return;
    }

    const windowHeight = Dimensions.get('window').height;
    let dir = 0;
    if (viewportY < AUTO_SCROLL_EDGE) {
      dir = -1;
    } else if (viewportY > windowHeight - AUTO_SCROLL_EDGE) {
      dir = 1;
    }

    if (dir === autoScrollDirRef.current) {
      return;
    }
    autoScrollDirRef.current = dir;

    if (dir === 0) {
      stopAutoScroll();
      return;
    }

    if (!autoScrollTimerRef.current) {
      autoScrollTimerRef.current = setInterval(() => {
        const current = getOffset();
        const next = Math.max(0, current + autoScrollDirRef.current * AUTO_SCROLL_STEP);
        scrollRef.current?.scrollTo({ y: next, animated: false });
        applyDrag();
      }, 16);
    }
  }

  function resetActiveState() {
    stopAutoScroll();
    dragAnim.setValue(0);
    for (let i = 0; i < shiftsRef.current.length; i += 1) {
      shiftsRef.current[i].setValue(0);
      shiftTargetsRef.current[i] = 0;
    }
    draggingRef.current = false;
    activeIndexRef.current = -1;
    hoverRef.current = -1;
    setActiveIndex(-1);
    onDragStateChange?.(false);
  }

  function beginDrag(index: number, clientY: number) {
    activeIndexRef.current = index;
    hoverRef.current = index;
    draggingRef.current = true;
    lastDyRef.current = 0;
    dragStartClientYRef.current = clientY;
    dragStartOffsetRef.current = getOffset();
    offsetsRef.current = computeOffsets();
    dragAnim.setValue(0);
    for (let i = 0; i < shiftsRef.current.length; i += 1) {
      shiftsRef.current[i].setValue(0);
      shiftTargetsRef.current[i] = 0;
    }
    setActiveIndex(index);
    onDragStateChange?.(true);
    onPickup?.();
  }

  function endDrag() {
    const from = activeIndexRef.current;
    const to = hoverRef.current;
    resetActiveState();
    if (from >= 0 && to >= 0 && from !== to) {
      onReorder(from, to);
    }
  }

  function handleGuardedPress(item: T, index: number, event: GestureResponderEvent) {
    if (dragJustEndedRef.current || activeIndexRef.current >= 0) {
      return;
    }
    onItemPress?.(item, index, event);
  }

  // --- Web: pointer events with pointer capture ---------------------------

  function handleWebPointerDown(index: number, event: WebPointerEvent) {
    if (!enabled) {
      return;
    }
    const { pointerId, clientX, clientY } = event.nativeEvent;
    pointerStartRef.current = { id: pointerId, x: clientX, y: clientY };
    const target = event.currentTarget;
    clearLongPressTimer();
    longPressTimerRef.current = setTimeout(() => {
      beginDrag(index, clientY);
      try {
        target.setPointerCapture?.(pointerId);
      } catch {
        // capture is best-effort
      }
    }, LONG_PRESS_DELAY);
  }

  function handleWebPointerMove(event: WebPointerEvent) {
    const start = pointerStartRef.current;
    if (!start) {
      return;
    }
    const { clientX, clientY } = event.nativeEvent;

    if (activeIndexRef.current < 0) {
      if (
        Math.abs(clientY - start.y) > MOVE_CANCEL_THRESHOLD ||
        Math.abs(clientX - start.x) > MOVE_CANCEL_THRESHOLD
      ) {
        clearLongPressTimer();
        pointerStartRef.current = null;
      }
      return;
    }

    lastDyRef.current = clientY - dragStartClientYRef.current;
    applyDrag();
    maybeAutoScroll(clientY);
  }

  function handleWebPointerUp(event: WebPointerEvent) {
    clearLongPressTimer();
    if (activeIndexRef.current >= 0) {
      try {
        event.currentTarget.releasePointerCapture?.(event.nativeEvent.pointerId);
      } catch {
        // ignore
      }
      dragJustEndedRef.current = true;
      setTimeout(() => {
        dragJustEndedRef.current = false;
      }, 300);
      endDrag();
    }
    pointerStartRef.current = null;
  }

  // --- Native: PanResponder + Pressable long-press ------------------------

  function activateNative(index: number) {
    if (!enabled) {
      return;
    }
    // Native uses gesture.dy, so the clientY baseline is irrelevant.
    beginDrag(index, 0);
    draggingRef.current = false; // becomes true on grant
  }

  function handleNativePressOut(index: number) {
    if (!draggingRef.current && activeIndexRef.current === index) {
      resetActiveState();
    }
  }

  const handlersRef = useRef<{
    shouldSet: () => boolean;
    onGrant: () => void;
    onMove: (gesture: PanResponderGestureState) => void;
    onEnd: () => void;
  }>({
    shouldSet: () => false,
    onGrant: () => {},
    onMove: () => {},
    onEnd: () => {},
  });
  handlersRef.current = {
    shouldSet: () => enabled && activeIndexRef.current >= 0,
    onGrant: () => {
      draggingRef.current = true;
      onDragStateChange?.(true);
    },
    onMove: (gesture: PanResponderGestureState) => {
      lastDyRef.current = gesture.dy;
      applyDrag();
      maybeAutoScroll(gesture.moveY);
    },
    onEnd: endDrag,
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: () => handlersRef.current.shouldSet(),
        onMoveShouldSetPanResponderCapture: () => handlersRef.current.shouldSet(),
        onPanResponderGrant: () => handlersRef.current.onGrant(),
        onPanResponderMove: (_event: GestureResponderEvent, gesture: PanResponderGestureState) =>
          handlersRef.current.onMove(gesture),
        onPanResponderRelease: () => handlersRef.current.onEnd(),
        onPanResponderTerminate: () => handlersRef.current.onEnd(),
        onPanResponderTerminationRequest: () => false,
      }),
    []
  );

  return (
    <View style={containerStyle}>
      {data.map((item, index) => {
        const isActive = index === activeIndex;
        const translateY = isActive ? dragAnim : shiftsRef.current[index];

        const dragProps: DragRenderInfo['dragProps'] = {
          onPress: (event: GestureResponderEvent) => handleGuardedPress(item, index, event),
        };
        if (enabled && !IS_WEB) {
          dragProps.onLongPress = () => activateNative(index);
          dragProps.delayLongPress = LONG_PRESS_DELAY;
          dragProps.onPressOut = () => handleNativePressOut(index);
        }

        const wrapperHandlers = IS_WEB
          ? {
              onPointerDown: (event: WebPointerEvent) => handleWebPointerDown(index, event),
              onPointerMove: handleWebPointerMove,
              onPointerUp: handleWebPointerUp,
              onPointerCancel: handleWebPointerUp,
            }
          : responder.panHandlers;

        return (
          <Animated.View
            key={keyExtractor(item)}
            onLayout={(event) => {
              heightsRef.current[index] = event.nativeEvent.layout.height;
            }}
            style={[
              { marginBottom: index < data.length - 1 ? itemGap : 0 },
              isActive ? styles.draggingCard : null,
              isActive ? { zIndex: 30, elevation: 8 } : null,
              {
                transform: [{ translateY }, ...(isActive ? [{ scale: 1.03 }] : [])],
              },
            ]}
            {...(wrapperHandlers as object)}
          >
            {renderItem(item, index, { isActive, dragProps })}
          </Animated.View>
        );
      })}
    </View>
  );
}
