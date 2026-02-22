import dayjs from "dayjs";
import { zodResolver } from "@hookform/resolvers/zod";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, View } from "react-native";
import { Clock3, Pencil, RefreshCw, Trash2, X } from "lucide-react-native";
import { Controller, useForm } from "react-hook-form";
import { useColorScheme } from "nativewind";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { AppDateInput } from "../../components/AppDateInput";
import { AppDivider } from "../../components/AppDivider";
import { AppInput } from "../../components/AppInput";
import { AppStack } from "../../components/AppStack";
import { AppText } from "../../components/AppText";
import { AppTimeInput } from "../../components/AppTimeInput";
import { Screen } from "../../components/Screen";
import { useCurrentUser } from "../../features/auth/current-user";
import { isOwnerOrAdminRole } from "../../features/auth/roles";
import type { StudentSession } from "../../features/sessions/api";
import {
  useCreateStudentSessionMutation,
  useDeleteStudentSessionMutation,
  useStudentSessionsQuery,
  useUpdateStudentSessionMutation,
} from "../../features/sessions/queries";
import { studentSessionFormSchema, type StudentSessionFormValues } from "../../features/sessions/schemas";
import { useStudentQuery } from "../../features/students/queries";
import { theme } from "../../theme/theme";
import { cn } from "../../utils/cn";
import { DISPLAY_DATE_FORMAT, parseDateInputToISODate } from "../../utils/dates";
import { toErrorMessage } from "../../utils/errors";

import type { StudentsStackParamList } from "../StudentsStackNavigator";
import type { SessionsStackParamList } from "../SessionsStackNavigator";
import { useNavigationLayout } from "../useNavigationLayout";

type Props =
  | NativeStackScreenProps<StudentsStackParamList, "StudentSessionHistory">
  | NativeStackScreenProps<SessionsStackParamList, "StudentSessionHistory">;

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

function getTaskPalette(task: string) {
  return taskPalettes[hashString(task) % taskPalettes.length];
}

function toggleTask(list: string[], task: string) {
  if (list.includes(task)) return list.filter((x) => x !== task);
  return [...list, task];
}

