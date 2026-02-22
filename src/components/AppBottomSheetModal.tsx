import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
  type LayoutChangeEvent,
} from "react-native";

import { cn } from "../utils/cn";

type Props = PropsWithChildren<{
  visible: boolean;
  onRequestClose: () => void;
  onClosed: () => void;
  collapsedHeightRatio?: number;
  maxHeightRatio?: number;
}>;

const TABLET_MIN_WIDTH = 600;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function AppBottomSheetModal({
  visible,
  onRequestClose,
  onClosed,
  collapsedHeightRatio = 0.6,
  maxHeightRatio = 0.9,
  children,
}: Props) {
  const { width, height } = useWindowDimensions();
  const isCompact = Math.min(width, height) < TABLET_MIN_WIDTH;
  const [mounted, setMounted] = useState(visible);
  const [measuredSheetHeight, setMeasuredSheetHeight] = useState<number | null>(null);
  const wasVisibleRef = useRef(false);

  const maxSheetHeight = Math.round(height * maxHeightRatio);
  const sheetHeight = measuredSheetHeight ?? maxSheetHeight;
  const collapsedHeight = Math.min(sheetHeight, Math.round(height * collapsedHeightRatio));

  const expandedTranslateY = 0;
  const collapsedTranslateY = Math.max(0, sheetHeight - collapsedHeight);
  const hiddenTranslateY = sheetHeight;

  const translateY = useRef(new Animated.Value(hiddenTranslateY)).current;
  const translateYRef = useRef(hiddenTranslateY);
  const dragStartRef = useRef(hiddenTranslateY);
  const sheetHeightRef = useRef(sheetHeight);

  sheetHeightRef.current = sheetHeight;

  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      translateYRef.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]);

  const backdropOpacity = useMemo(() => {
    return translateY.interpolate({
      inputRange: [expandedTranslateY, hiddenTranslateY],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });
  }, [expandedTranslateY, hiddenTranslateY, translateY]);

  useEffect(() => {
    const wasVisible = wasVisibleRef.current;
    wasVisibleRef.current = visible;

    if (visible && !wasVisible) {
      setMounted(true);
      const hiddenY = sheetHeightRef.current;
      translateY.setValue(hiddenY);
      requestAnimationFrame(() => {
        Animated.timing(translateY, {
          toValue: expandedTranslateY,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
      return;
    }

    if (!visible && wasVisible && mounted) {
      const hiddenY = sheetHeightRef.current;
      Animated.timing(translateY, {
        toValue: hiddenY,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        setMounted(false);
        onClosed();
      });
    }
  }, [expandedTranslateY, mounted, onClosed, translateY, visible]);

  const animateTo = useCallback((next: number, config?: { duration?: number }) => {
    translateY.stopAnimation((current) => {
      translateYRef.current = typeof current === "number" ? current : translateYRef.current;
      Animated.timing(translateY, {
        toValue: next,
        duration: config?.duration ?? 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [translateY]);

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          const current = typeof value === "number" ? value : translateYRef.current;
          translateYRef.current = current;
          dragStartRef.current = current;
        });
      },
      onPanResponderMove: (_event, gesture) => {
        const next = clamp(dragStartRef.current + gesture.dy, expandedTranslateY, hiddenTranslateY);
        translateY.setValue(next);
      },
      onPanResponderRelease: (_event, gesture) => {
        const current = translateYRef.current;
        const hiddenY = sheetHeightRef.current;
        const dismissThreshold = hiddenY * 0.7;
        const shouldDismiss = current > dismissThreshold || gesture.vy > 1.4;
        if (shouldDismiss) {
          onRequestClose();
          return;
        }

        const target =
          Math.abs(current - expandedTranslateY) <= Math.abs(current - collapsedTranslateY)
            ? expandedTranslateY
            : collapsedTranslateY;
        animateTo(target);
      },
    });
  }, [
    animateTo,
    collapsedTranslateY,
    expandedTranslateY,
    onRequestClose,
    translateY,
  ]);

  function onSheetLayout(event: LayoutChangeEvent) {
    const next = Math.min(Math.round(event.nativeEvent.layout.height), maxSheetHeight);
    if (!Number.isFinite(next) || next <= 0) return;
    setMeasuredSheetHeight((prev) => (prev === next ? prev : next));
  }

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onRequestClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0" onPress={onRequestClose}>
          <Animated.View style={{ flex: 1, opacity: backdropOpacity, backgroundColor: "rgba(0,0,0,0.4)" }} />
        </Pressable>

        <Animated.View
          onLayout={onSheetLayout}
          className={cn(
            "w-full rounded-t-3xl border border-border bg-card shadow-2xl shadow-black/20 dark:border-borderDark dark:bg-cardDark dark:shadow-black/60",
          )}
          style={[{ maxHeight: maxSheetHeight, transform: [{ translateY }] }]}
        >
          <View
            className={cn(
              "w-full max-w-[720px] self-center",
              isCompact ? "px-4 pt-4 pb-6" : "px-6 pt-6 pb-8",
            )}
          >
            <View className="items-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Dismiss sheet"
                onPress={onRequestClose}
                hitSlop={12}
                {...panResponder.panHandlers}
              >
                <View className="items-center py-2 mb-2">
                  <View className="h-1.5 w-14 rounded-full bg-border/70 dark:bg-borderDark/70" />
                </View>
              </Pressable>
            </View>

            <View>{children}</View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
