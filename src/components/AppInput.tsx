import { useState } from "react";
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
  type TextInputProps,
} from "react-native";
import { useColorScheme } from "nativewind";

import { useThemeFonts } from "../providers/ThemeFontsProvider";
import { theme } from "../theme/theme";
import { cn } from "../utils/cn";

import { AppText } from "./AppText";

type Props = TextInputProps & {
  label: string;
  error?: string;
  containerClassName?: string;
  inputClassName?: string;
  autoGrow?: boolean;
  autoGrowMinHeight?: number;
};

export function AppInput({
  label,
  error,
  containerClassName,
  inputClassName,
  autoGrow = false,
  autoGrowMinHeight,
  style,
  onContentSizeChange,
  scrollEnabled,
  ...props
}: Props) {
  const { colorScheme } = useColorScheme();
  const { fonts } = useThemeFonts();
  const placeholderTextColor =
    colorScheme === "dark" ? theme.colors.mutedDark : theme.colors.mutedLight;
  const isMultiline = Boolean(props.multiline);
  const shouldAutoGrow = autoGrow && isMultiline;
  const minHeight = shouldAutoGrow ? autoGrowMinHeight ?? 48 : undefined;
  const [contentHeight, setContentHeight] = useState(minHeight ?? 0);

  function handleContentSizeChange(
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ) {
    onContentSizeChange?.(event);
    if (!shouldAutoGrow) return;
    const next = Math.ceil(event.nativeEvent.contentSize.height);
    setContentHeight((prev) => (prev === next ? prev : next));
  }

  const autoGrowStyle =
    shouldAutoGrow && minHeight != null ? { height: Math.max(minHeight, contentHeight) } : null;

  return (
    <View className={cn(theme.input.wrapper, containerClassName)}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        className={cn(theme.input.base, error && theme.input.error, inputClassName)}
        placeholderTextColor={placeholderTextColor}
        onContentSizeChange={handleContentSizeChange}
        scrollEnabled={shouldAutoGrow ? false : scrollEnabled}
        style={[
          { fontFamily: fonts.regular },
          !isMultiline ? { paddingVertical: 0, textAlignVertical: "center" } : null,
          autoGrowStyle,
          style,
        ]}
        {...props}
      />
      {error ? (
        <AppText className="mt-1" variant="error">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
