# Forge Production Plan

This document lists the work required before Forge is ready for public production use. It is intentionally based on the current implementation, Neon services, and the scope in `PLAN.md`.

## Current State

The app is running locally with a production build and has:

- Next.js App Router UI for public pages and client/trainer/admin previews.
- Neon Postgres on branch `production`.
- Neon Managed Auth with email/password and Google sign-in code.
- A server-side auth proxy at `/api/auth/[...path]`.
- Protected route redirects for dashboards and admin routes.
- A `public.user_profiles` table with client/trainer roles.
- A server-side `ADMIN_EMAILS` admin allowlist.
- Neon Object Storage, Functions, AI Gateway, and Realtime declared in `neon.ts`.
- Neon configuration and environment variables pulled into `.env.local`.

The app is not yet production-ready. Most marketplace workflows are previews rather than persistent, authorized services.

## Launch Blockers

Complete these items before accepting real users or payments.

### 1. Google OAuth

- Create a production Google OAuth web client.
- Add the Neon Auth callback URI for the production branch:

  `https://ep-solitary-violet-bd9zrwgj.neonauth.c-8.us-east-2.aws.neon.tech/neondb/auth/callback/google`

- Configure the actual client ID and secret on project `morning-mud-63683558`, branch `production`.
- Confirm `neon neon-auth oauth-provider list` shows a custom Google provider rather than `shared`.
- Add the public app origin to the branch trusted-domain list.
- Test Google sign-up, sign-in, sign-out, reload/session restoration, account linking, and OAuth error handling.
- Do not ship with the Neon shared development OAuth client.

### 2. Apple OAuth

Apple sign-in is deferred for now.

Before enabling it:

- Create Apple Services ID credentials.
- Obtain Apple Team ID and Key ID.
- Store the `.p8` private key only through Neon's secure configuration.
- Register the HTTPS callback with Apple.
- Configure Apple for the production branch.
- Test Apple sign-in and account linking.

### 3. Auth Hardening

- Set a stable `NEON_AUTH_COOKIE_SECRET` of at least 32 characters in every deployed environment.
- Store it in hosting-provider secrets, not in source control.
- Rotate the current local secret before production launch.
- Verify password sign-up, wrong-password behavior, password reset, email verification, and sign-out.
- Decide and configure the branch's email-verification policy.
- Configure custom production SMTP if verification links or production app branding are required.
- Add account deactivation and suspension behavior.
- Replace demo identities in dashboards with the authenticated Neon user and profile.
- Enforce authorization in every route and mutation, not only page redirects.
- Replace demo trainer/client/admin permissions with persisted role and membership checks.
- Add server-side rate limits and abuse protections for sign-in and auth endpoints.
- Configure trusted production and preview domains.

### 4. Postgres Schema and Data

The initial `user_profiles` table is a migration foundation, not the complete marketplace schema.

Create migrations for:

- User profiles and account status.
- Trainer applications and review status.
- Trainer profiles, verification, specialties, languages, locations, and pricing.
- Programs and lessons.
- Program purchases and purchase entitlements.
- Private video metadata and ownership.
- Conversations and text messages.
- Conversation membership and access checks.
- Session slots and bookings.
- Booking status, meeting links, cancellation, and rescheduling.
- Payments, refunds, commissions, payout ledger entries, and payout status.
- In-app notices.
- Content flags and moderation records.
- Favorites or saved coaches.

Before launch:

- Use direct/unpooled database URLs for migrations.
- Use pooled URLs for serverless application queries.
- Add foreign keys, constraints, indexes, and transaction boundaries.
- Add migration history and rollback procedures.
- Test migrations on an isolated Neon branch of production-like data.
- Use parameterized SQL or an approved ORM throughout.
- Remove demo-only constants from authenticated features.

## Stripe and Payments

Stripe is a launch blocker and is not implemented yet.

Before implementing:

- Confirm Stripe Connect eligibility for an India-based platform.
- Confirm supported trainer onboarding, payouts, tax, and statutory requirements.
- Obtain written or documented confirmation of payout rules for India.
- Decide whether Stripe processing fees are paid by the platform or customers.
- Complete GST/invoice/refund requirements with a qualified advisor.

Implementation requirements:

