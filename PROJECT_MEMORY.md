# IHA CareFlow Project Memory

Last updated: 2026-05-13

## Project Overview

`iha-careflow` is a Next.js 16 App Router application for Integrative Healthcare Alliance care operations. The current priority is UI-first. Firebase has been initialized, but real auth and Firestore persistence are not wired yet.

The app was adapted from a shadcn-style admin dashboard reference, but Convex and Clerk were intentionally removed. Patient/provider directory data now lives in a Zustand store; other workflow data is still static/local component state.

## Local Dev Notes

- Use Node 22: `nvm use 22`
- Install/run with pnpm.
- `pnpm dev` uses webpack intentionally:
  - Script: `next dev --webpack`
  - Turbopack dev was stalling on route compilation in this environment.
- `pnpm build` uses Next default build and has passed after changes.
- Verification commands used frequently:
  - `pnpm lint`
  - `pnpm build`

## App Architecture

- Framework: Next.js `16.2.6`, React `19.2.4`, App Router.
- Firebase SDK: initialized for app/Auth/Firestore/Storage/Analytics.
- Global state: Zustand store in `src/stores/careflow-store.ts`.
- Styling: Tailwind CSS v4 via `src/app/globals.css`.
- Component style: shadcn/ui-style primitives under `src/components/ui`.
- Icons: `@tabler/icons-react` mostly, plus some `lucide-react` inside shadcn primitives.
- Admin shell:
  - `src/app/admin/layout.tsx`
  - Uses `SidebarProvider`, `SidebarInset`, `SiteHeader`, and `AppSidebar`.
- Sidebar navigation:
  - `src/components/app-sidebar.tsx`
  - Main workflow links are wired to current pages.
  - Care Directory group links to patient and doctor management pages.
- Root routes:
  - `/` redirects to `/login`.
  - `/admin` redirects to `/admin/dashboard`.

## Routes

### Public/Auth Routes

- `/login`
  - File: `src/app/login/page.tsx`
  - Uses `AuthPanel` from `src/components/auth-panel.tsx`.
  - UI-only admin login with email/password.
  - “Not a member? Register” links to `/register`.
  - Submit button routes to `/admin/dashboard`.

- `/register`
  - File: `src/app/register/page.tsx`
  - Uses the same `AuthPanel`.
  - UI-only registration form with name/email/password/confirm password.
  - Submit button routes to `/admin/dashboard`.

### Admin Routes

- `/admin/dashboard`
  - File: `src/app/admin/dashboard/page.tsx`
  - Command center overview.
  - Uses:
    - `SectionCards`
    - `ChartAreaInteractive`
    - `DataTable`
  - Static data file: `src/app/admin/dashboard/data.json`.

- `/admin/onboarding`
  - File: `src/app/admin/onboarding/page.tsx`
  - New-patient intake form, not an operations queue.
  - Collects:
    - Full name
    - Date of birth
    - Gender
    - Phone/email
    - Emergency contact
    - Reason for visit
    - Symptoms checklist
    - Symptom notes
    - Medical history
    - Medications/allergies
    - Insurance provider/member ID
    - Billing preference
  - Includes live auto-summary panel.

- `/admin/billing`
  - File: `src/app/admin/billing/page.tsx`
  - Billing and insurance dashboard.
  - Summary cards at top.
  - Patient billing records table.
  - Search by patient/insurance/invoice.
  - Status filter: All, Verified, Pending, Missing Info.
  - CSV export for filtered billing records.
  - Each row has:
    - `View`
    - `Send Reminder`
  - Details drawer includes:
    - Insurance details
    - Uploaded insurance card placeholder
    - Invoice breakdown
    - Invoice breakdown CSV download
    - Verification status
    - Billing notes

- `/admin/clinical-notes`
  - File: `src/app/admin/clinical-notes/page.tsx`
  - Clinical documentation workbench.
  - Top bar:
    - New Note modal
    - Search
    - Filter
  - Left panel:
    - Notes list with patient, note type, date/provider, status badge.
  - Main panel:
    - Unified patient header.
    - SOAP editor with large scrollable/editable sections.
    - S/O/A/P blocks have distinct background and left-border accents.
  - Right patient context panel:
    - Avatar
    - Name
    - Age
    - Reason
    - Risk
    - Insurance plan/member ID
    - Note status
  - New Note modal:
    - Search/select patient
    - Select appointment filtered by selected patient
    - Select note type: SOAP, Progress Note, Intake Note, Follow-up
    - Creates note and opens it immediately.
  - Patient tags were removed from the modal and moved to the context panel.

