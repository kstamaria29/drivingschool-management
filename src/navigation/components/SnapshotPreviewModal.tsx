import dayjs from "dayjs";
import { useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Image, Modal, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Polyline as SvgPolyline, Text as SvgText } from "react-native-svg";

import type { SnapshotPoint, SnapshotStroke, SnapshotText } from "../../features/map-annotations/codec";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";

export type SnapshotPreview = {
  id: string;
  title: string;
  notes: string | null;
  imageBase64: string;
  strokes: SnapshotStroke[];
  texts: SnapshotText[];
  width: number;
  height: number;
  createdAt: string;
};

type CanvasSize = {
  width: number;
  height: number;
};

type Props = {
  snapshot: SnapshotPreview | null;
  onClose: () => void;
};

function pointsToSvgPath(points: SnapshotPoint[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function scalePoint(
  point: SnapshotPoint,
  originalWidth: number,
  originalHeight: number,
  targetSize: CanvasSize,
) {
  if (originalWidth <= 0 || originalHeight <= 0 || targetSize.width <= 0 || targetSize.height <= 0) {
    return point;
  }
  return {
    x: (point.x / originalWidth) * targetSize.width,
    y: (point.y / originalHeight) * targetSize.height,
  };
}

function fitCanvasSize(sourceSize: CanvasSize, availableSize: CanvasSize): CanvasSize {
  if (
    sourceSize.width <= 0 ||
    sourceSize.height <= 0 ||
    availableSize.width <= 0 ||
    availableSize.height <= 0
  ) {
    return { width: 0, height: 0 };
  }

  const scale = Math.min(
    availableSize.width / sourceSize.width,
    availableSize.height / sourceSize.height,
  );

  return {
    width: Math.max(1, Math.round(sourceSize.width * scale)),
    height: Math.max(1, Math.round(sourceSize.height * scale)),
  };
}

function getScaleFactor(originalWidth: number, originalHeight: number, targetSize: CanvasSize) {
  if (originalWidth <= 0 || originalHeight <= 0 || targetSize.width <= 0 || targetSize.height <= 0) {
    return 1;
  }

  return Math.min(targetSize.width / originalWidth, targetSize.height / originalHeight);
}

export function SnapshotPreviewModal({
  snapshot,
  onClose,
}: Props) {
  const [availableSize, setAvailableSize] = useState<CanvasSize>({ width: 0, height: 0 });
  const [canvasSize, setCanvasSize] = useState<CanvasSize>({ width: 0, height: 0 });

  const sourceSize = useMemo(
    () => ({
      width: snapshot?.width ?? 0,
      height: snapshot?.height ?? 0,
    }),
    [snapshot?.height, snapshot?.width],
  );

  const fittedCanvasSize = useMemo(
    () => fitCanvasSize(sourceSize, availableSize),
    [availableSize, sourceSize],
  );

  const canvasScale = useMemo(
    () =>
      snapshot
        ? getScaleFactor(snapshot.width, snapshot.height, canvasSize)
        : 1,
    [canvasSize, snapshot],
  );

  function handleAvailableLayout(event: LayoutChangeEvent) {
    setAvailableSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  }

  function handleCanvasLayout(event: LayoutChangeEvent) {
    setCanvasSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  }

  const canvasStyle =
    fittedCanvasSize.width > 0 && fittedCanvasSize.height > 0
      ? { width: fittedCanvasSize.width, height: fittedCanvasSize.height }
      : undefined;

  return (
    <Modal visible={snapshot != null} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className={cn(theme.screen.safeArea, "px-4 py-4")}>
        <View className="flex-1 gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <AppText variant="heading">{snapshot?.title ?? "Snapshot"}</AppText>
              {snapshot ? (
                <AppText variant="caption">
                  {dayjs(snapshot.createdAt).format("DD MMM YYYY, h:mm A")}
                </AppText>
              ) : null}
            </View>
            <AppButton width="auto" variant="ghost" label="Close" onPress={onClose} />
          </View>

          {snapshot?.notes ? <AppText variant="body">{snapshot.notes}</AppText> : null}

          <View
            className="flex-1 items-center justify-center"
            onLayout={handleAvailableLayout}
          >
            <View
              className="overflow-hidden rounded-2xl border border-border bg-black dark:border-borderDark"
              style={canvasStyle}
              onLayout={handleCanvasLayout}
            >
              {snapshot ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${snapshot.imageBase64}` }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
              ) : null}

              {snapshot ? (
                <Svg style={StyleSheet.absoluteFillObject}>
                  {snapshot.strokes.map((stroke) => (
                    <SvgPolyline
                      key={stroke.id}
                      points={pointsToSvgPath(
                        stroke.points.map((point) =>
                          scalePoint(point, snapshot.width, snapshot.height, canvasSize),
                        ),
                      )}
                      fill="none"
                      stroke={stroke.color}
                      strokeWidth={stroke.width * canvasScale}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ))}

                  {snapshot.texts.map((textItem) => {
                    const scaledPoint = scalePoint(
                      { x: textItem.x, y: textItem.y },
                      snapshot.width,
                      snapshot.height,
                      canvasSize,
                    );

                    return (
                      <SvgText
                        key={textItem.id}
                        x={scaledPoint.x}
                        y={scaledPoint.y}
                        fill={textItem.color}
                        stroke="#000000"
                        strokeWidth={0.4 * canvasScale}
                        fontSize={textItem.size * canvasScale}
                        fontWeight="600"
                      >
                        {textItem.text}
                      </SvgText>
                    );
                  })}
                </Svg>
              ) : null}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
