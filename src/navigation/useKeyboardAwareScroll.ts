import { useEffect, useRef, type RefObject } from "react";
import {
  Keyboard,
  Platform,
  TextInput,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from "react-native";

type Options = {
  enabled: boolean;
  height: number;
  scrollRef: RefObject<ScrollView | null>;
  extraOffset?: number;
};

export function useKeyboardAwareScroll({
  enabled,
  height,
  scrollRef,
  extraOffset = 24,
}: Options) {
  const scrollOffsetYRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(showEvent, (event) => {
      const focusedInput = TextInput.State.currentlyFocusedInput?.();
      if (!focusedInput || typeof focusedInput.measureInWindow !== "function") {
        return;
      }

      focusedInput.measureInWindow((_x, y, _w, inputHeight) => {
        const keyboardTop = event.endCoordinates.screenY;
        const inputBottom = y + inputHeight;
        const isInBottomHalf = y >= height / 2;
        const overlap = inputBottom - keyboardTop;

        if (!isInBottomHalf || overlap <= 0) return;

        scrollRef.current?.scrollTo({
          y: Math.max(0, scrollOffsetYRef.current + overlap + extraOffset),
          animated: true,
        });
      });
    });

    return () => {
      subscription.remove();
    };
  }, [enabled, extraOffset, height, scrollRef]);

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
  }

  return {
    onScroll: enabled ? onScroll : undefined,
    scrollEventThrottle: enabled ? 16 : undefined,
  };
}
