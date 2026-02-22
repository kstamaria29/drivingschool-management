import { Platform } from "react-native";

import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";

import {
  restrictedMockTestLegacyCriticalErrors,
  restrictedMockTestLegacyImmediateErrors,
  restrictedMockTestStages,
} from "./constants";
import { calculateRestrictedMockTestSummary, getRestrictedMockTestTaskFaults } from "./scoring";
import type { RestrictedMockTestStoredData } from "./schema";

type Input = {
  assessmentId: string;
  organizationName: string;
  organizationLogoUrl?: string | null;
  fileName: string;
  androidDirectoryUri?: string;
  values: RestrictedMockTestStoredData;
};

export type ExportRestrictedMockTestPdfResult = {
  uri: string;
  savedTo: "downloads" | "app_storage";
};

function sanitizeFileName(input: string) {
  const withoutReserved = input.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "");
  const collapsed = withoutReserved.trim().replace(/\s+/g, "_");
  const safe = collapsed === "" ? "restricted_mock_test" : collapsed;
  return safe.slice(0, 80);
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildHtml(input: Input) {
  const v = input.values;
  const computedSummary = calculateRestrictedMockTestSummary({
    stagesState: v.stagesState,
    critical: v.critical,
    immediate: v.immediate,
  });

  const summary = v.summary ? { ...computedSummary, ...v.summary } : computedSummary;

  const stage1Repetitions = Object.values(v.stagesState.stage1 || {}).reduce((sum, task) => {
    return sum + (task.repetitions ?? 0);
  }, 0);

  const stage2Repetitions = Object.values(v.stagesState.stage2 || {}).reduce((sum, task) => {
    return sum + (task.repetitions ?? 0);
  }, 0);

  const stage1Faults = summary.stage1Faults ?? 0;
  const stage2Faults = summary.stage2Faults ?? 0;
  const stage2Enabled = Boolean(v.stage2Enabled);
  const criticalTotal = summary.criticalTotal ?? 0;
  const immediateTotal = summary.immediateTotal ?? 0;

  const dateTime = [v.date?.trim(), v.time?.trim()].filter(Boolean).join(" ");
  const logoUrl = input.organizationLogoUrl?.trim() || "";
  const logoHtml = logoUrl
    ? `<div class="header-right"><img class="logo" src="${escapeHtml(logoUrl)}" /></div>`
    : "";

  const legacyTaskMetaById: Record<string, { name: string; targetReps?: number }> = {
    s1_3pt: { name: "Three-point turn (if used instead of RPP)" },
    s2_turns: { name: "All turns give way", targetReps: 10 },
    s2_laneChanges: { name: "All lane changes", targetReps: 5 },
    s2_straight: { name: "All straight drives", targetReps: 4 },
    s2_roundabouts: { name: "All roundabouts", targetReps: 4 },
    s2_extra: { name: "All extra complex tasks / variations", targetReps: 5 },
  };

  type CategorizedGroup = { category: string; items: string[] };

  function extractCategorizedGroups(value: string): CategorizedGroup[] {
    const output = new Map<string, string[]>();

    value
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((rawLine) => {
        const line = rawLine.replace(/^[-•\u2022]\s+/, "");
        const match = line.match(/^(.+?)\s*-\s*(.+)$/);
        const category = match ? match[1].trim() : "Other";
        const item = match ? match[2].trim() : line;
        if (!item) return;

        const items = output.get(category) ?? [];
        items.push(item);
        output.set(category, items);
      });

    return Array.from(output.entries()).map(([category, items]) => ({ category, items }));
  }

  function renderCategorizedGroups(groups: CategorizedGroup[]) {
    return groups
      .map(({ category, items }) => {
        const lines = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
        return `
          <div class="group">
            <div class="group-title">${escapeHtml(category)}</div>
            <ul class="list group-list">${lines}</ul>
          </div>
        `;
      })
      .join("");
  }

  function renderCategorizedSection(title: string, value: string) {
    const groups = extractCategorizedGroups(value);

    return `
      <div class="section box-soft">
        <h2>${escapeHtml(title)}</h2>
        ${
          groups.length
            ? renderCategorizedGroups(groups)
            : `<div class="muted">None recorded.</div>`
        }
      </div>
    `;
  }

  function renderCategorizedTaskBlock(title: string, value: string) {
    const groups = extractCategorizedGroups(value);
    if (!groups.length) return "";
    return `
      <div class="task-block">
        <div class="task-block-title">${escapeHtml(title)}</div>
        ${renderCategorizedGroups(groups)}
      </div>
    `;
  }

  function renderRepetitionErrors(
    repetitions: number,
    repetitionErrors: Array<{ criticalErrors?: string | null; immediateFailureErrors?: string | null }>,
  ) {
    const count = Math.max(repetitions, repetitionErrors.length);
    if (count <= 0) return "";

    const blocks = Array.from({ length: count }, (_, index) => {
      const rep = repetitionErrors[index] ?? {};
      const criticalHtml = renderCategorizedTaskBlock("Critical error(s)", rep.criticalErrors ?? "");
      const immediateHtml = renderCategorizedTaskBlock("Immediate failure error", rep.immediateFailureErrors ?? "");
      const emptyHtml =
        !criticalHtml && !immediateHtml
          ? `<div class="muted">No critical/immediate errors recorded.</div>`
          : "";

      return `
        <div class="repetition">
          <div class="repetition-title">Repetition #${escapeHtml(String(index + 1))}</div>
          ${criticalHtml}
          ${immediateHtml}
          ${emptyHtml}
        </div>
      `;
    }).join("");

    return `<div class="repetitions">${blocks}</div>`;
  }

  function renderStage(stageId: "stage1" | "stage2") {
    const stage = restrictedMockTestStages.find((s) => s.id === stageId);
    if (!stage) return "";

    const stageTasks = v.stagesState[stageId] || {};
    const taskDefById = new Map<string, (typeof stage.tasks)[number]>(
      stage.tasks.map((taskDef) => [taskDef.id as string, taskDef]),
    );
    const knownTaskIds = new Set<string>(stage.tasks.map((taskDef) => taskDef.id as string));
    const extraTaskIds = Object.keys(stageTasks)
      .filter((taskId) => !knownTaskIds.has(taskId))
      .sort();
    const taskIds = [...stage.tasks.map((taskDef) => taskDef.id as string), ...extraTaskIds];

    const rows = taskIds
      .map((taskId) => {
        const t = stageTasks?.[taskId];
        if (!t) return null;

        const taskDef = taskDefById.get(taskId) ?? null;
        const legacyMeta = legacyTaskMetaById[taskId] ?? null;
        const taskName = taskDef?.name ?? legacyMeta?.name ?? taskId;
        const targetReps = taskDef?.targetReps ?? legacyMeta?.targetReps ?? null;

        const faults = getRestrictedMockTestTaskFaults(t);
        const repetitions = t.repetitions ?? 0;
        const repetitionErrors = t.repetitionErrors ?? [];
        const faultTotal = Object.values(t.items || {}).reduce((sum, value) => {
          return sum + (typeof value === "number" ? value : 0);
        }, 0);
        const hasDetails =
          repetitions > 0 ||
          faultTotal > 0 ||
          Boolean(t.location?.trim()) ||
          Boolean(t.criticalErrors?.trim()) ||
          Boolean(t.immediateFailureErrors?.trim()) ||
          Boolean(
            repetitionErrors.some(
              (rep) => Boolean(rep.criticalErrors?.trim()) || Boolean(rep.immediateFailureErrors?.trim()),
            ),
          ) ||
          Boolean(t.notes?.trim()) ||
          faults.length > 0;
        if (!hasDetails) return null;

        const repetitionErrorsHtml =
          repetitionErrors.length > 0 ? renderRepetitionErrors(repetitions, repetitionErrors) : "";
        const taskCriticalHtml = renderCategorizedTaskBlock(
          repetitionErrors.length > 0 ? "Critical error(s) (legacy)" : "Critical error(s)",
          t.criticalErrors ?? "",
        );
        const taskImmediateHtml = renderCategorizedTaskBlock(
          repetitionErrors.length > 0 ? "Immediate failure error (legacy)" : "Immediate failure error",
          t.immediateFailureErrors ?? "",
        );

        const targetHtml =
          targetReps != null
            ? `<div class="task-target">${escapeHtml(String(targetReps))} reps</div>`
            : "";

        const statsHtml =
          repetitions > 0 || faultTotal > 0
            ? `
              <div class="stats-row">
                ${
                  repetitions > 0
                    ? `<div class="stat-blue">Repetitions: ${escapeHtml(String(repetitions))}</div>`
                    : ""
                }
                <div class="stat-red">Faults: ${escapeHtml(String(faultTotal))}</div>
              </div>
            `
            : "";

        return `
          <div class="task">
            <div class="task-head">
              <div class="task-name">${escapeHtml(taskName)}</div>
              ${targetHtml}
            </div>
            ${statsHtml}
            ${t.location?.trim() ? `<div><span class="label">Location:</span> ${escapeHtml(t.location.trim())}</div>` : ""}
            ${faults.length ? `<div><span class="label">Fault types:</span> ${escapeHtml(faults.join(", "))}</div>` : ""}
            ${repetitionErrorsHtml}
            ${taskCriticalHtml}
            ${taskImmediateHtml}
            ${t.notes?.trim() ? `<div class="pre"><span class="label">Notes:</span> ${escapeHtml(t.notes.trim())}</div>` : ""}
          </div>
        `;
      })
      .filter(Boolean)
      .join("");

    if (!rows) {
      return `<div class="muted">No items recorded for this stage.</div>`;
    }

    return `<div class="stage">${rows}</div>`;
  }

  function renderErrorCounts(title: string, errors: readonly string[], counts: Record<string, number>) {
    const lines = errors
      .map((label) => {
        const count = counts[label] ?? 0;
        return count > 0 ? `<li>${escapeHtml(label)}: ${escapeHtml(String(count))}</li>` : null;
      })
      .filter(Boolean)
      .join("");

    return `
      <div class="section box-soft">
        <h2>${escapeHtml(title)}</h2>
        ${lines ? `<ul class="list">${lines}</ul>` : `<div class="muted">None recorded.</div>`}
      </div>
    `;
  }

  const hasLegacyCriticalCounts = restrictedMockTestLegacyCriticalErrors.some((label) => {
    return (v.critical?.[label] ?? 0) > 0;
  });
  const hasLegacyImmediateCounts = restrictedMockTestLegacyImmediateErrors.some((label) => {
    return (v.immediate?.[label] ?? 0) > 0;
  });
  const showLegacyCritical = hasLegacyCriticalCounts || Boolean(v.criticalNotes?.trim());
  const showLegacyImmediate = hasLegacyImmediateCounts || Boolean(v.immediateNotes?.trim());

  return `
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <style>
        @page { size: A4; margin: 16mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          font-size: 11px;
          line-height: 1.25;
        }
        h1 { font-size: 18px; margin: 0; }
        h2 { font-size: 12px; margin: 10px 0 6px 0; }
        .org { font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; font-size: 12px; margin-bottom: 4px; }
        .muted { color: #475569; font-size: 10px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .header-left { flex: 1; min-width: 0; }
        .header-right { flex-shrink: 0; display: flex; justify-content: flex-end; }
        .logo { height: 44px; width: auto; max-width: 140px; object-fit: contain; }
        .box-soft { border: 1px solid #0f172a; padding: 10px 12px; border-radius: 0; }
        .grid { width: 100%; border-collapse: collapse; }
        .grid td { padding: 3px 0; vertical-align: top; }
        .label { color: #334155; font-size: 10px; font-weight: 700; }
        .value { font-size: 10.5px; }
        .section { margin-top: 10px; }
        .pre { white-space: pre-wrap; }
        .list { margin: 6px 0 0 0; padding-left: 14px; }
        .list li { margin: 2px 0; }
        .stats-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 6px; }
        .stat-blue { color: #2563eb; font-weight: 700; }
        .stat-red { color: #dc2626; font-weight: 700; }
        .overview-row { display: flex; gap: 12px; justify-content: space-between; align-items: flex-start; margin-top: 8px; }
        .overview-stages { flex: 1; display: flex; flex-wrap: wrap; gap: 8px; align-items: flex-start; }
        .overview-errors { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; align-items: flex-start; }
        .badge { border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px 10px; white-space: nowrap; }
        .badge-stage { border-color: #2563eb; }
        .badge-critical { border-color: #fdba74; }
        .badge-immediate { border-color: #dc2626; }
        .badge-text { font-size: 10.5px; font-weight: 700; }
        .task { break-inside: avoid; border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 8px; }
        .task:first-child { border-top: none; padding-top: 0; margin-top: 0; }
        .task-head { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; }
        .task-name { font-weight: 700; }
        .task-target { font-weight: 700; white-space: nowrap; }
        .group { margin-top: 6px; }
        .group:first-child { margin-top: 0; }
        .group-title { font-weight: 700; font-size: 10px; color: #334155; }
        .group-list { margin-top: 4px; }
        .task-block { margin-top: 6px; }
        .task-block-title { font-weight: 700; font-size: 10px; color: #334155; margin-bottom: 4px; }
        .repetitions { margin-top: 6px; }
        .repetition { border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; margin-top: 8px; background: #f8fafc; }
        .repetition:first-child { margin-top: 0; }
        .repetition-title { font-weight: 800; font-size: 10px; color: #0f172a; margin-bottom: 4px; }
        .page-break { page-break-before: always; break-before: page; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <div class="org">${escapeHtml(input.organizationName)}</div>
          <h1>Mock Test – Restricted Licence</h1>
          <div class="muted">Student: ${escapeHtml(v.candidateName || "N/A")}</div>
        </div>
        ${logoHtml}
      </div>

      <div class="section box-soft">
        <h2>Session details</h2>
        <table class="grid">
          <tr><td class="label">Candidate</td><td class="value">${escapeHtml(v.candidateName || "N/A")}</td></tr>
          <tr><td class="label">Instructor</td><td class="value">${escapeHtml(v.instructor || "N/A")}</td></tr>
          <tr><td class="label">Date / time</td><td class="value">${escapeHtml(dateTime || "N/A")}</td></tr>
          <tr><td class="label">Vehicle</td><td class="value">${escapeHtml(v.vehicleInfo || "N/A")}</td></tr>
          <tr><td class="label">Route / area</td><td class="value">${escapeHtml(v.routeInfo || "N/A")}</td></tr>
        </table>
        ${v.preDriveNotes?.trim() ? `<div class="section pre"><span class="label">Pre-drive notes:</span>\n${escapeHtml(v.preDriveNotes.trim())}</div>` : ""}
      </div>

      <div class="section box-soft">
        <h2>Session overview</h2>
        <div class="overview-row">
          <div class="overview-stages">
            <div class="badge badge-stage">
              <div class="badge-text">
                Stage 1 <span class="stat-blue">Reps: ${escapeHtml(String(stage1Repetitions))}</span>
                <span class="stat-red"> Faults: ${escapeHtml(String(stage1Faults))}</span>
              </div>
            </div>
            ${
              stage2Enabled
                ? `
                  <div class="badge badge-stage">
                    <div class="badge-text">
                      Stage 2 <span class="stat-blue">Reps: ${escapeHtml(String(stage2Repetitions))}</span>
                      <span class="stat-red"> Faults: ${escapeHtml(String(stage2Faults))}</span>
                    </div>
                  </div>
                `
                : ""
            }
          </div>
          <div class="overview-errors">
            <div class="badge ${criticalTotal > 0 ? "badge-critical" : ""}">
              <div class="badge-text">Critical: ${escapeHtml(String(criticalTotal))}</div>
            </div>
            <div class="badge ${immediateTotal > 0 ? "badge-immediate" : ""}">
              <div class="badge-text">Immediate fail: ${escapeHtml(String(immediateTotal))}</div>
            </div>
          </div>
        </div>
        <div class="section pre">${escapeHtml(summary.resultText || "")}</div>
      </div>

      ${renderCategorizedSection("General feedback", v.generalFeedback ?? "")}
      ${renderCategorizedSection("Improvement(s) needed", v.improvementNeeded ?? "")}

      <div class="page-break"></div>

      <div class="section box-soft">
        <h2>${escapeHtml(restrictedMockTestStages.find((stage) => stage.id === "stage1")?.name || "Stage 1")}</h2>
        <div class="stats-row">
          <div class="stat-blue">Total Repetitions: ${escapeHtml(String(stage1Repetitions))}</div>
          <div class="stat-red">Total Faults: ${escapeHtml(String(stage1Faults))}</div>
        </div>
        ${renderStage("stage1")}
      </div>

      ${
        stage2Enabled
          ? `
            <div class="page-break"></div>

            <div class="section box-soft">
              <h2>${escapeHtml(restrictedMockTestStages.find((stage) => stage.id === "stage2")?.name || "Stage 2")}</h2>
              <div class="stats-row">
                <div class="stat-blue">Total Repetitions: ${escapeHtml(String(stage2Repetitions))}</div>
                <div class="stat-red">Total Faults: ${escapeHtml(String(stage2Faults))}</div>
              </div>
              ${renderStage("stage2")}
            </div>
          `
          : ""
      }

      ${
        showLegacyCritical
          ? renderErrorCounts("Critical errors (legacy)", restrictedMockTestLegacyCriticalErrors, v.critical || {})
          : ""
      }
      ${
        showLegacyCritical && v.criticalNotes?.trim()
          ? `<div class="section box-soft pre"><span class="label">Critical notes (legacy):</span>\n${escapeHtml(v.criticalNotes.trim())}</div>`
          : ""
      }

      ${
        showLegacyImmediate
          ? renderErrorCounts(
              "Immediate failure errors (legacy)",
              restrictedMockTestLegacyImmediateErrors,
              v.immediate || {},
            )
          : ""
      }
      ${
        showLegacyImmediate && v.immediateNotes?.trim()
          ? `<div class="section box-soft pre"><span class="label">Immediate notes (legacy):</span>\n${escapeHtml(v.immediateNotes.trim())}</div>`
          : ""
      }
    </body>
  </html>
  `;
}

