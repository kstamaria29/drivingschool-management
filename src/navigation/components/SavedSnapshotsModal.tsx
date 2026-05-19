import dayjs from "dayjs";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";

import type { SnapshotPreview } from "./SnapshotPreviewModal";

type Props = {
  visible: boolean;
  snapshots: SnapshotPreview[];
  deleting: boolean;
  onClose: () => void;
  onOpenSnapshot: (snapshotId: string) => void;
  onDeleteSnapshot: (snapshotId: string, snapshotTitle: string) => void;
};

export function SavedSnapshotsModal({
  visible,
  snapshots,
  deleting,
  onClose,
  onOpenSnapshot,
  onDeleteSnapshot,
}: Props) {
  const snapshotCountLabel =
    snapshots.length === 1 ? "1 saved snapshot" : `${snapshots.length} saved snapshots`;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className={cn(theme.screen.safeArea, "px-4 py-4")}>
        <View className="flex-1 gap-3">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1">
              <AppText variant="heading">Saved Snapshots</AppText>
              <AppText variant="caption">{snapshotCountLabel}</AppText>
            </View>
            <AppButton width="auto" variant="ghost" label="Close" onPress={onClose} />
          </View>

          {snapshots.length === 0 ? (
            <View className="flex-1 items-center justify-center px-6">
              <AppText className="text-center" variant="caption">
                No saved snapshots yet. Use the camera button to create one.
              </AppText>
            </View>
          ) : (
            <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
              <AppText variant="caption">Tap a snapshot to open it.</AppText>

              {snapshots.map((snapshot) => (
                <View
                  key={snapshot.id}
                  className="rounded-xl border border-border bg-background px-3 py-2 dark:border-borderDark dark:bg-backgroundDark"
                >
                  <View className="flex-row items-center justify-between gap-2">
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onOpenSnapshot(snapshot.id)}
                      className="flex-1"
                    >
                      <AppText variant="label">{snapshot.title}</AppText>
                      <AppText variant="caption">
                        {dayjs(snapshot.createdAt).format("DD MMM YYYY, h:mm A")}
                      </AppText>
                    </Pressable>

                    <AppButton
                      width="auto"
                      variant="ghost"
                      label="Delete"
                      disabled={deleting}
                      onPress={() => onDeleteSnapshot(snapshot.id, snapshot.title)}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
