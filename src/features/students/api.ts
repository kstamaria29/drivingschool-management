import * as FileSystem from "expo-file-system/legacy";

import { supabase } from "../../supabase/client";
import type { Database } from "../../supabase/types";
import { readUriAsUint8Array } from "../../utils/file-bytes";

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type StudentInsert = Database["public"]["Tables"]["students"]["Insert"];
export type StudentUpdate = Database["public"]["Tables"]["students"]["Update"];
export type StudentLicenseImageSide = "front" | "back";

export type UploadStudentLicenseImageInput = {
  organizationId: string;
  studentId: string;
  side: StudentLicenseImageSide;
  asset: import("expo-image-picker").ImagePickerAsset;
};
export type RemoveStudentLicenseImageInput = {
  organizationId: string;
  studentId: string;
  side: StudentLicenseImageSide;
};

const LICENSE_CARD_MAX_WIDTH_PX = 500;
const LICENSE_CARD_QUALITY = 0.85;

type CompressorModule = {
  Image: {
    compress: (
      uri: string,
      options?: {
        compressionMethod?: "auto" | "manual";
        maxWidth?: number;
        quality?: number;
      },
    ) => Promise<string>;
  };
  getRealPath: (uri: string, type: "image" | "video") => Promise<string>;
};

function extensionFromUri(uri: string) {
  const match = /\.([a-z0-9]+)(?:$|\?|#)/i.exec(uri);
  const raw = match?.[1]?.toLowerCase() ?? null;
  if (!raw) return null;
  if (raw === "jpeg") return "jpg";
  return raw;
}

function contentTypeFromExtension(extension: string) {
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

async function compressLicenseCardImageUri(inputUri: string): Promise<{
  uri: string;
  extension: string;
  contentType: string;
  shouldCleanupTempFile: boolean;
}> {
  let compressor: CompressorModule | null = null;
  try {
    compressor = require("react-native-compressor") as CompressorModule;
  } catch {
    // Library not installed / native module missing. Fall back to original file.
    const extension = extensionFromUri(inputUri) ?? "jpg";
    return {
      uri: inputUri,
      extension,
      contentType: contentTypeFromExtension(extension),
      shouldCleanupTempFile: false,
    };
  }

  let resolvedUri = inputUri;
  if (!resolvedUri.startsWith("file://")) {
    try {
      resolvedUri = await compressor.getRealPath(resolvedUri, "image");
    } catch {
      // Keep original URI if we can't resolve it; compression may still succeed.
    }
  }

  try {
    const compressedUri = await compressor.Image.compress(resolvedUri, {
      compressionMethod: "manual",
      maxWidth: LICENSE_CARD_MAX_WIDTH_PX,
      quality: LICENSE_CARD_QUALITY,
    });

    const extension = extensionFromUri(compressedUri) ?? extensionFromUri(resolvedUri) ?? "jpg";

    return {
      uri: compressedUri,
      extension,
      contentType: contentTypeFromExtension(extension),
      shouldCleanupTempFile: compressedUri !== resolvedUri,
    };
  } catch {
    const extension = extensionFromUri(resolvedUri) ?? "jpg";
    return {
      uri: resolvedUri,
      extension,
      contentType: contentTypeFromExtension(extension),
      shouldCleanupTempFile: false,
    };
  }
}

export type ListStudentsInput = {
  archived: boolean;
};

export async function listStudents(
  input: ListStudentsInput,
): Promise<Student[]> {
  const base = supabase
    .from("students")
    .select("*")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  const query = input.archived
    ? base.not("archived_at", "is", null)
    : base.is("archived_at", null);

  const { data, error } = await query.overrideTypes<
    Student[],
    { merge: false }
  >();
  if (error) throw error;
  return data ?? [];
}

export async function getStudent(studentId: string): Promise<Student | null> {
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .maybeSingle()
    .overrideTypes<Student, { merge: false }>();

  if (error) throw error;
  return data ?? null;
}

export async function createStudent(input: StudentInsert): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .insert(input)
    .select("*")
    .single()
    .overrideTypes<Student, { merge: false }>();

  if (error) throw error;
  return data;
}

export async function updateStudent(
  studentId: string,
  input: StudentUpdate,
): Promise<Student> {
  const { data, error } = await supabase
    .from("students")
    .update(input)
    .eq("id", studentId)
    .select("*")
    .single()
    .overrideTypes<Student, { merge: false }>();

  if (error) throw error;
  return data;
}

export async function archiveStudent(studentId: string): Promise<Student> {
  return updateStudent(studentId, { archived_at: new Date().toISOString() });
}

export async function unarchiveStudent(studentId: string): Promise<Student> {
  return updateStudent(studentId, { archived_at: null });
}

export async function deleteStudent(studentId: string): Promise<void> {
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, organization_id")
    .eq("id", studentId)
    .maybeSingle()
    .overrideTypes<Pick<Student, "id" | "organization_id">, { merge: false }>();

  if (studentError) throw studentError;

  await removeStudentRelatedHistories(studentId);

  if (student) {
    await removeAllStudentLicenseImageFiles(
      student.organization_id,
      student.id,
    );
  }

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId);
  if (error) throw error;
}

