import { z } from "zod";

export const organizationNameSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(2, "Enter at least 2 characters")
    .max(80, "Use 80 characters or fewer"),
});

export type OrganizationNameFormValues = z.infer<typeof organizationNameSchema>;

const emailSchema = z.string().email("Enter a valid email");

export const organizationEmailSchema = z.object({
  organizationEmail: z
    .string()
    .trim()
    .max(120, "Use 120 characters or fewer")
    .refine((value) => value === "" || emailSchema.safeParse(value).success, {
      message: "Enter a valid email",
    }),
});

export type OrganizationEmailFormValues = z.infer<typeof organizationEmailSchema>;
