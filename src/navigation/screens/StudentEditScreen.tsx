import * as ImagePicker from "expo-image-picker";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  View,
  type ScrollView,
} from "react-native";
import { X } from "lucide-react-native";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { AppCheckbox } from "../../components/AppCheckbox";
import { AddressAutocompleteInput } from "../../components/AddressAutocompleteInput";
import { AppDateInput } from "../../components/AppDateInput";
import { AppImage } from "../../components/AppImage";
import { AppInput } from "../../components/AppInput";
import { AppStack } from "../../components/AppStack";
import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";
import { useMyProfileQuery } from "../../features/auth/queries";
import { isOwnerOrAdminRole, toRoleLabel } from "../../features/auth/roles";
import { useAuthSession } from "../../features/auth/session";
import { useOrganizationQuery } from "../../features/organization/queries";
import { useOrganizationProfilesQuery } from "../../features/profiles/queries";
import {
  useCreateStudentMutation,
  useRemoveStudentLicenseImageMutation,
  useUploadStudentLicenseImageMutation,
  useStudentQuery,
  useUpdateStudentMutation,
} from "../../features/students/queries";
import {
  getStudentPhotoVideoReleaseLiabilityText,
  getStudentPhotoVideoReleasePermissionText,
  getStudentReleaseOrganizationName,
  STUDENT_DECLARATION_COPY,
  STUDENT_LEARNER_TYPE_OPTIONS,
  type StudentLearnerType,
  normalizeStudentOrganization,
  STUDENT_ORGANIZATION_OPTIONS,
} from "../../features/students/constants";
import {
  studentFormSchema,
  type StudentFormValues,
} from "../../features/students/schemas";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";
import {
  formatIsoDateToDisplay,
  parseDateInputToISODate,
} from "../../utils/dates";
import { toErrorMessage } from "../../utils/errors";
import { getProfileFullName } from "../../utils/profileName";
import { normalizeLicenseNumberInput } from "../../utils/licenseNumber";

import type { StudentsStackParamList } from "../StudentsStackNavigator";
import { useNavigationLayout } from "../useNavigationLayout";

type CreateProps = NativeStackScreenProps<
  StudentsStackParamList,
  "StudentCreate"
>;
type EditProps = NativeStackScreenProps<StudentsStackParamList, "StudentEdit">;
type Props = CreateProps | EditProps;
const classHeldOptions = ["1L", "1R", "1F"] as const;
const learnerTypeLabels: Record<
  (typeof STUDENT_LEARNER_TYPE_OPTIONS)[number],
  string
> = {
  visual: "Visual",
  auditory: "Auditory",
  ready: "Ready",
  kinesthetic: "Kinesthetic",
};
const studentOrganizationMenuOptions = [
  ...STUDENT_ORGANIZATION_OPTIONS,
  "Custom",
] as const;
type StudentOrganizationMenuOption =
  (typeof studentOrganizationMenuOptions)[number];
type StudentLicenseImageSide = "front" | "back";
type StudentLicenseImageSource = "camera" | "library";
const presetOrganizationLookup = new Set(
  STUDENT_ORGANIZATION_OPTIONS.map((option) => option.toLowerCase()),
);

