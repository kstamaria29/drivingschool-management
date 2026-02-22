import * as ImagePicker from "expo-image-picker";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
  useColorScheme,
} from "react-native";
import {
  Archive,
  Bell,
  Building2,
  ClipboardList,
  Clock,
  EllipsisVertical,
  Pencil,
  Play,
  RefreshCw,
  Trash2,
  Undo2,
  X,
  type LucideIcon,
} from "lucide-react-native";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { AppImage } from "../../components/AppImage";
import { AppStack } from "../../components/AppStack";
import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";
import { useAssessmentsQuery } from "../../features/assessments/queries";
import { useStudentRemindersQuery } from "../../features/reminders/queries";
import { useStudentSessionsQuery } from "../../features/sessions/queries";
import {
  useArchiveStudentMutation,
  useDeleteStudentMutation,
  useRemoveStudentLicenseImageMutation,
  useStudentQuery,
  useUnarchiveStudentMutation,
  useUploadStudentLicenseImageMutation,
} from "../../features/students/queries";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";
import { formatIsoDateToDisplay } from "../../utils/dates";
import { toErrorMessage } from "../../utils/errors";

import type { StudentsStackParamList } from "../StudentsStackNavigator";
import type { MainDrawerParamList } from "../MainDrawerNavigator";
import { useNavigationLayout } from "../useNavigationLayout";

type Props = NativeStackScreenProps<StudentsStackParamList, "StudentDetail">;
type LicenceImageItem = { key: "front" | "back"; label: string; uri: string };
type StudentLicenseImageSide = "front" | "back";
type StudentLicenseImageSource = "camera" | "library";
type StudentActionMenuItemTone = "default" | "info" | "success" | "warning" | "danger";
type StudentActionMenuItemProps = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  tone?: StudentActionMenuItemTone;
  disabled?: boolean;
  badgeCount?: number;
};

function DetailValueField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <View className={cn("gap-2", className)}>
      <AppText variant="label">{label}</AppText>
      <View className="min-h-12 justify-center rounded-xl border border-border bg-card px-4 py-3 shadow-sm shadow-black/5 dark:border-borderDark dark:bg-cardDark dark:shadow-black/30">
        <AppText className="flex-shrink text-left" variant="body">
          {value}
        </AppText>
      </View>
    </View>
  );
}

