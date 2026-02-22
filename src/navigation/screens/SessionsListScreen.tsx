import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, View } from "react-native";
import { Clock3, X } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { useColorScheme } from "nativewind";

import { CenteredLoadingState, EmptyStateCard, ErrorStateCard } from "../../components/AsyncState";
import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { AppDateInput } from "../../components/AppDateInput";
import { AppInput } from "../../components/AppInput";
import { AppStack } from "../../components/AppStack";
import { AppText } from "../../components/AppText";
import { AppTimeInput } from "../../components/AppTimeInput";
import { Screen } from "../../components/Screen";
import { useCurrentUser } from "../../features/auth/current-user";
import { isOwnerOrAdminRole } from "../../features/auth/roles";
import {
  useCreateStudentSessionMutation,
  useRecentStudentSessionsQuery,
  useStudentSessionsQuery,
} from "../../features/sessions/queries";
import { studentSessionFormSchema, type StudentSessionFormValues } from "../../features/sessions/schemas";
import { useStudentsQuery } from "../../features/students/queries";
import { cn } from "../../utils/cn";
import { DISPLAY_DATE_FORMAT, parseDateInputToISODate } from "../../utils/dates";
import { toErrorMessage } from "../../utils/errors";

import { AssessmentStudentDropdown } from "../components/AssessmentStudentDropdown";
import type { SessionsStackParamList } from "../SessionsStackNavigator";
import { useNavigationLayout } from "../useNavigationLayout";

type Props = NativeStackScreenProps<SessionsStackParamList, "SessionsList">;

const taskSuggestions = [
  "Pre-drive checks",
  "Mirror checks",
  "Indicating",
  "Lane positioning",
  "Turning technique",
  "Roundabouts",
  "Speed control",
  "Hazard perception",
  "Parking",
  "Reversing",
] as const;