- `/admin/messages`
  - File: `src/app/admin/messages/page.tsx`
  - Patient-provider messaging workspace.
  - Left panel:
    - Conversations list
    - Patient name
    - Last message preview
    - Time
    - Status badge
    - Search patients
  - Right panel:
    - Patient summary header
    - Upcoming appointment
    - Provider
    - Risk level
    - Message history
    - Quick actions
    - Message input and Send button
  - Sending a message appends it locally and updates last message/status.

- `/admin/patients`
  - File: `src/app/admin/patients/page.tsx`
  - Patient management directory.
  - UI-only/local state.
  - Includes:
    - Summary cards for total patients, intake pending, high risk, billing gaps.
    - Search by patient/contact/provider.
    - Status and risk filters.
    - Patient table with status, risk, provider, next appointment, billing readiness.
    - Right patient profile panel with contact, care readiness checklist, insurance/billing, workflow actions, and care context.
  - Connects patient profile data to onboarding, billing, scheduling, messages, and clinical notes.

- `/admin/doctors`
  - File: `src/app/admin/doctors/page.tsx`
  - Doctor/provider management directory.
  - UI-only/local state.
  - Includes:
    - Summary cards for active doctors, visits today, open notes, available slots.
    - Search by doctor/specialty/location/contact.
    - Specialty and status filters.
    - Provider table with status, daily visits, next availability, open notes.
    - `New doctor` modal that creates a local provider record.
    - Right provider profile panel with credentials, schedule capacity, patient panel, today's workflow, and quick actions.
  - Connects providers to scheduling capacity, notes ownership, and patient panel management.

- `/admin/scheduling`
  - File: `src/app/admin/scheduling/page.tsx`
  - Calendar-first scheduling dashboard.
  - Top action bar:
    - New appointment modal
    - Today/Week/Month toggle
    - Prev/next arrows
    - Provider filter
  - Automation banner:
    - “5 patients have appointments tomorrow with no confirmation. Send reminders?”
    - `Send All` changes to `Reminders Sent`.
  - Left panel:
    - Mini monthly calendar.
    - Dates with appointments highlighted.
    - Click date to select appointment on that date.
  - Main area:
    - Weekly grid with 7 day columns and time slots on left.
    - Appointment blocks display patient, type, provider, and status color.
  - Right panel:
    - Appointment detail with avatar, patient, date/time/duration, type, provider, status/risk.
    - Actions: Confirm, Reschedule, Cancel, Reminder.
    - Quick links: Start Session, Start note, Message patient, View billing.
  - New appointment modal:
    - Patient
    - Provider
    - Day
    - Time
    - Type
    - Creates a pending appointment directly on the calendar.

## Shared Components / Important Files

- `src/components/auth-panel.tsx`
  - Shared login/register panel.

- `src/components/firebase-provider.tsx`
  - Client provider mounted in `src/app/layout.tsx`.
  - Initializes Firebase Analytics only in the browser.

- `src/lib/firebase.ts`
  - Firebase app configuration for project `iha-careflow`.
  - Exports `firebaseApp`, `auth`, `db`, `storage`, and `getFirebaseAnalytics`.
  - Uses a guarded analytics initializer so server rendering/builds do not call `getAnalytics`.

- `src/stores/careflow-store.ts`
  - Zustand store for global patient/provider directory state.
  - Exports shared `Patient`, `Doctor`, status, risk, and insurance types.
  - Stores active patient/provider IDs and supports adding providers from the Doctors page.

- `src/components/app-sidebar.tsx`
  - Sidebar navigation and app brand.
  - Current links:
    - Command Center: `/admin/dashboard`
    - Patient Onboarding: `/admin/onboarding`
    - Billing & Insurance: `/admin/billing`
    - Clinical Notes: `/admin/clinical-notes`
    - Patient Messages: `/admin/messages`
    - Scheduling: `/admin/scheduling`

- `src/components/nav-care-directory.tsx`
  - Sidebar group labeled `Care Directory`.
  - Links:
    - Patients: `/admin/patients`
    - Doctors: `/admin/doctors`
  - Replaced the copied dashboard `Documents` sidebar section.

- `src/components/nav-documents.tsx`
  - Compatibility re-export to avoid stale dev-server imports after renaming the sidebar section.

- `src/components/site-header.tsx`
  - Admin header.

