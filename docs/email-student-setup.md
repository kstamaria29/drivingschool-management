# Email student (Assessment PDFs) - Setup guide

This app can email a saved assessment PDF to:

- The student (To)
- The organization (BCC copy)

The sender (From) is the organization email (`organizations.email`).

Implementation overview:

- Mobile app generates the PDF and sends it to a Supabase Edge Function as Base64.
- Supabase Edge Function `send-assessment-email` sends the email via Resend.

---

## Prerequisites

1. Supabase migrations applied through:
   - `supabase/migrations/022_organization_email.sql` (adds `organizations.email`)
2. A Resend account + a verified sending domain (recommended).
3. Supabase CLI installed (for deploying Edge Functions).

---

## Step-by-step setup

### 1) Verify a sending domain in Resend

1. In the Resend dashboard, add your domain (e.g. `yourdrivingschool.co.nz`).
2. Add the DNS records Resend gives you (SPF/DKIM/etc) in your DNS provider.
3. Wait for verification to complete.

Important:

- Personal inbox domains like `gmail.com` / `outlook.com` generally **cannot** be used as the `From` address.
- Use an address on your verified domain (e.g. `assessments@yourdrivingschool.co.nz`).

### 2) Create `RESEND_API_KEY`

1. Resend dashboard -> API Keys -> Create API key.
2. Copy the API key value (you may only be shown it once).

### 3) Add the key to Supabase Edge Function secrets

Set these secrets in Supabase (Dashboard -> Project Settings -> Edge Functions -> Secrets) **or** via CLI:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`

Do **not** store `RESEND_API_KEY` in the app `.env` (mobile apps can leak bundled secrets).

### 4) Deploy the Edge Function

Deploy:

- `supabase functions deploy send-assessment-email --no-verify-jwt`

### 5) Configure the organization sender email (in the app)

1. Open the app -> Settings.
2. Set the organization email (this becomes the email sender / From address).
3. Use an email on the verified Resend domain (example: `assessments@yourdrivingschool.co.nz`).

### 6) Ensure the student has an email

1. Open Students -> select the student.
2. Add the student's email address (required to send to them).

---

## Using the feature (in the app)

Supported assessments:

- Driving Assessment
- Mock Test - Restricted Licence
- Mock Test - Full License

1. Open Students -> select a student.
2. Open Assessment History.
3. Select an assessment record.
4. Tap **Email student** -> confirm.

Expected behavior:

- Student receives an email with the PDF attached.
- Organization receives a BCC copy of the same email.

---

## Troubleshooting

### Email fails with `502 email_send_failed`

This means Resend rejected the request.

1. Open Supabase Dashboard -> Edge Functions -> `send-assessment-email` -> Logs/Invocations.
2. Look for the provider error message (the function logs Resend's response payload).

Common causes:

- `From` address is not on a verified Resend domain (or sender isn't allowed).
- Invalid `RESEND_API_KEY` secret.
- Student email / organization email is missing or invalid.
- PDF attachment too large (the function rejects very large payloads).

### Missing organization email

Set it in-app under Settings (Organization section).

### Missing student email

Edit the student and add their email.

---

## Notes / limits

- The Edge Function enforces a max Base64 payload size (40MB) to avoid oversized emails.
- Access rules: only users who can access the assessment (owner/admin, or the assigned instructor) can send the email.
