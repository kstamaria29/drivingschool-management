import { useRef, type PropsWithChildren, type RefObject } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  View,
  type ScrollViewProps,
  type ViewProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useKeyboardAwareScroll } from "../navigation/useKeyboardAwareScroll";
import { theme } from "../theme/theme";
import { cn } from "../utils/cn";
import { ThemedBackdrop } from "./ThemedBackdrop";

type Props = PropsWithChildren<ViewProps> & {
  scroll?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
  scrollViewProps?: Omit<ScrollViewProps, "ref" | "children">;
  outerProps?: Omit<ViewProps, "children"> & { className?: string };
  keyboardAvoidingEnabled?: boolean;
  keyboardVerticalOffset?: number;
};

const TABLET_MIN_WIDTH = 600;

export function Screen({
  scroll = false,
  scrollRef: externalScrollRef,
  scrollViewProps,
  outerProps,
  keyboardAvoidingEnabled,
  keyboardVerticalOffset = 0,
  className,
  children,
  ...props
}: Props) {
  const { width, height } = useWindowDimensions();
  const minDimension = Math.min(width, height);
  const internalScrollRef = useRef<ScrollView>(null);
  const scrollRef = externalScrollRef ?? internalScrollRef;
  const isCompact = minDimension < TABLET_MIN_WIDTH;
  const isTabletPortrait = minDimension >= TABLET_MIN_WIDTH && height > width;
  const isTabletLandscape = minDimension >= TABLET_MIN_WIDTH && width > height;
  const resolvedKeyboardAvoidingEnabled = keyboardAvoidingEnabled ?? isTabletPortrait;
  const keyboardAwareEnabled = scroll && resolvedKeyboardAvoidingEnabled;
  const { onScroll, scrollEventThrottle } = useKeyboardAwareScroll({
    enabled: keyboardAwareEnabled,
    height,
    scrollRef,
  });

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
        enabled={resolvedKeyboardAvoidingEnabled}
        keyboardVerticalOffset={keyboardVerticalOffset}
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
            onScroll={onScroll}
            scrollEventThrottle={scrollEventThrottle}
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