- `src/components/data-table.tsx`
  - Lightweight dashboard table. Replaced heavy TanStack/DnD shadcn demo table because dev compilation felt too slow.

- `src/app/globals.css`
  - Theme tokens. Palette is warm clinical/teal/earthy and not default shadcn neutral only.

- `next.config.ts`
  - Has `turbopack.root = __dirname` to avoid workspace-root warning.

## Firestore Collections

Firebase is initialized, but Firestore collection reads/writes are not implemented yet. Recommended collection design for the backend phase:

- `users`
  - Admin/staff/provider profiles.
  - Fields: `uid`, `displayName`, `email`, `role`, `providerId`, `active`, `createdAt`.

- `patients`
  - Core patient profile.
  - Fields: `fullName`, `dob`, `gender`, `phone`, `email`, `emergencyContact`, `riskLevel`, `reasonForCare`, `createdAt`.

- `providers`
  - Doctor/provider profile and schedule capacity.
  - Fields: `displayName`, `title`, `specialty`, `license`, `npi`, `email`, `phone`, `status`, `location`, `networkStatus`, `panelCount`, `availableSlots`, `createdAt`.

- `patientIntakes`
  - Intake/onboarding form submissions.
  - Fields: `patientId`, `reasonForVisit`, `symptoms`, `medicalHistory`, `medications`, `allergies`, `insuranceProvider`, `memberId`, `billingPreference`, `status`, `submittedAt`.

- `insuranceRecords`
  - Billing readiness and insurance verification.
  - Fields: `patientId`, `providerName`, `memberId`, `status`, `cardFrontUrl`, `cardBackUrl`, `verificationNotes`, `lastCheckedAt`.

- `billingRecords`
  - Billing/invoice dashboard records.
  - Fields: `patientId`, `appointmentId`, `invoiceId`, `status`, `balance`, `breakdown`, `notes`, `reminderSentAt`.

- `appointments`
  - Scheduling records.
  - Fields: `patientId`, `providerId`, `date`, `startTime`, `endTime`, `type`, `status`, `riskLevel`, `onboardingComplete`, `insuranceVerified`, `consentSigned`, `reminderStatus`.

- `clinicalNotes`
  - SOAP/progress/intake/follow-up notes.
  - Fields: `patientId`, `appointmentId`, `providerId`, `noteType`, `status`, `subjective`, `objective`, `assessment`, `plan`, `signedAt`, `createdAt`, `updatedAt`.

- `conversations`
  - Patient-provider message threads.
  - Fields: `patientId`, `providerId`, `status`, `riskLevel`, `lastMessage`, `lastMessageAt`.

- `messages`
  - Individual conversation messages.
  - Fields: `conversationId`, `senderId`, `senderType`, `body`, `readAt`, `createdAt`.

- `auditLogs`
  - Important for healthcare admin actions.
  - Fields: `actorId`, `action`, `resourceType`, `resourceId`, `metadata`, `createdAt`.

## RBAC Roles

RBAC is not implemented yet. Recommended roles:

- `super_admin`
  - Full system access, user management, settings, audit logs.

- `admin`
  - Manage operations workflows, onboarding, scheduling, billing, messages.

- `provider`
  - Access assigned patient schedule, clinical notes, messages, sign notes.

- `billing`
  - Access billing and insurance records, invoice details, reminders.

- `front_desk`
  - Access onboarding, scheduling, reminders, basic patient demographics.

- `clinical_assistant`
  - Access intake review, notes drafts, messages, appointment prep.

Suggested route permissions:

- `/admin/dashboard`: all staff roles.
- `/admin/onboarding`: admin, front_desk, clinical_assistant, provider read access.
- `/admin/patients`: admin, front_desk, clinical_assistant, provider read/assigned patient access.
- `/admin/doctors`: super_admin/admin full access, front_desk scheduling read access, providers own profile read access.
- `/admin/billing`: admin, billing, limited provider read access.
- `/admin/clinical-notes`: provider, clinical_assistant draft access, admin read access.
- `/admin/messages`: admin, provider, clinical_assistant, front_desk.
- `/admin/scheduling`: admin, front_desk, provider read/limited update.

## Workflow Connections

Desired operational flow:

1. Patient onboarding is completed.
2. Insurance/billing verification is checked.
3. Appointment is scheduled.
4. Automated reminder is sent.
5. Patient-provider messaging handles prep/follow-up.
6. Consultation/session happens.
7. Clinical note is created and signed.
8. Follow-up appointment is scheduled.
9. Billing record/invoice is finalized.

