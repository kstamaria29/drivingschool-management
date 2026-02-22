import dayjs, { type Dayjs } from "dayjs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, useWindowDimensions, View } from "react-native";
import { CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react-native";

import { AppButton } from "../../components/AppButton";
import { AppCard } from "../../components/AppCard";
import { CenteredLoadingState } from "../../components/AsyncState";
import { CalendarMonth } from "../../components/CalendarMonth";
import { AppStack } from "../../components/AppStack";
import { AppText } from "../../components/AppText";
import { Screen } from "../../components/Screen";
import { useMyProfileQuery } from "../../features/auth/queries";
import { useAuthSession } from "../../features/auth/session";
import { useLessonsQuery } from "../../features/lessons/queries";
import { useRemindersByDateRangeQuery } from "../../features/reminders/queries";
import { cn } from "../../utils/cn";
import { DISPLAY_DATE_FORMAT } from "../../utils/dates";
import { toErrorMessage } from "../../utils/errors";

import type { LessonsStackParamList } from "../LessonsStackNavigator";

type Props = NativeStackScreenProps<LessonsStackParamList, "LessonsList">;

function startOfWeekMonday(date: Dayjs) {
  const day = date.day(); // 0 (Sun) - 6 (Sat)
  const offset = (day + 6) % 7; // 0 for Mon ... 6 for Sun
  return date.startOf("day").subtract(offset, "day");
}

function normalizeTimeHHmm(value: string | null | undefined) {
  if (!value) return "09:00";
  const match = value.match(/^([01]\d|2[0-3]):[0-5]\d/);
  return match ? match[0] : "09:00";
}

function getReminderStudentName(reminder: { students?: { first_name: string; last_name: string } | null }) {
  const student = reminder.students ?? null;
  if (!student) return "Unknown student";
  return `${student.first_name} ${student.last_name}`.trim() || "Unknown student";
}

export function LessonsListScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isCompact = Math.min(width, height) < 600;
  const isTabletLandscape = !isCompact && width > height;

  const { session } = useAuthSession();
  const profileQuery = useMyProfileQuery(session?.user.id);

  const [month, setMonth] = useState(() => dayjs().startOf("month"));
  const [selectedDate, setSelectedDate] = useState(() => dayjs().startOf("day"));

  const { fromISO, toISO, fromISODate, toISODate } = useMemo(() => {
    const from = startOfWeekMonday(month.startOf("month"));
    let last = startOfWeekMonday(month.endOf("month")).add(6, "day");
    const dayCount = last.diff(from, "day") + 1;
    if (dayCount < 42) {
      last = last.add(42 - dayCount, "day");
    }
    const to = last.add(1, "day");
    return {
      fromISO: from.toISOString(),
      toISO: to.toISOString(),
      fromISODate: from.format("YYYY-MM-DD"),
      toISODate: last.format("YYYY-MM-DD"),
    };
  }, [month]);

  const lessonsQuery = useLessonsQuery({ fromISO, toISO });
  const remindersQuery = useRemindersByDateRangeQuery({ fromISODate, toISODate });
  const isInstructor = profileQuery.data?.role === "instructor";
  const today = dayjs().startOf("day");

  const { lessonCountByDateISO, reminderCountByDateISO, lessonsForSelectedDay, remindersForSelectedDay } = useMemo(() => {
    const lessonCounts: Record<string, number> = {};
    const reminderCounts: Record<string, number> = {};
    const selectedISO = selectedDate.format("YYYY-MM-DD");

    const all = lessonsQuery.data ?? [];
    for (const lesson of all) {
      const dateISO = dayjs(lesson.start_time).format("YYYY-MM-DD");
      lessonCounts[dateISO] = (lessonCounts[dateISO] ?? 0) + 1;
    }

    const allReminders = remindersQuery.data ?? [];
    for (const reminder of allReminders) {
      const dateISO = reminder.reminder_date;
      reminderCounts[dateISO] = (reminderCounts[dateISO] ?? 0) + 1;
    }

    const remindersForDay = allReminders
      .filter((reminder) => reminder.reminder_date === selectedISO)
      .slice()
      .sort((a, b) => normalizeTimeHHmm(a.reminder_time).localeCompare(normalizeTimeHHmm(b.reminder_time)));

    const lessonsForDay = all
      .filter((lesson) => dayjs(lesson.start_time).format("YYYY-MM-DD") === selectedISO)
      .sort((a, b) => dayjs(a.start_time).valueOf() - dayjs(b.start_time).valueOf());

    return {
      lessonCountByDateISO: lessonCounts,
      reminderCountByDateISO: reminderCounts,
      lessonsForSelectedDay: lessonsForDay,
      remindersForSelectedDay: remindersForDay,
    };
  }, [lessonsQuery.data, remindersQuery.data, selectedDate]);

  function onPrevMonth() {
    setMonth((currentMonth) => {
      const next = currentMonth.subtract(1, "month");
      setSelectedDate((currentSelected) =>
        currentSelected.isSame(next, "month") ? currentSelected : next.startOf("month"),
      );
      return next;
    });
  }

  function onNextMonth() {
    setMonth((currentMonth) => {
      const next = currentMonth.add(1, "month");
      setSelectedDate((currentSelected) =>
        currentSelected.isSame(next, "month") ? currentSelected : next.startOf("month"),
      );
      return next;
    });
  }

  function onToday() {
    const today = dayjs().startOf("day");
    setSelectedDate(today);
    setMonth(today.startOf("month"));
  }

  const lessonCards = lessonsForSelectedDay.map((lesson) => {
    const start = dayjs(lesson.start_time);
    const end = dayjs(lesson.end_time);
    const studentName = lesson.students
      ? `${lesson.students.first_name} ${lesson.students.last_name}`
      : "Student";

    return (
      <Pressable key={lesson.id} onPress={() => navigation.navigate("LessonEdit", { lessonId: lesson.id })}>
        <View className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 dark:border-borderDark dark:bg-cardDark dark:shadow-black/30">
          <View className="flex-row items-start gap-4">
            <View className="w-20 items-center rounded-xl border border-border bg-background px-2 py-2 dark:border-borderDark dark:bg-backgroundDark">
              <AppText className="text-xs" variant="caption">
                {start.format("h:mm")}
              </AppText>
              <AppText className="text-xs" variant="caption">
                {start.format("A")}
              </AppText>
              <View className="my-1 h-px w-10 bg-border dark:bg-borderDark" />
              <AppText className="text-xs" variant="caption">
                {end.format("h:mm")}
              </AppText>
              <AppText className="text-xs" variant="caption">
                {end.format("A")}
              </AppText>
            </View>

            <View className="flex-1 gap-1">
              <View className="flex-row items-start justify-between gap-3">
                <AppText className="flex-1" variant="heading">
                  {studentName}
                </AppText>
              </View>
              {lesson.location ? (
                <AppText variant="caption" className="text-[16px]">
                  {lesson.location}
                </AppText>
              ) : null}
              {lesson.notes ? (
                <AppText numberOfLines={2} variant="caption">
                  {lesson.notes}
                </AppText>
              ) : null}
            </View>
          </View>
        </View>
      </Pressable>
    );
  });

  const hasLessons = lessonsForSelectedDay.length > 0;
  const hasReminders = remindersForSelectedDay.length > 0;

  const reminderCards = remindersForSelectedDay.map((reminder) => {
    const timeHHmm = normalizeTimeHHmm(reminder.reminder_time);
    const when = dayjs(`${reminder.reminder_date}T${timeHHmm}:00`);
    const timeLabel = when.isValid() ? when.format("h:mm") : timeHHmm;
    const meridiemLabel = when.isValid() ? when.format("A") : "";
    const studentName = getReminderStudentName(reminder);

    return (
      <View
        key={reminder.id}
        className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-black/5 dark:border-borderDark dark:bg-cardDark dark:shadow-black/30"
      >
        <View className="flex-row items-start gap-4">
          <View className="w-20 items-center rounded-xl border border-emerald-600/30 bg-emerald-600/10 px-2 py-2 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <AppText className="text-xs" variant="caption">
              {timeLabel}
            </AppText>
            {meridiemLabel ? (
              <AppText className="text-xs" variant="caption">
                {meridiemLabel}
              </AppText>
            ) : null}
          </View>

          <View className="flex-1 gap-1">
            <View className="flex-row items-start justify-between gap-3">
              <AppText className="flex-1" variant="heading">
                {studentName}
              </AppText>
              <View className="mt-2 h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
            </View>
            <AppText variant="body">{reminder.title}</AppText>
          </View>
        </View>
      </View>
    );
  });

  const weekStart = useMemo(() => startOfWeekMonday(selectedDate), [selectedDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => weekStart.add(index, "day")), [weekStart]);

  const weekStrip = (
    <View className="flex-row gap-0">
      {weekDays.map((date) => {
        const dateISO = date.format("YYYY-MM-DD");
        const isSelected = date.isSame(selectedDate, "day");
        const isToday = date.isSame(today, "day");
        const lessonCount = lessonCountByDateISO[dateISO] ?? 0;
        const reminderCount = reminderCountByDateISO[dateISO] ?? 0;

        return (
          <Pressable
            key={dateISO}
            onPress={() => setSelectedDate(date.startOf("day"))}
            className={cn(
              "flex-1 rounded-none border px-2 py-2",
              isSelected
                ? "border-primary bg-primary/10 dark:border-primaryDark dark:bg-primaryDark/10"
                : "border-border bg-background dark:border-borderDark dark:bg-backgroundDark",
            )}
          >
            <AppText className="text-center" variant="caption">
              {date.format("ddd")}
            </AppText>
            <View className="mt-1 items-center">
              <View
                className={cn(
                  "h-9 w-9 items-center justify-center rounded-full",
                  isToday && "border border-accent bg-accent/10 dark:bg-accent/15",
                )}
              >
                <AppText className="text-center text-lg" variant="body">
                  {date.date()}
                </AppText>
              </View>
            </View>
            <View className="mt-1 h-2 flex-row items-center justify-center gap-2">
              {lessonCount > 0 ? <View className="h-2 w-2 rounded-full bg-primary dark:bg-primaryDark" /> : null}
              {reminderCount > 0 ? <View className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500" /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  const markerLegend = (
    <View className="flex-row flex-wrap items-center gap-4">
      <View className="flex-row items-center gap-2">
        <View className="h-2 w-2 rounded-full bg-primary dark:bg-primaryDark" />
        <AppText variant="caption">Lessons</AppText>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
        <AppText variant="caption">Reminders</AppText>
      </View>
      <View className="flex-row items-center gap-2">
        <View className="h-4 w-4 rounded-full border border-accent bg-accent/10 dark:bg-accent/15" />
        <AppText variant="caption">Today</AppText>
      </View>
    </View>
  );

  const agenda = (
    <AppCard className={cn("gap-4", !isCompact && "flex-1")}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <AppText variant="heading">{selectedDate.format(`dddd, ${DISPLAY_DATE_FORMAT}`)}</AppText>
          <AppText className="mt-1" variant="caption">
            {lessonsForSelectedDay.length} lesson{lessonsForSelectedDay.length === 1 ? "" : "s"} scheduled
            {hasReminders
              ? ` · ${remindersForSelectedDay.length} reminder${remindersForSelectedDay.length === 1 ? "" : "s"}`
              : ""}
          </AppText>
        </View>
      </View>

      {weekStrip}

      {lessonsQuery.isPending || remindersQuery.isPending ? (
        <CenteredLoadingState label="Loading schedule..." />
      ) : lessonsQuery.isError || remindersQuery.isError ? (
        <AppStack gap="md">
          {lessonsQuery.isError ? (
            <AppStack gap="sm">
              <AppText variant="error">Lessons: {toErrorMessage(lessonsQuery.error)}</AppText>
              <AppButton
                width="auto"
                variant="secondary"
                icon={RefreshCw}
                label="Retry lessons"
                onPress={() => lessonsQuery.refetch()}
              />
            </AppStack>
          ) : null}

          {remindersQuery.isError ? (
            <AppStack gap="sm">
              <AppText variant="error">Reminders: {toErrorMessage(remindersQuery.error)}</AppText>
              <AppButton
                width="auto"
                variant="secondary"
                icon={RefreshCw}
                label="Retry reminders"
                onPress={() => remindersQuery.refetch()}
              />
            </AppStack>
          ) : null}
        </AppStack>
      ) : !hasLessons && !hasReminders ? (
        <AppStack gap="sm">
          <AppText variant="heading">No lessons or reminders</AppText>
          <AppText variant="body">
            {isInstructor
              ? "You may not be assigned any lessons yet."
              : "Create a lesson or add a reminder to plan your day."}
          </AppText>
        </AppStack>
      ) : (
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-3 pb-2"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <AppText variant="heading">Lessons</AppText>
          {!hasLessons ? <AppText variant="caption">No lessons scheduled.</AppText> : null}
          {lessonCards}
          {hasReminders ? (
            <View className="pt-2">
              <AppText variant="heading">Reminders</AppText>
            </View>
          ) : null}
          {reminderCards}
        </ScrollView>
      )}
    </AppCard>
  );

  return (
    <Screen scroll={isCompact} className={cn(isTabletLandscape && "max-w-[1100px]")}>
      <AppStack gap={isCompact ? "md" : "lg"} className={cn(!isCompact && "flex-1")}>
        <View className="flex-row flex-wrap items-center justify-between gap-3">
          <View className="min-w-48 flex-1">
            <AppText variant="title">Lessons</AppText>
            <AppText className="mt-1" variant="caption">
              Plan and track lessons by day.
            </AppText>
          </View>

          <View className="flex-row flex-wrap gap-2">
            <AppButton width="auto" variant="secondary" icon={CalendarDays} label="Today" onPress={onToday} />
            <AppButton
              width="auto"
              icon={CalendarPlus}
              label="New Lesson"
              onPress={() => navigation.navigate("LessonCreate", { initialDate: selectedDate.format("YYYY-MM-DD") })}
            />
          </View>
        </View>

        {isTabletLandscape ? (
          <View className="flex-1 flex-row gap-6">
            <AppCard className="flex-1 gap-4">
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <AppButton
                    width="auto"
                    size="icon"
                    variant="secondary"
                    icon={ChevronLeft}
                    label=""
                    accessibilityLabel="Previous month"
                    onPress={onPrevMonth}
                  />
                  <AppText variant="heading">{month.format("MMMM YYYY")}</AppText>
                  <AppButton
                    width="auto"
                    size="icon"
                    variant="secondary"
                    icon={ChevronRight}
                    label=""
                    accessibilityLabel="Next month"
                    onPress={onNextMonth}
                  />
                </View>
                <AppText className="text-right" variant="caption">
                  {selectedDate.format(DISPLAY_DATE_FORMAT)}
                </AppText>
              </View>

              {markerLegend}

              <CalendarMonth
                month={month}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  const next = date.startOf("day");
                  setSelectedDate(next);
                  if (!next.isSame(month, "month")) {
                    setMonth(next.startOf("month"));
                  }
                }}
                lessonCountByDateISO={lessonCountByDateISO}
                reminderCountByDateISO={reminderCountByDateISO}
              />
            </AppCard>

            {agenda}
          </View>
        ) : (
          <>
            <AppCard className="gap-4">
              <View className="flex-row items-center justify-between gap-2">
                <View className="flex-row items-center gap-2">
                  <AppButton
                    width="auto"
                    size="icon"
                    variant="secondary"
                    icon={ChevronLeft}
                    label=""
                    accessibilityLabel="Previous month"
                    onPress={onPrevMonth}
                  />
                  <AppText variant="heading">{month.format("MMMM YYYY")}</AppText>
                  <AppButton
                    width="auto"
                    size="icon"
                    variant="secondary"
                    icon={ChevronRight}
                    label=""
                    accessibilityLabel="Next month"
                    onPress={onNextMonth}
                  />
                </View>
                <AppText className="text-right" variant="caption">
                  {selectedDate.format(DISPLAY_DATE_FORMAT)}
                </AppText>
              </View>

              {markerLegend}

              <CalendarMonth
                month={month}
                selectedDate={selectedDate}
                onSelectDate={(date) => {
                  const next = date.startOf("day");
                  setSelectedDate(next);
                  if (!next.isSame(month, "month")) {
                    setMonth(next.startOf("month"));
                  }
                }}
                lessonCountByDateISO={lessonCountByDateISO}
                reminderCountByDateISO={reminderCountByDateISO}
              />
            </AppCard>

            {agenda}
          </>
        )}
      </AppStack>
    </Screen>
  );
}
