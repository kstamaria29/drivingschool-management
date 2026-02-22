// Supabase Edge Function: send-assessment-email
// Emails an assessment PDF to the student and a copy to the organization.
// Access: authenticated users who can access the assessment (owner/admin, or the assigned instructor).

import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_EMAILS_URL = "https://api.resend.com/emails";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
} as const;

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanEmailHeaderText(value: string) {
  return value.replaceAll(/[\r\n]+/g, " ").trim();
}

function assessmentTypeLabel(value: string) {
  if (value === "driving_assessment") return "Driving Assessment";
  if (value === "second_assessment") return "Mock Test - Restricted Licence";
  if (value === "third_assessment") return "Mock Test - Full License";
  return "Assessment";
}

async function sendWithResend(input: {
  resendApiKey: string;
  from: string;
  to: string[];
  bcc?: string[];
  subject: string;
  html: string;
  attachments: Array<{ filename: string; content: string; content_type?: string }>;
}) {
  const response = await fetch(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.resendApiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      ...(input.bcc?.length ? { bcc: input.bcc } : null),
      subject: input.subject,
      html: input.html,
      attachments: input.attachments,
    }),
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

  if (!response.ok) {
    return { ok: false as const, status: response.status, payload };
  }

  return { ok: true as const, status: response.status, payload };
}

function providerPayloadMessage(payload: unknown) {
  if (!payload) return null;
  if (typeof payload === "string") return payload.trim() || null;
  if (typeof payload !== "object") return String(payload);

  const record = payload as Record<string, unknown>;
  const message = typeof record.message === "string" ? record.message : null;
  const error = typeof record.error === "string" ? record.error : null;
  const name = typeof record.name === "string" ? record.name : null;
  const statusCode = typeof record.statusCode === "number" ? record.statusCode : null;

  if (message?.trim()) return message.trim();
  if (error?.trim()) return error.trim();
  if (name && statusCode) return `${name} (${statusCode})`;
  if (name) return name;

  try {
    const jsonValue = JSON.stringify(payload);
    return jsonValue.length > 800 ? `${jsonValue.slice(0, 800)}…` : jsonValue;
  } catch {
    return "Unknown provider error.";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "method_not_allowed" });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: "server_not_configured" });
  }

  if (!resendApiKey) {
    return json(500, { error: "email_provider_not_configured" });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return json(401, { error: "missing_authorization" });
  }
  const accessToken = authHeader.slice(7).trim();
  if (!accessToken) {
    return json(401, { error: "missing_authorization" });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const {
    data: { user: caller },
    error: callerError,
  } = await supabase.auth.getUser(accessToken);

  if (callerError || !caller) {
    return json(401, { error: "invalid_token" });
  }

  const { data: callerProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", caller.id)
    .maybeSingle();

  if (profileError || !callerProfile) {
    return json(500, { error: "failed_to_load_profile" });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const body = payload as Partial<{ assessmentId: string; fileName: string; pdfBase64: string }>;
  const assessmentId = (body.assessmentId ?? "").trim();
  const fileName = (body.fileName ?? "").trim();
  const pdfBase64 = (body.pdfBase64 ?? "").trim();

  if (!assessmentId || !isUuid(assessmentId)) {
    return json(400, { error: "invalid_assessment_id" });
  }

  if (!fileName) {
    return json(400, { error: "file_name_required" });
  }

  if (!pdfBase64) {
    return json(400, { error: "pdf_required" });
  }

  if (pdfBase64.length > 40 * 1024 * 1024) {
    return json(413, { error: "pdf_too_large" });
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id, organization_id, student_id, instructor_id, assessment_type, assessment_date, created_at")
    .eq("id", assessmentId)
    .maybeSingle();

  if (assessmentError) {
    return json(500, { error: "failed_to_load_assessment" });
  }

  if (!assessment) {
    return json(404, { error: "assessment_not_found" });
  }

  if (assessment.organization_id !== callerProfile.organization_id) {
    return json(403, { error: "forbidden" });
  }

  const canSendForAssessment =
    callerProfile.role === "owner" ||
    callerProfile.role === "admin" ||
    assessment.instructor_id === callerProfile.id;

  if (!canSendForAssessment) {
    return json(403, { error: "forbidden" });
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, first_name, last_name, email")
    .eq("id", assessment.student_id)
    .eq("organization_id", callerProfile.organization_id)
    .maybeSingle();

  if (studentError) {
    return json(500, { error: "failed_to_load_student" });
  }

  if (!student) {
    return json(404, { error: "student_not_found" });
  }

  const studentEmail = (student.email ?? "").trim();
  if (!studentEmail) {
    return json(400, { error: "student_email_missing" });
  }
  if (!isValidEmail(studentEmail)) {
    return json(400, { error: "student_email_invalid" });
  }

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, email")
    .eq("id", callerProfile.organization_id)
    .maybeSingle();

  if (orgError || !organization) {
    return json(500, { error: "failed_to_load_organization" });
  }

  const organizationEmail = (organization.email ?? "").trim();
  if (!organizationEmail) {
    return json(400, { error: "organization_email_missing" });
  }
  if (!isValidEmail(organizationEmail)) {
    return json(400, { error: "organization_email_invalid" });
  }

  const studentName = `${student.first_name ?? ""} ${student.last_name ?? ""}`.trim() || "Student";
  const typeLabel = assessmentTypeLabel(assessment.assessment_type);
  const subject = `${typeLabel} - ${studentName}`;

  const fromName = cleanEmailHeaderText(organization.name ?? "Driving School");
  const from = `${fromName} <${organizationEmail}>`;

  const html = `
    <div>
      <p>Please find attached the ${typeLabel} PDF for ${studentName}.</p>
      <p>Sent from ${fromName} (${organizationEmail}).</p>
    </div>
  `.trim();

  const sendResult = await sendWithResend({
    resendApiKey,
    from,
    to: [studentEmail],
    bcc: [organizationEmail],
    subject,
    html,
    attachments: [{ filename: fileName, content: pdfBase64, content_type: "application/pdf" }],
  });

  if (!sendResult.ok) {
    const providerMessage = providerPayloadMessage(sendResult.payload);
    console.error("Resend send failed", {
      status: sendResult.status,
      message: providerMessage ?? undefined,
      payload: sendResult.payload,
    });

    return json(502, {
      error: "email_send_failed",
      message: providerMessage ?? "Email provider rejected the request.",
      provider: sendResult.payload,
    });
  }

  return json(200, { ok: true, provider: sendResult.payload });
});
