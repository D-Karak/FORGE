# Implementation Plan

## Goal

Build a focused, mobile-first coaching marketplace for India using Next.js App Router, Neon, Stripe, Sentry, ImageKit, and Vercel. Keep the first release centered on trainer discovery, paid video programs, text chat, online 1:1 bookings, and small client/trainer/admin dashboards.

## Agreed v1 scope

- India-only users and INR checkout/payouts; keep country and currency fields extensible for later USD/EUR support.
- Public, SEO-indexable landing, trainer profiles, and program details. Keep search results and authenticated pages out of search indexes.
- Email/password and Google sign-in through Neon Managed Better Auth initially; Apple sign-in is deferred. One role per account; trainer applications require profile review and approval before listing.
- Trainer-created one-time programs with ongoing buyer access. Private ImageKit video playback requires a purchase; 500 MB per file and an assumed 120-minute duration cap.
- Text-only client/trainer chat, available before purchase, with basic rate limits and Neon Realtime beta subscriptions authorized server-side.
- Paid online 1:1 bookings: trainer-defined slots, 12-hour notice, 60-day booking horizon, automatic confirmation after payment, and a per-booking external meeting link.
- 24-hour cancellation/rescheduling cutoff; full refund for trainer cancellations. 10% platform commission on programs and sessions. Program proceeds paid weekly; session proceeds after completion.
- Minimal admin controls: trainer approval, content hiding, and basic user suspension. App-generated email is out of scope; use in-app notices.
- Sentry error/performance monitoring with sensitive data scrubbed. Next.js hosted on Vercel; no separate Render service in v1.

## Implementation sequence

1. **Create the Next.js project and project plan.** Scaffold a current stable Next.js App Router project in a `coach-platform/` subdirectory of the current workspace, then create `coach-platform/PLAN.md` with the agreed product scope, implementation phases, assumptions, and launch gates before adding product features. The subdirectory avoids modifying existing workspace metadata.
2. **Establish the application foundation.** Check official docs for current stable versions; choose and document a Neon-compatible ORM, schema/migrations, environment validation, secure server/client boundaries, and local/preview/production configuration. Use Vercel previews and Neon branches.
3. **Validate launch prerequisites.** Obtain Stripe confirmation that an India-based platform can use Connect for the required trainer onboarding and automated payouts. Confirm the Neon Realtime beta is available in the chosen region. Check current provider limits and free-tier suitability for ImageKit video storage and playback. Do not silently substitute another payout provider if Stripe eligibility fails.
4. **Implement identity and trust controls.** Integrate Neon Managed Better Auth with email/password and Google OAuth initially; model client, trainer, and admin roles; implement trainer application/review, approval, role-change support, content hiding, and user suspension. Apple OAuth is deferred until its provider credentials are available.
5. **Build discovery and programs.** Add indexable trainer/program pages and non-indexed filtered search for goal, specialty, program/session price, city/state, and language. Add trainer program management and ImageKit uploads, with purchase-gated signed playback and buyer entitlements.
6. **Add messaging and dashboards.** Implement text-only 1:1 chat with server-validated conversation membership, sealed Neon Realtime subscriptions, rate limits, and refresh fallback. Add client and trainer dashboards for purchases, bookings, chats, programs, availability, clients, and earnings.
7. **Implement checkout, bookings, and payouts.** After the Stripe eligibility gate, integrate hosted Checkout, verified/idempotent webhooks, 10% commission accounting, and Connect onboarding/transfers. Add session slot booking, per-booking meeting links, cancellation/refund rules, and payout release rules. Keep Stripe test/live credentials and webhook secrets server-only.
8. **Verify and launch.** Add focused automated coverage for trainer approval; discovery, purchase, and video entitlement; chat authorization; booking, payment, cancellation/refund; and payout states. Add Sentry with PII scrubbing, responsive/accessibility checks, SEO metadata, and Vercel production configuration.

## Open decisions and risks

- Stripe Connect eligibility for an India-based platform is unconfirmed; this blocks committing to automated payouts.
- Stripe processing-fee allocation is undecided. India tax/GST, invoicing, and statutory refund requirements need business/accounting guidance before launch.
- Neon Realtime is beta and lacks RLS; every subscription must be authorized server-side and tested for cross-user data isolation.
- Validate current stable framework/library versions, Neon Realtime regional availability, and ImageKit/Neon/Sentry free-tier limits during foundation work.
- Initial user scale, uptime/performance targets, and ORM preference are not specified.
- The initial auth implementation uses Neon Auth and a Postgres `user_profiles` table with a checked-in SQL migration; Google production OAuth credentials still need to be configured in Neon.
