// Supabase Edge Function: notifications-cron
// Intended to be invoked on a schedule (cron) to deliver:
// - Upcoming lesson reminders (at configured offsets)
// - Daily "Today's lessons" digest
//
// Access: service role only (no JWT required)

import { createClient } from "npm:@supabase/supabase-js@2";

const EXPO_PUSH_SEND_URL = "https://exp.host/--/api/v2/push/send";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function chunk<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

type Category = "lesson_reminders" | "daily_digest";

function androidChannelId(input: { category: Category; sound: boolean; vibrate: boolean }) {
  const base = input.category === "lesson_reminders" ? "lesson-reminders" : "daily-digest";
  const soundTag = input.sound ? "sound" : "nosound";
  const vibrateTag = input.vibrate ? "vibrate" : "novibrate";
  return `${base}-${soundTag}-${vibrateTag}`;
}

type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default";
  channelId?: string;
};

async function sendExpoPush(messages: ExpoPushMessage[]) {
  const parts = chunk(messages, 100);
  const results: Array<{ status: number; ok: boolean; body: unknown }> = [];

  for (const part of parts) {
    const response = await fetch(EXPO_PUSH_SEND_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(part),
    });

    const raw = await response.text();
    let payload: unknown = raw;
    if (raw) {
      try {
        payload = JSON.parse(raw);
      } catch {
        payload = raw;
      }
    }

    results.push({ status: response.status, ok: response.ok, body: payload });
  }

  return results;
}

type DueLessonReminderEvent = {
  organization_id: string;
  profile_id: string;
  lesson_id: string;
  offset_minutes: number;
  start_time: string;
  student_first_name: string;
  student_last_name: string;
  location: string | null;
  sound_enabled: boolean;
  vibration_enabled: boolean;
};

type DueDailyDigestProfile = {
  organization_id: string;
  profile_id: string;
  timezone: string;
  local_date: string;
  digest_time: string;
  sound_enabled: boolean;
  vibration_enabled: boolean;
};

type DigestLesson = {
  lesson_id: string;
  start_time: string;
  end_time: string;
  student_first_name: string;
  student_last_name: string;
  location: string | null;
};

function formatOffsetLabel(offsetMinutes: number) {
  if (offsetMinutes === 30) return "30 minutes";
  if (offsetMinutes === 60) return "1 hour";
  if (offsetMinutes === 180) return "3 hours";
  if (offsetMinutes === 300) return "5 hours";
  if (offsetMinutes === 1440) return "1 day";
  if (offsetMinutes === 2880) return "2 days";
  return `${offsetMinutes} min`;
}

function toShortTime(iso: string, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-NZ", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function buildDailyDigestBody(lessons: DigestLesson[], timeZone: string) {
  if (!lessons.length) {
    return "No lessons scheduled today.";
  }

  const lines = lessons.slice(0, 4).map((lesson) => {
    const time = toShortTime(lesson.start_time, timeZone);
    const student = `${lesson.student_first_name ?? ""} ${lesson.student_last_name ?? ""}`.trim();
    return `${time} - ${student || "Lesson"}`;
  });

  const remaining = lessons.length - lines.length;
  if (remaining > 0) {
    lines.push(`+${remaining} more`);
  }

  return lines.join("\n");
}

