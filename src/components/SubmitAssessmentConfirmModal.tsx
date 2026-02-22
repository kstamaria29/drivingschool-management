import { Modal, Pressable, useWindowDimensions } from "react-native";

import { cn } from "../utils/cn";

import { AppButton } from "./AppButton";
import { AppCard } from "./AppCard";
import { AppStack } from "./AppStack";
import { AppText } from "./AppText";

type Props = {
  visible: boolean;
  title: string;
  message: string;
  disabled?: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  onSubmitAndGeneratePdf: () => void;
  onSubmitAndEmailStudent: () => void;
};

const TABLET_MIN_WIDTH = 600;

export function SubmitAssessmentConfirmModal({
  visible,
  title,
  message,
  disabled = false,
  onCancel,
  onSubmit,
  onSubmitAndGeneratePdf,
  onSubmitAndEmailStudent,
}: Props) {
  const { width, height } = useWindowDimensions();
  const isCompact = Math.min(width, height) < TABLET_MIN_WIDTH;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        className={cn("flex-1 bg-black/40", isCompact ? "px-4 py-6" : "px-6 py-10")}
        onPress={onCancel}
      >
        <Pressable className="m-auto w-full max-w-md" onPress={(event) => event.stopPropagation()}>
          <AppCard className="gap-3">
            <AppText variant="heading">{title}</AppText>
            <AppText variant="body">{message}</AppText>

            <AppStack gap="sm">
              <AppButton
                variant="secondary"
                label="Submit"
                disabled={disabled}
                labelClassName="!text-blue-600 dark:!text-blue-400"
                onPress={onSubmit}
              />
              <AppButton
                variant="secondary"
                label="Submit and Generate PDF"
                disabled={disabled}
                labelClassName="!text-green-800 dark:!text-green-200"
                onPress={onSubmitAndGeneratePdf}
              />
              <AppButton
                variant="secondary"
                label="Submit and Email student"
                disabled={disabled}
                labelClassName="!text-green-800 dark:!text-green-200"
                onPress={onSubmitAndEmailStudent}
              />
              <AppButton variant="ghost" label="Cancel" disabled={disabled} onPress={onCancel} />
            </AppStack>
          </AppCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
