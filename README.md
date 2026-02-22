# Driving School App (Mobile, v1)

Expo React Native app with Supabase auth + onboarding (organization creation + optional logo upload).

Out of scope in this repo task: Google Calendar sync.

## 1) Prerequisites

- Node.js 20+
- A Supabase project (cloud)
- Expo Go on a device OR an Android/iOS simulator

## 2) Create Supabase project

1. Create a new Supabase project.
2. In the Supabase Dashboard, go to `SQL Editor` and run migrations in order (see `supabase/README.md`).
3. Create the required Storage buckets + apply policies (see `supabase/README.md`).
4. Get your API keys:
   - Go to `Project Settings` -> `API`
   - Copy the `Project URL`
   - Copy the `anon` key

## 3) Configure environment variables

1. Create a local `.env` file from `.env.example`
2. Set:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
GOOGLE_MAPS_API_KEY=...
# Optional alias for runtime access in Expo:
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

Use a Google key with Maps + Places Autocomplete + Place Details + Geocoding enabled.

### EAS builds (APK / AAB)

EAS builds do not automatically use your local `.env` (it is gitignored). You must set the same variables in EAS:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_MAPS_API_KEY`

Then rebuild (for example): `eas build -p android --profile preview`

## 4) Push notifications (Android / FCM)

This app uses Expo Push Notifications (`expo-notifications`). For Android devices, you must configure Firebase Cloud Messaging (FCM):

1. Create (or open) a Firebase project and add an Android app with package name `com.kstamaria29.drivingschoolapp`.
2. Download `google-services.json` and place it at the repo root: `./google-services.json`.
3. Upload FCM V1 credentials to EAS (Google Service Account Key) so Expo can deliver pushes to Android.

See: https://docs.expo.dev/push-notifications/fcm-credentials/

## 5) Run the app

```
npm install
npm run start
```

Then press `a` for Android (or scan the QR code with Expo Go).

## 6) What's implemented

- NativeWind styling + shared UI primitives (`src/components/*`)
- React Navigation `AuthStack` + responsive sidebar/drawer navigation with an auth gate (`src/navigation/RootNavigation.tsx`)
- Supabase client for Expo/React Native (`src/supabase/client.ts`)
- Email/password auth (sign in + sign up)
- Onboarding for first-time users (creates `organizations`, `profiles`, `organization_settings`, optional logo upload to `org-logos/<org_id>/logo.<ext>`)
- Students v1 (create/edit/archive + owner/instructor permissions via RLS)
- Lessons v1 (Today / This Week list + create/edit + calendar view)
- Assessments v1 (Driving Assessment: score criteria + save + export PDF)
- Google Maps screen (drawer entry) with map layer toggle, organization-safe map pins, anchored vector/snapshot annotations, and NZ address search/autocomplete

## 7) Repo notes

- Screens do not call Supabase directly; they use `features/*/api.ts` + React Query hooks.

## 8) Email student (assessment PDFs)

Step-by-step setup (Resend + Supabase Edge Function): `docs/email-student-setup.md`