function TaskBadge({ task, rightText }: { task: string; rightText?: string }) {
  const palette = getTaskPalette(task);
  return (
    <View className={cn("rounded-full border px-3 py-1", palette.wrapper)}>
      <AppText className={cn("text-xs font-semibold", palette.text)} variant="caption">
        {task}
        {rightText ? ` - ${rightText}` : ""}
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

export function StudentSessionHistoryScreen({ route }: Props) {
  const { studentId, openNewSession } = route.params;
  const { userId, profile } = useCurrentUser();
  const { colorScheme } = useColorScheme();
  const { isCompact } = useNavigationLayout();

  const trashColor = colorScheme === "dark" ? theme.colors.dangerDark : theme.colors.danger;
  const editColor = colorScheme === "dark" ? "#4ade80" : "#16a34a";

  const studentQuery = useStudentQuery(studentId);
  const sessionsQuery = useStudentSessionsQuery({ studentId });
  const createMutation = useCreateStudentSessionMutation();
  const deleteMutation = useDeleteStudentSessionMutation();
  const updateMutation = useUpdateStudentSessionMutation();

  const [createModalVisible, setCreateModalVisible] = useState(Boolean(openNewSession));
  const [suggestionsOpen, setSuggestionsOpen] = useState(true);
  const [customTask, setCustomTask] = useState("");
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const defaultTime = useMemo(() => dayjs().format("HH:mm"), []);

  const form = useForm<StudentSessionFormValues>({
    resolver: zodResolver(studentSessionFormSchema),
    defaultValues: {
      date: dayjs().format(DISPLAY_DATE_FORMAT),
      time: defaultTime,
      durationMinutes: "60",
      tasks: [],
      nextFocus: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!openNewSession) return;
    openCreateModal();
  }, [openNewSession]);

  const sessions = sessionsQuery.data ?? [];
  const lastSession = sessions[0] ?? null;

  const topTasks = useMemo(() => {
    const counts = new Map<string, number>();
    for (const session of sessions) {
      for (const task of session.tasks ?? []) {
        counts.set(task, (counts.get(task) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([task, count]) => ({ task, count }));
  }, [sessions]);

  const confirmSave = form.handleSubmit((values) => {
    const isEdit = Boolean(editingSessionId);
    Alert.alert(
      isEdit ? "Update session?" : "Save session?",
      isEdit ? "Update this session in the student's history?" : "Add this session to the student's history?",
      [
      { text: "Cancel", style: "cancel" },
      { text: isEdit ? "Update" : "Save", onPress: () => void (isEdit ? onUpdate(values) : onCreate(values)) },
      ],
    );
  });

  async function onCreate(values: StudentSessionFormValues) {
    const student = studentQuery.data ?? null;
    if (!student) return;

    const dateISO = parseDateInputToISODate(values.date);
    if (!dateISO) return;

    const sessionAt = dayjs(`${dateISO}T${values.time}`).toISOString();
    const duration =
      values.durationMinutes.trim() === "" ? null : Math.max(15, Number(values.durationMinutes.trim()));

    const instructorId = isOwnerOrAdminRole(profile.role) ? student.assigned_instructor_id : userId;

    try {
      await createMutation.mutateAsync({
        organization_id: profile.organization_id,
        student_id: student.id,
        instructor_id: instructorId,
        session_at: sessionAt,
        duration_minutes: duration,
        tasks: values.tasks,
        next_focus: values.nextFocus.trim() ? values.nextFocus.trim() : null,
        notes: values.notes.trim() ? values.notes.trim() : null,
      });

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
      closeCreateModal();
    } catch (error) {
      Alert.alert("Couldn't save session", toErrorMessage(error));
    }
  }

  async function onUpdate(values: StudentSessionFormValues) {
    const sessionId = editingSessionId;
    if (!sessionId) return;

    const dateISO = parseDateInputToISODate(values.date);
    if (!dateISO) return;

    const sessionAt = dayjs(`${dateISO}T${values.time}`).toISOString();
    const duration =
      values.durationMinutes.trim() === "" ? null : Math.max(15, Number(values.durationMinutes.trim()));

    try {
      await updateMutation.mutateAsync({
        sessionId,
        input: {
          session_at: sessionAt,
          duration_minutes: duration,
          tasks: values.tasks,
          next_focus: values.nextFocus.trim() ? values.nextFocus.trim() : null,
          notes: values.notes.trim() ? values.notes.trim() : null,
        },
      });

      resetCreateForm();
      closeCreateModal();
    } catch (error) {
      Alert.alert("Couldn't update session", toErrorMessage(error));
    }
  }

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
  }

  function openCreateModal() {
    setEditingSessionId(null);
    resetCreateForm();
    setCreateModalVisible(true);
  }

  function openEditModal(session: StudentSession) {
    const sessionAt = dayjs(session.session_at);
    const date = sessionAt.isValid() ? sessionAt.format(DISPLAY_DATE_FORMAT) : dayjs().format(DISPLAY_DATE_FORMAT);
    const time = sessionAt.isValid() ? sessionAt.format("HH:mm") : dayjs().format("HH:mm");

    form.reset({
      date,
      time,
      durationMinutes: session.duration_minutes ? String(session.duration_minutes) : "",
      tasks: session.tasks ?? [],
      nextFocus: session.next_focus ?? "",
      notes: session.notes ?? "",
    });
    setCustomTask("");
    setSuggestionsOpen(true);
    setEditingSessionId(session.id);
    setCreateModalVisible(true);
  }

  function closeCreateModal() {
    setCreateModalVisible(false);
    setEditingSessionId(null);
  }

  function onDeletePress(sessionId: string) {
    Alert.alert("Delete session?", "This permanently deletes the session.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => void deleteSession(sessionId),
      },
    ]);
  }

  async function deleteSession(sessionId: string) {
    setDeletingSessionId(sessionId);
    try {
      await deleteMutation.mutateAsync(sessionId);
    } catch (error) {
      Alert.alert("Couldn't delete session", toErrorMessage(error));
    } finally {
      setDeletingSessionId(null);
    }
  }

  return (
    <>
      <Screen scroll className={cn("max-w-6xl")}>
        <AppStack gap={isCompact ? "md" : "lg"}>
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <AppText variant="title">Session History</AppText>
            <AppText className="mt-2" variant="caption">
              {studentQuery.data
                ? `${studentQuery.data.first_name} ${studentQuery.data.last_name}`
                : studentQuery.isPending
                  ? "Loading student..."
                  : "Student"}
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

        <AppCard className="gap-3">
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <View className="min-w-56 flex-1 gap-1">
              <AppText variant="label">Total sessions</AppText>
              <AppText variant="heading">{sessions.length}</AppText>
            </View>

            <View className="min-w-56 flex-1 gap-1">
              <AppText variant="label">Last session</AppText>
              <AppText variant="heading">
                {lastSession ? dayjs(lastSession.session_at).format(DISPLAY_DATE_FORMAT) : "-"}
              </AppText>
            </View>

            <View className="min-w-56 flex-1 gap-2">
              <AppText variant="label">Most practiced</AppText>
              {topTasks.length ? (
                <View className="flex-row flex-wrap gap-2">
                  {topTasks.map(({ task, count }) => (
                    <TaskBadge key={task} task={task} rightText={String(count)} />
                  ))}
                </View>
              ) : (
                <AppText variant="caption">-</AppText>
              )}
            </View>
          </View>
        </AppCard>

        <AppDivider />

        {sessionsQuery.isPending ? (
          <View className="items-center justify-center py-8">
            <ActivityIndicator />
            <AppText className="mt-3 text-center" variant="body">
              Loading sessions...
            </AppText>
          </View>
        ) : sessionsQuery.isError ? (
          <AppStack gap="md">
            <AppCard className="gap-2">
              <AppText variant="heading">Couldn't load sessions</AppText>
              <AppText variant="body">{toErrorMessage(sessionsQuery.error)}</AppText>
            </AppCard>
            <AppButton
              label="Retry"
              icon={RefreshCw}
              variant="secondary"
              onPress={() => sessionsQuery.refetch()}
            />
          </AppStack>
        ) : sessions.length === 0 ? (
          <AppCard className="gap-2">
            <AppText variant="heading">No sessions yet</AppText>
            <AppText variant="body">Add your first session to start tracking progress.</AppText>
          </AppCard>
        ) : (
          <AppStack gap="md">
            {sessions.map((session) => {
              const when = dayjs(session.session_at).isValid()
                ? dayjs(session.session_at).format(DISPLAY_DATE_FORMAT)
                : "Unknown date";
              const tasks = session.tasks ?? [];
              const subtitleParts = [
                tasks.length ? `Tasks: ${tasks.length}` : null,
                session.duration_minutes ? `${session.duration_minutes} min` : null,
                session.next_focus?.trim() ? `Next: ${session.next_focus.trim()}` : null,
              ].filter(Boolean);

              return (
                <AppCard key={session.id} className="gap-4">
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <AppText variant="heading">Session on {when}</AppText>
                      <AppText className="mt-1" variant="caption">
                        {subtitleParts.length ? subtitleParts.join(" - ") : "-"}
                      </AppText>
                    </View>
 
                    <View className="flex-row items-center gap-2">
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Edit session"
                        disabled={deletingSessionId === session.id}
                        onPress={() => openEditModal(session)}
                        className={cn(
                          "h-10 w-10 items-center justify-center rounded-full border",
                          "border-green-600/30 bg-green-600/10 dark:border-green-400/30 dark:bg-green-400/10",
                          deletingSessionId === session.id && "opacity-60",
                        )}
                      >
                        <Pencil size={18} color={editColor} />
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Delete session"
                        disabled={deletingSessionId === session.id}
                        onPress={() => onDeletePress(session.id)}
                        className={cn(
                          "h-10 w-10 items-center justify-center rounded-full border",
                          "border-red-500/30 bg-red-500/10 dark:border-red-400/30 dark:bg-red-400/10",
                          deletingSessionId === session.id && "opacity-60",
                        )}
                      >
                        <Trash2 size={18} color={trashColor} />
                      </Pressable>
                    </View>
                  </View>

                  {tasks.length ? (
                    <View className="flex-row flex-wrap gap-2">
                      {tasks.map((task) => (
                        <TaskBadge key={task} task={task} />
                      ))}
                    </View>
                  ) : (
                    <AppText variant="caption">No tasks recorded.</AppText>
                  )}

                  {session.notes?.trim() ? (
                    <AppStack gap="sm">
                      <AppText variant="label">Notes</AppText>
                      <AppText variant="body">{session.notes.trim()}</AppText>
                    </AppStack>
                  ) : null}
                </AppCard>
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
          <Pressable
            className="m-auto w-full max-w-2xl"
            onPress={(event) => event.stopPropagation()}
          >
            <AppCard className="gap-4">
              <View className="flex-row items-center justify-between gap-2">
                <AppText variant="heading">{editingSessionId ? "Edit Session History" : "Add Session History"}</AppText>
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

              {isOwnerOrAdminRole(profile.role) && studentQuery.data ? (
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
                          onPress={() => setSuggestionsOpen((v) => !v)}
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
                  label={
                    createMutation.isPending || updateMutation.isPending
                      ? "Saving..."
                      : editingSessionId
                        ? "Update"
                        : "Save"
                  }
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    studentQuery.isPending ||
                    !studentQuery.data
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
