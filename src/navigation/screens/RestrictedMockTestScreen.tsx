import AsyncStorage from "@react-native-async-storage/async-storage";
import { zodResolver } from "@hookform/resolvers/zod";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import dayjs from "dayjs";
import { Save } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
  type GestureResponderEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Controller, useForm } from "react-hook-form";

import { AppButton } from "../../components/AppButton";
import { AppBottomSheetModal } from "../../components/AppBottomSheetModal";
import { AppCard } from "../../components/AppCard";
import { AppCollapsibleCard } from "../../components/AppCollapsibleCard";
import { AppDateInput } from "../../components/AppDateInput";
import { AppInput } from "../../components/AppInput";
import { AppStack } from "../../components/AppStack";
import { AppText } from "../../components/AppText";
import { AppTimeInput } from "../../components/AppTimeInput";
import { SuggestionsPickerModal } from "../../components/SuggestionsPickerModal";
import { Screen } from "../../components/Screen";
import { SubmitAssessmentConfirmModal } from "../../components/SubmitAssessmentConfirmModal";
import { useCurrentUser } from "../../features/auth/current-user";
import { ensureAndroidDownloadsDirectoryUri } from "../../features/assessments/android-downloads";
import { useCreateAssessmentMutation } from "../../features/assessments/queries";
import {
  restrictedMockTestGeneralFeedbackSuggestions,
  restrictedMockTestImprovementNeededSuggestions,
  restrictedMockTestStages,
  restrictedMockTestTaskCriticalErrorSuggestions,
  restrictedMockTestTaskImmediateFailureErrorSuggestions,
  restrictedMockTestTaskItems,
  type RestrictedMockTestStageId,
  type RestrictedMockTestTaskId,
  type RestrictedMockTestTaskItemId,
} from "../../features/assessments/restricted-mock-test/constants";
import { exportRestrictedMockTestPdf } from "../../features/assessments/restricted-mock-test/pdf";
import {
  calculateRestrictedMockTestSummary,
  type RestrictedMockTestStagesState,
  type RestrictedMockTestTaskState,
} from "../../features/assessments/restricted-mock-test/scoring";
import {
  restrictedMockTestFormSchema,
  restrictedMockTestStoredDataSchema,
  type RestrictedMockTestFormValues,
  type RestrictedMockTestStoredData,
} from "../../features/assessments/restricted-mock-test/schema";
import { notifyPdfSaved } from "../../features/notifications/download-notifications";
import { useOrganizationQuery, useOrganizationSettingsQuery } from "../../features/organization/queries";
import { useStudentsQuery } from "../../features/students/queries";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";
import { parseDateInputToISODate } from "../../utils/dates";
import { toErrorMessage } from "../../utils/errors";
import { getProfileFullName } from "../../utils/profileName";
import { openPdfUri } from "../../utils/open-pdf";
import { AssessmentStudentDropdown } from "../components/AssessmentStudentDropdown";
import { useNavigationLayout } from "../useNavigationLayout";
import { useAssessmentLeaveGuard } from "../useAssessmentLeaveGuard";

import type { AssessmentsStackParamList } from "../AssessmentsStackNavigator";
import type { MainDrawerParamList } from "../MainDrawerNavigator";

type Props = NativeStackScreenProps<AssessmentsStackParamList, "RestrictedMockTest">;

type Stage = "details" | "confirm" | "test";
type FaultValue = "" | "fault";
type ActiveTask = { stageId: RestrictedMockTestStageId; taskId: RestrictedMockTestTaskId };
type ExclusiveSection = RestrictedMockTestStageId | null;

const DRAFT_VERSION = 1;

function taskModalDraftKey(stageId: RestrictedMockTestStageId, taskId: RestrictedMockTestTaskId) {
  return `${stageId}:${taskId}`;
}

function draftKey(userId: string, studentId: string) {
  return `drivingschool.assessments.second_assessment.draft.v${DRAFT_VERSION}:${userId}:${studentId}`;
}

function createEmptyItems() {
  return restrictedMockTestTaskItems.reduce<Record<RestrictedMockTestTaskItemId, FaultValue>>(
    (acc, item) => {
      acc[item.id] = "";
      return acc;
    },
    {} as Record<RestrictedMockTestTaskItemId, FaultValue>,
  );
}

function createEmptyFaultCounts() {
  return restrictedMockTestTaskItems.reduce<Record<RestrictedMockTestTaskItemId, number>>(
    (acc, item) => {
      acc[item.id] = 0;
      return acc;
    },
    {} as Record<RestrictedMockTestTaskItemId, number>,
  );
}

function createEmptyStagesState(): RestrictedMockTestStagesState {
  const state: RestrictedMockTestStagesState = { stage1: {}, stage2: {} };
  restrictedMockTestStages.forEach((stage) => {
    const tasks: Record<string, RestrictedMockTestTaskState> = {};
      stage.tasks.forEach((task) => {
        tasks[task.id] = {
          items: createEmptyFaultCounts(),
          location: "",
          criticalErrors: "",
          immediateFailureErrors: "",
          repetitionErrors: [],
          notes: "",
          repetitions: 0,
        };
      });
    state[stage.id] = tasks;
  });
  return state;
}

function updateTaskState(
  prev: RestrictedMockTestStagesState,
  stageId: RestrictedMockTestStageId,
  taskId: RestrictedMockTestTaskId,
  updater: (task: RestrictedMockTestTaskState) => RestrictedMockTestTaskState,
): RestrictedMockTestStagesState {
  const stage = prev[stageId];
  const task: RestrictedMockTestTaskState = stage[taskId] || {
    items: createEmptyFaultCounts(),
    location: "",
    criticalErrors: "",
    immediateFailureErrors: "",
    repetitionErrors: [],
    notes: "",
    repetitions: 0,
  };
  const updatedTask = updater(task);

  return {
    ...prev,
    [stageId]: {
      ...stage,
      [taskId]: updatedTask,
    },
  };
}

function taskFaultCount(task: RestrictedMockTestTaskState) {
  let count = 0;
  restrictedMockTestTaskItems.forEach((item) => {
    count += task.items[item.id] ?? 0;
  });
  return count;
}

function countSelectedLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean).length;
}