function toSentenceCase(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function StudentActionMenuItem({
  label,
  icon: Icon,
  onPress,
  tone = "default",
  disabled = false,
  badgeCount,
}: StudentActionMenuItemProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const iconColor =
    tone === "danger"
      ? isDark
        ? theme.colors.dangerDark
        : theme.colors.danger
      : tone === "info"
        ? isDark
          ? "#93c5fd"
          : "#1d4ed8"
        : tone === "success"
          ? isDark
            ? "#4ade80"
            : "#16a34a"
        : tone === "warning"
          ? isDark
            ? "#fdba74"
            : "#c2410c"
          : isDark
            ? theme.colors.foregroundDark
            : theme.colors.foregroundLight;
  const textClassName =
    tone === "danger"
      ? "!text-red-700 dark:!text-red-300"
      : tone === "info"
        ? "!text-blue-600 dark:!text-blue-400"
        : tone === "success"
          ? "!text-green-700 dark:!text-green-300"
        : tone === "warning"
          ? "!text-orange-700 dark:!text-orange-300"
          : "";
  const normalizedBadgeCount =
    typeof badgeCount === "number" && Number.isFinite(badgeCount) && badgeCount > 0
      ? Math.min(Math.floor(badgeCount), 99)
      : null;
  const badgeText =
    normalizedBadgeCount == null
      ? ""
      : badgeCount != null && badgeCount > 99
        ? "99+"
        : String(normalizedBadgeCount);

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={cn(
        "h-11 flex-row items-center gap-3 rounded-lg px-3",
        !disabled && "active:bg-muted/30 dark:active:bg-mutedDark/30",
        disabled && "opacity-50",
      )}
    >
      <Icon size={20} color={iconColor} strokeWidth={2} />
      <View className="flex-1 flex-row items-center gap-2">
        <AppText
          variant="button"
          className={cn("flex-shrink text-[17px]", textClassName)}
          numberOfLines={1}
        >
          {label}
        </AppText>
        {normalizedBadgeCount != null ? (
          <View className="h-5 min-w-[20px] items-center justify-center rounded-full border border-green-700/30 bg-green-700/10 px-1.5 dark:border-green-300/30 dark:bg-green-300/10">
            <AppText
              variant="caption"
              className="text-[10px] font-semibold leading-[10px] text-green-800 dark:text-green-200"
              numberOfLines={1}
            >
              {badgeText}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function StudentDetailScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const screenScrollRef = useRef<ScrollView | null>(null);
  const colorScheme = useColorScheme();
  const { isSidebar, isCompact } = useNavigationLayout();
  const drawerNavigation =
    navigation.getParent<DrawerNavigationProp<MainDrawerParamList>>();
  const organizationIconColor =
    colorScheme === "dark"
      ? theme.colors.foregroundDark
      : theme.colors.foregroundLight;

  const query = useStudentQuery(studentId);
  const sessionsQuery = useStudentSessionsQuery({ studentId });
  const assessmentsQuery = useAssessmentsQuery({ studentId });
  const remindersQuery = useStudentRemindersQuery({ studentId });
  const archiveMutation = useArchiveStudentMutation();
  const unarchiveMutation = useUnarchiveStudentMutation();
  const deleteMutation = useDeleteStudentMutation();
  const uploadLicenseImageMutation = useUploadStudentLicenseImageMutation();
  const removeLicenseImageMutation = useRemoveStudentLicenseImageMutation();

  const student = query.data ?? null;
  const isArchived = Boolean(student?.archived_at);
  const notes = student?.notes?.trim() ? student.notes.trim() : "";
  const sessionCount = sessionsQuery.data?.length ?? 0;
  const assessmentCount = assessmentsQuery.data?.length ?? 0;
  const reminderCount = remindersQuery.data?.length ?? 0;
  const [licensePickerError, setLicensePickerError] = useState<string | null>(
    null,
  );
  const [licenseGalleryVisible, setLicenseGalleryVisible] = useState(false);
  const [licenseGalleryIndex, setLicenseGalleryIndex] = useState(0);
  const [licenseGalleryWidth, setLicenseGalleryWidth] = useState(0);
  const licenseGalleryScrollRef = useRef<ScrollView | null>(null);
  const [licenseActionModalSide, setLicenseActionModalSide] =
    useState<StudentLicenseImageSide | null>(null);
  const [startAssessmentModalVisible, setStartAssessmentModalVisible] =
    useState(false);
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const studentDobDisplay = student?.date_of_birth
    ? formatIsoDateToDisplay(student.date_of_birth)
    : "-";
  const studentAgeDisplay = student?.date_of_birth
    ? String(dayjs().diff(dayjs(student.date_of_birth), "year"))
    : "-";

  const licenseImages = useMemo<LicenceImageItem[]>(() => {
    const images: LicenceImageItem[] = [];
    if (student?.license_front_image_url) {
      images.push({
        key: "front",
        label: "Front",
        uri: student.license_front_image_url,
      });
    }
    if (student?.license_back_image_url) {
      images.push({
        key: "back",
        label: "Back",
        uri: student.license_back_image_url,
      });
    }
    return images;
  }, [student?.license_back_image_url, student?.license_front_image_url]);

  useEffect(() => {
    if (licenseImages.length === 0) {
      setLicenseGalleryVisible(false);
      setLicenseGalleryIndex(0);
      return;
    }

    if (licenseGalleryIndex > licenseImages.length - 1) {
      setLicenseGalleryIndex(0);
    }
  }, [licenseGalleryIndex, licenseImages.length]);

  const activeLicenseImage = licenseImages[licenseGalleryIndex] ?? null;
  const licenseActionTitle =
    licenseActionModalSide === "front"
      ? "Front photo options"
      : licenseActionModalSide === "back"
        ? "Back photo options"
        : "";
  const licenseActionHasExisting =
    licenseActionModalSide === "front"
      ? Boolean(student?.license_front_image_url)
      : licenseActionModalSide === "back"
        ? Boolean(student?.license_back_image_url)
        : false;

  const resetTransientUi = useCallback(() => {
    setActionMenuVisible(false);
    setStartAssessmentModalVisible(false);
    setLicenseActionModalSide(null);
    setLicenseGalleryVisible(false);
    setLicenseGalleryIndex(0);
    setLicensePickerError(null);
  }, []);

  useEffect(() => {
    resetTransientUi();
  }, [resetTransientUi, studentId]);

  useFocusEffect(
    useCallback(() => {
      resetTransientUi();
      requestAnimationFrame(() => {
        screenScrollRef.current?.scrollTo({ y: 0, animated: false });
      });
    }, [resetTransientUi]),
  );

  function openLicenseGallery(startIndex: number) {
    if (licenseImages.length === 0) return;
    setLicenseGalleryIndex(startIndex);
    setLicenseGalleryVisible(true);
  }

  useEffect(() => {
    if (!licenseGalleryVisible) return;
    if (licenseGalleryWidth <= 0) return;
    licenseGalleryScrollRef.current?.scrollTo({
      x: licenseGalleryIndex * licenseGalleryWidth,
      y: 0,
      animated: false,
    });
  }, [licenseGalleryIndex, licenseGalleryVisible, licenseGalleryWidth]);

  function showPreviousLicenseImage() {
    if (licenseImages.length <= 1) return;
    setLicenseGalleryIndex((previous) =>
      previous === 0 ? licenseImages.length - 1 : previous - 1,
    );
  }

  function showNextLicenseImage() {
    if (licenseImages.length <= 1) return;
    setLicenseGalleryIndex((previous) => (previous + 1) % licenseImages.length);
  }

  async function pickLicenseAssetFromLibrary() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Permission to access photos was denied.");
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (result.canceled) return null;
    return result.assets[0] ?? null;
  }

  async function pickLicenseAssetFromCamera() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Permission to access the camera was denied.");
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });

    if (result.canceled) return null;
    return result.assets[0] ?? null;
  }

  async function pickAndUploadLicenseImage(
    side: StudentLicenseImageSide,
    source: StudentLicenseImageSource,
  ) {
    if (!student) return;

    try {
      setLicensePickerError(null);
      const asset =
        source === "camera"
          ? await pickLicenseAssetFromCamera()
          : await pickLicenseAssetFromLibrary();

      if (!asset) return;

      await uploadLicenseImageMutation.mutateAsync({
        organizationId: student.organization_id,
        studentId: student.id,
        side,
        asset,
      });
    } catch (error) {
      setLicensePickerError(toErrorMessage(error));
    }
  }

  function deleteLicenseImage(side: StudentLicenseImageSide) {
    if (!student) return;
    const sideLabel = side === "front" ? "front" : "back";

    Alert.alert(
      `Delete ${sideLabel} photo`,
      "This will remove the saved licence photo.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            removeLicenseImageMutation.mutate(
              {
                organizationId: student.organization_id,
                studentId: student.id,
                side,
              },
              {
                onError: (error) => {
                  setLicensePickerError(toErrorMessage(error));
                },
              },
            );
          },
        },
      ],
    );
  }

  function closeLicenseActionModal() {
    setLicenseActionModalSide(null);
  }

  function openLicenseImageActions(side: StudentLicenseImageSide) {
    setLicenseActionModalSide(side);
  }

  function closeStartAssessmentModal() {
    setStartAssessmentModalVisible(false);
  }

  function closeActionMenu() {
    setActionMenuVisible(false);
  }

  function openActionMenu() {
    setActionMenuVisible(true);
  }

  function onStartAssessmentPress() {
    setStartAssessmentModalVisible(true);
  }

  function navigateToAssessment(
    routeName:
      | "DrivingAssessment"
      | "RestrictedMockTest"
      | "FullLicenseMockTest",
  ) {
    if (!student) return;
    closeStartAssessmentModal();
    drawerNavigation?.navigate("Assessments", {
      screen: routeName,
      params: {
        studentId: student.id,
        returnToStudentId: student.id,
      },
    });
  }

  function onArchivePress() {
    if (!student) return;
    Alert.alert("Archive student", "This student will be moved to Archived.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => archiveMutation.mutate(student.id),
      },
    ]);
  }

  function onUnarchivePress() {
    if (!student) return;
    unarchiveMutation.mutate(student.id);
  }

  function onDeletePress() {
    if (!student) return;

    const warningDetails: string[] = [];
    if (sessionCount > 0) {
      warningDetails.push(
        `${sessionCount} session histor${sessionCount === 1 ? "y" : "ies"}`,
      );
    }
    if (assessmentCount > 0) {
      warningDetails.push(
        `${assessmentCount} assessment histor${assessmentCount === 1 ? "y" : "ies"}`,
      );
    }
    if (student.license_front_image_url || student.license_back_image_url) {
      warningDetails.push("uploaded licence card photos");
    }

    const deleteMessage =
      warningDetails.length === 0
        ? "Permanently delete this student? This cannot be undone."
        : `Permanently delete this student? This cannot be undone.\n\nWarning: This student has ${warningDetails.join(", ")} that will disappear forever. Save or export them first if needed.`;

    Alert.alert("Delete student", deleteMessage, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteMutation.mutate(student.id, {
            onSuccess: () =>
              navigation.reset({ index: 0, routes: [{ name: "StudentsList" }] }),
            onError: (error) =>
              Alert.alert("Couldn't delete student", toErrorMessage(error)),
          });
        },
      },
    ]);
  }

  return (
    <>
      <Screen scroll scrollRef={screenScrollRef} className="flex-none">
        <AppStack gap={isCompact ? "md" : "lg"}>
          {query.isPending ? (
            <View
              className={cn(
                "items-center justify-center py-10",
                theme.text.base,
              )}
            >
              <ActivityIndicator />
              <AppText className="mt-3 text-center" variant="body">
                Loading student...
              </AppText>
            </View>
          ) : query.isError ? (
            <AppStack gap="md">
              <AppCard className="gap-2">
                <AppText variant="heading">Couldn't load student</AppText>
                <AppText variant="body">{toErrorMessage(query.error)}</AppText>
              </AppCard>
              <AppButton
                label="Retry"
                icon={RefreshCw}
                onPress={() => query.refetch()}
              />
            </AppStack>
          ) : !student ? (
            <AppCard className="gap-2">
              <AppText variant="heading">Student not found</AppText>
              <AppText variant="body">
                This student may have been deleted or you may not have access.
              </AppText>
            </AppCard>
          ) : (
            <>
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1">
                  <AppText
                    className={isCompact ? "text-[26px]" : "text-[30px]"}
                    variant="title"
                  >
                    {student.first_name} {student.last_name}
                  </AppText>
                  <View className="mt-1 flex-row items-center gap-2">
                    <Building2
                      size={22}
                      color={organizationIconColor}
                      strokeWidth={2}
                    />
                    <AppText className="text-[24px]" numberOfLines={1}>
                      {student.organization_name ?? "-"}
                    </AppText>
                  </View>
                  {isArchived ? (
                    <AppText className="mt-2" variant="caption">
                      Archived on{" "}
                      {student.archived_at ? formatIsoDateToDisplay(student.archived_at) : ""}
                    </AppText>
                  ) : null}
                </View>

                <AppButton
                  width="auto"
                  size="icon"
                  variant="secondary"
                  label=""
                  className="h-[55px] w-[55px]"
                  iconSize={30}
                  accessibilityLabel="More student actions"
                  icon={EllipsisVertical}
                  onPress={openActionMenu}
                />
              </View>

              <View
                className={cn(
                  isSidebar ? "flex-row flex-wrap gap-6" : isCompact ? "gap-4" : "gap-6",
                )}
              >
                <AppStack
                  gap="md"
                  className={cn(isSidebar && "flex-1 min-w-[360px]")}
                >
                  <AppCard className="gap-3">
                    <AppText variant="heading">Contact</AppText>

                    <View className="flex-row flex-wrap gap-3">
                      <DetailValueField
                        className="min-w-56 flex-1"
                        label="Email"
                        value={student.email ?? "-"}
                      />
                      <DetailValueField
                        className="min-w-56 flex-1"
                        label="Phone"
                        value={student.phone ?? "-"}
                      />
                    </View>

                    <View className="flex-row flex-wrap gap-3">
                      <DetailValueField
                        className="min-w-56 flex-1"
                        label="Date of birth"
                        value={studentDobDisplay}
                      />
                      <DetailValueField
                        className="min-w-56 flex-1"
                        label="Age"
                        value={studentAgeDisplay}
                      />
                    </View>

                    <DetailValueField
                      className="w-full"
                      label="Address"
                      value={student.address?.trim() ? student.address : "-"}
                    />
                  </AppCard>

                <AppCard className="gap-3">
                  <AppText variant="heading">Licence</AppText>

                  <View className="flex-row flex-wrap gap-3">
                    <DetailValueField
                      className="min-w-56 flex-1"
                      label="Type"
                      value={toSentenceCase(student.license_type ?? "")}
                    />
                    <DetailValueField
                      className="min-w-56 flex-1"
                      label="Number"
                      value={student.license_number ?? "-"}
                    />
                  </View>

                  <View className="flex-row flex-wrap gap-3">
                    <DetailValueField
                      className="min-w-56 flex-1"
                      label="Version"
                      value={student.license_version ?? "-"}
                    />
                    <DetailValueField
                      className="min-w-56 flex-1"
                      label="Class held"
                      value={student.class_held ?? "-"}
                    />
                  </View>

                  <View className="flex-row flex-wrap gap-3">
                    <DetailValueField
                      className="min-w-56 flex-1"
                      label="Issue date"
                      value={
                        student.issue_date
                          ? formatIsoDateToDisplay(student.issue_date)
                          : "-"
                      }
                    />
                    <DetailValueField
                      className="min-w-56 flex-1"
                      label="Expiry date"
                      value={
                        student.expiry_date
                          ? formatIsoDateToDisplay(student.expiry_date)
                          : "-"
                      }
                    />
                  </View>
                  <View className="h-2" />

                  <AppStack gap="sm">
                    <AppText variant="label">Licence card photos</AppText>
                    <View className="flex-row gap-3">
                      <AppStack className="flex-1" gap="sm">
                        {student.license_front_image_url ? (
                          <Pressable
                            onPress={() => {
                              const frontIndex = licenseImages.findIndex(
                                (image) => image.key === "front",
                              );
                              if (frontIndex >= 0)
                                openLicenseGallery(frontIndex);
                            }}
                          >
                            <View className="h-32 overflow-hidden rounded-xl border border-border bg-card dark:border-borderDark dark:bg-cardDark">
                              <AppImage
                                source={{
                                  uri: student.license_front_image_url,
                                }}
                                resizeMode="cover"
                                className="h-full w-full"
                              />
                            </View>
                          </Pressable>
                        ) : null}
                        <AppButton
                          variant="secondary"
                          label={
                            student.license_front_image_url
                              ? "Front photo options"
                              : "Add Front Licence photo"
                          }
                          disabled={
                            uploadLicenseImageMutation.isPending ||
                            removeLicenseImageMutation.isPending
                          }
                          onPress={() => openLicenseImageActions("front")}
                        />
                      </AppStack>

                      <AppStack className="flex-1" gap="sm">
                        {student.license_back_image_url ? (
                          <Pressable
                            onPress={() => {
                              const backIndex = licenseImages.findIndex(
                                (image) => image.key === "back",
                              );
                              if (backIndex >= 0) openLicenseGallery(backIndex);
                            }}
                          >
                            <View className="h-32 overflow-hidden rounded-xl border border-border bg-card dark:border-borderDark dark:bg-cardDark">
                              <AppImage
                                source={{
                                  uri: student.license_back_image_url,
                                }}
                                resizeMode="cover"
                                className="h-full w-full"
                              />
                            </View>
                          </Pressable>
                        ) : null}
                        <AppButton
                          variant="secondary"
                          label={
                            student.license_back_image_url
                              ? "Back photo options"
                              : "Add Back Licence photo"
                          }
                          disabled={
                            uploadLicenseImageMutation.isPending ||
                            removeLicenseImageMutation.isPending
                          }
                          onPress={() => openLicenseImageActions("back")}
                        />
                      </AppStack>
                    </View>
                    {licenseImages.length > 0 ? (
                      <AppText variant="caption">
                        Tap a photo to view full size.
                      </AppText>
                    ) : null}
                    {uploadLicenseImageMutation.isError ? (
                      <AppText variant="error">
                        {toErrorMessage(uploadLicenseImageMutation.error)}
                      </AppText>
                    ) : null}
                    {removeLicenseImageMutation.isError ? (
                      <AppText variant="error">
                        {toErrorMessage(removeLicenseImageMutation.error)}
                      </AppText>
                    ) : null}
                    {licensePickerError ? (
                      <AppText variant="error">{licensePickerError}</AppText>
                    ) : null}
                  </AppStack>
                </AppCard>

                {notes ? (
                  <AppCard className="gap-2">
                    <AppText variant="heading">Notes</AppText>
                    <AppText variant="body">{notes}</AppText>
                  </AppCard>
                ) : null}
                </AppStack>
              </View>
            </>
          )}
        </AppStack>
      </Screen>

      <Modal
        visible={actionMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeActionMenu}
      >
        <Pressable
          className="flex-1 bg-black/20"
          onPress={closeActionMenu}
        >
          <Pressable
            className={cn(
              "absolute right-6 top-24 w-[250px]",
              isCompact && "right-4 top-20 w-[230px]",
            )}
            onPress={(event) => event.stopPropagation()}
          >
            <AppCard className="gap-1 p-2">
              <StudentActionMenuItem
                label="Start Assessment"
                icon={Play}
                tone="info"
                disabled={!drawerNavigation}
                onPress={() => {
                  if (!student) return;
                  closeActionMenu();
                  onStartAssessmentPress();
                }}
              />
              <StudentActionMenuItem
                label="Sessions"
                icon={Clock}
                badgeCount={
                  sessionsQuery.isPending || sessionsQuery.isError ? undefined : sessionCount
                }
                onPress={() => {
                  if (!student) return;
                  closeActionMenu();
                  navigation.navigate("StudentSessionHistory", {
                    studentId: student.id,
                  });
                }}
              />
              <StudentActionMenuItem
                label="Reminders"
                icon={Bell}
                badgeCount={
                  remindersQuery.isPending || remindersQuery.isError
                    ? undefined
                    : reminderCount
                }
                onPress={() => {
                  if (!student) return;
                  closeActionMenu();
                  navigation.navigate("StudentReminders", {
                    studentId: student.id,
                  });
                }}
              />
              <StudentActionMenuItem
                label="Assessments"
                icon={ClipboardList}
                badgeCount={
                  assessmentsQuery.isPending || assessmentsQuery.isError
                    ? undefined
                    : assessmentCount
                }
                onPress={() => {
                  if (!student) return;
                  closeActionMenu();
                  navigation.navigate("StudentAssessmentHistory", {
                    studentId: student.id,
                  });
                }}
              />
              <View className="h-2" />
              <StudentActionMenuItem
                label="Edit details"
                icon={Pencil}
                tone="success"
                onPress={() => {
                  if (!student) return;
                  closeActionMenu();
                  navigation.navigate("StudentEdit", { studentId: student.id });
                }}
              />
              <StudentActionMenuItem
                label={
                  isArchived
                    ? (unarchiveMutation.isPending ? "Unarchiving..." : "Unarchive")
                    : (archiveMutation.isPending ? "Archiving..." : "Archive")
                }
                icon={isArchived ? Undo2 : Archive}
                tone="warning"
                disabled={
                  archiveMutation.isPending ||
                  unarchiveMutation.isPending ||
                  deleteMutation.isPending
                }
                onPress={() => {
                  closeActionMenu();
                  if (isArchived) {
                    onUnarchivePress();
                    return;
                  }
                  onArchivePress();
                }}
              />
              <StudentActionMenuItem
                label={deleteMutation.isPending ? "Deleting..." : "Delete"}
                icon={Trash2}
                tone="danger"
                disabled={
                  deleteMutation.isPending ||
                  archiveMutation.isPending ||
                  unarchiveMutation.isPending
                }
                onPress={() => {
                  closeActionMenu();
                  onDeletePress();
                }}
              />
            </AppCard>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={startAssessmentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeStartAssessmentModal}
      >
        <Pressable
          className={cn("flex-1 bg-black/40", isCompact ? "px-4 py-6" : "px-6 py-10")}
          onPress={closeStartAssessmentModal}
        >
          <Pressable
            className="m-auto w-full max-w-md"
            onPress={(event) => event.stopPropagation()}
          >
            <AppCard className="gap-3">
              <AppText variant="heading">Start Assessment</AppText>
              <AppText variant="body">
                Choose the assessment to start for this student.
              </AppText>
              <AppStack gap="sm">
                <AppButton
                  variant="secondary"
                  label="Driving Assessment"
                  onPress={() => navigateToAssessment("DrivingAssessment")}
                />
                <AppButton
                  variant="secondary"
                  label="Mock Test - Restricted Licence"
                  onPress={() => navigateToAssessment("RestrictedMockTest")}
                />
                <AppButton
                  variant="secondary"
                  label="Mock Test - Full License"
                  onPress={() => navigateToAssessment("FullLicenseMockTest")}
                />
                <AppButton
                  variant="ghost"
                  label="Cancel"
                  onPress={closeStartAssessmentModal}
                />
              </AppStack>
            </AppCard>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={licenseActionModalSide != null}
        transparent
        animationType="fade"
        onRequestClose={closeLicenseActionModal}
      >
        <Pressable
          className={cn("flex-1 bg-black/40", isCompact ? "px-4 py-6" : "px-6 py-10")}
          onPress={closeLicenseActionModal}
        >
          <Pressable
            className="m-auto w-full max-w-md"
            onPress={(event) => event.stopPropagation()}
          >
            <AppCard className="gap-3">
              <View className="flex-row items-center justify-between gap-2">
                <AppText variant="heading">{licenseActionTitle}</AppText>
                <AppButton
                  label=""
                  width="auto"
                  size="icon"
                  variant="ghost"
                  icon={X}
                  onPress={closeLicenseActionModal}
                />
              </View>

              <AppButton
                variant="secondary"
                label="Take photo"
                disabled={
                  uploadLicenseImageMutation.isPending ||
                  removeLicenseImageMutation.isPending
                }
                onPress={() => {
                  const side = licenseActionModalSide;
                  closeLicenseActionModal();
                  if (!side) return;
                  void pickAndUploadLicenseImage(side, "camera");
                }}
              />
              <AppButton
                variant="secondary"
                label="Choose from library"
                disabled={
                  uploadLicenseImageMutation.isPending ||
                  removeLicenseImageMutation.isPending
                }
                onPress={() => {
                  const side = licenseActionModalSide;
                  closeLicenseActionModal();
                  if (!side) return;
                  void pickAndUploadLicenseImage(side, "library");
                }}
              />
              {licenseActionHasExisting ? (
                <AppButton
                  variant="danger"
                  label="Delete photo"
                  disabled={
                    uploadLicenseImageMutation.isPending ||
                    removeLicenseImageMutation.isPending
                  }
                  onPress={() => {
                    const side = licenseActionModalSide;
                    closeLicenseActionModal();
                    if (!side) return;
                    deleteLicenseImage(side);
                  }}
                />
              ) : null}
              <AppButton
                variant="ghost"
                label="Cancel"
                onPress={closeLicenseActionModal}
              />
            </AppCard>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={licenseGalleryVisible && activeLicenseImage != null}
        transparent
        animationType="fade"
        onRequestClose={() => setLicenseGalleryVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/90 px-4 py-8"
          onPress={() => setLicenseGalleryVisible(false)}
        >
          <Pressable
            className="flex-1"
            onPress={(event) => event.stopPropagation()}
          >
            <View className="flex-row items-center justify-between gap-2">
              <AppText className="text-primaryForeground" variant="body">
                {activeLicenseImage
                  ? `${activeLicenseImage.label} (${licenseGalleryIndex + 1}/${licenseImages.length})`
                  : ""}
              </AppText>
              <AppButton
                width="auto"
                variant="secondary"
                label="Close"
                onPress={() => setLicenseGalleryVisible(false)}
              />
            </View>

            <View
              className="flex-1 items-center justify-center"
              onLayout={(event) => setLicenseGalleryWidth(event.nativeEvent.layout.width)}
            >
              <ScrollView
                ref={licenseGalleryScrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                onMomentumScrollEnd={(event) => {
                  if (licenseGalleryWidth <= 0) return;
                  const nextIndex = Math.round(event.nativeEvent.contentOffset.x / licenseGalleryWidth);
                  const clamped = Math.max(0, Math.min(nextIndex, licenseImages.length - 1));
                  if (clamped !== licenseGalleryIndex) setLicenseGalleryIndex(clamped);
                }}
              >
                {licenseImages.map((image) => (
                  <View
                    key={image.key}
                    style={{ width: licenseGalleryWidth }}
                    className="flex-1 items-center justify-center"
                  >
                    <AppImage
                      source={{ uri: image.uri }}
                      resizeMode="contain"
                      className="h-full w-full"
                    />
                  </View>
                ))}
              </ScrollView>
            </View>

            <View className="flex-row gap-2">
              <AppButton
                className="flex-1"
                width="auto"
                variant="secondary"
                label="Previous"
                disabled={licenseImages.length <= 1}
                onPress={showPreviousLicenseImage}
              />
              <AppButton
                className="flex-1"
                width="auto"
                variant="secondary"
                label="Next"
                disabled={licenseImages.length <= 1}
                onPress={showNextLicenseImage}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
