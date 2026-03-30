import type { GestureResponderHandlers, LayoutChangeEvent } from "react-native";
import { Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { Minus, Redo2, Undo2 } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polyline as SvgPolyline } from "react-native-svg";

import type { SnapshotPoint, SnapshotStroke } from "../../features/map-annotations/codec";
import { AppButton } from "../../components/AppButton";
import { AppInput } from "../../components/AppInput";
import { AppText } from "../../components/AppText";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";

type Props = {
  visible: boolean;
  imageBase64: string | null;
  title: string;
  notes: string;
  strokes: SnapshotStroke[];
  activeStroke: SnapshotPoint[];
  activeColor: string;
  lineWidth: number;
  colorOptions: readonly string[];
  widthOptions: readonly number[];
  saving: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onClose: () => void;
  onChangeTitle: (value: string) => void;
  onChangeNotes: (value: string) => void;
  onSelectColor: (value: string) => void;
  onSelectWidth: (value: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onSave: () => void;
  onCanvasLayout: (event: LayoutChangeEvent) => void;
  panHandlers: GestureResponderHandlers;
};

function pointsToSvgPath(points: SnapshotPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

export function SnapshotAnnotationModal({
  visible,
  imageBase64,
  title,
  notes,
  strokes,
  activeStroke,
  activeColor,
  lineWidth,
  colorOptions,
  widthOptions,
  saving,
  canUndo,
  canRedo,
  onClose,
  onChangeTitle,
  onChangeNotes,
  onSelectColor,
  onSelectWidth,
  onUndo,
  onRedo,
  onClear,
  onSave,
  onCanvasLayout,
  panHandlers,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className={cn(theme.screen.safeArea, "px-4 py-4")}>
        <View className="flex-1 gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <AppText variant="heading">Snapshot Annotation</AppText>
            <AppButton width="auto" variant="ghost" label="Close" onPress={onClose} />
          </View>

          <AppInput label="Title" value={title} onChangeText={onChangeTitle} />
          <AppInput
            label="Notes"
            value={notes}
            onChangeText={onChangeNotes}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            inputClassName="h-20 py-3"
          />

          <View className="gap-2 rounded-xl border border-border p-3 dark:border-borderDark">
            <AppText variant="label">Drawing style</AppText>

            <View className="flex-row flex-wrap gap-2">
              {colorOptions.map((colorOption) => {
                const selected = colorOption.toLowerCase() === activeColor.toLowerCase();
                return (
                  <Pressable
                    key={colorOption}
                    accessibilityRole="button"
                    accessibilityLabel={`Select color ${colorOption}`}
                    className={cn(
                      "h-7 w-7 rounded-full border",
                      selected
                        ? "border-foreground dark:border-foregroundDark"
                        : "border-border dark:border-borderDark",
                    )}
                    style={{ backgroundColor: colorOption }}
                    onPress={() => onSelectColor(colorOption)}
                  />
                );
              })}
            </View>

            <View className="flex-row flex-wrap gap-2">
              {widthOptions.map((option) => {
                const selected = option === lineWidth;
                return (
                  <AppButton
                    key={`width-${option}`}
                    width="auto"
                    variant={selected ? "primary" : "secondary"}
                    label={`${option}px`}
                    icon={Minus}
                    iconStrokeWidth={Math.max(1.5, Math.min(4, option / 1.5))}
                    onPress={() => onSelectWidth(option)}
                  />
                );
              })}
            </View>
          </View>

          <View
            className="flex-1 overflow-hidden rounded-2xl border border-border bg-black dark:border-borderDark"
            onLayout={onCanvasLayout}
          >
            {imageBase64 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${imageBase64}` }}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            ) : null}

            <Svg style={StyleSheet.absoluteFillObject}>
              {strokes.map((stroke) => (
                <SvgPolyline
                  key={stroke.id}
                  points={pointsToSvgPath(stroke.points)}
                  fill="none"
                  stroke={stroke.color}
                  strokeWidth={stroke.width}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ))}

              {activeStroke.length >= 2 ? (
                <SvgPolyline
                  points={pointsToSvgPath(activeStroke)}
                  fill="none"
                  stroke={activeColor}
                  strokeWidth={lineWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray="8 6"
                />
              ) : null}
            </Svg>

            <View style={StyleSheet.absoluteFillObject} {...panHandlers} />
          </View>

          <View className="gap-2">
            <View className="flex-row flex-wrap gap-2">
              <AppButton
                width="auto"
                size="icon"
                variant="secondary"
                label=""
                icon={Undo2}
                accessibilityLabel="Undo"
                disabled={!canUndo}
                onPress={onUndo}
              />
              <AppButton
                width="auto"
                size="icon"
                variant="secondary"
                label=""
                icon={Redo2}
                accessibilityLabel="Redo"
                disabled={!canRedo}
                onPress={onRedo}
              />
              <AppButton width="auto" variant="secondary" label="Clear" onPress={onClear} />
            </View>

            <View className="flex-row justify-end">
              <AppButton
                width="auto"
                label={saving ? "Saving..." : "Save snapshot"}
                disabled={saving}
                onPress={onSave}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