- Stripe credentials and webhook secrets must remain server-only.
- Implement hosted Checkout for programs and sessions.
- Implement Stripe Connect onboarding for trainers.
- Verify webhook signatures.
- Make every webhook idempotent.
- Store the provider event ID and processed state.
- Reconcile payments against database ledger records.
- Enforce 10% platform commission.
- Release program proceeds according to the agreed weekly schedule.
- Release session proceeds only after completion.
- Implement full refunds for trainer cancellation.
- Implement rescheduling and 24-hour cutoff rules.
- Implement safe handling for failed payments, partial failures, and duplicate events.
- Test India tax, refunds, payout failures, disputes, and account deactivation.

Do not promise automated payouts until Stripe eligibility is confirmed.

## Trainer Trust and Moderation

Implement:

- Trainer applications with reviewed profile data.
- Application approval and rejection workflows.
- One role per account, with a verified admin override process.
- Public trainer listing only after approval.
- Content hiding and removal.
- User suspension and session invalidation behavior.
- Audit logs for approval, role changes, suspension, and content moderation.
- Admin-only server endpoints.
- Separation between admin preview UI and real moderation authorization.

## Discovery and Public SEO

- Add server-rendered trainer and program detail pages.
- Add SEO metadata, canonical URLs, Open Graph images, and structured data.
- Submit an XML sitemap and configure robots.
- Prevent authenticated dashboards and filtered search pages from being indexed.
- Add real database-backed discovery filters.
- Add pagination and stable sort orders.
- Add empty states and 404 handling.
- Use optimized and legally licensed media.

## Programs and Video

- Implement trainer program creation and editing.
- Enforce program ownership server-side.
- Create real lesson records and video objects.
- Move private playback behind purchase entitlements.
- Use signed, short-lived Object Storage URLs or a private CDN.
- Enforce 500 MB per file and the intended duration cap.
- Validate upload type, size, duration, and malware if applicable.
- Prevent unauthorized direct object access.
- Record purchase and lesson-progress state.
- Test preview, purchase, playback, and entitlement revocation.

## Messaging and Realtime

- Store 1:1 conversations and messages in Postgres.
- Validate sender identity and both membership sides in every endpoint.
- Add message validation and content limits.
- Add per-user/per-conversation rate limits.
- Configure Neon Realtime with server-authorized subscriptions.
- Use a refresh or database fallback when Realtime is unavailable.
- Test cross-user isolation and reconnect behavior.
- Add in-app message notifications.
- Define retention, deletion, and moderation behavior.
- Do not expose `NEON_REALTIME_SECRET` to browser code.

## Booking and Sessions

- Implement trainer-defined availability slots.
- Enforce 12-hour minimum notice.
- Enforce a 60-day maximum horizon.
- Prevent slot races and double-booking with database constraints or transactions.
- Create bookings only after verified payment.
- Generate a unique external meeting link per booking.
- Implement cancellation and rescheduling at least 24 hours before the session.
- Handle trainer cancellations and full refunds.
- Send in-app status notices.
- Implement post-session completion and payout release.

## Dashboards

Replace demo data and routes with real data for:

- Client purchases and learning progress.
- Client bookings and cancellations.
- Client and trainer conversations.
- Trainer programs and lesson management.
- Trainer clients.
- Trainer availability.
- Trainer earnings and payout history.
- Account profile settings.
- Notifications.
- Admin moderation tools.

The current dashboard also displays hard-coded names and sessions. These must be removed before production.

## AI Gateway

Neon AI Gateway is provisioned but not application-wired.

Before enabling it:

- Buy Neon AI Gateway credits.
- Select the exact allowed models.
- Store provider/model configuration server-side.
- Implement model-routing and fallback behavior.
- Add request budgets and provider timeouts.
- Add rate limits and abuse protections.
- Scrub prompts and logs for PII.
- Record relevant usage and cost.
- Add a graceful disabled/credit-exhausted response.
- Document whether AI output is used for chat, moderation, or coaching features.

No AI Gateway feature is required for the current core MVP, so it can remain disabled until a concrete product requirement exists.

## Object Storage

Object Storage is declared with a private `assets` bucket.

Before use:

