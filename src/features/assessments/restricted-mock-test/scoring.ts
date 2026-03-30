import {
  restrictedMockTestLegacyCriticalErrors,
  restrictedMockTestLegacyImmediateErrors,
  restrictedMockTestTaskItems,
  type RestrictedMockTestStageId,
  type RestrictedMockTestTaskItemId,
} from "./constants";

export type RestrictedMockTestTaskState = {
  items: Record<RestrictedMockTestTaskItemId, number>;
  location: string;
  criticalErrors: string;
  immediateFailureErrors: string;
  repetitionErrors: Array<{
    criticalErrors: string;
    immediateFailureErrors: string;
    faults: string[];
  }>;
  notes: string;
  repetitions: number;
};

export type RestrictedMockTestStagesState = Record<
  RestrictedMockTestStageId,
  Record<string, RestrictedMockTestTaskState>
>;

export type RestrictedMockTestErrorCounts = Record<string, number>;

export type RestrictedMockTestSummary = {
  stage1Faults: number;
  stage2Faults: number;
  criticalTotal: number;
  immediateTotal: number;
  immediateList: string;
  resultText: string;
  resultTone: "danger" | "success";
};

function extractNonEmptyLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function calculateRestrictedMockTestSummary(input: {
  stagesState: RestrictedMockTestStagesState;
  critical?: RestrictedMockTestErrorCounts | null;
  immediate?: RestrictedMockTestErrorCounts | null;
}): RestrictedMockTestSummary {
  let stage1Faults = 0;
  let stage2Faults = 0;
  const taskCriticalLines: string[] = [];
  const taskImmediateLines: string[] = [];

  (["stage1", "stage2"] as const).forEach((stageId) => {
    const stageTasks = input.stagesState[stageId] ?? {};
    const isStage1 = stageId === "stage1";

    Object.values(stageTasks).forEach((taskState) => {
      if (!taskState?.items) return;

      restrictedMockTestTaskItems.forEach((taskItem) => {
        const count = taskState.items?.[taskItem.id] ?? 0;
        if (count <= 0) return;
        if (isStage1) stage1Faults += count;
        else stage2Faults += count;
      });

      const repetitionErrors = taskState.repetitionErrors ?? [];
      repetitionErrors.forEach((rep) => {
        taskCriticalLines.push(...extractNonEmptyLines(rep.criticalErrors ?? ""));
        taskImmediateLines.push(...extractNonEmptyLines(rep.immediateFailureErrors ?? ""));
      });

      taskCriticalLines.push(...extractNonEmptyLines(taskState.criticalErrors ?? ""));
      taskImmediateLines.push(...extractNonEmptyLines(taskState.immediateFailureErrors ?? ""));
    });
  });

  const legacyCriticalTotal = restrictedMockTestLegacyCriticalErrors.reduce((sum, label) => {
    return sum + (input.critical?.[label] ?? 0);
  }, 0);

  const legacyImmediateTotal = restrictedMockTestLegacyImmediateErrors.reduce((sum, label) => {
    return sum + (input.immediate?.[label] ?? 0);
  }, 0);

  const criticalTotal = taskCriticalLines.length + legacyCriticalTotal;
  const immediateTotal = taskImmediateLines.length + legacyImmediateTotal;

  const immediateCounts = new Map<string, number>();
  taskImmediateLines.forEach((line) => {
    immediateCounts.set(line, (immediateCounts.get(line) ?? 0) + 1);
  });
  restrictedMockTestLegacyImmediateErrors.forEach((label) => {
    const count = input.immediate?.[label] ?? 0;
    if (count <= 0) return;
    immediateCounts.set(label, (immediateCounts.get(label) ?? 0) + count);
  });
  const immediateList = Array.from(immediateCounts.entries())
    .map(([label, count]) => (count > 0 ? `${label} (${count})` : null))
    .filter(Boolean)
    .join("; ");

  if (immediateTotal > 0) {
    return {
      stage1Faults,
      stage2Faults,
      criticalTotal,
      immediateTotal,
      immediateList,
      resultText:
        "Automatic FAIL (immediate failure error recorded). Use the recorded task faults and feedback to plan coaching and a re-test.",
      resultTone: "danger",
    };
  }

  return {
    stage1Faults,
    stage2Faults,
    criticalTotal,
    immediateTotal,
    immediateList,
    resultText:
      "No immediate failure errors recorded. Use Stage 1 & 2 task faults plus feedback to decide readiness for the real test.",
    resultTone: "success",
  };
}

export function getRestrictedMockTestTaskFaults(task: RestrictedMockTestTaskState) {
  const faults: string[] = [];
  restrictedMockTestTaskItems.forEach((item) => {
    const count = task.items[item.id] ?? 0;
    if (count <= 0) return;
    faults.push(count > 1 ? `${item.label} (${count})` : item.label);
  });
  return faults;
}
