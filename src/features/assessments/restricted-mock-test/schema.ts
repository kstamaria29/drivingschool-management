import { z } from "zod";

import { parseDateInputToISODate } from "../../../utils/dates";

const dateString = z
  .string()
  .trim()
  .refine((value) => parseDateInputToISODate(value) != null, {
    message: "Use DD/MM/YYYY",
  });

export const restrictedMockTestFormSchema = z.object({
  studentId: z.string().uuid("Select a student"),
  date: dateString,
  time: z.string().trim(),
  vehicleInfo: z.string().trim(),
  routeInfo: z.string().trim(),
  preDriveNotes: z.string().trim(),
  generalFeedback: z.string().trim(),
  improvementNeeded: z.string().trim(),
  criticalNotes: z.string().trim(),
  immediateNotes: z.string().trim(),
});

export type RestrictedMockTestFormValues = z.infer<typeof restrictedMockTestFormSchema>;

const legacyFaultValue = z.union([z.literal(""), z.literal("fault")]);

const faultCountsSchema = z
  .record(z.string(), z.union([z.number().int().min(0), legacyFaultValue]))
  .optional()
  .default({})
  .transform((items) => {
    const output: Record<string, number> = {};
    Object.entries(items).forEach(([key, value]) => {
      output[key] = typeof value === "number" ? value : value === "fault" ? 1 : 0;
    });
    return output;
  });

const taskStateSchema = z.object({
  items: faultCountsSchema,
  location: z.string().default(""),
  criticalErrors: z.string().default(""),
  immediateFailureErrors: z.string().default(""),
  repetitionErrors: z
    .array(
      z.object({
        criticalErrors: z.string().default(""),
        immediateFailureErrors: z.string().default(""),
        faults: z.array(z.string()).optional().default([]),
      }),
    )
    .optional()
    .default([]),
  notes: z.string().default(""),
  repetitions: z.number().int().min(0).default(0),
});

const stageTasksSchema = z.record(z.string(), taskStateSchema).default({});

const stagesStateSchema = z
  .object({
    stage1: stageTasksSchema,
    stage2: stageTasksSchema,
  })
  .default({ stage1: {}, stage2: {} });

const errorCountsSchema = z.record(z.string(), z.number().int().min(0)).optional().default({});

export const restrictedMockTestStoredDataSchema = restrictedMockTestFormSchema.extend({
  // Backwards compatibility: older stored assessments may not include these fields.
  generalFeedback: z.string().trim().optional().default(""),
  improvementNeeded: z.string().trim().optional().default(""),
  criticalNotes: z.string().trim().optional().default(""),
  immediateNotes: z.string().trim().optional().default(""),
  version: z.number().int().optional(),
  candidateName: z.string().trim().optional().default(""),
  instructor: z.string().trim().optional().default(""),
  stage2Enabled: z.boolean().optional().default(false),
  stagesState: stagesStateSchema,
  critical: errorCountsSchema,
  immediate: errorCountsSchema,
  summary: z
    .object({
      stage1Faults: z.number().int().min(0).optional(),
      stage2Faults: z.number().int().min(0).optional(),
      criticalTotal: z.number().int().min(0).optional(),
      immediateTotal: z.number().int().min(0).optional(),
      immediateList: z.string().optional(),
      resultText: z.string().optional(),
      resultTone: z.union([z.literal("danger"), z.literal("success")]).optional(),
    })
    .optional(),
  savedByUserId: z.string().optional(),
});

export type RestrictedMockTestStoredData = z.infer<typeof restrictedMockTestStoredDataSchema>;
