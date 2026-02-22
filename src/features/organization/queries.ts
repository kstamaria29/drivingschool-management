import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getOrganization,
  getOrganizationSettings,
  updateOrganizationEmail,
  updateOrganizationName,
  updateOrganizationLogoUrl,
  uploadOrganizationLogo,
  type UploadOrganizationLogoInput,
} from "./api";

export const organizationKeys = {
  org: (organizationId: string) => ["organization", { organizationId }] as const,
  settings: (organizationId: string) => ["organization-settings", { organizationId }] as const,
};

export function useOrganizationQuery(organizationId?: string) {
  return useQuery({
    queryKey: organizationId
      ? organizationKeys.org(organizationId)
      : (["organization", { organizationId: null }] as const),
    queryFn: () => getOrganization(organizationId!),
    enabled: !!organizationId,
  });
}

export function useOrganizationSettingsQuery(organizationId?: string) {
  return useQuery({
    queryKey: organizationId
      ? organizationKeys.settings(organizationId)
      : (["organization-settings", { organizationId: null }] as const),
    queryFn: () => getOrganizationSettings(organizationId!),
    enabled: !!organizationId,
  });
}

export function useUpdateOrganizationLogoUrlMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logoUrl: string | null) => updateOrganizationLogoUrl(organizationId, logoUrl),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.settings(organizationId) });
    },
  });
}

export function useUpdateOrganizationNameMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => updateOrganizationName(organizationId, name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.org(organizationId) });
    },
  });
}

export function useUpdateOrganizationEmailMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string | null) => updateOrganizationEmail(organizationId, email),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.org(organizationId) });
    },
  });
}

export function useUploadOrganizationLogoMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<UploadOrganizationLogoInput, "organizationId">) =>
      uploadOrganizationLogo({ organizationId, asset: input.asset }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: organizationKeys.settings(organizationId) });
    },
  });
}
