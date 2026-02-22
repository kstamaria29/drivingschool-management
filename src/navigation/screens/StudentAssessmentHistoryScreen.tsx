import dayjs from "dayjs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState, type ReactElement } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { ClipboardList, Download, Mail, RefreshCw, Trash2 } from "lucide-react-native";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { AppDivider } from "../../components/AppDivider";
import { AppStack } from "../../components/AppStack";
import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";
import { useCurrentUser } from "../../features/auth/current-user";
import { type Assessment } from "../../features/assessments/api";
import {
  useAssessmentsQuery,
  useDeleteAssessmentMutation,
  useSendAssessmentEmailMutation,
} from "../../features/assessments/queries";
import { ensureAndroidDownloadsDirectoryUri } from "../../features/assessments/android-downloads";
import {
  drivingAssessmentCriteria,
  type DrivingAssessmentCategoryKey,
} from "../../features/assessments/driving-assessment/constants";
import { exportDrivingAssessmentPdf } from "../../features/assessments/driving-assessment/pdf";
import {
  calculateDrivingAssessmentScore,
  generateDrivingAssessmentFeedbackSummary,
} from "../../features/assessments/driving-assessment/scoring";
import { drivingAssessmentStoredDataSchema } from "../../features/assessments/driving-assessment/schema";
import {
  fullLicenseMockTestAssessmentItems,
  fullLicenseMockTestCriticalErrors,
  fullLicenseMockTestImmediateErrors,
} from "../../features/assessments/full-license-mock-test/constants";
import { exportFullLicenseMockTestPdf } from "../../features/assessments/full-license-mock-test/pdf";
import {
  calculateFullLicenseMockTestSummary,
  scoreFullLicenseMockTestAttempt,
  type FullLicenseMockTestAttempt,
} from "../../features/assessments/full-license-mock-test/scoring";
import { fullLicenseMockTestStoredDataSchema } from "../../features/assessments/full-license-mock-test/schema";
import {
  restrictedMockTestLegacyCriticalErrors,
  restrictedMockTestLegacyImmediateErrors,
  restrictedMockTestStages,
  restrictedMockTestTaskItems,
} from "../../features/assessments/restricted-mock-test/constants";
import { exportRestrictedMockTestPdf } from "../../features/assessments/restricted-mock-test/pdf";
import {
  calculateRestrictedMockTestSummary,
  getRestrictedMockTestTaskFaults,
} from "../../features/assessments/restricted-mock-test/scoring";
import { restrictedMockTestStoredDataSchema } from "../../features/assessments/restricted-mock-test/schema";
import { notifyPdfSaved } from "../../features/notifications/download-notifications";
import { useOrganizationQuery, useOrganizationSettingsQuery } from "../../features/organization/queries";
import { useStudentQuery } from "../../features/students/queries";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";
import { DISPLAY_DATE_FORMAT, parseDateInputToISODate } from "../../utils/dates";
import { toErrorMessage } from "../../utils/errors";
import { openPdfUri } from "../../utils/open-pdf";
import { useNavigationLayout } from "../useNavigationLayout";
import type { StudentAssessmentHistoryParams } from "../studentAssessmentHistoryParams";

type StudentAssessmentHistoryScreenParamList = {
  StudentAssessmentHistory: StudentAssessmentHistoryParams;
};

type Props = NativeStackScreenProps<
  StudentAssessmentHistoryScreenParamList,
  "StudentAssessmentHistory"
>;

type AssessmentType = Assessment["assessment_type"];

const assessmentTypes: Array<{ type: AssessmentType; label: string }> = [
  { type: "driving_assessment", label: "Driving Assessment" },
  { type: "second_assessment", label: "Mock Test - Restricted Licence" },
  { type: "third_assessment", label: "Mock Test - Full License" },
];

function formatCategoryTitle(category: string) {
  return category.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
}

function formatAssessmentDate(assessment: Assessment) {
  const raw = assessment.assessment_date ?? null;
  const parsed = raw ? dayjs(raw) : dayjs(assessment.created_at);
  return parsed.isValid() ? parsed.format(DISPLAY_DATE_FORMAT) : "Unknown date";
}

function getDrivingAssessmentSummary(assessment: Assessment) {
  if (assessment.assessment_type !== "driving_assessment") return null;

  const parsed = drivingAssessmentStoredDataSchema.safeParse(assessment.form_data);
  if (parsed.success && parsed.data.feedbackSummary?.trim()) {
    return parsed.data.feedbackSummary.trim();
  }

  if (assessment.total_score == null) return null;
  return generateDrivingAssessmentFeedbackSummary(assessment.total_score);
}

function getDrivingAssessmentImprovements(assessment: Assessment) {
  if (assessment.assessment_type !== "driving_assessment") return null;
  const parsed = drivingAssessmentStoredDataSchema.safeParse(assessment.form_data);
  if (!parsed.success) return null;
  return parsed.data.improvements?.trim() ? parsed.data.improvements.trim() : null;
}

function getRestrictedMockTestSummary(assessment: Assessment) {
  if (assessment.assessment_type !== "second_assessment") return null;
  const parsed = restrictedMockTestStoredDataSchema.safeParse(assessment.form_data);
  if (!parsed.success) return null;

  const values = parsed.data;
  const computedSummary = calculateRestrictedMockTestSummary({
    stagesState: values.stagesState,
    critical: values.critical,
    immediate: values.immediate,
  });

  const summary = values.summary ? { ...computedSummary, ...values.summary } : computedSummary;

  const s1 = summary.stage1Faults ?? 0;
  const s2 = summary.stage2Faults ?? 0;
  const stage1Repetitions = Object.values(values.stagesState.stage1 || {}).reduce((sum, task) => {
    return sum + (task.repetitions ?? 0);
  }, 0);
  const stage2Repetitions = Object.values(values.stagesState.stage2 || {}).reduce((sum, task) => {
    return sum + (task.repetitions ?? 0);
  }, 0);
  const crit = summary.criticalTotal ?? 0;
  const imm = summary.immediateTotal ?? 0;

  const stage2HasRecordedItems =
    stage2Repetitions > 0 ||
    s2 > 0 ||
    Object.values(values.stagesState.stage2 || {}).some((task) => {
      return (
        Boolean(task.location?.trim()) ||
        Boolean(task.criticalErrors?.trim()) ||
        Boolean(task.immediateFailureErrors?.trim()) ||
        Boolean(task.notes?.trim())
      );
    });

  const stage2Used = Boolean(values.stage2Enabled) || stage2HasRecordedItems;

  return `Stage 1: ${s1} faults / ${stage1Repetitions} reps \u00b7 ${stage2Used ? `Stage 2: ${s2} faults / ${stage2Repetitions} reps` : "Stage 2: not enabled"} \u00b7 Critical: ${crit} \u00b7 Immediate: ${imm}`;
}

