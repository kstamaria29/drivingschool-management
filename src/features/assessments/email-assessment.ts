import { supabase } from "../../supabase/client";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../../supabase/env";

export type SendAssessmentEmailInput = {
  assessmentId: string;
  fileName: string;
  pdfBase64: string;
};

function readErrorMessage(payload: unknown, status: number, fallback: string) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const error = typeof record.error === "string" ? record.error : null;
    const message = typeof record.message === "string" ? record.message : null;
    if (message) return `${fallback} (${status}): ${message}`;
    if (error) return `${fallback} (${status}): ${error}`;
  }
  return `${fallback} (${status})`;
}

export async function sendAssessmentEmail(input: SendAssessmentEmailInput) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  const accessToken = session?.access_token;
  if (!accessToken) {
    throw new Error("You're not signed in. Please sign in again and retry.");
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-assessment-email`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const raw = await response.text();
  let payload: unknown = null;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    throw new Error(readErrorMessage(payload, response.status, "Email sending failed"));
  }

  return payload;
}
