import type { PostgrestError } from "@supabase/supabase-js";

import { supabase } from "../../supabase/client";
import type { Database } from "../../supabase/types";
import { readUriAsUint8Array } from "../../utils/file-bytes";

export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationSettings = Database["public"]["Tables"]["organization_settings"]["Row"];

export type UploadOrganizationLogoInput = {
  organizationId: string;
  asset: import("expo-image-picker").ImagePickerAsset;
};

function guessFileExtension(asset: UploadOrganizationLogoInput["asset"]) {
  const fileName = asset.fileName ?? "";
  const match = /\.([a-z0-9]+)$/i.exec(fileName);
  if (match?.[1]) return match[1].toLowerCase();

  const uriMatch = /\.([a-z0-9]+)(?:$|\?|#)/i.exec(asset.uri);
  if (uriMatch?.[1]) return uriMatch[1].toLowerCase();

  const mimeType = asset.mimeType ?? "";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function guessContentType(asset: UploadOrganizationLogoInput["asset"]) {
  const extension = guessFileExtension(asset);
  if (asset.mimeType) return asset.mimeType;
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

export async function getOrganization(organizationId: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle()
    .overrideTypes<Organization, { merge: false }>();

  if (error) throw error;
  return data ?? null;
}

export async function getOrganizationSettings(
  organizationId: string,
): Promise<OrganizationSettings | null> {
  const { data, error } = await supabase
    .from("organization_settings")
    .select("*")
    .eq("organization_id", organizationId)
    .maybeSingle()
    .overrideTypes<OrganizationSettings, { merge: false }>();

  if (error) throw error;
  return data ?? null;
}

export async function updateOrganizationLogoUrl(organizationId: string, logoUrl: string | null) {
  const { error } = await supabase.from("organization_settings").upsert(
    {
      organization_id: organizationId,
      logo_url: logoUrl,
    },
    { onConflict: "organization_id" },
  );

  if (error) throw error;
}

export async function updateOrganizationName(organizationId: string, name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Organization name is required.");
  }

  const { error } = await supabase
    .from("organizations")
    .update({ name: trimmedName })
    .eq("id", organizationId);

  if (error) throw error;
}

export async function updateOrganizationEmail(organizationId: string, email: string | null) {
  const trimmedEmail = email?.trim() ?? "";
  const nextEmail = trimmedEmail === "" ? null : trimmedEmail;

  if (nextEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
    throw new Error("Enter a valid email.");
  }

  const { error } = await supabase
    .from("organizations")
    .update({ email: nextEmail })
    .eq("id", organizationId);

  if (error) throw error;
}

export async function uploadOrganizationLogo(input: UploadOrganizationLogoInput) {
  const extension = guessFileExtension(input.asset);
  const contentType = guessContentType(input.asset);
  const objectPath = `${input.organizationId}/logo.${extension}`;

  const bytes = await readUriAsUint8Array(input.asset.uri);
  const { error: uploadError } = await supabase.storage
    .from("org-logos")
    .upload(objectPath, bytes, { contentType, upsert: true });

  if (uploadError) throw uploadError;

  const { data: signed, error: signedError } = await supabase.storage
    .from("org-logos")
    .createSignedUrl(objectPath, 60 * 60 * 24 * 365);

  if (signedError) throw signedError;

  await updateOrganizationLogoUrl(input.organizationId, signed.signedUrl);

  return { logoUrl: signed.signedUrl };
}

export function toUserFacingOrganizationError(error: unknown) {
  const postgrest = error as Partial<PostgrestError> | null;
  if (postgrest?.message) return postgrest.message;
  return "Something went wrong. Please try again.";
}
