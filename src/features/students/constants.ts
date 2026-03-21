export const STUDENT_ORGANIZATION_OPTIONS = [
  "Private",
  "UMMA Trust",
  "Renaissance",
  "Lifeskill",
] as const;

export const STUDENT_LEARNER_TYPE_OPTIONS = [
  "visual",
  "auditory",
  "ready",
  "kinesthetic",
] as const;

export type StudentLearnerType = (typeof STUDENT_LEARNER_TYPE_OPTIONS)[number];

export const STUDENT_RELEASE_ORGANIZATION_FALLBACK = "SM DRIVING SCHOOL LTD";

export const STUDENT_PHOTO_VIDEO_RELEASE_COPY =
  "to use photographs and videos of me for promotional, educational, and informational purposes. These materials may be used in various media formats, including but not limited to print publications, websites, social media platforms, advertisements, brochures, newsletters, and presentations.";

export const STUDENT_PHOTO_VIDEO_RELEASE_LIABILITY_COPY =
  "I understand that I will not receive any compensation for the use of the photographs and videos. I also release {organizationName} from any claims, demands, or liabilities arising out of the photographs and videos.";

export const STUDENT_DECLARATION_COPY =
  "I declare that the details recorded above are correct, and that I am responsible for any traffic infringement that may occur during this course of the driver training.";

export function normalizeStudentOrganization(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function getStudentLearnerTypeLabel(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function getStudentLearnerTypesLabel(values: string[] | null | undefined) {
  const filtered = (values ?? []).filter((value) => value.trim().length > 0);
  if (filtered.length === 0) return "-";
  return filtered.map((value) => getStudentLearnerTypeLabel(value)).join(", ");
}

export function getStudentReleaseOrganizationName(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed || STUDENT_RELEASE_ORGANIZATION_FALLBACK;
}

export function getStudentPhotoVideoReleasePermissionText(organizationName: string) {
  return `I hereby grant permission to ${getStudentReleaseOrganizationName(organizationName)}, ${STUDENT_PHOTO_VIDEO_RELEASE_COPY}`;
}

export function getStudentPhotoVideoReleaseLiabilityText(organizationName: string) {
  return STUDENT_PHOTO_VIDEO_RELEASE_LIABILITY_COPY.replace(
    "{organizationName}",
    getStudentReleaseOrganizationName(organizationName),
  );
}