export async function exportRestrictedMockTestPdf(input: Input) {
  const html = buildHtml(input);
  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS === "android" && input.androidDirectoryUri) {
    try {
      const baseName = sanitizeFileName(input.fileName);
      const pdfName = `${baseName}.pdf`;

      const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
        input.androidDirectoryUri,
        pdfName,
        "application/pdf",
      );

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await FileSystem.writeAsStringAsync(createdUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return { uri: createdUri, savedTo: "downloads" } satisfies ExportRestrictedMockTestPdfResult;
    } catch {
      // Fall back to app storage if SAF permission is missing or has been revoked.
    }
  }

  const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!baseDir) {
    throw new Error("Couldn't access a writable folder to save the PDF.");
  }

  const folderUri = `${baseDir}restricted-mock-tests/`;
  const folderInfo = await FileSystem.getInfoAsync(folderUri);
  if (!folderInfo.exists) {
    await FileSystem.makeDirectoryAsync(folderUri, { intermediates: true });
  }

  const destinationUri = `${folderUri}${sanitizeFileName(input.fileName)}.pdf`;
  await FileSystem.deleteAsync(destinationUri, { idempotent: true });
  await FileSystem.copyAsync({ from: uri, to: destinationUri });

  return { uri: destinationUri, savedTo: "app_storage" } satisfies ExportRestrictedMockTestPdfResult;
}