- Configure CORS and trusted origins.
- Establish naming and folder conventions.
- Create server-generated presigned-upload URLs.
- Validate content type and size.
- Keep access keys server-only.
- Use short-lived signed download URLs for private content.
- Implement deletion and orphan cleanup.
- Test public assets versus private purchase-gated assets.

## Neon Functions

The `hello` sample function is deployed and passes an HTTP smoke test.

Before use:

- Replace it with the real domain function.
- Verify JWT or managed session access as required.
- Apply the same authorization rules used by Next.js route handlers.
- Store secrets only in deployed environment variables.
- Implement request validation, timeouts, and structured logs.
- Test on production-like Neon branches.

## Hosting and Domains

- Deploy to Vercel or the final hosting provider.
- Configure production environment variables.
- Configure a production custom domain.
- Configure a trusted production and preview origin in Neon Auth.
- Configure TLS and security headers.
- Redirect HTTP to HTTPS.
- Set secure cookie behavior and the correct cookie domain.
- Configure preview-branch environment variables separately.
- Use the direct database URL only for migrations.
- Verify build-time and runtime environment parity.
- Add `robots.txt`, metadata, and an indexability policy.

## Testing

Run focused automated and browser tests for:

- Email/password sign-up and sign-in.
- Google OAuth sign-in.
- Apple OAuth if enabled.
- Sign-out and reload/session restoration.
- Protected routes and direct unauthenticated API requests.
- Wrong password and auth error states.
- Trainer application and approval.
- Role change and account suspension.
- Public discovery and SEO pages.
- Search filters and pagination.
- Program purchase and entitlements.
- Private video playback.
- Unauthorized video access.
- Conversation membership and chat authorization.
- Realtime subscription isolation.
- Booking availability and double-booking.
- Stripe success, failure, refund, dispute, and idempotency.
- Cancellation and rescheduling.
- Payout releases.
- Admin authorization.
- Mobile and desktop layouts.
- Keyboard navigation and accessibility.
- Sensitive-data log scrubbing.

## Observability and Operations

- Add Sentry with PII scrubbing.
- Configure release tracking and source maps.
- Add structured application and API logs.
- Configure database and auth alerts.
- Monitor Auth failures and OAuth errors.
- Monitor Neon compute, database, and egress usage.
- Monitor Stripe webhook failures.
- Monitor background jobs and payout states.
- Create a production incident checklist.
- Define backup and restore procedures.
- Define account and data deletion procedures.
- Create a support workflow for booking, refund, and trainer issues.

## Security

- Remove secrets from source control and chat history.
- Rotate the Neon Auth cookie secret.
- Rotate any exposed credentials.
- Add security headers and dependency scanning.
- Review OAuth callback URL allowlists.
- Enforce least-privilege database access.
- Test authorization on every resource type.
- Sanitize rendered user content.
- Add CSRF protections where applicable.
- Add upload and file-download authorization.
- Add abuse prevention for auth and messaging.
- Complete a final security review before launch.

## Dependency and Maintenance

- Review and address current npm vulnerabilities.
- Pin and periodically update Next.js, React, and Neon packages.
- Keep server and browser SDK behavior aligned.
- Add automated dependency updates and review policies.
- Document supported Node, npm, and deployment versions.
- Add CI for lint, build, migration checks, and tests.

## Launch Checklist

- [ ] Production Google OAuth configured and verified.
- [ ] Production custom SMTP configured, if needed.
- [ ] Apple OAuth configured only if required.
- [ ] Production cookie secret set and rotated.
- [ ] Production domain and trusted origins configured.
- [ ] Stripe India eligibility confirmed.
- [ ] Stripe Checkout, webhooks, refunds, and payouts implemented.
- [ ] Database schema and migrations complete.
- [ ] End-to-end auth verified.
- [ ] Authorization tests pass for every resource.
- [ ] Program purchase and private-video access pass.
- [ ] Chat membership and Realtime isolation pass.
- [ ] Booking, cancellation, and payout flows pass.
- [ ] Trainer review and moderation complete.
- [ ] Public SEO metadata and indexing rules complete.
- [ ] Sentry and logs configured.
- [ ] Security review complete.
- [ ] Accessibility and mobile checks complete.
- [ ] Vercel or production hosting environment complete.
- [ ] Production backup and incident procedures documented.
