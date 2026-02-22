import { useEffect, useRef, type PropsWithChildren, type RefObject } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
  type ScrollViewProps,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../theme/theme";
import { cn } from "../utils/cn";
import { ThemedBackdrop } from "./ThemedBackdrop";

type Props = PropsWithChildren<ViewProps> & {
  scroll?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
  scrollViewProps?: Omit<ScrollViewProps, "ref" | "children">;
  outerProps?: Omit<ViewProps, "children"> & { className?: string };
};

const TABLET_MIN_WIDTH = 600;

export function Screen({
  scroll = false,
  scrollRef: externalScrollRef,
  scrollViewProps,
  outerProps,
  className,
  children,
  ...props
}: Props) {
  const { width, height } = useWindowDimensions();
  const minDimension = Math.min(width, height);
  const internalScrollRef = useRef<ScrollView>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;
  const scrollOffsetYRef = useRef(0);
  const isCompact = minDimension < TABLET_MIN_WIDTH;
  const isTabletPortrait = minDimension >= TABLET_MIN_WIDTH && height > width;
  const isTabletLandscape = minDimension >= TABLET_MIN_WIDTH && width > height;
  const keyboardAvoidingEnabled = isTabletPortrait;
  const keyboardAwareEnabled = scroll && keyboardAvoidingEnabled;

  useEffect(() => {
    if (!keyboardAwareEnabled) return;

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
          y: Math.max(0, scrollOffsetYRef.current + overlap + 24),
          animated: true,
        });
      });
    });

    return () => {
      subscription.remove();
    };
  }, [height, keyboardAwareEnabled]);

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
  }

  const content = (
    <View
      className={cn(
        theme.screen.container,
        isCompact && "px-4 py-4",
        className,
        isTabletLandscape && "max-w-[9999px]",
      )}
      {...props}
    >
      {children}
    </View>
  );

  const { className: outerClassName, ...outerViewProps } = outerProps ?? {};

  return (
    <SafeAreaView className={cn(theme.screen.safeArea, "relative", outerClassName)}>
      <ThemedBackdrop />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled={keyboardAvoidingEnabled}
        {...outerViewProps}
      >
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            {...scrollViewProps}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios" && keyboardAwareEnabled}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName={theme.screen.scrollContent}
            onScroll={keyboardAwareEnabled ? onScroll : undefined}
            scrollEventThrottle={keyboardAwareEnabled ? 16 : undefined}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