function emptyToNull(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export function StudentEditScreen({ navigation, route }: Props) {
  const studentId =
    route.name === "StudentEdit" ? route.params.studentId : undefined;
  const studentEditScrollRef = useRef<ScrollView>(null);
  const { isCompact } = useNavigationLayout();

  const { session } = useAuthSession();
  const userId = session?.user.id;
  const profileQuery = useMyProfileQuery(userId);
  const organizationQuery = useOrganizationQuery(profileQuery.data?.organization_id);

  const studentQuery = useStudentQuery(studentId);
  const createMutation = useCreateStudentMutation();
  const updateMutation = useUpdateStudentMutation();
  const uploadLicenseImageMutation = useUploadStudentLicenseImageMutation();
  const removeLicenseImageMutation = useRemoveStudentLicenseImageMutation();

  const role = profileQuery.data?.role ?? null;
  const canManageStudentAssignments = isOwnerOrAdminRole(role);
  const isEditing = Boolean(studentId);

  const orgProfilesQuery = useOrganizationProfilesQuery(
    canManageStudentAssignments,
  );

  const defaultAssignedInstructorId = useMemo(() => {
    if (role === "instructor" || role === "owner" || role === "admin") {
      return userId ?? "";
    }
    return "";
  }, [role, userId]);

  const instructorProfiles = useMemo(
    () =>
      (orgProfilesQuery.data ?? []).filter(
        (profileOption) => profileOption.role === "instructor",
      ),
    [orgProfilesQuery.data],
  );

  const assignableInstructorProfiles = useMemo(
    () =>
      (orgProfilesQuery.data ?? []).filter(
        (profileOption) => profileOption.role !== "admin",
      ),
    [orgProfilesQuery.data],
  );

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      email: "",
      phone: "",
      address: "",
      organization: STUDENT_ORGANIZATION_OPTIONS[0],
      learnerTypes: [],
      assignedInstructorId: defaultAssignedInstructorId,
      licenseType: "learner",
      licenseNumber: "",
      licenseVersion: "",
      classHeld: "",
      issueDate: "",
      expiryDate: "",
      notes: "",
      photoVideoReleaseConsent: false,
      photoVideoReleaseLiabilityWaiver: false,
      declarationConfirmed: false,
    },
  });
  const [organizationOptionsModalVisible, setOrganizationOptionsModalVisible] =
    useState(false);
  const [customOrganizationModalVisible, setCustomOrganizationModalVisible] =
    useState(false);
  const [customOrganizationValue, setCustomOrganizationValue] = useState("");
  const [instructorMenuOpen, setInstructorMenuOpen] = useState(false);
  const [licensePickerError, setLicensePickerError] = useState<string | null>(
    null,
  );
  const [pendingLicenseFrontAsset, setPendingLicenseFrontAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [pendingLicenseBackAsset, setPendingLicenseBackAsset] =
    useState<ImagePicker.ImagePickerAsset | null>(null);
  const [removeLicenseFrontOnSave, setRemoveLicenseFrontOnSave] =
    useState(false);
  const [removeLicenseBackOnSave, setRemoveLicenseBackOnSave] = useState(false);
  const [licenseActionModalSide, setLicenseActionModalSide] =
    useState<StudentLicenseImageSide | null>(null);

  useEffect(() => {
    if (defaultAssignedInstructorId) {
      form.setValue("assignedInstructorId", defaultAssignedInstructorId, {
        shouldValidate: true,
      });
    }
  }, [defaultAssignedInstructorId, form]);

  useEffect(() => {
    if (!canManageStudentAssignments || isEditing) return;

    const currentAssignedInstructorId = form.getValues("assignedInstructorId");

    if (instructorProfiles.length === 0) {
      if (userId && currentAssignedInstructorId !== userId) {
        form.setValue("assignedInstructorId", userId, {
          shouldValidate: true,
        });
      }
      return;
    }

    const hasSelectedInstructor = instructorProfiles.some(
      (profileOption) => profileOption.id === currentAssignedInstructorId,
    );

    if (!hasSelectedInstructor) {
      form.setValue("assignedInstructorId", instructorProfiles[0].id, {
        shouldValidate: true,
      });
    }
  }, [
    canManageStudentAssignments,
    form,
    instructorProfiles,
    isEditing,
    userId,
  ]);

  useEffect(() => {
    if (!studentId) return;
    if (!studentQuery.data) return;

    form.reset({
      firstName: studentQuery.data.first_name,
      lastName: studentQuery.data.last_name,
      dateOfBirth: studentQuery.data.date_of_birth
        ? formatIsoDateToDisplay(studentQuery.data.date_of_birth)
        : "",
      email: studentQuery.data.email ?? "",
      phone: studentQuery.data.phone ?? "",
      address: studentQuery.data.address ?? "",
      organization:
        studentQuery.data.organization_name ?? STUDENT_ORGANIZATION_OPTIONS[0],
      learnerTypes: studentQuery.data.learner_types ?? [],
      assignedInstructorId: studentQuery.data.assigned_instructor_id,
      licenseType: studentQuery.data.license_type ?? "learner",
      licenseNumber: studentQuery.data.license_number ?? "",
      licenseVersion: studentQuery.data.license_version ?? "",
      classHeld: studentQuery.data.class_held ?? "",
      issueDate: studentQuery.data.issue_date
        ? formatIsoDateToDisplay(studentQuery.data.issue_date)
        : "",
      expiryDate: studentQuery.data.expiry_date
        ? formatIsoDateToDisplay(studentQuery.data.expiry_date)
        : "",
      notes: studentQuery.data.notes ?? "",
      photoVideoReleaseConsent:
        studentQuery.data.photo_video_release_consent ?? false,
      photoVideoReleaseLiabilityWaiver:
        studentQuery.data.photo_video_release_liability_waiver ?? false,
      declarationConfirmed: studentQuery.data.declaration_confirmed ?? false,
    });
    setRemoveLicenseFrontOnSave(false);
    setRemoveLicenseBackOnSave(false);
  }, [form, studentId, studentQuery.data]);

  const isLoading =
    profileQuery.isPending ||
    (studentId ? studentQuery.isPending : false) ||
    !session;

  if (isLoading) {
    return (
      <Screen>
        <View
          className={cn("flex-1 items-center justify-center", theme.text.base)}
        >
          <ActivityIndicator />
          <AppText className="mt-3 text-center" variant="body">
            Loading...
          </AppText>
        </View>
      </Screen>
    );
  }

  if (profileQuery.isError) {
    return (
      <Screen>
        <AppStack gap="md">
          <AppText variant="title">Couldn't load your profile</AppText>
          <AppCard className="gap-2">
            <AppText variant="body">
              {toErrorMessage(profileQuery.error)}
            </AppText>
          </AppCard>
          <AppButton label="Retry" onPress={() => profileQuery.refetch()} />
        </AppStack>
      </Screen>
    );
  }

  const profile = profileQuery.data;
  if (!profile) {
    return (
      <Screen>
        <AppCard className="gap-2">
          <AppText variant="heading">Profile required</AppText>
          <AppText variant="body">Complete onboarding first.</AppText>
        </AppCard>
      </Screen>
    );
  }

  const organizationId = profile.organization_id;
  const releaseOrganizationName = getStudentReleaseOrganizationName(
    organizationQuery.data?.name,
  );
  const photoVideoReleasePermissionText =
    getStudentPhotoVideoReleasePermissionText(releaseOrganizationName);
  const photoVideoReleaseLiabilityText =
    getStudentPhotoVideoReleaseLiabilityText(releaseOrganizationName);
  const mutationError =
    createMutation.error ??
    updateMutation.error ??
    uploadLicenseImageMutation.error ??
    removeLicenseImageMutation.error;
  const showCreateInstructorDropdown =
    canManageStudentAssignments && !isEditing && instructorProfiles.length > 0;
  const hideAssignedInstructorCard =
    canManageStudentAssignments &&
    !orgProfilesQuery.isPending &&
    !orgProfilesQuery.isError &&
    instructorProfiles.length === 0;

  function mapStudentInput(values: StudentFormValues) {
    const base = {
      assigned_instructor_id: values.assignedInstructorId,
      first_name: values.firstName.trim(),
      last_name: values.lastName.trim(),
      date_of_birth: values.dateOfBirth.trim()
        ? parseDateInputToISODate(values.dateOfBirth)
        : null,
      email: values.email.trim(),
      phone: values.phone.trim(),
      address: emptyToNull(values.address),
      organization_name: normalizeStudentOrganization(values.organization),
      learner_types: values.learnerTypes,
      license_type: values.licenseType,
      license_number: emptyToNull(values.licenseNumber),
      license_version: emptyToNull(values.licenseVersion),
      class_held: emptyToNull(values.classHeld),
      issue_date: values.issueDate.trim()
        ? parseDateInputToISODate(values.issueDate)
        : null,
      expiry_date: values.expiryDate.trim()
        ? parseDateInputToISODate(values.expiryDate)
        : null,
      notes: emptyToNull(values.notes),
      photo_video_release_consent: values.photoVideoReleaseConsent,
      photo_video_release_liability_waiver:
        values.photoVideoReleaseLiabilityWaiver,
      declaration_confirmed: values.declarationConfirmed,
    } as const;
    return base;
  }

  function closeCustomOrganizationModal() {
    setCustomOrganizationModalVisible(false);
    setCustomOrganizationValue("");
  }

  function closeOrganizationOptionsModal() {
    setOrganizationOptionsModalVisible(false);
  }

  function openOrganizationOptionsModal() {
    setOrganizationOptionsModalVisible(true);
  }

  function applyOrganizationValue(nextValue: string) {
    form.setValue("organization", normalizeStudentOrganization(nextValue), {
      shouldDirty: true,
      shouldValidate: true,
    });
    closeOrganizationOptionsModal();
  }

  function openCustomOrganizationModal(currentValue: string) {
    const normalizedCurrent = normalizeStudentOrganization(currentValue);
    closeOrganizationOptionsModal();
    setCustomOrganizationValue(
      presetOrganizationLookup.has(normalizedCurrent.toLowerCase())
        ? ""
        : normalizedCurrent,
    );
    setCustomOrganizationModalVisible(true);
  }

  function onSelectOrganizationOption(
    option: StudentOrganizationMenuOption,
    currentValue: string,
  ) {
    if (option === "Custom") {
      openCustomOrganizationModal(currentValue);
      return;
    }
    applyOrganizationValue(option);
  }

  function saveCustomOrganization() {
    const normalized = normalizeStudentOrganization(customOrganizationValue);
    if (!normalized) {
      Alert.alert(
        "Organization required",
        "Enter a custom organization name first.",
      );
      return;
    }

    applyOrganizationValue(normalized);
    closeCustomOrganizationModal();
  }

  function setPendingLicenseAsset(
    side: StudentLicenseImageSide,
    asset: ImagePicker.ImagePickerAsset | null,
  ) {
    if (side === "front") {
      setPendingLicenseFrontAsset(asset);
      if (asset) setRemoveLicenseFrontOnSave(false);
      return;
    }
    setPendingLicenseBackAsset(asset);
    if (asset) setRemoveLicenseBackOnSave(false);
  }

  function setRemoveLicenseOnSave(
    side: StudentLicenseImageSide,
    shouldRemove: boolean,
  ) {
    if (side === "front") {
      setRemoveLicenseFrontOnSave(shouldRemove);
      return;
    }
    setRemoveLicenseBackOnSave(shouldRemove);
  }

  function closeLicenseActionModal() {
    setLicenseActionModalSide(null);
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

  async function pickLicenseAsset(
    side: StudentLicenseImageSide,
    source: StudentLicenseImageSource,
  ) {
    try {
      setLicensePickerError(null);
      const asset =
        source === "camera"
          ? await pickLicenseAssetFromCamera()
          : await pickLicenseAssetFromLibrary();
      if (!asset) return;
      setPendingLicenseAsset(side, asset);
    } catch (error) {
      setLicensePickerError(toErrorMessage(error));
    }
  }

  function openLicenseImageActions(side: StudentLicenseImageSide) {
    setLicenseActionModalSide(side);
  }

  async function applyPendingLicenseImageChanges(studentIdToUpload: string) {
    if (removeLicenseFrontOnSave && !pendingLicenseFrontAsset) {
      await removeLicenseImageMutation.mutateAsync({
        organizationId,
        studentId: studentIdToUpload,
        side: "front",
      });
    } else if (pendingLicenseFrontAsset) {
      await uploadLicenseImageMutation.mutateAsync({
        organizationId,
        studentId: studentIdToUpload,
        side: "front",
        asset: pendingLicenseFrontAsset,
      });
    }

    if (removeLicenseBackOnSave && !pendingLicenseBackAsset) {
      await removeLicenseImageMutation.mutateAsync({
        organizationId,
        studentId: studentIdToUpload,
        side: "back",
      });
    } else if (pendingLicenseBackAsset) {
      await uploadLicenseImageMutation.mutateAsync({
        organizationId,
        studentId: studentIdToUpload,
        side: "back",
        asset: pendingLicenseBackAsset,
      });
    }
  }

  async function createStudentAndNavigate(values: StudentFormValues) {
    const base = mapStudentInput(values);
    const created = await createMutation.mutateAsync({
      organization_id: organizationId,
      ...base,
    });
    await applyPendingLicenseImageChanges(created.id);
    navigation.replace("StudentDetail", { studentId: created.id });
  }

  async function updateStudentAndNavigate(values: StudentFormValues) {
    const updated = await updateMutation.mutateAsync({
      studentId: studentId!,
      input: mapStudentInput(values),
    });
    await applyPendingLicenseImageChanges(updated.id);
    navigation.replace("StudentDetail", { studentId: updated.id });
  }

  async function onSubmit(values: StudentFormValues) {
    if (!userId) return;

    if (!isEditing && !values.declarationConfirmed) {
      form.setError("declarationConfirmed", {
        type: "manual",
        message: "Declaration must be checked before adding a student.",
      });
      scrollToBottomSoon();
      return;
    }

    form.clearErrors("declarationConfirmed");

    if (isEditing) {
      Alert.alert("Save student", "Save changes to this student?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save",
          onPress: () => {
            void updateStudentAndNavigate(values).catch(() => {
              // Mutation error state is already handled by React Query and rendered below.
            });
          },
        },
      ]);
      return;
    }

    Alert.alert("Add student", "Add this student now?", [
      { text: "Back", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => {
          void createStudentAndNavigate(values).catch(() => {
            // Mutation error state is already handled by React Query and rendered below.
          });
        },
      },
    ]);
  }

  function scrollToBottomSoon() {
    setTimeout(() => {
      studentEditScrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  const saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadLicenseImageMutation.isPending ||
    removeLicenseImageMutation.isPending;
  const existingLicenseFrontUri =
    studentQuery.data?.license_front_image_url ?? null;
  const existingLicenseBackUri =
    studentQuery.data?.license_back_image_url ?? null;
  const licenseFrontPreviewUri =
    pendingLicenseFrontAsset?.uri ??
    (removeLicenseFrontOnSave ? null : existingLicenseFrontUri) ??
    null;
  const licenseBackPreviewUri =
    pendingLicenseBackAsset?.uri ??
    (removeLicenseBackOnSave ? null : existingLicenseBackUri) ??
    null;
  const licenseActionTitle =
    licenseActionModalSide === "front"
      ? "Front photo options"
      : licenseActionModalSide === "back"
        ? "Back photo options"
        : "";
  const licenseActionHasPending =
    licenseActionModalSide === "front"
      ? pendingLicenseFrontAsset != null
      : licenseActionModalSide === "back"
        ? pendingLicenseBackAsset != null
        : false;
  const licenseActionExistingUri =
    licenseActionModalSide === "front"
      ? existingLicenseFrontUri
      : licenseActionModalSide === "back"
        ? existingLicenseBackUri
        : null;
  const licenseActionMarkedForRemoval =
    licenseActionModalSide === "front"
      ? removeLicenseFrontOnSave
      : licenseActionModalSide === "back"
        ? removeLicenseBackOnSave
        : false;
  const licenseActionCanDelete =
    licenseActionModalSide != null &&
    (licenseActionHasPending ||
      (Boolean(licenseActionExistingUri) && !licenseActionMarkedForRemoval));
  const selectedOrganization = form.watch("organization")?.trim() ?? "";
  const declarationStudentFullName = [
    form.watch("firstName")?.trim() ?? "",
    form.watch("lastName")?.trim() ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  function toggleLearnerTypeSelection(
    selected: StudentLearnerType[],
    option: StudentLearnerType,
  ) {
    if (selected.includes(option)) {
      return selected.filter((value) => value !== option);
    }

    return STUDENT_LEARNER_TYPE_OPTIONS.filter(
      (candidate) => selected.includes(candidate) || candidate === option,
    );
  }
  const hasCustomOrganization =
    selectedOrganization.length > 0 &&
    !presetOrganizationLookup.has(selectedOrganization.toLowerCase());
  const organizationLabel = selectedOrganization || "Select organization";

  return (
    <>
      <Screen scroll scrollRef={studentEditScrollRef}>
        <AppStack gap={isCompact ? "md" : "lg"}>
          <View>
            <AppText variant="title">
              {isEditing ? "Edit student" : "New student"}
            </AppText>
            <AppText className="mt-2" variant="body">
              {canManageStudentAssignments
                ? "You can assign this student to an instructor."
                : "This student will be assigned to you."}
            </AppText>
          </View>

          <AppCard className="gap-4">
            <Controller
              control={form.control}
              name="firstName"
              render={({ field, fieldState }) => (
                <AppInput
                  label="First name"
                  autoCapitalize="words"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="lastName"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Last name"
                  autoCapitalize="words"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="dateOfBirth"
              render={({ field, fieldState }) => (
                <AppDateInput
                  label="Date of birth"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Email"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Phone"
                  keyboardType="phone-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="address"
              render={({ field }) => (
                <AddressAutocompleteInput
                  label="Address (optional)"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Start typing an address"
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={form.control}
              name="organization"
              render={({ fieldState }) => (
                <AppStack gap="sm">
                  <AppText variant="label">Organization</AppText>
                  <Pressable
                    accessibilityRole="button"
                    className={cn(
                      theme.button.base,
                      theme.button.variant.secondary,
                      theme.button.size.md,
                      "px-4",
                    )}
                    onPress={openOrganizationOptionsModal}
                  >
                    <AppText
                      className={cn(
                        "w-full text-left",
                        theme.button.labelVariant.secondary,
                      )}
                      variant="button"
                    >
                      {organizationLabel}
                    </AppText>
                  </Pressable>

                  {fieldState.error?.message ? (
                    <AppText variant="error">
                      {fieldState.error.message}
                    </AppText>
                  ) : null}
                </AppStack>
              )}
            />

            <Controller
              control={form.control}
              name="learnerTypes"
              render={({ field, fieldState }) => (
                <AppStack gap="sm">
                  <AppText variant="label">Type of learner</AppText>
                  {fieldState.error?.message ? (
                    <AppText variant="error">
                      {fieldState.error.message}
                    </AppText>
                  ) : null}

                  <View className="flex-row flex-wrap gap-2">
                    {STUDENT_LEARNER_TYPE_OPTIONS.map((option) => (
                      <AppButton
                        key={option}
                        label={learnerTypeLabels[option]}
                        width="auto"
                        className={cn(isCompact ? "min-w-[48%] flex-1" : "flex-1")}
                        variant={
                          field.value.includes(option) ? "primary" : "secondary"
                        }
                        onPress={() =>
                          field.onChange(toggleLearnerTypeSelection(field.value, option))
                        }
                      />
                    ))}
                  </View>
                </AppStack>
              )}
            />
          </AppCard>

          {!hideAssignedInstructorCard ? (
            <AppCard className="gap-4">
              <AppText variant="heading">Assigned Instructor</AppText>

              <Controller
                control={form.control}
                name="assignedInstructorId"
                render={({ field, fieldState }) => {
                  const selectedInstructorName =
                    instructorProfiles.find(
                      (profileOption) => profileOption.id === field.value,
                    )?.display_name ?? "";

                  return (
                    <AppStack gap="sm">
                      {fieldState.error?.message ? (
                        <AppText variant="error">
                          {fieldState.error.message}
                        </AppText>
                      ) : null}

                      {canManageStudentAssignments ? (
                        showCreateInstructorDropdown ? (
                          <AppStack gap="sm">
                            <Pressable
                              accessibilityRole="button"
                              className={cn(
                                theme.button.base,
                                theme.button.variant.secondary,
                                theme.button.size.md,
                                "px-4",
                              )}
                              onPress={() =>
                                setInstructorMenuOpen((previous) => !previous)
                              }
                            >
                              <AppText
                                className={cn(
                                  "w-full text-left",
                                  theme.button.labelVariant.secondary,
                                )}
                                variant="button"
                              >
                                Assign new student to an Instructor
                              </AppText>
                            </Pressable>

                            <AppText className="text-center" variant="caption">
                              {selectedInstructorName
                                ? `Selected: ${selectedInstructorName}`
                                : "Select an instructor"}
                            </AppText>

                            {instructorMenuOpen ? (
                              <AppStack gap="sm">
                                {instructorProfiles.map((profileOption) => (
                                  <AppButton
                                    key={profileOption.id}
                                    label={profileOption.display_name}
                                    variant={
                                      field.value === profileOption.id
                                        ? "primary"
                                        : "secondary"
                                    }
                                    onPress={() => {
                                      field.onChange(profileOption.id);
                                      setInstructorMenuOpen(false);
                                    }}
                                  />
                                ))}
                              </AppStack>
                            ) : null}
                          </AppStack>
                        ) : orgProfilesQuery.isPending ? (
                          <AppText variant="caption">
                            Loading instructors...
                          </AppText>
                        ) : orgProfilesQuery.isError ? (
                          <AppStack gap="md">
                            <AppText variant="error">
                              {toErrorMessage(orgProfilesQuery.error)}
                            </AppText>
                            <AppButton
                              label="Retry instructors"
                              variant="secondary"
                              onPress={() => orgProfilesQuery.refetch()}
                            />
                          </AppStack>
                        ) : (
                          <AppStack gap="sm">
                            {assignableInstructorProfiles.length === 0 ? (
                              <AppText variant="caption">
                                No instructors available.
                              </AppText>
                            ) : (
                              assignableInstructorProfiles.map(
                                (profileOption) => (
                                  <AppButton
                                    key={profileOption.id}
                                    label={`${profileOption.display_name}${
                                      profileOption.role === "owner" ||
                                      profileOption.role === "admin"
                                        ? ` (${toRoleLabel(profileOption.role)})`
                                        : ""
                                    }`}
                                    variant={
                                      field.value === profileOption.id
                                        ? "primary"
                                        : "secondary"
                                    }
                                    onPress={() =>
                                      field.onChange(profileOption.id)
                                    }
                                  />
                                ),
                              )
                            )}
                          </AppStack>
                        )
                      ) : (
                        <AppText variant="body">
                          {getProfileFullName(profile)}
                        </AppText>
                      )}
                    </AppStack>
                  );
                }}
              />
            </AppCard>
          ) : null}

          <AppCard className="gap-4">
            <AppText variant="heading">Licence</AppText>

            <Controller
              control={form.control}
              name="licenseType"
              render={({ field, fieldState }) => (
                <AppStack gap="sm">
                  <AppText variant="label">Licence type</AppText>
                  {fieldState.error?.message ? (
                    <AppText variant="error">
                      {fieldState.error.message}
                    </AppText>
                  ) : null}

                  <View className="flex-row gap-2">
                    <AppButton
                      label="Learner"
                      width="auto"
                      className="flex-1"
                      variant={
                        field.value === "learner" ? "primary" : "secondary"
                      }
                      onPress={() => field.onChange("learner")}
                    />
                    <AppButton
                      label="Restricted"
                      width="auto"
                      className="flex-1"
                      variant={
                        field.value === "restricted" ? "primary" : "secondary"
                      }
                      onPress={() => field.onChange("restricted")}
                    />
                    <AppButton
                      label="Full"
                      width="auto"
                      className="flex-1"
                      variant={field.value === "full" ? "primary" : "secondary"}
                      onPress={() => field.onChange("full")}
                    />
                  </View>
                </AppStack>
              )}
            />

            <Controller
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <AppInput
                  label="Licence number"
                  autoCapitalize="characters"
                  value={field.value}
                  onChangeText={(next) =>
                    field.onChange(normalizeLicenseNumberInput(next))
                  }
                  onBlur={field.onBlur}
                />
              )}
            />

            <Controller
              control={form.control}
              name="licenseVersion"
              render={({ field }) => (
                <AppInput
                  label="Licence version"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <Controller
              control={form.control}
              name="classHeld"
              render={({ field, fieldState }) => (
                <AppStack gap="sm">
                  <AppText variant="label">Class held</AppText>
                  {fieldState.error?.message ? (
                    <AppText variant="error">
                      {fieldState.error.message}
                    </AppText>
                  ) : null}
                  <View className="flex-row gap-2">
                    {classHeldOptions.map((option) => (
                      <AppButton
                        key={option}
                        width="auto"
                        className="flex-1"
                        label={option}
                        variant={
                          field.value === option ? "primary" : "secondary"
                        }
                        onPress={() => field.onChange(option)}
                      />
                    ))}
                  </View>
                </AppStack>
              )}
            />

            <Controller
              control={form.control}
              name="issueDate"
              render={({ field, fieldState }) => (
                <AppDateInput
                  label="Issue date"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={form.control}
              name="expiryDate"
              render={({ field, fieldState }) => (
                <AppDateInput
                  label="Expiry date"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />

            <AppStack gap="sm">
              <AppText variant="label">Licence card photos</AppText>
              <AppText variant="caption">
                Add front/back photos. Selected photos upload when you save.
              </AppText>

              <View className="flex-row gap-3">
                <AppStack className="flex-1" gap="sm">
                  {licenseFrontPreviewUri ? (
                    <AppImage
                      source={{ uri: licenseFrontPreviewUri }}
                      resizeMode="contain"
                      className="h-36 w-full rounded-xl border border-border bg-card dark:border-borderDark dark:bg-cardDark"
                    />
                  ) : null}
                  <AppButton
                    variant="secondary"
                    label={
                      licenseFrontPreviewUri
                        ? "Front photo options"
                        : "Add Front Licence photo"
                    }
                    onPress={() => openLicenseImageActions("front")}
                  />
                </AppStack>

                <AppStack className="flex-1" gap="sm">
                  {licenseBackPreviewUri ? (
                    <AppImage
                      source={{ uri: licenseBackPreviewUri }}
                      resizeMode="contain"
                      className="h-36 w-full rounded-xl border border-border bg-card dark:border-borderDark dark:bg-cardDark"
                    />
                  ) : null}
                  <AppButton
                    variant="secondary"
                    label={
                      licenseBackPreviewUri
                        ? "Back photo options"
                        : "Add Back Licence photo"
                    }
                    onPress={() => openLicenseImageActions("back")}
                  />
                </AppStack>
              </View>

              {licensePickerError ? (
                <AppText variant="error">{licensePickerError}</AppText>
              ) : null}
            </AppStack>
          </AppCard>

          <AppCard className="gap-4">
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <AppInput
                  label="Notes (optional)"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  inputClassName="h-28 py-3"
                  value={field.value}
                  onChangeText={field.onChange}
                  onFocus={scrollToBottomSoon}
                  onBlur={field.onBlur}
                />
              )}
            />
          </AppCard>

          <AppCard className="gap-4">
            <AppText variant="heading">Photo and Video Release Permission</AppText>

            <Controller
              control={form.control}
              name="photoVideoReleaseConsent"
              render={({ field }) => (
                <AppCheckbox
                  checked={field.value}
                  label={photoVideoReleasePermissionText}
                  onPress={() => field.onChange(!field.value)}
                />
              )}
            />

            <Controller
              control={form.control}
              name="photoVideoReleaseLiabilityWaiver"
              render={({ field }) => (
                <AppCheckbox
                  checked={field.value}
                  label={photoVideoReleaseLiabilityText}
                  onPress={() => field.onChange(!field.value)}
                />
              )}
            />
          </AppCard>

          <AppCard className="gap-4">
            <AppText variant="heading">Declaration</AppText>

            <Controller
              control={form.control}
              name="declarationConfirmed"
              render={({ field, fieldState }) => (
                <AppStack gap="sm">
                  <AppCheckbox
                    checked={field.value}
                    label={STUDENT_DECLARATION_COPY}
                    onPress={() => {
                      field.onChange(!field.value);
                      if (!field.value) {
                        form.clearErrors("declarationConfirmed");
                      }
                    }}
                  />
                  {fieldState.error?.message ? (
                    <AppText variant="error">
                      {fieldState.error.message}
                    </AppText>
                  ) : null}
                </AppStack>
              )}
            />

            <AppInput
              label="Full name"
              value={declarationStudentFullName}
              editable={false}
            />
          </AppCard>

          {mutationError ? (
            <AppText variant="error">{toErrorMessage(mutationError)}</AppText>
          ) : null}

          <AppButton
            label={
              saving ? "Saving..." : isEditing ? "Save student" : "Add student"
            }
            disabled={saving}
            onPress={form.handleSubmit(onSubmit)}
          />

          <AppButton
            label="Cancel"
            variant="ghost"
            onPress={() => navigation.goBack()}
          />
        </AppStack>
      </Screen>

      <Modal
        animationType="fade"
        transparent
        visible={licenseActionModalSide != null}
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
                onPress={() => {
                  const side = licenseActionModalSide;
                  closeLicenseActionModal();
                  if (!side) return;
                  void pickLicenseAsset(side, "camera");
                }}
              />
              <AppButton
                variant="secondary"
                label="Choose from library"
                onPress={() => {
                  const side = licenseActionModalSide;
                  closeLicenseActionModal();
                  if (!side) return;
                  void pickLicenseAsset(side, "library");
                }}
              />
              {licenseActionCanDelete ? (
                <AppButton
                  variant="danger"
                  label="Delete photo"
                  onPress={() => {
                    const side = licenseActionModalSide;
                    const existingUriForSide = licenseActionExistingUri;
                    closeLicenseActionModal();
                    if (!side) return;
                    setPendingLicenseAsset(side, null);
                    setRemoveLicenseOnSave(side, Boolean(existingUriForSide));
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
        animationType="fade"
        transparent
        visible={customOrganizationModalVisible}
        onRequestClose={closeCustomOrganizationModal}
      >
        <Pressable
          className={cn("flex-1 bg-black/40", isCompact ? "px-4 py-6" : "px-6 py-10")}
          onPress={closeCustomOrganizationModal}
        >
          <Pressable
            className="m-auto w-full max-w-md"
            onPress={(event) => event.stopPropagation()}
          >
            <AppCard className={isCompact ? "gap-3" : "gap-4"}>
              <AppText variant="heading">Custom organization</AppText>
              <AppInput
                label="Organization name"
                autoFocus
                autoCapitalize="words"
                value={customOrganizationValue}
                onChangeText={setCustomOrganizationValue}
                placeholder="Enter organization name"
              />
              <View className="flex-row gap-2">
                <AppButton
                  className="flex-1"
                  width="auto"
                  variant="secondary"
                  label="Cancel"
                  onPress={closeCustomOrganizationModal}
                />
                <AppButton
                  className="flex-1"
                  width="auto"
                  label="Save"
                  onPress={saveCustomOrganization}
                />
              </View>
            </AppCard>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={organizationOptionsModalVisible}
        onRequestClose={closeOrganizationOptionsModal}
      >
        <Pressable
          className={cn("flex-1 bg-black/40", isCompact ? "px-4 py-6" : "px-6 py-10")}
          onPress={closeOrganizationOptionsModal}
        >
          <Pressable
            className="m-auto w-full max-w-md"
            onPress={(event) => event.stopPropagation()}
          >
            <AppCard className="gap-3">
              <View className="flex-row items-center justify-between gap-2">
                <AppText variant="heading">Organization</AppText>
                <AppButton
                  label=""
                  width="auto"
                  size="icon"
                  variant="ghost"
                  icon={X}
                  onPress={closeOrganizationOptionsModal}
                />
              </View>

              {studentOrganizationMenuOptions.map((option) => (
                <AppButton
                  key={option}
                  variant={
                    option === "Custom"
                      ? hasCustomOrganization
                        ? "primary"
                        : "secondary"
                      : selectedOrganization.toLowerCase() ===
                          option.toLowerCase()
                        ? "primary"
                        : "secondary"
                  }
                  label={
                    option === "Custom" && hasCustomOrganization
                      ? `Custom: ${selectedOrganization}`
                      : option
                  }
                  onPress={() =>
                    onSelectOrganizationOption(option, selectedOrganization)
                  }
                />
              ))}

              <AppButton
                variant="ghost"
                label="Cancel"
                onPress={closeOrganizationOptionsModal}
              />
            </AppCard>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
