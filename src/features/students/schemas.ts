import { z } from "zod";

import { STUDENT_LEARNER_TYPE_OPTIONS } from "./constants";
import { parseDateInputToISODate } from "../../utils/dates";

const dateString = z
  .string()
  .trim()
  .refine((value) => value === "" || parseDateInputToISODate(value) != null, {
    message: "Use DD/MM/YYYY",
  });

export const studentFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  dateOfBirth: dateString,
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .refine((value) => value.replace(/\D/g, "").length >= 7, {
      message: "Enter a valid phone",
    }),
  address: z.string().trim(),
  organization: z.string().trim().min(1, "Organization is required"),
  learnerTypes: z.array(z.enum(STUDENT_LEARNER_TYPE_OPTIONS)),
  assignedInstructorId: z.string().uuid("Select an instructor"),
  licenseType: z.enum(
    ["learner", "restricted", "full"],
    "Select a licence type",
  ),
  licenseNumber: z.string().trim(),
  licenseVersion: z.string().trim(),
  classHeld: z.string().trim(),
  issueDate: dateString,
  expiryDate: dateString,
  notes: z.string().trim(),
  photoVideoReleaseConsent: z.boolean(),
  photoVideoReleaseLiabilityWaiver: z.boolean(),
  declarationConfirmed: z.boolean(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;
