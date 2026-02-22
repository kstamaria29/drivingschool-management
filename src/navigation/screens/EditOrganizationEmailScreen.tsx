import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { AppInput } from "../../components/AppInput";
import { AppStack } from "../../components/AppStack";
import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";
import { useCurrentUser } from "../../features/auth/current-user";
import { isOwnerOrAdminRole } from "../../features/auth/roles";
import {
  useOrganizationQuery,
  useUpdateOrganizationEmailMutation,
} from "../../features/organization/queries";
import {
  organizationEmailSchema,
  type OrganizationEmailFormValues,
} from "../../features/organization/schemas";
import { toErrorMessage } from "../../utils/errors";

import type { SettingsStackParamList } from "../SettingsStackNavigator";
import { useNavigationLayout } from "../useNavigationLayout";

export function EditOrganizationEmailScreen() {
  const { isCompact } = useNavigationLayout();
  const { profile } = useCurrentUser();
  const canManageOrganization = isOwnerOrAdminRole(profile.role);
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>();

  const orgQuery = useOrganizationQuery(profile.organization_id);
  const mutation = useUpdateOrganizationEmailMutation(profile.organization_id);

  const form = useForm<OrganizationEmailFormValues>({
    resolver: zodResolver(organizationEmailSchema),
    defaultValues: {
      organizationEmail: orgQuery.data?.email ?? "",
    },
  });

  useEffect(() => {
    if (!orgQuery.isSuccess) return;
    form.reset({ organizationEmail: orgQuery.data?.email ?? "" });
  }, [form, orgQuery.data?.email, orgQuery.isSuccess]);

  async function onSubmit(values: OrganizationEmailFormValues) {
    const trimmed = values.organizationEmail.trim();
    await mutation.mutateAsync(trimmed === "" ? null : trimmed);
    Alert.alert("Organization updated", "Organization email has been updated.");
    navigation.goBack();
  }

  if (!canManageOrganization) {
    return (
      <Screen scroll>
        <AppStack gap={isCompact ? "md" : "lg"}>
          <View>
            <AppText variant="title">Change organization email</AppText>
            <AppText className="mt-2" variant="body">
              Only owners and admins can update the organization email.
            </AppText>
          </View>
        </AppStack>
      </Screen>
    );
  }

  if (orgQuery.isPending) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <AppText className="mt-3 text-center" variant="body">
            Loading organization...
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppStack gap={isCompact ? "md" : "lg"}>
        <View>
          <AppText variant="title">Change organization email</AppText>
          <AppText className="mt-2" variant="body">
            Leave blank to remove the organization email.
          </AppText>
        </View>

        <AppCard className={isCompact ? "gap-3" : "gap-4"}>
          <Controller
            control={form.control}
            name="organizationEmail"
            render={({ field, fieldState }) => (
              <AppInput
                label="Organization email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
        </AppCard>

        {orgQuery.isError ? (
          <AppText variant="error">{toErrorMessage(orgQuery.error)}</AppText>
        ) : null}
        {mutation.isError ? (
          <AppText variant="error">{toErrorMessage(mutation.error)}</AppText>
        ) : null}

        <AppButton
          label={mutation.isPending ? "Saving..." : "Save organization email"}
          disabled={mutation.isPending}
          onPress={form.handleSubmit(onSubmit)}
        />
      </AppStack>
    </Screen>
  );
}

