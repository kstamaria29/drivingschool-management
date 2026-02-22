import { useEffect, useMemo, useRef } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";

import { AppBottomSheetModal } from "./AppBottomSheetModal";
import { AppButton } from "./AppButton";
import { AppStack } from "./AppStack";
import { AppText } from "./AppText";

type CategorizedSuggestion = {
  category: string;
  text: string;
};

type SuggestionGroup = {
  category: string;
  suggestions: CategorizedSuggestion[];
};

type Props = {
  visible: boolean;
  title: string;
  subtitle?: string;
  suggestions: readonly CategorizedSuggestion[];
  value: string;
  selectedVariant?: "primary" | "danger";
  onChangeValue: (next: string) => void;
  onClose: () => void;
};

const NOOP = () => {};

function buildSuggestionLine(option: CategorizedSuggestion) {
  return `${option.category} - ${option.text}`;
}

function hasSuggestionLine(value: string, suggestion: string) {
  return value
    .split(/\r?\n/)
    .some((line) => line.trim().toLowerCase() === suggestion.trim().toLowerCase());
}

function toggleSuggestionLine(value: string, suggestion: string) {
  const lines = value.split(/\r?\n/);
  const index = lines.findIndex(
    (line) => line.trim().toLowerCase() === suggestion.trim().toLowerCase(),
  );

  if (index >= 0) {
    const next = [...lines.slice(0, index), ...lines.slice(index + 1)];
    return next.join("\n").trimEnd();
  }

  const trimmed = value.trimEnd();
  return trimmed ? `${trimmed}\n${suggestion}` : suggestion;
}

function groupSuggestionsByCategory(options: readonly CategorizedSuggestion[]) {
  const categories = new Map<string, CategorizedSuggestion[]>();
  options.forEach((option) => {
    const list = categories.get(option.category) ?? [];
    list.push(option);
    categories.set(option.category, list);
  });

  return Array.from(categories.entries()).map(([category, suggestions]) => ({ category, suggestions }));
}

function countSelectedLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export function SuggestionsPickerModal({
  visible,
  title,
  subtitle,
  suggestions,
  value,
  selectedVariant = "primary",
  onChangeValue,
  onClose,
}: Props) {
  const { height } = useWindowDimensions();
  const suggestionGroups = useMemo(() => groupSuggestionsByCategory(suggestions), [suggestions]);
  const selectedCount = useMemo(() => countSelectedLines(value), [value]);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  return (
    <AppBottomSheetModal
      visible={visible}
      onRequestClose={onClose}
      onClosed={NOOP}
      collapsedHeightRatio={0.45}
    >
      <View className="gap-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <AppText className="!text-[22px]" variant="heading">
              {title}
            </AppText>
            {subtitle ? (
              <AppText className="mt-1" variant="caption">
                {subtitle}
              </AppText>
            ) : null}
          </View>
          <AppText className="text-right" variant="caption">
            {selectedCount > 0 ? `${selectedCount} selected` : "\u2014"}
          </AppText>
        </View>

        <ScrollView
          style={{ flexShrink: 1, maxHeight: Math.round(height * 0.6) }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <AppStack gap="md">
            {suggestionGroups.map(({ category, suggestions: options }) => (
              <View key={category} className="gap-2">
                <AppText
                  className="!text-[15px] underline !text-blue-600 dark:!text-blue-400"
                  variant="heading"
                >
                  {category}
                </AppText>
                <AppStack gap="sm">
                  {options.map((option) => {
                    const line = buildSuggestionLine(option);
                    const selected = hasSuggestionLine(value, line);
                    return (
                      <AppButton
                        key={line}
                        width="full"
                        variant={selected ? selectedVariant : "secondary"}
                        label={option.text}
                        contentClassName="w-full justify-start"
                        labelClassName="flex-1 text-left"
                        onPress={() => {
                          const next = toggleSuggestionLine(valueRef.current, line);
                          valueRef.current = next;
                          onChangeValue(next);
                        }}
                      />
                    );
                  })}
                </AppStack>
              </View>
            ))}
          </AppStack>
        </ScrollView>
      </View>
    </AppBottomSheetModal>
  );
}
