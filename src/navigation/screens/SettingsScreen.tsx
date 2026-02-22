import * as ImagePicker from "expo-image-picker";
import { ActivityIndicator, Pressable, View } from "react-native";
import { useState } from "react";
import {
  AtSign,
  BellRing,
  Building2,
  IdCard,
  ImageUp,
  KeyRound,
  Palette,
  RefreshCw,
  UserPlus,
  UserRoundPen,
  Users,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { Avatar } from "../../components/Avatar";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { AppImage } from "../../components/AppImage";
import { AppStack } from "../../components/AppStack";
import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";
import { useCurrentUser } from "../../features/auth/current-user";
import { getRoleDisplayLabel, isOwnerOrAdminRole } from "../../features/auth/roles";
import { useUploadOrganizationLogoMutation } from "../../features/organization/queries";
import {
  useOrganizationQuery,
  useOrganizationSettingsQuery,
} from "../../features/organization/queries";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";
import { toErrorMessage } from "../../utils/errors";
import { getProfileFullName } from "../../utils/profileName";
import type { SettingsStackParamList } from "../SettingsStackNavigator";
import { useNavigationLayout } from "../useNavigationLayout";

export function SettingsScreen() {
  const { isCompact } = useNavigationLayout();
  const { profile } = useCurrentUser();
  const canManageOrganization = isOwnerOrAdminRole(profile.role);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [organizationExpanded, setOrganizationExpanded] = useState(false);
  const [accountExpanded, setAccountExpanded] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  const orgQuery = useOrganizationQuery(profile.organization_id);
  const orgSettingsQuery = useOrganizationSettingsQuery(profile.organization_id);

  const uploadOrgLogoMutation = useUploadOrganizationLogoMutation(profile.organization_id);

  async function pickOrgLogo() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error("Permission to access photos was denied.");
    }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: "images",
    allowsEditing: false,
  });

    if (result.canceled) return null;
    return result.assets[0] ?? null;
  }

  const notificationsButton = (
    <AppButton
      label="Notifications"
      variant="secondary"
      icon={BellRing}
      onPress={() => navigation.navigate("Notifications")}
    />
  );

  const themesButton = (
    <AppButton
      label="Themes"
      variant="secondary"
      icon={Palette}
      onPress={() => navigation.navigate("Themes")}
    />
  );

  const organizationCard = canManageOrganization ? (
    <AppCard className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="heading">Organization</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            organizationExpanded ? "Hide organization settings" : "Show organization settings"
          }
          onPress={() => setOrganizationExpanded((expanded) => !expanded)}
        >
          <AppText
            className={
              organizationExpanded
                ? "text-red-600 dark:text-red-400"
                : "text-blue-600 dark:text-blue-400"
            }
            variant="caption"
          >
            {organizationExpanded ? "Hide" : "Show"}
          </AppText>
        </Pressable>
      </View>

      {orgQuery.isPending || orgSettingsQuery.isPending ? (
        <View className={cn("items-center justify-center py-6", theme.text.base)}>
          <ActivityIndicator />
          <AppText className="mt-3 text-center" variant="body">
            Loading organization...
          </AppText>
        </View>
      ) : orgQuery.isError || orgSettingsQuery.isError ? (
        <AppStack gap="md">
          <AppText variant="body">
            {toErrorMessage(orgQuery.error ?? orgSettingsQuery.error)}
          </AppText>
          {organizationExpanded ? (
            <AppButton
              label="Retry"
              variant="secondary"
              icon={RefreshCw}
              onPress={() => {
                void orgQuery.refetch();
                void orgSettingsQuery.refetch();
              }}
            />
          ) : null}
        </AppStack>
      ) : (
        <View className="flex-row items-center gap-4">
          {orgSettingsQuery.data?.logo_url ? (
            <AppImage
              source={{ uri: orgSettingsQuery.data.logo_url }}
              resizeMode="contain"
              className="h-16 w-16 bg-transparent"
            />
          ) : (
            <View className="h-16 w-16 border border-border bg-card dark:border-borderDark dark:bg-cardDark" />
          )}
          <View className="flex-1">
            <AppText variant="body">{orgQuery.data?.name ?? "Organization"}</AppText>
            <AppText variant="caption">
              {orgQuery.data?.email?.trim() ? orgQuery.data.email : "No organization email set."}
            </AppText>
          </View>
        </View>
      )}

      {organizationExpanded ? (
        <>
          <AppButton
            label="Change organization name"
            variant="secondary"
            icon={Building2}
            disabled={!canManageOrganization}
            onPress={() => navigation.navigate("EditOrganizationName")}
          />

          <AppButton
            label="Change organization email"
            variant="secondary"
            icon={AtSign}
            disabled={!canManageOrganization}
            onPress={() => navigation.navigate("EditOrganizationEmail")}
          />

          <AppButton
            label={
              uploadOrgLogoMutation.isPending ? "Uploading logo..." : "Change organization logo"
            }
            variant="secondary"
            icon={ImageUp}
            disabled={!canManageOrganization || uploadOrgLogoMutation.isPending}
            onPress={async () => {
              try {
                setPickerError(null);
                const asset = await pickOrgLogo();
                if (!asset) return;
                uploadOrgLogoMutation.mutate({ asset });
              } catch (error) {
                setPickerError(toErrorMessage(error));
              }
            }}
          />

          <AppButton
            label="View members"
            variant="secondary"
            icon={Users}
            disabled={!canManageOrganization}
            onPress={() => navigation.navigate("ViewMembers")}
          />
        </>
      ) : null}

      {uploadOrgLogoMutation.isError ? (
        <AppText variant="error">{toErrorMessage(uploadOrgLogoMutation.error)}</AppText>
      ) : null}
      {pickerError ? <AppText variant="error">{pickerError}</AppText> : null}
    </AppCard>
  ) : null;

  const accountCard = (
    <AppCard className="gap-3">
      <View className="flex-row items-center justify-between gap-3">
        <AppText variant="heading">Account Settings</AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            accountExpanded ? "Hide account settings" : "Show account settings"
          }
          onPress={() => setAccountExpanded((expanded) => !expanded)}
        >
          <AppText
            className={
              accountExpanded
                ? "text-red-600 dark:text-red-400"
                : "text-blue-600 dark:text-blue-400"
            }
            variant="caption"
          >
            {accountExpanded ? "Hide" : "Show"}
          </AppText>
        </Pressable>
      </View>

      <View className="flex-row items-center gap-4">
        <Avatar uri={profile.avatar_url} size={64} label={getProfileFullName(profile)} />
        <View className="flex-1">
          <AppText variant="body">
            {getProfileFullName(profile) || profile.display_name}
          </AppText>
          <AppText variant="caption">{getRoleDisplayLabel(profile)}</AppText>
        </View>
      </View>

      {accountExpanded ? (
        <>
          <AppButton
            label="Edit details"
            variant="secondary"
            icon={UserRoundPen}
            onPress={() => navigation.navigate("EditDetails")}
          />

          <AppButton
            label="Change password"
            variant="secondary"
            icon={KeyRound}
            onPress={() => navigation.navigate("ChangePassword")}
          />

          {canManageOrganization ? (
            <AppButton
              label="Change role display"
              variant="secondary"
              icon={IdCard}
              onPress={() => navigation.navigate("EditRoleDisplay")}
            />
          ) : null}
        </>
      ) : null}
    </AppCard>
  );

  const instructorsCard = canManageOrganization ? (
    <AppCard className="gap-3">
      <AppText variant="heading">Instructors</AppText>
      <AppText variant="caption">
        Create logins for instructors. They will be required to change their password on first
        sign-in.
      </AppText>
      <AppButton
        label="Add instructor"
        variant="secondary"
        icon={UserPlus}
        onPress={() => navigation.navigate("AddInstructor")}
      />
    </AppCard>
  ) : null;

  return (
    <Screen scroll>
      <AppStack gap={isCompact ? "md" : "lg"}>
        <View>
          <AppText variant="title">Settings</AppText>
          <AppText className="mt-2" variant="body">
            {canManageOrganization
              ? "Manage your organization and profile."
              : "Manage your profile."}
          </AppText>
        </View>

        {notificationsButton}
        {themesButton}
        {organizationCard}
        {accountCard}
        {instructorsCard}
      </AppStack>
    </Screen>
  );
}