const taskPalettes = [
  {
    wrapper: "border-emerald-500/30 bg-emerald-500/15 dark:border-emerald-400/30 dark:bg-emerald-400/15",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  {
    wrapper: "border-orange-500/30 bg-orange-500/15 dark:border-orange-400/30 dark:bg-orange-400/15",
    text: "text-orange-700 dark:text-orange-300",
  },
] as const;

function normalizeTaskLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function getTaskPalette(task: string) {
  return taskPalettes[hashString(task) % taskPalettes.length];
}

function toggleTask(list: string[], task: string) {
  if (list.includes(task)) return list.filter((x) => x !== task);
  return [...list, task];
}

function TaskBadge({ task }: { task: string }) {
  const palette = getTaskPalette(task);
  return (
    <View className={cn("rounded-full border px-3 py-1", palette.wrapper)}>
      <AppText className={cn("text-xs font-semibold", palette.text)} variant="caption">
        {task}
      </AppText>
    </View>
  );
}

function TaskChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const palette = getTaskPalette(label);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className={cn(
        "rounded-full border px-3 py-2",
        selected
          ? palette.wrapper
          : "border-border bg-card dark:border-borderDark dark:bg-cardDark",
      )}
    >
      <AppText
        className={cn(
          selected ? palette.text : "text-muted dark:text-mutedDark",
          selected && "font-semibold",
        )}
        variant="caption"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function getStudentFullName(student: { first_name: string; last_name: string } | null) {
  if (!student) return "Unknown student";
  return `${student.first_name} ${student.last_name}`.trim() || "Unknown student";
}

export function SessionsListScreen({ navigation }: Props) {
  const { userId, profile } = useCurrentUser();
  const { colorScheme } = useColorScheme();
  const { isCompact } = useNavigationLayout();

  const recentSessionsQuery = useRecentStudentSessionsQuery({ limit: 5 });
  const studentsQuery = useStudentsQuery({ archived: false });
  const createMutation = useCreateStudentSessionMutation();

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [customTask, setCustomTask] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentError, setStudentError] = useState<string | undefined>(undefined);

  const selectedStudent = useMemo(() => {
    if (!selectedStudentId) return null;
    return studentsQuery.data?.find((student) => student.id === selectedStudentId) ?? null;
  }, [selectedStudentId, studentsQuery.data]);

  const selectedStudentSessionsQuery = useStudentSessionsQuery(
    selectedStudentId ? { studentId: selectedStudentId, limit: 1 } : undefined,
  );
  const lastSession = selectedStudentSessionsQuery.data?.[0] ?? null;

  const form = useForm<StudentSessionFormValues>({
    resolver: zodResolver(studentSessionFormSchema),
    defaultValues: {
      date: dayjs().format(DISPLAY_DATE_FORMAT),
      time: dayjs().format("HH:mm"),
      durationMinutes: "60",
      tasks: [],
      nextFocus: "",
      notes: "",
    },
  });

  function resetCreateForm() {
    form.reset({
      date: dayjs().format(DISPLAY_DATE_FORMAT),
      time: dayjs().format("HH:mm"),
      durationMinutes: "60",
      tasks: [],
      nextFocus: "",
      notes: "",
    });
    setCustomTask("");
    setSuggestionsOpen(true);
    setSelectedStudentId(null);
    setStudentError(undefined);
  }

  function openCreateModal() {
    resetCreateForm();
    setCreateModalVisible(true);
  }

  function closeCreateModal() {
    setCreateModalVisible(false);
  }

  const confirmSave = form.handleSubmit((values) => {
    if (!selectedStudent) {
      setStudentError("Select a student");
      return;
    }

    Alert.alert("Save session?", "Add this session to the student's history?", [
      { text: "Cancel", style: "cancel" },
      { text: "Save", onPress: () => void onCreate(values) },
    ]);
  });

  async function onCreate(values: StudentSessionFormValues) {
    if (!selectedStudent) {
      setStudentError("Select a student");
      return;
    }

    const dateISO = parseDateInputToISODate(values.date);
    if (!dateISO) return;

    const sessionAt = dayjs(`${dateISO}T${values.time}`).toISOString();
    const duration =
      values.durationMinutes.trim() === "" ? null : Math.max(15, Number(values.durationMinutes.trim()));

    const instructorId = isOwnerOrAdminRole(profile.role) ? selectedStudent.assigned_instructor_id : userId;

    try {
      await createMutation.mutateAsync({
        organization_id: profile.organization_id,
        student_id: selectedStudent.id,
        instructor_id: instructorId,
        session_at: sessionAt,
        duration_minutes: duration,
        tasks: values.tasks,
        next_focus: values.nextFocus.trim() ? values.nextFocus.trim() : null,
        notes: values.notes.trim() ? values.notes.trim() : null,
      });

      resetCreateForm();
      closeCreateModal();
    } catch (error) {
      Alert.alert("Couldn't save session", toErrorMessage(error));
    }
  }

  const recentSessions = recentSessionsQuery.data ?? [];

  return (
    <>
      <Screen scroll className="max-w-6xl">
        <AppStack gap={isCompact ? "md" : "lg"}>
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <AppText variant="title">Sessions</AppText>
              <AppText className="mt-2" variant="caption">
                Last 5 sessions
              </AppText>
            </View>

            <AppButton
              width="auto"
              variant="primary"
              label="New Session"
              icon={Clock3}
              onPress={openCreateModal}
            />
          </View>

          {recentSessionsQuery.isPending ? (
            <CenteredLoadingState label="Loading sessions..." />
          ) : recentSessionsQuery.isError ? (
            <ErrorStateCard
              title="Couldn't load sessions"
              message={toErrorMessage(recentSessionsQuery.error)}
              onRetry={() => recentSessionsQuery.refetch()}
              retryPlacement="inside"
            />
          ) : recentSessions.length === 0 ? (
            <EmptyStateCard
              title="No sessions yet"
              message="Create a session to start tracking student progress."
            />
          ) : (
            <AppStack gap="md">
              {recentSessions.map((session) => {
                const sessionDate = dayjs(session.session_at).isValid()
                  ? dayjs(session.session_at).format(DISPLAY_DATE_FORMAT)
                  : "Unknown date";
                const studentName = getStudentFullName(session.students);
                const tasks = session.tasks ?? [];

                return (
                  <Pressable
                    key={session.id}
                    accessibilityRole="button"
                    onPress={() =>
                      navigation.navigate("StudentSessionHistory", {
                        studentId: session.student_id,
                      })
                    }
                    className="active:opacity-90"
                  >
                    <AppCard className="gap-3">
                      <View className="gap-1">
                        <AppText variant="heading">{studentName}</AppText>
                        <AppText variant="caption">Session date: {sessionDate}</AppText>
                      </View>

                      <View className="gap-2">
                        <AppText variant="label">Task covered</AppText>
                        {tasks.length ? (
                          <View className="flex-row flex-wrap gap-2">
                            {tasks.map((task) => (
                              <TaskBadge key={task} task={task} />
                            ))}
                          </View>
                        ) : (
                          <AppText variant="caption">No tasks recorded.</AppText>
                        )}
                      </View>

                      {session.next_focus?.trim() ? (
                        <View className="gap-1">
                          <AppText variant="label">Next focus</AppText>
                          <AppText variant="body">{session.next_focus.trim()}</AppText>
                        </View>
                      ) : null}

                      {session.notes?.trim() ? (
                        <View className="gap-1">
                          <AppText variant="label">Notes</AppText>
                          <AppText variant="body">{session.notes.trim()}</AppText>
                        </View>
                      ) : null}
                    </AppCard>
                  </Pressable>
                );
              })}
            </AppStack>
          )}
        </AppStack>
      </Screen>

      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCreateModal}
      >
        <Pressable
          className={cn("flex-1 bg-black/40", isCompact ? "px-4 py-6" : "px-6 py-10")}
          onPress={closeCreateModal}
        >
          <Pressable className="m-auto w-full max-w-2xl" onPress={(event) => event.stopPropagation()}>
            <AppCard className="gap-4">
              <View className="flex-row items-center justify-between gap-2">
                <AppText variant="heading">Add Session History</AppText>
                <AppButton
                  label=""
                  width="auto"
                  size="icon"
                  variant="ghost"
                  icon={X}
                  accessibilityLabel="Close"
                  onPress={closeCreateModal}
                />
              </View>

              {isOwnerOrAdminRole(profile.role) && selectedStudent ? (
                <AppText variant="caption">
                  Recorded under assigned instructor for this student.
                </AppText>
              ) : null}

              <ScrollView
                keyboardShouldPersistTaps="handled"
                contentContainerClassName="gap-4 pb-1"
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                <AppStack gap="sm">
                  <AppText variant="label">Student</AppText>
                  {studentsQuery.isPending ? (
                    <AppText variant="caption">Loading students...</AppText>
                  ) : studentsQuery.isError ? (
                    <ErrorStateCard
                      title="Couldn't load students"
                      message={toErrorMessage(studentsQuery.error)}
                      onRetry={() => studentsQuery.refetch()}
                      retryPlacement="inside"
                    />
                  ) : (
                    <AssessmentStudentDropdown
                      students={studentsQuery.data ?? []}
                      selectedStudentId={selectedStudentId}
                      currentUserId={userId}
                      onSelectStudent={(student) => {
                        setSelectedStudentId(student.id);
                        setStudentError(undefined);
                      }}
                      error={studentError}
                    />
                  )}
                </AppStack>

                <View className="flex-row flex-wrap gap-4">
                  <View className="min-w-56 flex-1">
                    <Controller
                      control={form.control}
                      name="date"
                      render={({ field, fieldState }) => (
                        <AppDateInput
                          label="Date"
                          value={field.value}
                          onChangeText={field.onChange}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </View>

                  <View className="min-w-56 flex-1">
                    <Controller
                      control={form.control}
                      name="time"
                      render={({ field, fieldState }) => (
                        <AppTimeInput
                          label="Time"
                          value={field.value}
                          onChangeText={field.onChange}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </View>

                  <View className="min-w-56 flex-1">
                    <Controller
                      control={form.control}
                      name="durationMinutes"
                      render={({ field, fieldState }) => (
                        <AppInput
                          label="Duration (min)"
                          keyboardType="numeric"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </View>
                </View>

                <Controller
                  control={form.control}
                  name="tasks"
                  render={({ field, fieldState }) => (
                    <AppStack gap="sm">
                      <View className="flex-row items-end justify-between gap-3">
                        <View className="flex-1">
                          <AppText variant="label">Tasks covered</AppText>
                          <AppText className="mt-1" variant="caption">
                            Select from suggestions or add your own.
                          </AppText>
                        </View>
                        <AppText variant="caption">{field.value.length} selected</AppText>
                      </View>

                      {fieldState.error?.message ? (
                        <AppText variant="error">{fieldState.error.message}</AppText>
                      ) : null}

                      {field.value.length ? (
                        <View className="flex-row flex-wrap gap-2">
                          {field.value.map((task) => (
                            <TaskChip
                              key={task}
                              label={task}
                              selected
                              onPress={() => field.onChange(field.value.filter((x) => x !== task))}
                            />
                          ))}
                        </View>
                      ) : (
                        <AppText variant="caption">No tasks selected yet.</AppText>
                      )}

                      <View className="flex-row items-start justify-between gap-3">
                        <View className="flex-1">
                          <AppText variant="label">Task suggestions</AppText>
                          <AppText className="mt-1" variant="caption">
                            10 quick picks (multiple choice)
                          </AppText>
                        </View>

                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={
                            suggestionsOpen ? "Hide task suggestions" : "Show task suggestions"
                          }
                          className="px-1 py-1"
                          onPress={() => setSuggestionsOpen((value) => !value)}
                        >
                          <AppText
                            variant="label"
                            className={cn(
                              "underline font-semibold",
                              colorScheme === "dark" ? "text-amber-300" : "text-emerald-600",
                            )}
                          >
                            {suggestionsOpen ? "Hide" : "Show"}
                          </AppText>
                        </Pressable>
                      </View>

                      {suggestionsOpen ? (
                        <View className="flex-row flex-wrap gap-2">
                          {taskSuggestions.map((task) => (
                            <TaskChip
                              key={task}
                              label={task}
                              selected={field.value.includes(task)}
                              onPress={() => field.onChange(toggleTask(field.value, task))}
                            />
                          ))}
                        </View>
                      ) : null}

                      <View className="flex-row items-end gap-2">
                        <AppInput
                          label="Add custom task"
                          containerClassName="flex-1"
                          value={customTask}
                          onChangeText={setCustomTask}
                          placeholder="e.g. Three-point turn"
                          autoCapitalize="sentences"
                        />
                        <AppButton
                          width="auto"
                          label="Add"
                          disabled={!customTask.trim()}
                          onPress={() => {
                            const next = normalizeTaskLabel(customTask);
                            if (!next) return;
                            if (field.value.includes(next)) {
                              setCustomTask("");
                              return;
                            }
                            field.onChange([...field.value, next]);
                            setCustomTask("");
                          }}
                        />
                      </View>

                      {lastSession?.tasks?.length ? (
                        <AppButton
                          width="auto"
                          variant="ghost"
                          label="Use last session tasks"
                          onPress={() => field.onChange(lastSession.tasks)}
                        />
                      ) : null}
                    </AppStack>
                  )}
                />

                <View className="flex-row flex-wrap gap-4">
                  <View className="min-w-56 flex-1">
                    <Controller
                      control={form.control}
                      name="nextFocus"
                      render={({ field }) => (
                        <AppInput
                          label="Next focus (optional)"
                          value={field.value}
                          onChangeText={field.onChange}
                          onBlur={field.onBlur}
                          placeholder="What to focus on next lesson"
                        />
                      )}
                    />
                  </View>
                </View>

                <Controller
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <AppInput
                      label="Notes (optional)"
                      multiline
                      numberOfLines={6}
                      textAlignVertical="top"
                      inputClassName="h-28 py-3"
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
              </ScrollView>

              <View className="flex-row gap-2">
                <AppButton
                  width="auto"
                  className="flex-1"
                  variant="secondary"
                  label="Cancel"
                  onPress={closeCreateModal}
                />
                <AppButton
                  width="auto"
                  className="flex-1"
                  label={createMutation.isPending ? "Saving..." : "Save"}
                  disabled={
                    createMutation.isPending ||
                    studentsQuery.isPending ||
                    studentsQuery.isError ||
                    !selectedStudent
                  }
                  onPress={confirmSave}
                />
              </View>
            </AppCard>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