export function RestrictedMockTestScreen({ navigation, route }: Props) {
  const { profile, userId } = useCurrentUser();
  const { isCompact } = useNavigationLayout();
  const organizationQuery = useOrganizationQuery(profile.organization_id);
  const organizationSettingsQuery = useOrganizationSettingsQuery(profile.organization_id);
  const studentsQuery = useStudentsQuery({ archived: false });
  const createAssessment = useCreateAssessmentMutation();

  const [stage, setStage] = useState<Stage>("details");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [startTestModalVisible, setStartTestModalVisible] = useState(false);
  const [submitConfirmVisible, setSubmitConfirmVisible] = useState(false);
  const [pendingSubmitValues, setPendingSubmitValues] = useState<RestrictedMockTestFormValues | null>(null);

  const scrollRef = useRef<ScrollView | null>(null);
  const scrollOffsetYRef = useRef(0);
  const stage1SectionRef = useRef<View | null>(null);
  const stage2SectionRef = useRef<View | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const { width, height } = useWindowDimensions();
  const minDimension = Math.min(width, height);
  const keyboardAwareEnabled = minDimension >= 600 && height > width;

  const [stage2Enabled, setStage2Enabled] = useState(false);
  const [stagesState, setStagesState] = useState<RestrictedMockTestStagesState>(() =>
    createEmptyStagesState(),
  );
  const [expandedStages, setExpandedStages] = useState<Record<RestrictedMockTestStageId, boolean>>({
    stage1: false,
    stage2: false,
  });
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [activeTask, setActiveTask] = useState<ActiveTask | null>(null);
  const [openTaskSuggestions, setOpenTaskSuggestions] = useState<
    "criticalErrors" | "immediateFailureErrors" | null
  >(null);
  const [taskModalDrafts, setTaskModalDrafts] = useState<
    Record<string, Record<RestrictedMockTestTaskItemId, FaultValue>>
  >({});
  const [taskModalItems, setTaskModalItems] = useState<
    Record<RestrictedMockTestTaskItemId, FaultValue>
  >(() => createEmptyItems());
  const [openFeedbackSuggestions, setOpenFeedbackSuggestions] = useState<
    "generalFeedback" | "improvementNeeded" | null
  >(null);
  const [draftResolvedStudentId, setDraftResolvedStudentId] = useState<string | null>(null);
  const { leaveWithoutPrompt } = useAssessmentLeaveGuard({
    navigation,
    enabled: stage === "test",
  });
  const drawerNavigation =
    navigation.getParent<DrawerNavigationProp<MainDrawerParamList>>();
  const returnToStudentId = route.params?.returnToStudentId ?? null;

  const organizationName = organizationQuery.data?.name ?? "Driving School";
  const organizationLogoUrl = organizationSettingsQuery.data?.logo_url ?? null;

  function getOpenSection(): ExclusiveSection {
    if (expandedStages.stage1) return "stage1";
    if (expandedStages.stage2) return "stage2";
    return null;
  }

  function setOpenSection(section: ExclusiveSection) {
    setExpandedStages({ stage1: section === "stage1", stage2: section === "stage2" });
  }

  function toggleSection(section: Exclude<ExclusiveSection, null>) {
    setOpenSection(getOpenSection() === section ? null : section);
  }

  type WindowRect = { x: number; y: number; width: number; height: number };

  function measureInWindow(ref: { current: View | null }) {
    return new Promise<WindowRect | null>((resolve) => {
      const node = ref.current;
      if (!node || typeof node.measureInWindow !== "function") {
        resolve(null);
        return;
      }
      node.measureInWindow((x, y, width, height) => resolve({ x, y, width, height }));
    });
  }

  function isPointInRect(x: number, y: number, rect: WindowRect) {
    return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
  }

  async function isPointInsideAnySectionCard(x: number, y: number) {
    const rects = await Promise.all([
      measureInWindow(stage1SectionRef),
      measureInWindow(stage2SectionRef),
    ]);

    return rects.some((rect) => rect != null && isPointInRect(x, y, rect));
  }

  function onRootTouchStart(event: GestureResponderEvent) {
    if (stage !== "test") return;
    if (taskModalVisible) return;
    if (submitConfirmVisible) return;
    if (getOpenSection() == null) return;

    touchStartRef.current = {
      x: event.nativeEvent.pageX,
      y: event.nativeEvent.pageY,
    };
  }

  function onRootTouchEnd(event: GestureResponderEvent) {
    if (stage !== "test") return;
    if (taskModalVisible) return;
    if (submitConfirmVisible) return;

    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;

    if (getOpenSection() == null) return;

    const endX = event.nativeEvent.pageX;
    const endY = event.nativeEvent.pageY;
    const movedPx = Math.hypot(endX - start.x, endY - start.y);
    if (movedPx > 10) return;

    void (async () => {
      const isInside = await isPointInsideAnySectionCard(endX, endY);
      if (!isInside) setOpenSection(null);
    })();
  }

  function scrollToTop(animated = false) {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated });
    });
  }

  function navigateAfterSubmit() {
    leaveWithoutPrompt(() => {
      resetMockTestToBlank();
      navigation.reset({ index: 0, routes: [{ name: "AssessmentsMain" }] });
      if (returnToStudentId && drawerNavigation) {
        drawerNavigation.navigate("Students", {
          screen: "StudentDetail",
          params: { studentId: returnToStudentId },
        });
      }
    });
  }

  const form = useForm<RestrictedMockTestFormValues>({
    resolver: zodResolver(restrictedMockTestFormSchema),
    defaultValues: {
      studentId: "",
      date: dayjs().format("DD/MM/YYYY"),
      time: dayjs().format("HH:mm"),
      vehicleInfo: "",
      routeInfo: "",
      preDriveNotes: "",
      generalFeedback: "",
      improvementNeeded: "",
      criticalNotes: "",
      immediateNotes: "",
    },
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      scrollToTop(false);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!keyboardAwareEnabled) return;

    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const subscription = Keyboard.addListener(showEvent, (event) => {
      const focusedInput = TextInput.State.currentlyFocusedInput?.();
      if (!focusedInput || typeof focusedInput.measureInWindow !== "function") {
        return;
      }

      focusedInput.measureInWindow((_x, y, _w, inputHeight) => {
        const keyboardTop = event.endCoordinates.screenY;
        const inputBottom = y + inputHeight;
        const isInBottomHalf = y >= height / 2;
        const overlap = inputBottom - keyboardTop;

        if (!isInBottomHalf || overlap <= 0) return;

        scrollRef.current?.scrollTo({
          y: Math.max(0, scrollOffsetYRef.current + overlap + 24),
          animated: true,
        });
      });
    });

    return () => {
      subscription.remove();
    };
  }, [height, keyboardAwareEnabled]);

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    scrollOffsetYRef.current = event.nativeEvent.contentOffset.y;
  }

  function resetMockTestForStudent(studentId: string) {
    setStage("details");
    setStartTestModalVisible(false);
    setStage2Enabled(false);
    setStagesState(createEmptyStagesState());
    setOpenSection(null);
    setTaskModalVisible(false);
    setActiveTask(null);
    setOpenTaskSuggestions(null);
    setTaskModalDrafts({});
    setOpenFeedbackSuggestions(null);
    setDraftResolvedStudentId(null);
    setSelectedStudentId(studentId);
    scrollToTop(false);

    form.reset({
      studentId,
      date: dayjs().format("DD/MM/YYYY"),
      time: dayjs().format("HH:mm"),
      vehicleInfo: "",
      routeInfo: "",
      preDriveNotes: "",
      generalFeedback: "",
      improvementNeeded: "",
      criticalNotes: "",
      immediateNotes: "",
    });
  }

  function resetMockTestToBlank() {
    setStage("details");
    setStartTestModalVisible(false);
    setStage2Enabled(false);
    setStagesState(createEmptyStagesState());
    setOpenSection(null);
    setTaskModalVisible(false);
    setActiveTask(null);
    setOpenTaskSuggestions(null);
    setTaskModalDrafts({});
    setOpenFeedbackSuggestions(null);
    setDraftResolvedStudentId(null);
    setSelectedStudentId(null);
    scrollToTop(false);

    form.reset({
      studentId: "",
      date: dayjs().format("DD/MM/YYYY"),
      time: dayjs().format("HH:mm"),
      vehicleInfo: "",
      routeInfo: "",
      preDriveNotes: "",
      generalFeedback: "",
      improvementNeeded: "",
      criticalNotes: "",
      immediateNotes: "",
    });
  }

  const selectedStudent = useMemo(() => {
    const students = studentsQuery.data ?? [];
    if (!selectedStudentId) return null;
    return students.find((s) => s.id === selectedStudentId) ?? null;
  }, [selectedStudentId, studentsQuery.data]);

  useEffect(() => {
    if (!selectedStudent) {
      setStartTestModalVisible(false);
    }
  }, [selectedStudent]);

  useEffect(() => {
    const initialStudentId = route.params?.studentId ?? null;
    if (!initialStudentId) return;
    if (selectedStudentId === initialStudentId) return;
    resetMockTestForStudent(initialStudentId);
  }, [form, route.params?.studentId, selectedStudentId]);

  useEffect(() => {
    setStage("details");
    scrollToTop(false);
  }, [selectedStudentId]);

  const summary = useMemo(() => {
    return calculateRestrictedMockTestSummary({ stagesState });
  }, [stagesState]);

  const stage1Repetitions = useMemo(() => {
    return Object.values(stagesState.stage1 ?? {}).reduce((sum, task) => sum + (task.repetitions ?? 0), 0);
  }, [stagesState.stage1]);

  const stage2Repetitions = useMemo(() => {
    return Object.values(stagesState.stage2 ?? {}).reduce((sum, task) => sum + (task.repetitions ?? 0), 0);
  }, [stagesState.stage2]);

  const activeTaskDefinition = useMemo(() => {
    if (!activeTask) return null;
    const stageDef = restrictedMockTestStages.find((s) => s.id === activeTask.stageId) ?? null;
    const taskDef = stageDef?.tasks.find((t) => t.id === activeTask.taskId) ?? null;
    return { stageDef, taskDef };
  }, [activeTask]);

  const activeTaskState = useMemo(() => {
    if (!activeTask) return null;
    return (
      stagesState[activeTask.stageId]?.[activeTask.taskId] ?? {
        items: createEmptyFaultCounts(),
        location: "",
        criticalErrors: "",
        immediateFailureErrors: "",
        repetitionErrors: [],
        notes: "",
        repetitions: 0,
      }
    );
  }, [activeTask, stagesState]);

  const activeTaskDef = activeTaskDefinition?.taskDef ?? null;

  const saving = createAssessment.isPending;

  const draftHydratedRef = useRef<string | null>(null);
  const draftSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function maybeHydrateDraft(studentId: string) {
    if (draftHydratedRef.current === studentId) return;
    draftHydratedRef.current = studentId;
    setDraftResolvedStudentId(null);

    const key = draftKey(userId, studentId);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      setDraftResolvedStudentId(studentId);
      return;
    }

    let parsed: RestrictedMockTestStoredData | null = null;
    try {
      const json = JSON.parse(raw);
      const result = restrictedMockTestStoredDataSchema.safeParse(json);
      parsed = result.success ? result.data : null;
    } catch {
      parsed = null;
    }

    if (!parsed) {
      setDraftResolvedStudentId(studentId);
      return;
    }

    Alert.alert(
      "Resume draft?",
      "A saved draft exists for this student on this device.",
      [
        {
          text: "Start new",
          style: "destructive",
          onPress: () => {
            void AsyncStorage.removeItem(key);
            setStage2Enabled(false);
            setStagesState(createEmptyStagesState());
            setOpenSection("stage1");
            setTaskModalVisible(false);
            setActiveTask(null);
            setOpenTaskSuggestions(null);
            setTaskModalDrafts({});
            setOpenFeedbackSuggestions(null);
            form.reset({
              studentId,
              date: dayjs().format("DD/MM/YYYY"),
              time: dayjs().format("HH:mm"),
              vehicleInfo: "",
              routeInfo: "",
              preDriveNotes: "",
              generalFeedback: "",
              improvementNeeded: "",
              criticalNotes: "",
              immediateNotes: "",
            });
            setDraftResolvedStudentId(studentId);
          },
        },
        {
          text: "Resume",
          onPress: () => {
            form.reset({
              studentId,
              date: parsed?.date ?? form.getValues("date"),
              time: parsed?.time ?? dayjs().format("HH:mm"),
              vehicleInfo: parsed?.vehicleInfo ?? "",
              routeInfo: parsed?.routeInfo ?? "",
              preDriveNotes: parsed?.preDriveNotes ?? "",
              generalFeedback: parsed?.generalFeedback ?? "",
              improvementNeeded: parsed?.improvementNeeded ?? "",
              criticalNotes: parsed?.criticalNotes ?? "",
              immediateNotes: parsed?.immediateNotes ?? "",
            });
            setStage2Enabled(Boolean(parsed?.stage2Enabled));
            setStagesState(parsed?.stagesState ?? createEmptyStagesState());
            setOpenSection("stage1");
            setOpenTaskSuggestions(null);
            setTaskModalDrafts({});
            setOpenFeedbackSuggestions(null);
            setDraftResolvedStudentId(studentId);
          },
        },
      ],
    );
  }

  useEffect(() => {
    if (stage !== "test") return;
    if (!selectedStudent) return;
    void maybeHydrateDraft(selectedStudent.id);
  }, [selectedStudent, stage]);

  useEffect(() => {
    if (stage !== "test") return;
    if (!selectedStudent) return;
    if (draftResolvedStudentId !== selectedStudent.id) return;

    if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    draftSaveTimeoutRef.current = setTimeout(() => {
      const values = form.getValues();
      const candidateName = `${selectedStudent.first_name} ${selectedStudent.last_name}`.trim();

      const data: RestrictedMockTestStoredData = {
        ...values,
        candidateName,
        instructor: getProfileFullName(profile),
        stage2Enabled,
        stagesState,
        critical: {},
        immediate: {},
        savedByUserId: userId,
        summary,
        version: DRAFT_VERSION,
      };

      void AsyncStorage.setItem(draftKey(userId, selectedStudent.id), JSON.stringify(data));
    }, 500);

    return () => {
      if (draftSaveTimeoutRef.current) clearTimeout(draftSaveTimeoutRef.current);
    };
  }, [
    form,
    getProfileFullName(profile),
    selectedStudent,
    stage,
    stage2Enabled,
    stagesState,
    draftResolvedStudentId,
    summary,
    userId,
  ]);

  async function saveAssessment(values: RestrictedMockTestFormValues) {
    const student = selectedStudent;
    if (!student) {
      Alert.alert("Select a student", "Please select a student first.");
      return null;
    }

    const assessmentDateISO = parseDateInputToISODate(values.date);
    if (!assessmentDateISO) {
      Alert.alert("Check the form", "Use DD/MM/YYYY for the assessment date.");
      return null;
    }

    const candidateName = `${student.first_name} ${student.last_name}`.trim();
    const storedData: RestrictedMockTestStoredData = {
      ...values,
      candidateName,
      instructor: getProfileFullName(profile),
      stage2Enabled,
      stagesState,
      critical: {},
      immediate: {},
      savedByUserId: userId,
      summary,
      version: DRAFT_VERSION,
    };

    const validated = restrictedMockTestStoredDataSchema.safeParse(storedData);
    if (!validated.success) {
      Alert.alert("Check the form", "Some required fields are missing.");
      return null;
    }

    try {
      const assessment = await createAssessment.mutateAsync({
        organization_id: profile.organization_id,
        student_id: student.id,
        instructor_id: student.assigned_instructor_id,
        assessment_type: "second_assessment",
        assessment_date: assessmentDateISO,
        total_score: null,
        form_data: validated.data,
      });

      await AsyncStorage.removeItem(draftKey(userId, student.id));

      return { assessment, assessmentDateISO, values: validated.data, student };
    } catch (error) {
      Alert.alert("Couldn't submit assessment", toErrorMessage(error));
      return null;
    }
  }

  async function submitOnly(values: RestrictedMockTestFormValues) {
    const result = await saveAssessment(values);
    if (!result) return;

    Alert.alert("Submitted", "Assessment saved.", [
      { text: "Done", onPress: navigateAfterSubmit },
    ]);
  }

  async function submitAndGeneratePdf(values: RestrictedMockTestFormValues) {
    const result = await saveAssessment(values);
    if (!result) return;

    try {
      const fileName = `Mock Test Restricted ${result.student.first_name} ${result.student.last_name} ${dayjs(result.assessmentDateISO).format("DD-MM-YY")}`;
      const androidDirectoryUri =
        Platform.OS === "android" ? await ensureAndroidDownloadsDirectoryUri() : undefined;
      const saved = await exportRestrictedMockTestPdf({
        assessmentId: result.assessment.id,
        organizationName,
        organizationLogoUrl,
        fileName,
        androidDirectoryUri: androidDirectoryUri ?? undefined,
        values: result.values,
      });

      await notifyPdfSaved({
        fileName,
        uri: saved.uri,
        savedTo: saved.savedTo === "downloads" ? "Downloads" : "App storage",
      });

      Alert.alert(
        "Submitted",
        saved.savedTo === "downloads"
          ? "Assessment saved and PDF saved to Downloads."
          : "Assessment saved and PDF saved inside the app.",
        [
          {
            text: "Open",
            onPress: () => {
              void openPdfUri(saved.uri);
              navigateAfterSubmit();
            },
          },
          { text: "Done", onPress: navigateAfterSubmit },
        ],
      );
    } catch (exportError) {
      Alert.alert(
        "Saved, but couldn't export PDF",
        `Assessment saved, but PDF export failed: ${toErrorMessage(exportError)}`,
        [{ text: "Done", onPress: navigateAfterSubmit }],
      );
    }
  }

  function openTaskModal(stageId: RestrictedMockTestStageId, taskId: RestrictedMockTestTaskId) {
    const key = taskModalDraftKey(stageId, taskId);
    setActiveTask({ stageId, taskId });
    setTaskModalItems(taskModalDrafts[key] ?? createEmptyItems());
    setOpenTaskSuggestions(null);
    setTaskModalVisible(true);
  }

  function requestCloseTaskModal() {
    const task = activeTask;
    if (task) {
      const key = taskModalDraftKey(task.stageId, task.taskId);
      setTaskModalDrafts((prev) => ({ ...prev, [key]: taskModalItems }));
    }
    setOpenTaskSuggestions(null);
    setTaskModalVisible(false);
  }

  function finalizeCloseTaskModal() {
    setActiveTask(null);
    setOpenTaskSuggestions(null);
  }

  function closeSubmitConfirmModal() {
    setSubmitConfirmVisible(false);
    setPendingSubmitValues(null);
  }

  const header = (
    <View>
      <AppText variant="title">Mock Test – Restricted Licence</AppText>
      <AppText className="mt-2" variant="body">
        Restricted Licence – tablet-friendly mock test based on NZ restricted test tasks.
      </AppText>
    </View>
  );

  const studentCard = (
    <AppCard className="gap-4">
      <View className="flex-row items-start justify-between gap-3">
        <AppText variant="heading">Student</AppText>
        {selectedStudent ? (
          <AppText variant="heading" className="text-right">
            {selectedStudent.first_name} {selectedStudent.last_name}
          </AppText>
        ) : null}
      </View>

      {studentsQuery.isPending ? (
        <View className={cn("items-center justify-center py-4", theme.text.base)}>
          <ActivityIndicator />
          <AppText className="mt-3 text-center" variant="body">
            Loading students...
          </AppText>
        </View>
      ) : studentsQuery.isError ? (
        <AppStack gap="sm">
          <AppText variant="body">{toErrorMessage(studentsQuery.error)}</AppText>
          <AppButton
            width="auto"
            label="Retry"
            variant="secondary"
            onPress={() => studentsQuery.refetch()}
          />
        </AppStack>
      ) : (
        <>
          {form.formState.errors.studentId?.message ? (
            <AppText variant="error">{form.formState.errors.studentId.message}</AppText>
          ) : null}

          {stage === "details" ? (
            <AssessmentStudentDropdown
              students={studentsQuery.data ?? []}
              selectedStudentId={selectedStudentId}
              currentUserId={profile.id}
              selectedStudentNameClassName="!text-[17px]"
              onSelectStudent={(student) => {
                resetMockTestForStudent(student.id);
              }}
            />
          ) : null}
        </>
      )}
    </AppCard>
  );

  const summaryCard =
    stage === "test" ? (
      <AppCard className="gap-3 border-slate-900 dark:border-borderDark">
        {selectedStudent ? (
          <AppText className={cn(!isCompact && "!text-[28px]")} variant="heading">
            {selectedStudent.first_name} {selectedStudent.last_name}
          </AppText>
        ) : null}
        <AppText className={cn(selectedStudent && "mt-2")} variant="heading">
          Session overview
        </AppText>
        <AppText variant="caption">
          Stage 2 is optional: enable it only after Stage 1 is safe enough to continue.
        </AppText>
        <View className={cn("flex-row items-start gap-4", isCompact && "flex-col")}>
          <View className="flex-1 flex-row flex-wrap gap-2">
            <View className="rounded-xl border border-border bg-background px-3 py-2 !border-blue-600 dark:border-borderDark dark:bg-backgroundDark dark:!border-blue-400">
              <AppText className="!text-foreground dark:!text-foregroundDark" variant="caption">
                Stage 1{" "}
                <AppText className="!text-blue-600 dark:!text-blue-400" variant="caption">
                  Reps: {stage1Repetitions}
                </AppText>{" "}
                <AppText className="!text-red-600 dark:!text-red-400" variant="caption">
                  Faults: {summary.stage1Faults}
                </AppText>
              </AppText>
            </View>
            <View className="rounded-xl border border-border bg-background px-3 py-2 !border-blue-600 dark:border-borderDark dark:bg-backgroundDark dark:!border-blue-400">
              <AppText className="!text-foreground dark:!text-foregroundDark" variant="caption">
                Stage 2{" "}
                <AppText className="!text-blue-600 dark:!text-blue-400" variant="caption">
                  Reps: {stage2Repetitions}
                </AppText>{" "}
                <AppText className="!text-red-600 dark:!text-red-400" variant="caption">
                  Faults: {summary.stage2Faults}
                </AppText>
              </AppText>
            </View>
          </View>

          <View className="flex-row flex-wrap justify-end gap-2">
            <View
              className={cn(
                "rounded-xl border border-border bg-background px-3 py-2 dark:border-borderDark dark:bg-backgroundDark",
                summary.criticalTotal > 0 && "!border-orange-400 dark:!border-orange-300",
              )}
            >
              <AppText variant="caption">Critical: {summary.criticalTotal}</AppText>
            </View>
            <View
              className={cn(
                "rounded-xl border border-border bg-background px-3 py-2 dark:border-borderDark dark:bg-backgroundDark",
                summary.immediateTotal > 0 && "!border-red-600 dark:!border-red-500",
              )}
            >
              <AppText variant="caption">Immediate fail: {summary.immediateTotal}</AppText>
            </View>
          </View>
        </View>
      </AppCard>
    ) : null;

  const preDriveCard =
    stage === "details" ? (
      <AppCard className="gap-4">
        <AppText variant="heading">Pre-drive checks</AppText>
        <AppText variant="caption">
          Licence, WoF/CoF, L plates, registration, RUC (diesel), fuel, tyres, lights, horn, wipers,
          seatbelts, mirrors, handbrake, demisters.
        </AppText>

        <View className={cn("flex-row gap-4", isCompact && "flex-col")}>
          <View className={cn(!isCompact && "flex-1")}>
            <Controller
              control={form.control}
              name="date"
              render={({ field, fieldState }) => (
                <AppDateInput
                  label="Date of mock test"
                  value={field.value}
                  onChangeText={field.onChange}
                  error={fieldState.error?.message}
                />
              )}
            />
          </View>

          <View className={cn(!isCompact && "flex-1")}>
            <Controller
              control={form.control}
              name="time"
              render={({ field }) => (
                <AppTimeInput
                  label="Time"
                  value={field.value ?? ""}
                  onChangeText={(next) => field.onChange(next)}
                />
              )}
            />
          </View>
        </View>

        <View className={cn("flex-row gap-4", isCompact && "flex-col")}>
          <View className={cn(!isCompact && "flex-1")}>
            <Controller
              control={form.control}
              name="vehicleInfo"
              render={({ field }) => (
                <AppInput
                  label="Vehicle (plate / model)"
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                />
              )}
            />
          </View>

          <View className={cn(!isCompact && "flex-1")}>
            <Controller
              control={form.control}
              name="routeInfo"
              render={({ field }) => (
                <AppInput label="Route / area" value={field.value ?? ""} onChangeText={field.onChange} />
              )}
            />
          </View>
        </View>

        <Controller
          control={form.control}
          name="preDriveNotes"
          render={({ field }) => (
            <AppInput
              label="Notes (pre-drive issues / coaching)"
              value={field.value ?? ""}
              onChangeText={field.onChange}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              inputClassName="h-28 py-3"
            />
          )}
        />
      </AppCard>
    ) : null;

  function renderStageTasks(stageId: RestrictedMockTestStageId) {
    const stageDef = restrictedMockTestStages.find((s) => s.id === stageId);
    if (!stageDef) return null;

    const stageKey = stageDef.id;
    const expanded = expandedStages[stageKey];
    const sectionRef = stageKey === "stage1" ? stage1SectionRef : stage2SectionRef;
    const stageFaults = stageKey === "stage1" ? summary.stage1Faults : summary.stage2Faults;
    const stageRepetitions = Object.values(stagesState[stageKey] ?? {}).reduce((sum, task) => {
      return sum + (task.repetitions ?? 0);
    }, 0);
    const stageLocked = stageKey === "stage2" && !stage2Enabled;
    const rightText = stageLocked ? "Locked" : undefined;
    const stageHasValue = stageRepetitions > 0 || stageFaults > 0;
    const stageBorderClassName = expanded
      ? "!border-2 !border-blue-600 dark:!border-blue-400"
      : stageHasValue
        ? "!border-slate-400 dark:!border-slate-600"
        : undefined;

    return (
      <View ref={sectionRef} collapsable={false}>
        <AppCollapsibleCard
          title={stageDef.name}
          subtitleNode={
            stageLocked ? undefined : (
              <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
                <AppText className="text-xl !text-blue-600 dark:!text-blue-400" variant="body">
                  Total Repetitions: {stageRepetitions}
                </AppText>
                <AppText className="text-xl !text-red-600 dark:!text-red-400" variant="body">
                  Total Faults: {stageFaults}
                </AppText>
              </View>
            )
          }
          showLabelClassName="!text-blue-600 dark:!text-blue-400"
          hideLabelClassName="!text-red-600 dark:!text-red-400"
          rightText={rightText}
          rightTextClassName={stageLocked ? "!text-green-700 dark:!text-green-300" : undefined}
          expanded={expanded}
          className={stageBorderClassName}
          onToggle={() => toggleSection(stageKey)}
        >
          <AppStack gap="md">
            <AppText variant="caption">{stageDef.note}</AppText>

            {stageKey === "stage2" && !stage2Enabled ? (
              <AppStack gap="sm">
                <AppText variant="body">
                  Stage 2 is locked. Enable it only after Stage 1 performance is safe.
                </AppText>
                <AppButton
                  width="auto"
                  label="Enable Stage 2"
                  onPress={() => {
                    setStage2Enabled(true);
                    setOpenSection("stage2");
                  }}
                />
              </AppStack>
            ) : (
              <AppStack gap="md">
                {stageDef.tasks.map((taskDef) => {
                   const taskState = stagesState[stageKey]?.[taskDef.id] ?? {
                     items: createEmptyFaultCounts(),
                     location: "",
                     criticalErrors: "",
                     immediateFailureErrors: "",
                     repetitionErrors: [],
                     notes: "",
                     repetitions: 0,
                   };
                  const faults = taskFaultCount(taskState);
                  const repetitions = taskState.repetitions ?? 0;

                  return (
                    <Pressable
                      key={taskDef.id}
                      accessibilityRole="button"
                      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                      className={cn(
                        theme.card.base,
                        "gap-2",
                        repetitions > 0 && "!border-orange-500 dark:!border-orange-400",
                      )}
                      onPress={() => openTaskModal(stageKey, taskDef.id)}
                    >
                      <View className="gap-2">
                        <View className="flex-row items-start justify-between gap-3">
                          <AppText className="flex-1" variant="heading">
                            {taskDef.name}
                          </AppText>
                          <AppText
                            className="shrink-0 text-right"
                            variant="heading"
                            numberOfLines={1}
                          >
                            {taskDef.targetReps} reps
                          </AppText>
                        </View>
                        {repetitions > 0 ? (
                          <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
                            <AppText className="text-xl !text-blue-600 dark:!text-blue-400" variant="body">
                              Repetitions: {repetitions}
                            </AppText>
                            <AppText className="text-xl !text-red-600 dark:!text-red-400" variant="body">
                              Faults: {faults}
                            </AppText>
                          </View>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </AppStack>
            )}
          </AppStack>
        </AppCollapsibleCard>
      </View>
    );
  }

  const feedbackCards =
    stage === "test" ? (
      <AppStack gap={isCompact ? "md" : "lg"}>
        <Controller
          control={form.control}
          name="generalFeedback"
          render={({ field }) => {
            const value = field.value ?? "";
            const selectedCount = countSelectedLines(value);
            return (
              <AppCard className="gap-4 border-slate-900 dark:border-borderDark">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <AppText variant="heading">General feedback</AppText>
                    <AppText className="mt-1" variant="caption">
                      Select from suggestions or add your own.
                    </AppText>
                  </View>
                  <AppText className="text-right" variant="caption">
                    {selectedCount > 0 ? `${selectedCount} selected` : "—"}
                  </AppText>
                </View>

                <AppInput
                  label="General feedback"
                  value={value}
                  onChangeText={field.onChange}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoGrow
                  autoGrowMinHeight={128}
                  inputClassName="py-3"
                />

                <AppButton
                  width="auto"
                  variant="ghost"
                  label={
                    openFeedbackSuggestions === "generalFeedback"
                      ? "Hide suggestions"
                      : "Show suggestions"
                  }
                  onPress={() =>
                    setOpenFeedbackSuggestions((current) =>
                      current === "generalFeedback" ? null : "generalFeedback",
                    )
                  }
                />

                <SuggestionsPickerModal
                  visible={openFeedbackSuggestions === "generalFeedback"}
                  title="General feedback suggestions"
                  subtitle="Tap suggestions to add/remove them. Tap the handle or backdrop to dismiss."
                  suggestions={restrictedMockTestGeneralFeedbackSuggestions}
                  value={value}
                  onChangeValue={field.onChange}
                  onClose={() => setOpenFeedbackSuggestions(null)}
                />
              </AppCard>
            );
          }}
        />

        <Controller
          control={form.control}
          name="improvementNeeded"
          render={({ field }) => {
            const value = field.value ?? "";
            const selectedCount = countSelectedLines(value);
            return (
              <AppCard className="gap-4 border-slate-900 dark:border-borderDark">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <AppText variant="heading">Improvement(s) needed</AppText>
                      <AppText className="mt-1" variant="caption">
                        Select from suggestions or add your own.
                      </AppText>
                    </View>
                  <AppText className="text-right" variant="caption">
                    {selectedCount > 0 ? `${selectedCount} selected` : "—"}
                  </AppText>
                </View>

                <AppInput
                  label="Improvement(s) needed"
                  value={value}
                  onChangeText={field.onChange}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoGrow
                  autoGrowMinHeight={128}
                  inputClassName="py-3"
                />

                <AppButton
                  width="auto"
                  variant="ghost"
                  label={
                    openFeedbackSuggestions === "improvementNeeded"
                      ? "Hide suggestions"
                      : "Show suggestions"
                  }
                  onPress={() =>
                    setOpenFeedbackSuggestions((current) =>
                      current === "improvementNeeded" ? null : "improvementNeeded",
                    )
                  }
                />

                <SuggestionsPickerModal
                  visible={openFeedbackSuggestions === "improvementNeeded"}
                  title="Improvement(s) needed suggestions"
                  subtitle="Tap suggestions to add/remove them. Tap the handle or backdrop to dismiss."
                  suggestions={restrictedMockTestImprovementNeededSuggestions}
                  value={value}
                  onChangeValue={field.onChange}
                  onClose={() => setOpenFeedbackSuggestions(null)}
                />
              </AppCard>
            );
          }}
        />
      </AppStack>
    ) : null;

  const stageActions =
    stage === "details" ? (
      <AppStack gap="sm">
        <AppButton
          label="Review and start"
          disabled={!selectedStudent}
          onPress={() => {
            if (!selectedStudent) {
              Alert.alert("Select a student", "Please select a student first.");
              return;
            }
            setStartTestModalVisible(true);
          }}
        />
        <AppButton label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </AppStack>
    ) : stage === "confirm" ? (
      <AppCard className="gap-4">
        <AppText variant="heading">Confirm details</AppText>
        <AppText variant="body">
          Candidate: {selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : "—"}
        </AppText>
        <AppText variant="body">Date: {form.getValues("date") || "—"}</AppText>
        <AppText variant="body">Time: {form.getValues("time") || "—"}</AppText>
        <AppText variant="body">Vehicle: {form.getValues("vehicleInfo") || "—"}</AppText>
        <AppText variant="body">Route: {form.getValues("routeInfo") || "—"}</AppText>
        <AppText variant="caption">The test auto-saves on this device while you’re in the test screen.</AppText>
        <AppStack gap="sm">
          <AppButton width="auto" variant="secondary" label="Back" onPress={() => setStage("details")} />
            <AppButton
              width="auto"
              label="Start test"
              onPress={() => {
                setStage("test");
                setOpenSection("stage1");
                scrollToTop(false);
              }}
            />
            <AppButton width="auto" variant="ghost" label="Cancel" onPress={() => navigation.goBack()} />
          </AppStack>
        </AppCard>
    ) : (
      <>
        {createAssessment.isError ? (
          <AppText variant="error">{toErrorMessage(createAssessment.error)}</AppText>
        ) : null}
        <AppButton
          label={saving ? "Submitting..." : "Submit"}
          disabled={saving}
          onPress={form.handleSubmit((values) => {
            setPendingSubmitValues(values);
            setSubmitConfirmVisible(true);
          })}
        />
        <AppButton label="Cancel" variant="ghost" onPress={() => navigation.goBack()} />
      </>
    );

  return (
    <>
      <Screen outerProps={{ onTouchStart: onRootTouchStart, onTouchEnd: onRootTouchEnd }}>
        <AppStack className="flex-1" gap={isCompact ? "md" : "lg"}>
          <AppStack gap={isCompact ? "md" : "lg"}>
            {header}
            {stage !== "test" ? studentCard : null}
            {summaryCard}
          </AppStack>

          <ScrollView
            ref={scrollRef}
            className="flex-1"
            onTouchStart={onRootTouchStart}
            onTouchEnd={onRootTouchEnd}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios" && keyboardAwareEnabled}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName={cn(theme.screen.scrollContent, isCompact ? "pb-6" : "pb-8")}
            onScroll={keyboardAwareEnabled ? onScroll : undefined}
            scrollEventThrottle={keyboardAwareEnabled ? 16 : undefined}
          >
            <AppStack gap={isCompact ? "md" : "lg"}>
              {stage === "details" ? preDriveCard : null}
              {stage === "confirm" ? stageActions : null}

              {stage === "test" ? (
                <>
                  {renderStageTasks("stage1")}
                  {renderStageTasks("stage2")}
                  {feedbackCards}
                  {stageActions}
                </>
              ) : null}

              {stage === "details" ? stageActions : null}
            </AppStack>
          </ScrollView>
        </AppStack>
      </Screen>

      <SubmitAssessmentConfirmModal
        visible={submitConfirmVisible}
        title="Submit mock test?"
        message="Submit will save the assessment. Submit and Generate PDF will also export a PDF."
        disabled={saving}
        onCancel={closeSubmitConfirmModal}
        onSubmit={() => {
          const values = pendingSubmitValues;
          closeSubmitConfirmModal();
          if (!values) return;
          void submitOnly(values);
        }}
        onSubmitAndGeneratePdf={() => {
          const values = pendingSubmitValues;
          closeSubmitConfirmModal();
          if (!values) return;
          void submitAndGeneratePdf(values);
        }}
      />

      <AppBottomSheetModal
        visible={taskModalVisible}
        onRequestClose={requestCloseTaskModal}
        onClosed={finalizeCloseTaskModal}
        collapsedHeightRatio={0.45}
      >
        {activeTask && activeTaskDef && activeTaskState ? (
          <>
            {(() => {
              const currentItems = activeTaskState.items as Record<RestrictedMockTestTaskItemId, number>;
              const recordedFaults = restrictedMockTestTaskItems.reduce((sum, item) => {
                return sum + (currentItems[item.id] ?? 0);
              }, 0);
              const selectedFaults = restrictedMockTestTaskItems.reduce((sum, item) => {
                return taskModalItems[item.id] === "fault" ? sum + 1 : sum;
              }, 0);
              const previewFaults = recordedFaults + selectedFaults;

              return (
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <AppText className="!text-[22px]" variant="heading">
                      {activeTaskDef.name}
                    </AppText>
                    <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
                      <AppText className="text-xl !text-blue-600 dark:!text-blue-400" variant="body">
                        Repetitions: {activeTaskState.repetitions ?? 0}
                      </AppText>
                      <AppText className="text-xl !text-red-600 dark:!text-red-400" variant="body">
                        Faults: {previewFaults}
                      </AppText>
                    </View>
                  </View>

                  <View className="items-end gap-2">
                    <AppButton
                      width="auto"
                      variant="primary"
                      className="bg-green-600 border-green-600 dark:bg-green-500 dark:border-green-500"
                      label="Record Repetition"
                      icon={Save}
                      onPress={() => {
                        if (openTaskSuggestions) setOpenTaskSuggestions(null);
                        const stageId = activeTask.stageId;
                        const taskId = activeTask.taskId;
                        const taskName = activeTaskDef.name;
                        const nextCount = (activeTaskState.repetitions ?? 0) + 1;
                        Alert.alert(
                          "Record repetition?",
                          `Save repetition #${nextCount} for "${taskName}"?`,
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Record",
                              onPress: () => {
                                Keyboard.dismiss();
                                setStagesState((prev) =>
                                  updateTaskState(prev, stageId, taskId, (task) => {
                                    const nextItems: Record<RestrictedMockTestTaskItemId, number> = {
                                      ...task.items,
                                    };

                                    restrictedMockTestTaskItems.forEach((item) => {
                                      if (taskModalItems[item.id] === "fault") {
                                        nextItems[item.id] = (nextItems[item.id] ?? 0) + 1;
                                      }
                                    });

                                    return {
                                      ...task,
                                      repetitions: (task.repetitions ?? 0) + 1,
                                      items: nextItems,
                                      repetitionErrors: [
                                        ...(task.repetitionErrors ?? []),
                                        {
                                          criticalErrors: task.criticalErrors ?? "",
                                          immediateFailureErrors: task.immediateFailureErrors ?? "",
                                        },
                                      ],
                                      criticalErrors: "",
                                      immediateFailureErrors: "",
                                    };
                                  }),
                                );
                                const cleared = createEmptyItems();
                                setTaskModalItems(cleared);
                                setTaskModalDrafts((drafts) => ({
                                  ...drafts,
                                  [taskModalDraftKey(stageId, taskId)]: cleared,
                                }));
                                setOpenTaskSuggestions(null);
                              },
                            },
                          ],
                        );
                      }}
                    />
                  </View>
                </View>
              );
            })()}

            <ScrollView
              style={{ flexShrink: 1 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <AppStack gap="md" className={cn(isCompact ? "pt-1" : "pt-2")}>
                <AppInput
                  label="Location / reference (street, landmark, direction)"
                  value={activeTaskState.location}
                  onChangeText={(next) => {
                    const stageId = activeTask.stageId;
                    const taskId = activeTask.taskId;
                    setStagesState((prev) =>
                      updateTaskState(prev, stageId, taskId, (task) => ({
                        ...task,
                        location: next,
                      })),
                    );
                  }}
                />

                <AppStack gap="sm">
                  <AppText variant="caption">
                    Tap a button to mark a Fault (red).
                  </AppText>
                  <View className="flex-row flex-wrap gap-2">
                    {restrictedMockTestTaskItems.map((item) => {
                      const current = taskModalItems[item.id] as FaultValue;
                      const isFault = current === "fault";
                      return (
                        <Pressable
                          key={item.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: isFault }}
                          className={cn(
                            "w-[48%] rounded-xl border px-3 py-3",
                            isFault
                              ? "border-danger bg-danger dark:border-dangerDark dark:bg-dangerDark"
                              : "border-border bg-background dark:border-borderDark dark:bg-backgroundDark",
                          )}
                          onPress={() => {
                            const task = activeTask;
                            setTaskModalItems((prev) => {
                              const nextValue: FaultValue = prev[item.id] === "fault" ? "" : "fault";
                              const next = { ...prev, [item.id]: nextValue };
                              if (task) {
                                const key = taskModalDraftKey(task.stageId, task.taskId);
                                setTaskModalDrafts((drafts) => ({ ...drafts, [key]: next }));
                              }
                              return next;
                            });
                          }}
                        >
                          <AppText
                            className={cn("text-center", isFault && "text-primaryForeground")}
                            variant="button"
                          >
                            {item.label}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                </AppStack>

                <AppInput
                  label="Critical error(s)"
                  value={activeTaskState.criticalErrors ?? ""}
                  onChangeText={(next) => {
                    const stageId = activeTask.stageId;
                    const taskId = activeTask.taskId;
                    setStagesState((prev) =>
                      updateTaskState(prev, stageId, taskId, (task) => ({
                        ...task,
                        criticalErrors: next,
                      })),
                    );
                  }}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoGrow
                  autoGrowMinHeight={128}
                  inputClassName="py-3"
                />

                <AppButton
                  width="auto"
                  variant="ghost"
                  label={openTaskSuggestions === "criticalErrors" ? "Hide suggestions" : "Show suggestions"}
                  onPress={() =>
                    setOpenTaskSuggestions((current) => (current === "criticalErrors" ? null : "criticalErrors"))
                  }
                />

                <SuggestionsPickerModal
                  visible={openTaskSuggestions === "criticalErrors"}
                  title="Critical error(s) suggestions"
                  subtitle="Tap suggestions to add/remove them. Tap the handle or backdrop to dismiss."
                  suggestions={restrictedMockTestTaskCriticalErrorSuggestions}
                  value={activeTaskState.criticalErrors ?? ""}
                  onChangeValue={(next) => {
                    const stageId = activeTask.stageId;
                    const taskId = activeTask.taskId;
                    setStagesState((prev) =>
                      updateTaskState(prev, stageId, taskId, (task) => ({ ...task, criticalErrors: next })),
                    );
                  }}
                  onClose={() => setOpenTaskSuggestions(null)}
                />

                <AppInput
                  label="Immediate failure error"
                  value={activeTaskState.immediateFailureErrors ?? ""}
                  onChangeText={(next) => {
                    const stageId = activeTask.stageId;
                    const taskId = activeTask.taskId;
                    setStagesState((prev) =>
                      updateTaskState(prev, stageId, taskId, (task) => ({
                        ...task,
                        immediateFailureErrors: next,
                      })),
                    );
                  }}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoGrow
                  autoGrowMinHeight={128}
                  inputClassName="py-3"
                />

                <AppButton
                  width="auto"
                  variant="ghost"
                  label={
                    openTaskSuggestions === "immediateFailureErrors" ? "Hide suggestions" : "Show suggestions"
                  }
                  onPress={() =>
                    setOpenTaskSuggestions((current) =>
                      current === "immediateFailureErrors" ? null : "immediateFailureErrors",
                    )
                  }
                />

                <SuggestionsPickerModal
                  visible={openTaskSuggestions === "immediateFailureErrors"}
                  title="Immediate failure error suggestions"
                  subtitle="Tap suggestions to add/remove them. Tap the handle or backdrop to dismiss."
                  suggestions={restrictedMockTestTaskImmediateFailureErrorSuggestions}
                  value={activeTaskState.immediateFailureErrors ?? ""}
                  selectedVariant="danger"
                  onChangeValue={(next) => {
                    const stageId = activeTask.stageId;
                    const taskId = activeTask.taskId;
                    setStagesState((prev) =>
                      updateTaskState(prev, stageId, taskId, (task) => ({
                        ...task,
                        immediateFailureErrors: next,
                      })),
                    );
                  }}
                  onClose={() => setOpenTaskSuggestions(null)}
                />

              </AppStack>
            </ScrollView>
          </>
        ) : (
          <AppStack gap="sm">
            <AppText className="!text-[22px]" variant="heading">
              No task selected
            </AppText>
          </AppStack>
        )}
      </AppBottomSheetModal>

      <Modal
        visible={startTestModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStartTestModalVisible(false)}
      >
        <Pressable
          className={cn("flex-1 bg-black/40", isCompact ? "px-4 py-6" : "px-6 py-10")}
          onPress={() => setStartTestModalVisible(false)}
        >
          <Pressable
            className="m-auto w-full max-w-md"
            onPress={(event) => event.stopPropagation()}
          >
            <AppCard className="gap-3">
              <AppText variant="heading">Start test?</AppText>
              <AppText variant="body">
                {selectedStudent
                  ? `You are about to start assessing ${selectedStudent.first_name} ${selectedStudent.last_name}.`
                  : "Select a student first."}
              </AppText>
              <AppStack gap="sm">
                <AppButton
                  width="auto"
                  variant="secondary"
                  label="Cancel"
                  onPress={() => setStartTestModalVisible(false)}
                />
                <AppButton
                  width="auto"
                  label="Start"
                  disabled={!selectedStudent}
                  onPress={() => {
                    setStartTestModalVisible(false);
                    setStage("test");
                    setOpenSection("stage1");
                    scrollToTop(false);
                  }}
                />
              </AppStack>
            </AppCard>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