Deno.serve(async (_req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "server_not_configured" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const windowStart = new Date();
  const windowEnd = new Date(windowStart.getTime() + 5 * 60 * 1000);

  // 1) Upcoming lesson reminders due in this window.
  const {
    data: dueLessonEvents,
    error: dueLessonError,
  } = await supabase.rpc("get_due_lesson_reminder_events", {
    window_start: windowStart.toISOString(),
    window_end: windowEnd.toISOString(),
  });

  if (dueLessonError) {
    // Keep the cron resilient: return 200 so scheduler doesn't back off permanently.
    return json(200, { ok: false, error: "failed_to_get_due_lessons", details: dueLessonError });
  }

  const dueLessons = (dueLessonEvents ?? []) as DueLessonReminderEvent[];
  const dueProfileIdsForLessons = [...new Set(dueLessons.map((e) => e.profile_id))];

  const lessonTokensByProfileId = new Map<string, string[]>();
  if (dueProfileIdsForLessons.length) {
    const { data: tokenRows } = await supabase
      .from("push_tokens")
      .select("profile_id, expo_push_token")
      .in("profile_id", dueProfileIdsForLessons);

    for (const row of tokenRows ?? []) {
      const profileId = (row as { profile_id?: unknown }).profile_id;
      const token = (row as { expo_push_token?: unknown }).expo_push_token;
      if (typeof profileId !== "string" || typeof token !== "string" || !token) continue;
      const existing = lessonTokensByProfileId.get(profileId) ?? [];
      existing.push(token);
      lessonTokensByProfileId.set(profileId, existing);
    }
  }

  const lessonPushMessages: ExpoPushMessage[] = [];
  let lessonDeliveriesInserted = 0;

  for (const event of dueLessons) {
    const tokens = lessonTokensByProfileId.get(event.profile_id) ?? [];
    if (!tokens.length) continue;

    const { error: insertError } = await supabase.from("lesson_notification_deliveries").insert({
      organization_id: event.organization_id,
      profile_id: event.profile_id,
      lesson_id: event.lesson_id,
      offset_minutes: event.offset_minutes,
    });

    if (insertError) {
      // Duplicate delivery: skip sending to avoid double notifications.
      continue;
    }

    lessonDeliveriesInserted += 1;

    const studentName = `${event.student_first_name ?? ""} ${event.student_last_name ?? ""}`.trim();
    const title = `Lesson in ${formatOffsetLabel(event.offset_minutes)}`;
    const body = studentName ? studentName : "Upcoming lesson";

    const channelId = androidChannelId({
      category: "lesson_reminders",
      sound: event.sound_enabled,
      vibrate: event.vibration_enabled,
    });

    for (const to of tokens) {
      lessonPushMessages.push({
        to,
        title,
        body,
        data: {
          category: "lesson_reminders",
          lessonId: event.lesson_id,
          offsetMinutes: event.offset_minutes,
        },
        ...(event.sound_enabled ? { sound: "default" } : null),
        channelId,
      });
    }
  }

  const lessonSendResults =
    lessonPushMessages.length > 0 ? await sendExpoPush(lessonPushMessages) : [];

  // 2) Daily digest (only once per local day per user; deduped in DB).
  const {
    data: dueDigestProfiles,
    error: dueDigestError,
  } = await supabase.rpc("get_due_daily_digest_profiles", {
    window_start: windowStart.toISOString(),
  });

  if (dueDigestError) {
    return json(200, {
      ok: false,
      error: "failed_to_get_due_digests",
      details: dueDigestError,
      lesson: {
        due: dueLessons.length,
        deliveriesInserted: lessonDeliveriesInserted,
        messages: lessonPushMessages.length,
        sendResults: lessonSendResults,
      },
    });
  }

  const dueDigests = (dueDigestProfiles ?? []) as DueDailyDigestProfile[];
  const dueProfileIdsForDigest = [...new Set(dueDigests.map((d) => d.profile_id))];

  const digestTokensByProfileId = new Map<string, string[]>();
  if (dueProfileIdsForDigest.length) {
    const { data: tokenRows } = await supabase
      .from("push_tokens")
      .select("profile_id, expo_push_token")
      .in("profile_id", dueProfileIdsForDigest);

    for (const row of tokenRows ?? []) {
      const profileId = (row as { profile_id?: unknown }).profile_id;
      const token = (row as { expo_push_token?: unknown }).expo_push_token;
      if (typeof profileId !== "string" || typeof token !== "string" || !token) continue;
      const existing = digestTokensByProfileId.get(profileId) ?? [];
      existing.push(token);
      digestTokensByProfileId.set(profileId, existing);
    }
  }

  const digestPushMessages: ExpoPushMessage[] = [];
  let digestDeliveriesInserted = 0;

  for (const profile of dueDigests) {
    const tokens = digestTokensByProfileId.get(profile.profile_id) ?? [];
    if (!tokens.length) continue;

    const {
      data: lessonRows,
      error: lessonsError,
    } = await supabase.rpc("get_lessons_for_local_date", {
      p_profile_id: profile.profile_id,
      p_local_date: profile.local_date,
    });

    if (lessonsError) {
      console.error("daily_digest_lessons_lookup_failed", {
        profileId: profile.profile_id,
        localDate: profile.local_date,
        error: lessonsError,
      });
      // Don't mark as delivered - allow retry on the next cron run.
      continue;
    }

    const { error: insertError } = await supabase.from("daily_digest_deliveries").insert({
      organization_id: profile.organization_id,
      profile_id: profile.profile_id,
      digest_date: profile.local_date,
    });

    if (insertError) {
      continue;
    }

    digestDeliveriesInserted += 1;

    const lessons = (lessonRows ?? []) as DigestLesson[];
    const title = "Today's lessons";
    const body = buildDailyDigestBody(lessons, profile.timezone);

    const channelId = androidChannelId({
      category: "daily_digest",
      sound: profile.sound_enabled,
      vibrate: profile.vibration_enabled,
    });

    for (const to of tokens) {
      digestPushMessages.push({
        to,
        title,
        body,
        data: {
          category: "daily_digest",
          localDate: profile.local_date,
        },
        ...(profile.sound_enabled ? { sound: "default" } : null),
        channelId,
      });
    }
  }

  const digestSendResults =
    digestPushMessages.length > 0 ? await sendExpoPush(digestPushMessages) : [];

  return json(200, {
    ok: true,
    window: { start: windowStart.toISOString(), end: windowEnd.toISOString() },
    lesson: {
      due: dueLessons.length,
      deliveriesInserted: lessonDeliveriesInserted,
      messages: lessonPushMessages.length,
      sendResults: lessonSendResults,
    },
    digest: {
      due: dueDigests.length,
      deliveriesInserted: digestDeliveriesInserted,
      messages: digestPushMessages.length,
      sendResults: digestSendResults,
    },
  });
});