function getFullLicenseMockTestSummary(assessment: Assessment) {
  if (assessment.assessment_type !== "third_assessment") return null;
  const parsed = fullLicenseMockTestStoredDataSchema.safeParse(assessment.form_data);
  if (!parsed.success) return null;

  const values = parsed.data;
  const computed = calculateFullLicenseMockTestSummary({
    attempts: (values.attempts ?? []) as unknown as FullLicenseMockTestAttempt[],
    critical: values.critical || {},
    immediate: values.immediate || {},
  });

  const readiness = values.summary?.readinessLabel ?? computed.readiness.label;
  const score = computed.scorePercent == null ? "\u2014" : `${computed.scorePercent}%`;
  return `${readiness} - Score: ${score} - Attempts: ${computed.attemptsCount}`;
}

function ScoreChip({ score }: { score: number | null }) {
  if (score == null) return null;
  return (
    <View className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1 dark:border-primaryDark/30 dark:bg-primaryDark/20">
      <AppText className="text-primary dark:text-primaryDark" variant="caption">
        Total score: {score}
      </AppText>
    </View>
  );
}

export function StudentAssessmentHistoryScreen({ route }: Props) {
  const { studentId } = route.params;
  const { isTablet, isLandscape, isCompact } = useNavigationLayout();
  const { profile } = useCurrentUser();

  const [assessmentType, setAssessmentType] = useState<AssessmentType>(
    route.params.initialAssessmentType ?? "driving_assessment",
  );
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [downloadingAssessmentId, setDownloadingAssessmentId] = useState<string | null>(null);
  const [emailingAssessmentId, setEmailingAssessmentId] = useState<string | null>(null);
  const [deletingAssessmentId, setDeletingAssessmentId] = useState<string | null>(null);

  const studentQuery = useStudentQuery(studentId);
  const organizationQuery = useOrganizationQuery(profile.organization_id);
  const organizationSettingsQuery = useOrganizationSettingsQuery(profile.organization_id);
  const allAssessmentsQuery = useAssessmentsQuery({ studentId });
  const assessmentsQuery = useAssessmentsQuery({ studentId, assessmentType });
  const deleteAssessmentMutation = useDeleteAssessmentMutation();
  const sendAssessmentEmailMutation = useSendAssessmentEmailMutation();

  const twoPane = isTablet && isLandscape;

  useEffect(() => {
    setSelectedAssessmentId(null);
  }, [assessmentType, studentId]);

  useEffect(() => {
    setAssessmentType(route.params.initialAssessmentType ?? "driving_assessment");
  }, [route.params.initialAssessmentType, studentId]);

  useEffect(() => {
    if (selectedAssessmentId) return;
    const first = assessmentsQuery.data?.[0];
    if (first) setSelectedAssessmentId(first.id);
  }, [assessmentsQuery.data, selectedAssessmentId]);

  const selectedAssessment = useMemo(() => {
    const list = assessmentsQuery.data ?? [];
    if (!selectedAssessmentId) return null;
    return list.find((a) => a.id === selectedAssessmentId) ?? null;
  }, [assessmentsQuery.data, selectedAssessmentId]);

  const assessmentTypeCounts = useMemo(() => {
    const counts: Partial<Record<AssessmentType, number>> = {};

    for (const assessment of allAssessmentsQuery.data ?? []) {
      counts[assessment.assessment_type] = (counts[assessment.assessment_type] ?? 0) + 1;
    }

    return counts;
  }, [allAssessmentsQuery.data]);

  function onDeletePress(assessment: Assessment) {
    Alert.alert(
      "Delete assessment?",
      "This permanently deletes the assessment and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => void deleteAssessment(assessment),
        },
      ],
    );
  }

  async function deleteAssessment(assessment: Assessment) {
    setDeletingAssessmentId(assessment.id);
    try {
      await deleteAssessmentMutation.mutateAsync(assessment.id);
      setSelectedAssessmentId(null);
    } catch (error) {
      Alert.alert("Couldn't delete assessment", toErrorMessage(error));
    } finally {
      setDeletingAssessmentId(null);
    }
  }

  async function onDownloadPdfPress(assessment: Assessment) {
    const student = studentQuery.data ?? null;
    if (!student) {
      Alert.alert("Couldn't load student", "Please try again once the student details are loaded.");
      return;
    }

    const organizationName = organizationQuery.data?.name ?? "Driving School";
    const organizationLogoUrl = organizationSettingsQuery.data?.logo_url ?? null;

    setDownloadingAssessmentId(assessment.id);
    try {
      const androidDirectoryUri =
        Platform.OS === "android" ? await ensureAndroidDownloadsDirectoryUri() : undefined;

      if (assessment.assessment_type === "driving_assessment") {
        const parsed = drivingAssessmentStoredDataSchema.safeParse(assessment.form_data);
        if (!parsed.success) {
          Alert.alert(
            "Couldn't export PDF",
            "This assessment is missing required data. Try creating a new assessment.",
          );
          return;
        }

        const values = parsed.data;
        const score = calculateDrivingAssessmentScore(values.scores);
        const totalPercent = assessment.total_score ?? score.percentAnswered;
        const feedbackSummary =
          values.feedbackSummary?.trim() ||
          (totalPercent == null ? "" : generateDrivingAssessmentFeedbackSummary(totalPercent));

        const assessmentDateISO = parseDateInputToISODate(values.date) ?? values.date;
        const issueDateISO = values.issueDate ? parseDateInputToISODate(values.issueDate) : null;
        const expiryDateISO = values.expiryDate ? parseDateInputToISODate(values.expiryDate) : null;
        const fileName = `${student.first_name} ${student.last_name} ${dayjs(assessmentDateISO).format("DD-MM-YY")}`;

        const saved = await exportDrivingAssessmentPdf({
          assessmentId: assessment.id,
          organizationName,
          organizationLogoUrl,
          fileName,
          androidDirectoryUri: androidDirectoryUri ?? undefined,
          criteria: drivingAssessmentCriteria,
          values: {
            ...values,
            date: dayjs(assessmentDateISO).format(DISPLAY_DATE_FORMAT),
            issueDate: issueDateISO
              ? dayjs(issueDateISO).format(DISPLAY_DATE_FORMAT)
              : values.issueDate,
            expiryDate: expiryDateISO
              ? dayjs(expiryDateISO).format(DISPLAY_DATE_FORMAT)
              : values.expiryDate,
            totalScorePercent: totalPercent,
            totalScoreRaw: score.totalRaw,
            feedbackSummary,
          },
        });

        await notifyPdfSaved({
          fileName,
          uri: saved.uri,
          savedTo: saved.savedTo === "downloads" ? "Downloads" : "App storage",
        });

        Alert.alert(
          "PDF saved",
          saved.savedTo === "downloads"
            ? "Saved to Downloads."
            : "Saved inside the app (your device may restrict global downloads).",
          [{ text: "Open", onPress: () => void openPdfUri(saved.uri) }, { text: "Done" }],
        );

        return;
      }

      if (assessment.assessment_type === "second_assessment") {
        const parsed = restrictedMockTestStoredDataSchema.safeParse(assessment.form_data);
        if (!parsed.success) {
          Alert.alert(
            "Couldn't export PDF",
            "This assessment is missing required data. Try creating a new assessment.",
          );
          return;
        }

        const values = parsed.data;
        const assessmentDateISO =
          parseDateInputToISODate(values.date) ?? assessment.assessment_date ?? assessment.created_at;
        const fileName = `Mock Test Restricted ${student.first_name} ${student.last_name} ${dayjs(assessmentDateISO).format("DD-MM-YY")}`;

        const saved = await exportRestrictedMockTestPdf({
          assessmentId: assessment.id,
          organizationName,
          organizationLogoUrl,
          fileName,
          androidDirectoryUri: androidDirectoryUri ?? undefined,
          values,
        });

        await notifyPdfSaved({
          fileName,
          uri: saved.uri,
          savedTo: saved.savedTo === "downloads" ? "Downloads" : "App storage",
        });

        Alert.alert(
          "PDF saved",
          saved.savedTo === "downloads"
            ? "Saved to Downloads."
            : "Saved inside the app (your device may restrict global downloads).",
          [{ text: "Open", onPress: () => void openPdfUri(saved.uri) }, { text: "Done" }],
        );

        return;
      }

      if (assessment.assessment_type === "third_assessment") {
        const parsed = fullLicenseMockTestStoredDataSchema.safeParse(assessment.form_data);
        if (!parsed.success) {
          Alert.alert(
            "Couldn't export PDF",
            "This assessment is missing required data. Try creating a new assessment.",
          );
          return;
        }

        const values = parsed.data;
        const assessmentDateISO =
          parseDateInputToISODate(values.date) ?? assessment.assessment_date ?? assessment.created_at;
        const fileName = `Mock Test Full License ${student.first_name} ${student.last_name} ${dayjs(
          assessmentDateISO,
        ).format("DD-MM-YY")}`;

        const saved = await exportFullLicenseMockTestPdf({
          assessmentId: assessment.id,
          organizationName,
          organizationLogoUrl,
          fileName,
          androidDirectoryUri: androidDirectoryUri ?? undefined,
          values,
        });

        await notifyPdfSaved({
          fileName,
          uri: saved.uri,
          savedTo: saved.savedTo === "downloads" ? "Downloads" : "App storage",
        });

        Alert.alert(
          "PDF saved",
          saved.savedTo === "downloads"
            ? "Saved to Downloads."
            : "Saved inside the app (your device may restrict global downloads).",
          [{ text: "Open", onPress: () => void openPdfUri(saved.uri) }, { text: "Done" }],
        );

        return;
      }

      Alert.alert("Not available", "PDF export isn't available for this assessment type yet.");
      return;

    } catch (error) {
      Alert.alert("Couldn't export PDF", toErrorMessage(error));
    } finally {
      setDownloadingAssessmentId(null);
    }
  }

  async function sendAssessmentEmail(assessment: Assessment) {
    const student = studentQuery.data ?? null;
    if (!student) {
      Alert.alert("Couldn't load student", "Please try again once the student details are loaded.");
      return;
    }

    const studentEmail = (student.email ?? "").trim();
    if (!studentEmail) {
      Alert.alert("Missing student email", "Add an email address for this student to email assessments.");
      return;
    }

    const organizationEmail = (organizationQuery.data?.email ?? "").trim();
    if (!organizationEmail) {
      Alert.alert(
        "Missing organization email",
        "Set your organization email in Settings to email assessments.",
      );
      return;
    }

    const organizationName = organizationQuery.data?.name ?? "Driving School";
    const organizationLogoUrl = organizationSettingsQuery.data?.logo_url ?? null;

    setEmailingAssessmentId(assessment.id);
    try {
      if (assessment.assessment_type === "driving_assessment") {
        const parsed = drivingAssessmentStoredDataSchema.safeParse(assessment.form_data);
        if (!parsed.success) {
          Alert.alert(
            "Couldn't send email",
            "This assessment is missing required data. Try creating a new assessment.",
          );
          return;
        }

        const values = parsed.data;
        const score = calculateDrivingAssessmentScore(values.scores);
        const totalPercent = assessment.total_score ?? score.percentAnswered;
        const feedbackSummary =
          values.feedbackSummary?.trim() ||
          (totalPercent == null ? "" : generateDrivingAssessmentFeedbackSummary(totalPercent));

        const assessmentDateISO = parseDateInputToISODate(values.date) ?? values.date;
        const issueDateISO = values.issueDate ? parseDateInputToISODate(values.issueDate) : null;
        const expiryDateISO = values.expiryDate ? parseDateInputToISODate(values.expiryDate) : null;
        const fileName = `${student.first_name} ${student.last_name} ${dayjs(assessmentDateISO).format("DD-MM-YY")}`;

        const saved = await exportDrivingAssessmentPdf({
          assessmentId: assessment.id,
          organizationName,
          organizationLogoUrl,
          fileName,
          criteria: drivingAssessmentCriteria,
          values: {
            ...values,
            date: dayjs(assessmentDateISO).format(DISPLAY_DATE_FORMAT),
            issueDate: issueDateISO
              ? dayjs(issueDateISO).format(DISPLAY_DATE_FORMAT)
              : values.issueDate,
            expiryDate: expiryDateISO
              ? dayjs(expiryDateISO).format(DISPLAY_DATE_FORMAT)
              : values.expiryDate,
            totalScorePercent: totalPercent,
            totalScoreRaw: score.totalRaw,
            feedbackSummary,
          },
        });

        const pdfBase64 = await FileSystem.readAsStringAsync(saved.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await sendAssessmentEmailMutation.mutateAsync({
          assessmentId: assessment.id,
          fileName: `${fileName}.pdf`,
          pdfBase64,
        });

        Alert.alert(
          "Email sent",
          `Sent to ${studentEmail} and ${organizationEmail}.`,
          Platform.OS === "ios" ? undefined : [{ text: "OK" }],
        );

        return;
      }

      if (assessment.assessment_type === "second_assessment") {
        const parsed = restrictedMockTestStoredDataSchema.safeParse(assessment.form_data);
        if (!parsed.success) {
          Alert.alert(
            "Couldn't send email",
            "This assessment is missing required data. Try creating a new assessment.",
          );
          return;
        }

        const values = parsed.data;
        const assessmentDateISO =
          parseDateInputToISODate(values.date) ?? assessment.assessment_date ?? assessment.created_at;
        const fileName = `Mock Test Restricted ${student.first_name} ${student.last_name} ${dayjs(assessmentDateISO).format("DD-MM-YY")}`;

        const saved = await exportRestrictedMockTestPdf({
          assessmentId: assessment.id,
          organizationName,
          organizationLogoUrl,
          fileName,
          values,
        });

        const pdfBase64 = await FileSystem.readAsStringAsync(saved.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await sendAssessmentEmailMutation.mutateAsync({
          assessmentId: assessment.id,
          fileName: `${fileName}.pdf`,
          pdfBase64,
        });

        Alert.alert(
          "Email sent",
          `Sent to ${studentEmail} and ${organizationEmail}.`,
          Platform.OS === "ios" ? undefined : [{ text: "OK" }],
        );

        return;
      }

      if (assessment.assessment_type === "third_assessment") {
        const parsed = fullLicenseMockTestStoredDataSchema.safeParse(assessment.form_data);
        if (!parsed.success) {
          Alert.alert(
            "Couldn't send email",
            "This assessment is missing required data. Try creating a new assessment.",
          );
          return;
        }

        const values = parsed.data;
        const assessmentDateISO =
          parseDateInputToISODate(values.date) ?? assessment.assessment_date ?? assessment.created_at;
        const fileName = `Mock Test Full License ${student.first_name} ${student.last_name} ${dayjs(
          assessmentDateISO,
        ).format("DD-MM-YY")}`;

        const saved = await exportFullLicenseMockTestPdf({
          assessmentId: assessment.id,
          organizationName,
          organizationLogoUrl,
          fileName,
          values,
        });

        const pdfBase64 = await FileSystem.readAsStringAsync(saved.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await sendAssessmentEmailMutation.mutateAsync({
          assessmentId: assessment.id,
          fileName: `${fileName}.pdf`,
          pdfBase64,
        });

        Alert.alert(
          "Email sent",
          `Sent to ${studentEmail} and ${organizationEmail}.`,
          Platform.OS === "ios" ? undefined : [{ text: "OK" }],
        );

        return;
      }

      Alert.alert("Not available", "Email sending isn't available for this assessment type yet.");
    } catch (error) {
      Alert.alert("Couldn't send email", toErrorMessage(error));
    } finally {
      setEmailingAssessmentId(null);
    }
  }

  function onEmailStudentPress(assessment: Assessment) {
    const student = studentQuery.data ?? null;
    if (!student) {
      Alert.alert("Couldn't load student", "Please try again once the student details are loaded.");
      return;
    }

    const studentEmail = (student.email ?? "").trim();
    if (!studentEmail) {
      Alert.alert("Missing student email", "Add an email address for this student to email assessments.");
      return;
    }

    const organizationEmail = (organizationQuery.data?.email ?? "").trim();
    if (!organizationEmail) {
      Alert.alert(
        "Missing organization email",
        "Set your organization email in Settings to email assessments.",
      );
      return;
    }

    Alert.alert(
      "Email student?",
      `This will send the assessment PDF to:\n${studentEmail}\n${organizationEmail}\n\nSender: ${organizationEmail}`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send", onPress: () => void sendAssessmentEmail(assessment) },
      ],
    );
  }

  const header = (
    <View>
      <AppText variant="title">Assessment History</AppText>
      {studentQuery.data ? (
        <AppText className="mt-2" variant="body">
          {studentQuery.data.first_name} {studentQuery.data.last_name}
        </AppText>
      ) : (
        <AppText className="mt-2" variant="body">
          Student assessments by type.
        </AppText>
      )}
    </View>
  );

  const tabs = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      contentContainerClassName="gap-2"
    >
      {assessmentTypes.map((tab) => (
        <AppButton
          key={tab.type}
          width="auto"
          variant={tab.type === assessmentType ? "primary" : "secondary"}
          icon={ClipboardList}
          badgeCount={allAssessmentsQuery.isPending ? undefined : (assessmentTypeCounts[tab.type] ?? 0)}
          label={tab.label}
          onPress={() => setAssessmentType(tab.type)}
        />
      ))}
    </ScrollView>
  );

  const listContent = assessmentsQuery.isPending ? (
    <View className={cn("items-center justify-center py-10", theme.text.base)}>
      <ActivityIndicator />
      <AppText className="mt-3 text-center" variant="body">
        Loading assessments...
      </AppText>
    </View>
  ) : assessmentsQuery.isError ? (
    <AppStack gap="md">
      <AppCard className="gap-2">
        <AppText variant="heading">Couldn't load assessments</AppText>
        <AppText variant="body">{toErrorMessage(assessmentsQuery.error)}</AppText>
      </AppCard>
      <AppButton label="Retry" icon={RefreshCw} onPress={() => assessmentsQuery.refetch()} />
    </AppStack>
  ) : (assessmentsQuery.data ?? []).length === 0 ? (
    <AppCard className="gap-2">
      <AppText variant="heading">No assessments yet</AppText>
      <AppText variant="body">
        Create a new assessment from the Assessments screen to see it appear here.
      </AppText>
    </AppCard>
  ) : (
    <AppStack gap="sm">
      {(assessmentsQuery.data ?? []).map((assessment) => {
        const isSelected = assessment.id === selectedAssessmentId;
        const drivingSummary = getDrivingAssessmentSummary(assessment);
        const drivingImprovements = getDrivingAssessmentImprovements(assessment);
        const restrictedSummary = getRestrictedMockTestSummary(assessment);
        const fullLicenseSummary = getFullLicenseMockTestSummary(assessment);
        const summaryText = drivingSummary ?? restrictedSummary ?? fullLicenseSummary;

        return (
          <Pressable
            key={assessment.id}
            accessibilityRole="button"
            onPress={() => setSelectedAssessmentId(assessment.id)}
            className="w-full"
          >
            <AppCard
              className={cn(
                "gap-2",
                isSelected &&
                  "border-primary bg-primary/5 dark:border-primaryDark dark:bg-primaryDark/10",
                twoPane && "py-3",
              )}
            >
              <View className="flex-row items-center justify-between gap-3">
                <AppText variant="heading">{formatAssessmentDate(assessment)}</AppText>
                {assessment.assessment_type === "driving_assessment" ? (
                  <AppText variant="caption">
                    Score: {assessment.total_score == null ? "" : String(assessment.total_score)}
                  </AppText>
                ) : assessment.assessment_type === "second_assessment" ||
                  assessment.assessment_type === "third_assessment" ? (
                  <AppText variant="caption">Mock test</AppText>
                ) : (
                  <AppText variant="caption">Assessment</AppText>
                )}
              </View>

              {summaryText ? (
                <AppText numberOfLines={2} variant="caption">
                  {summaryText}
                </AppText>
              ) : null}
              {drivingImprovements ? (
                <AppText numberOfLines={2} variant="caption">
                  {drivingImprovements}
                </AppText>
              ) : null}
            </AppCard>
          </Pressable>
        );
      })}
    </AppStack>
  );

  function renderDetail(assessment: Assessment | null) {
    if (!assessment) {
      return (
        <AppCard className="gap-2">
          <AppText variant="heading">Select an assessment</AppText>
          <AppText variant="body">Tap an entry to view details.</AppText>
        </AppCard>
      );
    }

    if (assessment.assessment_type === "second_assessment") {
      const parsed = restrictedMockTestStoredDataSchema.safeParse(assessment.form_data);
      if (!parsed.success) {
        return (
          <AppStack gap="md">
            <AppCard className="gap-2">
              <AppText variant="heading">Couldn't read mock test</AppText>
              <AppText variant="body">
                This assessment is missing required data, so it can't be displayed.
              </AppText>
            </AppCard>

            <AppButton
              variant="danger"
              label={deletingAssessmentId === assessment.id ? "Deleting..." : "Delete assessment"}
              icon={Trash2}
              disabled={deletingAssessmentId === assessment.id}
              onPress={() => onDeletePress(assessment)}
            />
          </AppStack>
        );
      }

      const values = parsed.data;
      const computedSummary = calculateRestrictedMockTestSummary({
        stagesState: values.stagesState,
        critical: values.critical,
        immediate: values.immediate,
      });

      const summary = values.summary ? { ...computedSummary, ...values.summary } : computedSummary;

      const criticalTotal = summary.criticalTotal ?? 0;
      const immediateTotal = summary.immediateTotal ?? 0;
      const stage1Repetitions = Object.values(values.stagesState.stage1 || {}).reduce((sum, task) => {
        return sum + (task.repetitions ?? 0);
      }, 0);
      const stage2Repetitions = Object.values(values.stagesState.stage2 || {}).reduce((sum, task) => {
        return sum + (task.repetitions ?? 0);
      }, 0);
      const stage1Faults = summary.stage1Faults ?? 0;
      const stage2Faults = summary.stage2Faults ?? 0;
      const stage2HasRecordedItems =
        stage2Repetitions > 0 ||
        stage2Faults > 0 ||
        Object.values(values.stagesState.stage2 || {}).some((task) => {
          return (
            Boolean(task.location?.trim()) ||
            Boolean(task.criticalErrors?.trim()) ||
            Boolean(task.immediateFailureErrors?.trim()) ||
            Boolean(
              task.repetitionErrors?.some(
                (rep) => Boolean(rep.criticalErrors?.trim()) || Boolean(rep.immediateFailureErrors?.trim()),
              ),
            ) ||
            Boolean(task.notes?.trim())
          );
        });
      const stage2Used = Boolean(values.stage2Enabled) || stage2HasRecordedItems;

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

      function renderCategorizedLines(value: string): ReactElement | null {
        const groups = extractCategorizedGroups(value);
        if (groups.length === 0) return null;

        return (
          <AppStack gap="sm">
            {groups.map((group) => (
              <View key={group.category} className="gap-1">
                <AppText variant="label">{group.category}</AppText>
                {group.items.map((item, index) => (
                  <AppText key={`${group.category}-${index}`} className="ml-3" variant="body">
                    • {item}
                  </AppText>
                ))}
              </View>
            ))}
          </AppStack>
        );
      }

      function renderRecordedTasks(stageId: "stage1" | "stage2") {
        const stage = restrictedMockTestStages.find((s) => s.id === stageId);
        if (!stage) return null;

        const stageFaults = stageId === "stage1" ? stage1Faults : stage2Faults;
        const stageState = values.stagesState[stageId] || {};
        const stageRepetitions = Object.values(stageState).reduce((sum, task) => {
          return sum + (task.repetitions ?? 0);
        }, 0);

        const taskDefById = new Map<string, (typeof stage.tasks)[number]>(
          stage.tasks.map((taskDef) => [taskDef.id as string, taskDef]),
        );
        const knownTaskIds = new Set<string>(stage.tasks.map((taskDef) => taskDef.id as string));
        const extraTaskIds = Object.keys(stageState)
          .filter((taskId) => !knownTaskIds.has(taskId))
          .sort();
        const taskIds = [...stage.tasks.map((taskDef) => taskDef.id as string), ...extraTaskIds];

        const tasks = taskIds
          .map((taskId) => {
            const taskState = stageState?.[taskId];
            if (!taskState) return null;

            const taskDef = taskDefById.get(taskId) ?? null;
            const legacyMeta = legacyTaskMetaById[taskId] ?? null;
            const taskName = taskDef?.name ?? legacyMeta?.name ?? taskId;
            const targetReps = taskDef?.targetReps ?? legacyMeta?.targetReps ?? null;

            const repetitions = taskState.repetitions ?? 0;
            const faultTotal = restrictedMockTestTaskItems.reduce((sum, item) => {
              return sum + (taskState.items?.[item.id] ?? 0);
            }, 0);
            const faults = getRestrictedMockTestTaskFaults(taskState);
            const repetitionErrors = taskState.repetitionErrors ?? [];
            const hasRepetitionErrors = repetitionErrors.some(
              (rep) => Boolean(rep.criticalErrors?.trim()) || Boolean(rep.immediateFailureErrors?.trim()),
            );

            const hasDetails =
              repetitions > 0 ||
              faultTotal > 0 ||
              Boolean(taskState.location?.trim()) ||
              Boolean(taskState.criticalErrors?.trim()) ||
              Boolean(taskState.immediateFailureErrors?.trim()) ||
              hasRepetitionErrors ||
              Boolean(taskState.notes?.trim());
            if (!hasDetails) return null;

            const showStats = repetitions > 0 || faultTotal > 0;

            return (
              <AppCard key={taskId} className="gap-2">
                <View className="flex-row items-start justify-between gap-3">
                  <AppText className="flex-1" variant="heading">
                    {taskName}
                  </AppText>
                  {targetReps != null ? (
                    <AppText className="shrink-0 text-right" variant="heading">
                      {targetReps} reps
                    </AppText>
                  ) : null}
                </View>

                {showStats ? (
                  <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
                    {repetitions > 0 ? (
                      <AppText className="!text-blue-600 dark:!text-blue-400" variant="body">
                        Repetitions: {repetitions}
                      </AppText>
                    ) : null}
                    <AppText className="!text-red-600 dark:!text-red-400" variant="body">
                      Faults: {faultTotal}
                    </AppText>
                  </View>
                ) : null}

                {taskState.location?.trim() ? (
                  <AppText variant="body">Location: {taskState.location.trim()}</AppText>
                ) : null}
                {faults.length ? (
                  <AppText variant="body">Fault types: {faults.join(", ")}</AppText>
                ) : null}
                {repetitionErrors.length > 0 ? (
                  <View className="gap-3">
                    {Array.from({ length: Math.max(repetitions, repetitionErrors.length) }, (_, index) => {
                      const rep = repetitionErrors[index] ?? {
                        criticalErrors: "",
                        immediateFailureErrors: "",
                      };
                      const criticalValue = rep.criticalErrors?.trim() ?? "";
                      const immediateValue = rep.immediateFailureErrors?.trim() ?? "";
                      const showCritical = Boolean(criticalValue);
                      const showImmediate = Boolean(immediateValue);

                      return (
                        <View
                          key={`repetition-${index + 1}`}
                          className="gap-2 rounded-xl border border-border bg-background px-3 py-3 dark:border-borderDark dark:bg-backgroundDark"
                        >
                          <AppText variant="label">Repetition #{index + 1}</AppText>
                          {showCritical ? (
                            <View className="gap-2">
                              <AppText variant="label">Critical error(s)</AppText>
                              {renderCategorizedLines(criticalValue)}
                            </View>
                          ) : null}
                          {showImmediate ? (
                            <View className="gap-2">
                              <AppText className="text-red-600 dark:text-red-400" variant="label">
                                Immediate failure error
                              </AppText>
                              {renderCategorizedLines(immediateValue)}
                            </View>
                          ) : null}
                          {!showCritical && !showImmediate ? (
                            <AppText variant="caption">No critical/immediate errors recorded.</AppText>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : null}
                {taskState.criticalErrors?.trim() ? (
                  <View className="gap-2">
                    <AppText variant="label">
                      {repetitionErrors.length > 0 ? "Critical error(s) (legacy)" : "Critical error(s)"}
                    </AppText>
                    {renderCategorizedLines(taskState.criticalErrors.trim())}
                  </View>
                ) : null}
                {taskState.immediateFailureErrors?.trim() ? (
                  <View className="gap-2">
                    <AppText className="text-red-600 dark:text-red-400" variant="label">
                      {repetitionErrors.length > 0
                        ? "Immediate failure error (legacy)"
                        : "Immediate failure error"}
                    </AppText>
                    {renderCategorizedLines(taskState.immediateFailureErrors.trim())}
                  </View>
                ) : null}
                {taskState.notes?.trim() ? (
                  <AppText variant="body">Notes: {taskState.notes.trim()}</AppText>
                ) : null}
              </AppCard>
            );
          })
          .filter((task): task is ReactElement => task != null);

        const stageHeader = (
          <View>
            <AppText variant="heading">{stage.name}</AppText>
            <View className="mt-1 flex-row flex-wrap items-center gap-x-4 gap-y-1">
              <AppText className="!text-blue-600 dark:!text-blue-400" variant="body">
                Total Repetitions: {stageRepetitions}
              </AppText>
              <AppText className="!text-red-600 dark:!text-red-400" variant="body">
                Total Faults: {stageFaults}
              </AppText>
            </View>
            {stageId === "stage2" && !values.stage2Enabled ? (
              <AppText className="mt-1" variant="caption">
                Stage 2 was not enabled, but some items were recorded.
              </AppText>
            ) : null}
          </View>
        );

        if (tasks.length === 0) {
          return (
            <AppCard className="gap-2">
              {stageHeader}
              <AppText variant="body">No items recorded for this stage.</AppText>
            </AppCard>
          );
        }

        return (
          <AppStack gap="sm">
            {stageHeader}
            {tasks}
          </AppStack>
        );
      }

      function renderErrorLines(errors: readonly string[], counts: Record<string, number>) {
        const lines = errors
          .map((label) => {
            const count = counts[label] ?? 0;
            return count > 0 ? `${label}: ${count}` : null;
          })
          .filter((line): line is string => line != null);

        return lines.length ? lines.join("\n") : "";
      }

      const legacyCriticalLines = renderErrorLines(
        restrictedMockTestLegacyCriticalErrors,
        values.critical || {},
      );
      const legacyImmediateLines = renderErrorLines(
        restrictedMockTestLegacyImmediateErrors,
        values.immediate || {},
      );
      const showLegacyCritical = Boolean(legacyCriticalLines.trim()) || Boolean(values.criticalNotes?.trim());
      const showLegacyImmediate = Boolean(legacyImmediateLines.trim()) || Boolean(values.immediateNotes?.trim());

      return (
        <AppStack gap="md">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <AppText variant="heading">Mock Test - Restricted Licence</AppText>
              <AppText className="mt-1" variant="caption">
                Assessment on {formatAssessmentDate(assessment)}
              </AppText>
              {values.instructor?.trim() ? (
                <AppText className="mt-1" variant="caption">
                  Instructor: {values.instructor.trim()}
                </AppText>
              ) : null}
            </View>

            <View className="items-end gap-1">
              <AppText variant="caption">Critical: {criticalTotal}</AppText>
              <AppText variant={immediateTotal > 0 ? "error" : "caption"}>
                Immediate: {immediateTotal}
              </AppText>
            </View>
          </View>

          <AppButton
            width="auto"
            label={downloadingAssessmentId === assessment.id ? "Saving PDF..." : "Download PDF"}
            icon={Download}
            disabled={
              downloadingAssessmentId === assessment.id ||
              emailingAssessmentId === assessment.id ||
              deletingAssessmentId === assessment.id
            }
            onPress={() => void onDownloadPdfPress(assessment)}
          />

          <AppButton
            width="auto"
            variant="secondary"
            label={emailingAssessmentId === assessment.id ? "Sending..." : "Email student"}
            icon={Mail}
            disabled={
              downloadingAssessmentId === assessment.id ||
              emailingAssessmentId === assessment.id ||
              deletingAssessmentId === assessment.id
            }
            onPress={() => onEmailStudentPress(assessment)}
          />

          <AppDivider />

          <AppCard className="gap-2">
            <AppText variant="heading">Session details</AppText>
            <AppText variant="body">Candidate: {values.candidateName || ""}</AppText>
            <AppText variant="body">Date: {values.date || ""}</AppText>
            <AppText variant="body">Time: {values.time || ""}</AppText>
            <AppText variant="body">Vehicle: {values.vehicleInfo || ""}</AppText>
            <AppText variant="body">Route: {values.routeInfo || ""}</AppText>
            {values.preDriveNotes?.trim() ? (
              <AppText variant="body">Pre-drive notes: {values.preDriveNotes.trim()}</AppText>
            ) : null}
          </AppCard>

          <AppCard className="gap-2">
            <AppText variant="heading">Overview</AppText>
            <AppText variant="body">
              Stage 1: {stage1Repetitions} reps {"\u00b7"} {stage1Faults} faults
            </AppText>
            <AppText variant="body">
              Stage 2:{" "}
              {stage2Used ? `${stage2Repetitions} reps \u00b7 ${stage2Faults} faults` : "not enabled"}
            </AppText>
            <AppText variant="body">Critical errors: {criticalTotal}</AppText>
            <AppText variant="body">Immediate failure errors: {immediateTotal}</AppText>
            {summary.resultText ? <AppText variant="caption">{summary.resultText}</AppText> : null}
          </AppCard>

          <AppCard className="gap-2">
            <AppText variant="heading">General feedback</AppText>
            {values.generalFeedback?.trim()
              ? renderCategorizedLines(values.generalFeedback.trim())
              : <AppText variant="body">None recorded.</AppText>}
          </AppCard>

          <AppCard className="gap-2">
            <AppText variant="heading">Improvement(s) needed</AppText>
            {values.improvementNeeded?.trim()
              ? renderCategorizedLines(values.improvementNeeded.trim())
              : <AppText variant="body">None recorded.</AppText>}
          </AppCard>

          <AppDivider />

          {renderRecordedTasks("stage1")}

          {stage2Used ? renderRecordedTasks("stage2") : (
            <AppCard className="gap-2">
              <AppText variant="heading">Stage 2</AppText>
              <AppText variant="body">Stage 2 not enabled.</AppText>
            </AppCard>
          )}

          {showLegacyCritical ? (
            <AppCard className="gap-2">
              <AppText variant="heading">Critical errors (legacy)</AppText>
              <AppText variant="body">{legacyCriticalLines || "None recorded."}</AppText>
              {values.criticalNotes?.trim() ? (
                <AppText variant="body">Notes: {values.criticalNotes.trim()}</AppText>
              ) : null}
            </AppCard>
          ) : null}

          {showLegacyImmediate ? (
            <AppCard className="gap-2">
              <AppText variant="heading">Immediate failure errors (legacy)</AppText>
              <AppText variant="body">{legacyImmediateLines || "None recorded."}</AppText>
              {values.immediateNotes?.trim() ? (
                <AppText variant="body">Notes: {values.immediateNotes.trim()}</AppText>
              ) : null}
            </AppCard>
          ) : null}

          <AppDivider />

          <AppButton
            variant="danger"
            label={deletingAssessmentId === assessment.id ? "Deleting..." : "Delete assessment"}
            icon={Trash2}
            disabled={
              deletingAssessmentId === assessment.id ||
              downloadingAssessmentId === assessment.id ||
              emailingAssessmentId === assessment.id
            }
            onPress={() => onDeletePress(assessment)}
          />
        </AppStack>
      );
    }

    if (assessment.assessment_type === "third_assessment") {
      const parsed = fullLicenseMockTestStoredDataSchema.safeParse(assessment.form_data);
      if (!parsed.success) {
        return (
          <AppStack gap="md">
            <AppCard className="gap-2">
              <AppText variant="heading">Couldn't read mock test</AppText>
              <AppText variant="body">
                This assessment is missing required data, so it can't be displayed.
              </AppText>
            </AppCard>

            <AppButton
              variant="danger"
              label={deletingAssessmentId === assessment.id ? "Deleting..." : "Delete assessment"}
              icon={Trash2}
              disabled={deletingAssessmentId === assessment.id}
              onPress={() => onDeletePress(assessment)}
            />
          </AppStack>
        );
      }

      const values = parsed.data;
      const computed = calculateFullLicenseMockTestSummary({
        attempts: (values.attempts ?? []) as unknown as FullLicenseMockTestAttempt[],
        critical: values.critical || {},
        immediate: values.immediate || {},
      });

      const readinessLabel = values.summary?.readinessLabel ?? computed.readiness.label;
      const readinessReason = values.summary?.readinessReason ?? computed.readiness.reason;

      function renderErrorLines(errors: readonly string[], counts: Record<string, number>) {
        const lines = errors
          .map((label) => {
            const count = counts[label] ?? 0;
            return count > 0 ? `${label}: ${count}` : null;
          })
          .filter((line): line is string => line != null);

        return lines.length ? lines.join("\n") : "";
      }

      const criticalLines = renderErrorLines(fullLicenseMockTestCriticalErrors, values.critical || {});
      const immediateLines = renderErrorLines(fullLicenseMockTestImmediateErrors, values.immediate || {});

      const coachingFocus = Object.entries(computed.failuresByItem)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([id, count]) => ({
          id,
          label: fullLicenseMockTestAssessmentItems.find((x) => x.id === id)?.label ?? id,
          count,
        }));

      return (
        <AppStack gap="md">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <AppText variant="heading">Mock Test - Full License</AppText>
              <AppText className="mt-1" variant="caption">
                Assessment on {formatAssessmentDate(assessment)}
              </AppText>
              {values.instructor?.trim() ? (
                <AppText className="mt-1" variant="caption">
                  Instructor: {values.instructor.trim()}
                </AppText>
              ) : null}
            </View>

            <View className="items-end gap-2">
              <ScoreChip score={computed.scorePercent} />
              <View className="rounded-full border border-border bg-background px-3 py-1 dark:border-borderDark dark:bg-backgroundDark">
                <AppText
                  variant={readinessLabel === "NOT READY" ? "error" : "caption"}
                  className="font-semibold"
                >
                  {readinessLabel}
                </AppText>
              </View>
            </View>
          </View>

          <AppButton
            width="auto"
            label={downloadingAssessmentId === assessment.id ? "Saving PDF..." : "Download PDF"}
            icon={Download}
            disabled={
              downloadingAssessmentId === assessment.id ||
              emailingAssessmentId === assessment.id ||
              deletingAssessmentId === assessment.id
            }
            onPress={() => void onDownloadPdfPress(assessment)}
          />

          <AppButton
            width="auto"
            variant="secondary"
            label={emailingAssessmentId === assessment.id ? "Sending..." : "Email student"}
            icon={Mail}
            disabled={
              downloadingAssessmentId === assessment.id ||
              emailingAssessmentId === assessment.id ||
              deletingAssessmentId === assessment.id
            }
            onPress={() => onEmailStudentPress(assessment)}
          />

          <AppDivider />

          <AppCard className="gap-2">
            <AppText variant="heading">Overview</AppText>
            <AppText variant="body">Readiness: {readinessLabel}</AppText>
            <AppText variant="caption">{readinessReason}</AppText>
            <AppText variant="body">Attempts: {computed.attemptsCount}</AppText>
            <AppText variant="body">Score: {computed.scorePercent == null ? "\u2014" : `${computed.scorePercent}%`}</AppText>
            <AppText variant="body">Critical errors: {computed.criticalTotal}</AppText>
            <AppText variant="body">Immediate failure errors: {computed.immediateTotal}</AppText>
          </AppCard>

          <AppCard className="gap-2">
            <AppText variant="heading">Session details</AppText>
            <AppText variant="body">Candidate: {values.candidateName || ""}</AppText>
            <AppText variant="body">Date: {values.date || ""}</AppText>
            <AppText variant="body">Time: {values.time || ""}</AppText>
            <AppText variant="body">Area: {values.locationArea || ""}</AppText>
            <AppText variant="body">Vehicle: {values.vehicle || ""}</AppText>
            <AppText variant="body">Mode: {values.mode || ""}</AppText>
            <AppText variant="body">Conditions: {values.weather || ""}</AppText>
            {values.overallNotes?.trim() ? (
              <AppText variant="body">Overall notes: {values.overallNotes.trim()}</AppText>
            ) : null}
          </AppCard>

          <AppCard className="gap-2">
            <AppText variant="heading">Coaching focus</AppText>
            {coachingFocus.length === 0 ? (
              <AppText variant="body">No item failures recorded.</AppText>
            ) : (
              <AppStack gap="sm">
                {coachingFocus.map((item) => (
                  <View key={item.id} className="flex-row items-center justify-between gap-3">
                    <AppText className="flex-1" variant="body">
                      {item.label}
                    </AppText>
                    <AppText variant="caption">{item.count} fail(s)</AppText>
                  </View>
                ))}
              </AppStack>
            )}
          </AppCard>

          <AppCard className="gap-3">
            <AppText variant="heading">Attempts</AppText>
            {(values.attempts ?? []).length === 0 ? (
              <AppText variant="body">No attempts recorded.</AppText>
            ) : (
              <AppStack gap="sm">
                {(values.attempts ?? []).slice(0, 8).map((attempt) => {
                  const scored = scoreFullLicenseMockTestAttempt(attempt as unknown as FullLicenseMockTestAttempt);
                  return (
                    <View
                      key={attempt.id}
                      className="rounded-xl border border-border bg-background px-3 py-2 dark:border-borderDark dark:bg-backgroundDark"
                    >
                      <View className="flex-row items-start justify-between gap-3">
                        <AppText className="flex-1" variant="body">
                          {attempt.taskName}
                        </AppText>
                        <AppText variant={scored.fails > 0 ? "error" : "caption"}>
                          {scored.fails}/{scored.total}
                        </AppText>
                      </View>
                      {attempt.variant?.trim() ? (
                        <AppText variant="caption" numberOfLines={2}>
                          {attempt.variant.trim()}
                        </AppText>
                      ) : null}
                    </View>
                  );
                })}
              </AppStack>
            )}
          </AppCard>

          <AppDivider />

          <AppCard className="gap-2">
            <AppText variant="heading">Critical errors</AppText>
            <AppText variant="body">{criticalLines || "None recorded."}</AppText>
            {values.criticalNotes?.trim() ? (
              <AppText variant="body">Notes: {values.criticalNotes.trim()}</AppText>
            ) : null}
          </AppCard>

          <AppCard className="gap-2">
            <AppText variant="heading">Immediate failure errors</AppText>
            <AppText variant="body">{immediateLines || "None recorded."}</AppText>
            {values.immediateNotes?.trim() ? (
              <AppText variant="body">Notes: {values.immediateNotes.trim()}</AppText>
            ) : null}
          </AppCard>

          <AppDivider />

          <AppButton
            variant="danger"
            label={deletingAssessmentId === assessment.id ? "Deleting..." : "Delete assessment"}
            icon={Trash2}
            disabled={
              deletingAssessmentId === assessment.id ||
              downloadingAssessmentId === assessment.id ||
              emailingAssessmentId === assessment.id
            }
            onPress={() => onDeletePress(assessment)}
          />
        </AppStack>
      );
    }

    if (assessment.assessment_type !== "driving_assessment") {
      return (
        <AppStack gap="md">
          <AppCard className="gap-2">
            <AppText variant="heading">Assessment on {formatAssessmentDate(assessment)}</AppText>
            <AppText variant="body">This assessment type doesn't have a detailed view yet.</AppText>
          </AppCard>

          <AppButton
            variant="danger"
            label={deletingAssessmentId === assessment.id ? "Deleting..." : "Delete assessment"}
            icon={Trash2}
            disabled={deletingAssessmentId === assessment.id}
            onPress={() => onDeletePress(assessment)}
          />
        </AppStack>
      );
    }

    const parsed = drivingAssessmentStoredDataSchema.safeParse(assessment.form_data);
    if (!parsed.success) {
      return (
        <AppCard className="gap-2">
          <AppText variant="heading">Couldn't read assessment</AppText>
          <AppText variant="body">
            This assessment is missing required data, so it can't be displayed.
          </AppText>
        </AppCard>
      );
    }

    const values = parsed.data;
    const score = calculateDrivingAssessmentScore(values.scores);
    const totalPercent = assessment.total_score ?? score.percentAnswered;
    const feedbackSummary =
      values.feedbackSummary?.trim() ||
      (totalPercent == null ? "" : generateDrivingAssessmentFeedbackSummary(totalPercent));

    return (
      <AppStack gap="md">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <AppText variant="heading">Assessment on {formatAssessmentDate(assessment)}</AppText>
            <AppText className="mt-1" variant="caption">
              Instructor: {values.instructor || "\u2014"}
            </AppText>
          </View>

          <ScoreChip score={totalPercent} />
        </View>

        <AppButton
          width="auto"
          label={downloadingAssessmentId === assessment.id ? "Saving PDF..." : "Download PDF"}
          icon={Download}
          disabled={
            downloadingAssessmentId === assessment.id ||
            emailingAssessmentId === assessment.id ||
            deletingAssessmentId === assessment.id
          }
          onPress={() => void onDownloadPdfPress(assessment)}
        />

        <AppButton
          width="auto"
          variant="secondary"
          label={emailingAssessmentId === assessment.id ? "Sending..." : "Email student"}
          icon={Mail}
          disabled={
            downloadingAssessmentId === assessment.id ||
            emailingAssessmentId === assessment.id ||
            deletingAssessmentId === assessment.id
          }
          onPress={() => onEmailStudentPress(assessment)}
        />

        <AppDivider />

        <View className="flex-row flex-wrap gap-4">
          <View className="min-w-56 flex-1 gap-2">
            <AppText variant="label">Feedback summary</AppText>
            <AppText variant="body">{feedbackSummary || "\u2014"}</AppText>
          </View>

          <View className="min-w-56 flex-1 gap-2">
            <AppText variant="label">Strengths</AppText>
            <AppText variant="body">{values.strengths?.trim() ? values.strengths.trim() : "\u2014"}</AppText>
          </View>

          <View className="min-w-56 flex-1 gap-2">
            <AppText variant="label">Improvements</AppText>
            <AppText variant="body">
              {values.improvements?.trim() ? values.improvements.trim() : "\u2014"}
            </AppText>
          </View>

          <View className="min-w-56 flex-1 gap-2">
            <AppText variant="label">Recommendation</AppText>
            <AppText variant="body">
              {values.recommendation?.trim() ? values.recommendation.trim() : "\u2014"}
            </AppText>
          </View>

          <View className="min-w-56 flex-1 gap-2">
            <AppText variant="label">Next steps</AppText>
            <AppText variant="body">{values.nextSteps?.trim() ? values.nextSteps.trim() : "\u2014"}</AppText>
          </View>
        </View>

        <AppDivider />

        <AppText variant="heading">Scores by criteria</AppText>

        {(Object.keys(drivingAssessmentCriteria) as DrivingAssessmentCategoryKey[]).map((category) => {
          const criteria = drivingAssessmentCriteria[category];
          const categoryScores = values.scores?.[category];

          return (
            <AppCard key={category} className="gap-3">
              <AppText variant="heading">{formatCategoryTitle(category)}</AppText>

              {criteria.map((label, index) => {
                const raw =
                  (Array.isArray(categoryScores)
                    ? categoryScores[index]
                    : (categoryScores as Record<string, string> | undefined)?.[String(index)]) ?? "";
                const scoreText = raw?.trim() ? raw.trim() : "\u2014";

                return (
                  <View key={`${category}-${index}`} className="flex-row items-start justify-between gap-3">
                    <AppText className="flex-1" variant="body">
                      {label}
                    </AppText>
                    <View className="min-w-9 items-center rounded-lg border border-border bg-background px-2 py-1 dark:border-borderDark dark:bg-backgroundDark">
                      <AppText variant="caption">{scoreText}</AppText>
                    </View>
                  </View>
                );
              })}
            </AppCard>
          );
        })}

        <AppDivider />

        <AppButton
          variant="danger"
          label={deletingAssessmentId === assessment.id ? "Deleting..." : "Delete assessment"}
          icon={Trash2}
          disabled={
            deletingAssessmentId === assessment.id ||
            downloadingAssessmentId === assessment.id ||
            emailingAssessmentId === assessment.id
          }
          onPress={() => onDeletePress(assessment)}
        />
      </AppStack>
    );
  }

  const content = twoPane ? (
    <View className="flex-1 flex-row gap-4">
      <ScrollView
        className="w-80"
        contentContainerClassName="gap-3 pb-6"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {listContent}
      </ScrollView>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-4 pb-6"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
      >
        {renderDetail(selectedAssessment)}
      </ScrollView>
    </View>
  ) : (
    <AppStack gap={isCompact ? "md" : "lg"}>
      {listContent}
      {renderDetail(selectedAssessment)}
    </AppStack>
  );

  return (
    <Screen scroll={!twoPane} className={cn(twoPane && "max-w-6xl")}>
      <AppStack gap={isCompact ? "md" : "lg"} className={cn(twoPane && "flex-1")}>
        {header}
        {tabs}
        {studentQuery.isError ? (
          <AppCard className="gap-2">
            <AppText variant="heading">Couldn't load student</AppText>
            <AppText variant="body">{toErrorMessage(studentQuery.error)}</AppText>
          </AppCard>
        ) : null}
        {content}
      </AppStack>
    </Screen>
  );
}