Cross-page relationships already represented in UI:

- Patient directory acts as the profile hub for onboarding readiness, billing readiness, scheduling, messages, and clinical notes.
- Doctor directory acts as the provider hub for schedule capacity, patient panel load, open notes, and credentialing/network readiness.
- Scheduling detail panel links conceptually to billing, clinical notes, and messages.
- Billing readiness depends on intake/onboarding and insurance verification.
- Clinical Notes New Note modal uses patient + appointment pairing.
- Messages panel shows upcoming appointment and provider.
- Onboarding collects insurance/billing info needed by Billing.

## Completed Features

- Next.js project set up with shadcn-style admin shell.
- Convex and Clerk references removed from copied reference UI.
- Firebase initialized:
  - Firebase App
  - Auth export
  - Firestore export
  - Storage export
  - browser-safe Analytics initializer
- Zustand global state added for patient/provider directory data.
- Login/register UI routes.
- Dashboard command center.
- Patient onboarding intake form with live summary.
- Billing & Insurance dashboard:
  - search
  - status filter
  - CSV export
  - reminder buttons
  - details drawer
  - invoice breakdown download
- Clinical Notes workbench:
  - notes list
  - SOAP editor
  - new note modal
  - patient context panel
  - improved SOAP section visibility/scrolling
- Patient Messages workspace:
  - conversations list
  - patient summary
  - message history
  - quick actions
  - local send behavior
- Patients directory:
  - search and status/risk filters
  - summary cards
  - patient table
  - profile/readiness detail panel
- Doctors directory:
  - search and specialty/status filters
  - summary cards
  - doctor table
  - new doctor modal
  - provider capacity/profile detail panel
- Scheduling calendar:
  - mini calendar
  - weekly grid
  - provider filter
  - new appointment modal
  - reminder automation banner
  - appointment detail panel
- `pnpm lint` and `pnpm build` have passed after latest feature work.

## Pending TODOs

### Backend/Auth

- Firebase SDK is installed and initialized.
- Move Firebase config to `NEXT_PUBLIC_*` environment variables before production.
- Implement real auth for login/register.
- Protect `/admin/*` routes.
- Implement RBAC in frontend route guards and Firestore rules.
- Add audit logging for clinical/billing/scheduling actions.

### Data Layer

- Replace static arrays/local state and Zustand seed data with Firestore reads/writes.
- Hydrate Zustand from Firestore collections.
- Add loading, error, empty, and permission states.
- Add validation schemas for intake, billing, notes, messages, scheduling.
- Add server actions or API routes if needed.

### Workflow Enhancements

- Patients:
  - Persist patient profiles.
  - Add edit/archive flows.
  - Add shared patient profile component used across notes/messages/scheduling/billing.
  - Link each patient to intakes, appointments, notes, billing, and conversations.

- Doctors:
  - Persist provider profiles.
  - Add edit/deactivate flows.
  - Add schedule template management.
  - Add patient panel assignment and capacity rules.

- Onboarding:
  - Save drafts.
  - Submit intake.
  - Upload insurance card.
  - Consent forms.

- Billing:
  - Real invoice generation.
  - Store CSV/export history.
  - Payment reminders via email/SMS later.
  - Insurance verification status transitions.

- Clinical Notes:
  - Provider-only signing.
  - Required fields by note type.
  - Version history.
  - Print/export note.

- Messages:
  - Read/unread state.
  - Attachments.
  - Escalation to provider.
  - Message templates.

- Scheduling:
  - Real conflict detection by provider/date/time.
  - Calendar date navigation.
  - Real Today/Week/Month views.
  - Appointment status persistence.
  - Reminder delivery status.
  - Reschedule/cancel flows.

### UI Polish

- Add active nav state to sidebar.
- Improve mobile layouts for workbench pages.
- Add loading skeletons once backend exists.
- Add empty states for filtered tables/lists.
- Add toast feedback for actions like Save, Send Reminder, Create Appointment.
- Consider a patient profile shared component for use across notes/messages/scheduling.

## Important User Preferences

- User wants UI-first before backend.
- User does not like pages that require awkward page-level scrolling; prefers contained workspaces with internal scroll areas.
- User prefers professional dashboard workflows with tables, drawers/modals, filters, exports, status colors, and automation cues.
- User frequently rejects generic dashboard placeholders; pages should match the real healthcare workflow.
- Use direct, usable screens rather than marketing/landing pages.
- Avoid Convex. The user explicitly asked to remove Convex from copied admin code.