async function removeStudentRelatedHistories(studentId: string) {
  const { error: deleteMapAnnotationsError } = await supabase
    .from("map_annotations")
    .delete()
    .eq("student_id", studentId);

  if (deleteMapAnnotationsError) throw deleteMapAnnotationsError;

  const { error: deleteMapPinsError } = await supabase
    .from("map_pins")
    .delete()
    .eq("student_id", studentId);

  if (deleteMapPinsError) throw deleteMapPinsError;

  const { error: deleteRemindersError } = await supabase
    .from("student_reminders")
    .delete()
    .eq("student_id", studentId);

  if (deleteRemindersError) throw deleteRemindersError;

  const { error: deleteLessonsError } = await supabase
    .from("lessons")
    .delete()
    .eq("student_id", studentId);

  if (deleteLessonsError) throw deleteLessonsError;

  const { error: deleteSessionsError } = await supabase
    .from("student_sessions")
    .delete()
    .eq("student_id", studentId);

  if (deleteSessionsError) throw deleteSessionsError;

  const { error: deleteAssessmentsError } = await supabase
    .from("assessments")
    .delete()
    .eq("student_id", studentId);

  if (deleteAssessmentsError) throw deleteAssessmentsError;
}

function guessFileExtension(asset: UploadStudentLicenseImageInput["asset"]) {
  const fileName = asset.fileName ?? "";
  const fileNameMatch = /\.([a-z0-9]+)$/i.exec(fileName);
  if (fileNameMatch?.[1]) return fileNameMatch[1].toLowerCase();

  const uriMatch = /\.([a-z0-9]+)(?:$|\?|#)/i.exec(asset.uri);
  if (uriMatch?.[1]) return uriMatch[1].toLowerCase();

  const mimeType = asset.mimeType ?? "";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function guessContentType(asset: UploadStudentLicenseImageInput["asset"]) {
  const extension = guessFileExtension(asset);
  if (asset.mimeType) return asset.mimeType;
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return "image/jpeg";
}

async function removeExistingLicenseImageFilesForSide(
  organizationId: string,
  studentId: string,
  side: StudentLicenseImageSide,
) {
  const folder = `${organizationId}/${studentId}`;

  const { data, error } = await supabase.storage
    .from("student-licenses")
    .list(folder, { limit: 100 });

  if (error) throw error;

  const toRemove = (data ?? [])
    .filter((file) => file.name.startsWith(`${side}.`))
    .map((file) => `${folder}/${file.name}`);

  if (toRemove.length === 0) return;

  const { error: removeError } = await supabase.storage
    .from("student-licenses")
    .remove(toRemove);

  if (removeError) throw removeError;
}

async function removeAllStudentLicenseImageFiles(
  organizationId: string,
  studentId: string,
) {
  const folder = `${organizationId}/${studentId}`;

  const { data, error } = await supabase.storage
    .from("student-licenses")
    .list(folder, { limit: 100 });

  if (error) throw error;

  const toRemove = (data ?? []).map((file) => `${folder}/${file.name}`);
  if (toRemove.length === 0) return;

  const { error: removeError } = await supabase.storage
    .from("student-licenses")
    .remove(toRemove);

  if (removeError) throw removeError;
}

export async function uploadStudentLicenseImage(
  input: UploadStudentLicenseImageInput,
): Promise<Student> {
  const originalExtension = guessFileExtension(input.asset);
  const originalContentType = guessContentType(input.asset);
  const compressed = await compressLicenseCardImageUri(input.asset.uri);
  const extension = compressed.extension || originalExtension;
  const contentType = compressed.contentType || originalContentType;
  const objectPath = `${input.organizationId}/${input.studentId}/${input.side}.${extension}`;

  try {
    await removeExistingLicenseImageFilesForSide(
      input.organizationId,
      input.studentId,
      input.side,
    );

    const bytes = await readUriAsUint8Array(compressed.uri);
    const { error: uploadError } = await supabase.storage
      .from("student-licenses")
      .upload(objectPath, bytes, { contentType, upsert: true });

    if (uploadError) throw uploadError;

    const { data: signed, error: signedError } = await supabase.storage
      .from("student-licenses")
      .createSignedUrl(objectPath, 60 * 60 * 24 * 365);

    if (signedError) throw signedError;

    const studentUpdate: StudentUpdate =
      input.side === "front"
        ? { license_front_image_url: signed.signedUrl }
        : { license_back_image_url: signed.signedUrl };

    return updateStudent(input.studentId, studentUpdate);
  } finally {
    if (compressed.shouldCleanupTempFile && compressed.uri.startsWith("file://")) {
      // Best-effort cleanup of temp compressed file.
      try {
        await FileSystem.deleteAsync(compressed.uri, { idempotent: true });
      } catch {
        // Ignore.
      }
    }
  }
}

export async function removeStudentLicenseImage(
  input: RemoveStudentLicenseImageInput,
): Promise<Student> {
  await removeExistingLicenseImageFilesForSide(
    input.organizationId,
    input.studentId,
    input.side,
  );

  const studentUpdate: StudentUpdate =
    input.side === "front"
      ? { license_front_image_url: null }
      : { license_back_image_url: null };

  return updateStudent(input.studentId, studentUpdate);
}
