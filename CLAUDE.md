@AGENTS.md

# Memento Mori — Technical Architecture Documentation

## 1. Project Overview

**Memento Mori** is a contemplative web application that visualizes a user's life in weeks and sends weekly email reminders for each completed week of life. Given a birth date and expected lifespan, it renders a grid where every square is one week of life (shaded if past, empty if future), along with stats (years/weeks/days remaining, percentage lived) and a rotating philosophical quote. Users may opt in to receive a weekly email on each newly completed week of life.

- **Core problem:** translates the abstract passage of time into something visceral, giving the user a concrete prompt to reflect on how remaining time is used.
- **Target users:** individuals interested in stoicism, memento-mori practices, intentional living, and personal productivity. The UI is in Brazilian Portuguese (`pt-BR`).
- **Status:** Early MVP / personal project. Authored by Lucas Eduardo Schuster. Single maintainer. Single production deployment (implied by `APP_URL` env var; concrete host not declared in repo).
- **Repository:** `github.com/LucasESchuster/memento-mori` (linked from the homepage).
- **External resources:** Resend for email delivery; PostgreSQL (local via Docker Compose, remote for production).

## 2. Tech Stack

### Frontend
- **Next.js 16.2.4** (App Router, React Server Components).
- **React 19.2.4** / **React DOM 19.2.4**.
- **TypeScript 5** (strict mode).
- **Tailwind CSS v4** (PostCSS plugin `@tailwindcss/postcss`) with `tw-animate-css`.
- **Radix UI primitives** (via `radix-ui`) and **shadcn** (style preset `radix-nova`, base color `neutral`, icons from `lucide-react`).
- **Framer Motion 12** for scroll/entrance animations.
- **Zod 4** for client/server schema validation.
- **Google Fonts** via `next/font/google` — Geist (sans) + Cormorant Garamond (serif/italic) for the stoic typographic tone.

### Backend
- **Next.js Route Handlers** (`app/api/**/route.ts`) — no separate backend server; logic runs as serverless functions co-located with the frontend.
- **Prisma 6.19** (`@prisma/client`) as ORM.
- **Zod** for request body validation.
- **Node crypto** for token generation (`randomBytes(32).toString("hex")`).

### Database
- **PostgreSQL 16** (relational).
- Locally run via **Docker Compose** (`postgres:16-alpine`).
- Production host not configured in-repo (assumed managed Postgres — Supabase/Neon/Railway/RDS are plausible; see "Questions to Resolve").

### Infrastructure
- **Deployment target:** Next.js project, almost certainly deployed to Vercel or equivalent Next.js-friendly platform (README links default Vercel deployment; no explicit Dockerfile for the app, no CI workflows in repo).
- **No CI/CD files** detected (`.github/`, `.gitlab-ci.yml`, etc. not present).
- **No CDN config** beyond what Next.js/Vercel provide by default.
- **Weekly email job:** shipped as a CLI script (`scripts/send-weekly.ts` via `tsx`) — expected to be invoked by an external cron (Vercel Cron, platform scheduler, or cronjob on a VPS). The trigger mechanism is **not declared in the repo**.

### Third-party services
- **Resend** (`resend` SDK v6.12) — transactional email sending.
- **@react-email/components** — JSX-based email templates rendered to HTML + plaintext at send time.
- No analytics, payments, authentication provider, or object storage.

### Why these choices (where non-obvious)
- **Next.js App Router for a full-stack single codebase:** frontend, API routes, and email rendering share one TS project, reducing moving parts for a single-maintainer MVP.
- **React Email instead of HTML strings or MJML:** allows templates to share TypeScript types (`LifeStats`, `Quote`) with the rest of the app and produce accessible plaintext + HTML from the same source.
- **Prisma over raw SQL / Drizzle:** single entity, trivial CRUD — Prisma's ergonomics and built-in migration tooling outweigh its runtime overhead.
- **Double opt-in with tokens in URL (no passwords, no sessions):** matches the product's low-friction, non-account model; the unsubscribe token doubles as an edit token (see ADR-3).

## 3. Architecture

### Style
**Modular monolith inside a Next.js App Router project**, with an out-of-band CLI script for scheduled work. There are no microservices, no message queues, no background workers beyond the cron-invoked script.

### Main components

| Component | Location | Responsibility |
|---|---|---|
| Home page (Client Component) | `app/page.tsx` | Captures birth date + life expectancy, computes stats locally, renders the grid, prompts subscription. |
| Edit page (Server Component) | `app/edit/page.tsx` | Server-renders a preferences editor using the unsubscribe token from the URL. |
| Subscribe API | `app/api/subscribe/route.ts` | Validates input, creates/updates `Subscription`, triggers confirmation email. |
| Confirm API | `app/api/confirm/route.ts` | Consumes the confirmation token, marks `confirmedAt`, returns an HTML page. |
| Unsubscribe API | `app/api/unsubscribe/route.ts` | Accepts GET or one-click POST (RFC 8058), sets `unsubscribedAt`. |
| Subscription API | `app/api/subscription/route.ts` | GET/PATCH preferences via unsubscribe token (used by the edit page). |
| Email renderer | `lib/resend.ts` + `emails/*.tsx` | Renders React Email templates to HTML + plaintext, sends via Resend. |
| Prisma client singleton | `lib/db.ts` | Shared DB client; cached on `globalThis` to avoid reconnect storms in dev. |
| Weekly sender | `scripts/send-weekly.ts` | Iterates active subscriptions, sends the weekly email when a new week has completed, updates `lastSentWeek`/`lastSentAt`. |

### Communication
- Browser ↔ server: **REST-like JSON** over HTTPS to Next.js route handlers. Mostly `application/json`; unsubscribe also accepts `application/x-www-form-urlencoded` to support the mail-client one-click button.
- Server ↔ DB: Prisma over TCP to PostgreSQL.
- Server ↔ Resend: HTTPS via Resend SDK.
- Cron ↔ `send-weekly.ts`: process invocation (the container/platform runs `npm run send-weekly`).

### Request lifecycle — typical subscribe flow
1. Client submits the form on `/`. React state holds `birthDate`, `lifeExpectancy`, `email`.
2. `POST /api/subscribe` with JSON body. In-memory IP-based rate limit (5/h) is checked.
3. Zod validates (`email`, `birthDate` ISO string, `lifeExpectancy` int 60–100).
4. Prisma `findUnique({ email })` — if already confirmed & active → short-circuit `already_subscribed`.
5. Generate `confirmToken = randomBytes(32).hex()`; reuse existing `unsubscribeToken` for returning users, otherwise generate one.
6. Upsert the `Subscription` row (resetting `confirmedAt`, `unsubscribedAt`, `lastSentWeek` on re-subscribe).
7. Render `ConfirmEmail` via `@react-email/components` → HTML + text.
8. Resend SDK sends the email.
9. Respond `201` (new) or `200` (re-subscribe) with `{ status: "confirmation_sent" }`.
10. User clicks the link → `GET /api/confirm?token=...` → Prisma updates `{ confirmedAt: now, confirmToken: null }` → returns inline HTML success page.

### SSR vs client
- **Home (`/`)** is a Client Component — calculations and grid rendering happen entirely in the browser; `localStorage` persists the last-entered `birthDate`/`lifeExpectancy`. No DB read is required to visualize a life.
- **Edit (`/edit`)** is a Server Component with `dynamic = "force-dynamic"` — the page fetches the subscription server-side using the token before hydrating the form. The form submits PATCH back through the API.
- **Confirm / Unsubscribe pages** return raw inline HTML from the route handler (not React) — intentionally minimal, no JS runtime needed.

## 4. Project Structure

Rooted at the repository root:

```
app/                      # Next.js App Router
  layout.tsx              # Root layout, font loading, metadata
  page.tsx                # Home (client-side life visualizer)
  globals.css             # Tailwind + theme tokens
  icon.svg, favicon.ico   # Site icons
  edit/page.tsx           # Server-rendered preferences editor
  api/
    subscribe/route.ts
    confirm/route.ts
    unsubscribe/route.ts
    subscription/route.ts
components/               # React components
  LifeForm.tsx            # Shared form (birth date + slider)
  LifeStats.tsx           # Numerical stats display
  LifeBar.tsx             # Horizontal progress bar
  WeeksGrid.tsx           # 52-wide grid of week squares
  Quote.tsx               # Quote display with refresh
  SubscribeForm.tsx       # Email opt-in form
  EditForm.tsx            # Preferences editor (client side of /edit)
  ui/                     # shadcn-generated primitives (button, card, input, slider)
emails/                   # React Email templates
  ConfirmEmail.tsx
  WeeklyEmail.tsx
lib/                      # Domain + infrastructure helpers
  calculations.ts         # Pure functions: life stats, date validation
  weeks.ts                # weekOfLife(birthDate, now)
  db.ts                   # Prisma singleton
  resend.ts               # Resend client + sendConfirmEmail / sendWeeklyEmail
  tokens.ts               # randomToken(bytes)
  quotes.ts               # Curated quote array + pickRandomQuote(exclude?)
  utils.ts                # shadcn cn() utility
prisma/
  schema.prisma
  migrations/*/migration.sql
scripts/
  send-weekly.ts          # Cron-invoked weekly sender
public/                   # Static assets (default Next.js placeholders)
docker-compose.yml        # Local Postgres
.env.example              # Env var template
AGENTS.md / CLAUDE.md     # AI assistant guidance (CLAUDE.md → AGENTS.md)
```

### Conventions
- **Path alias:** `@/*` maps to the project root (`tsconfig.json` `paths`).
- **Client vs server:** files beginning with `"use client"` are Client Components; everything else in `app/` is a Server Component by default.
- **Feature-flat organization:** there is no per-feature folder — only `components/`, `lib/`, `emails/`, `app/api/<resource>/`. Appropriate for the project's small surface.
- **`ui/` subfolder** is reserved for shadcn primitives (`components.json` declares `@/components/ui` alias).
- **File naming:** React components use PascalCase `.tsx`; pure modules in `lib/` use lowercase. Route handlers live in `route.ts` files per App Router convention.

## 5. Key Architectural Decisions (ADRs)

### ADR-1 — No authentication; token-in-URL for all post-signup actions
- **Decision:** Users never create a password or session. All post-signup actions (confirm, edit, unsubscribe) are authorized solely by possession of a long opaque token (`randomBytes(32).hex()` = 64 hex chars) emailed to the user.
- **Context:** The product is a one-email-per-week reminder; creating accounts would kill signup conversion and wasn't justified by product surface.
- **Alternatives considered:** magic-link sessions, social login, passwordless accounts.
- **Consequences:** (+) Frictionless UX, minimal code, no session infrastructure. (−) Anyone with the token can edit or unsubscribe — the token should be treated as a password-equivalent and never logged. (−) No way to rotate or invalidate a leaked token short of unsubscribing and re-subscribing. (−) No multi-device "my account" view possible.

### ADR-2 — Double opt-in via `confirmToken`
- **Decision:** `POST /api/subscribe` never activates a subscription. It stores a pending row with a `confirmToken` and sends an email; only a click on that link sets `confirmedAt`.
- **Context:** Prevents signup spam, address-typo waste, and protects sender reputation.
- **Alternatives considered:** single opt-in, captcha-only.
- **Consequences:** (+) Compliance with email best practices (GDPR/LGPD friendly, Resend-friendly). (−) One extra round-trip before the user starts receiving mail. (−) Abandoned pending rows accumulate — no cleanup job exists yet (see technical debt).

### ADR-3 — Same token used for unsubscribe and edit (`unsubscribeToken`)
- **Decision:** The `unsubscribeToken` is the single key for `/api/unsubscribe`, `/api/subscription` (GET/PATCH), and `/edit`. The `confirmToken` is separate, single-use, and nulled on confirm.
- **Context:** Weekly emails need both an unsubscribe link (required for deliverability + one-click via `List-Unsubscribe-Post`) and an "edit preferences" link. One stable token keeps URLs short and the schema simple.
- **Alternatives considered:** separate `editToken`; signed short-lived JWTs per action.
- **Consequences:** (+) One generation, one index, one unique constraint. (−) Unsubscribe link leakage = edit capability leakage. (−) No per-action expiration.

### ADR-4 — Client-side computation for the public visualizer
- **Decision:** The life-in-weeks grid is computed entirely in the browser from `birthDate` + `lifeExpectancy` held in React state and `localStorage`. The homepage never hits the DB unless the user subscribes.
- **Context:** The visualizer is the product's hook; it must be instant, work offline-ish, and not cost the backend anything for anonymous visitors.
- **Alternatives considered:** SSR with no persistence; user accounts with server-side state.
- **Consequences:** (+) Zero backend cost for browsing. (−) Hydration dance required to avoid SSR/CSR mismatch on return visits (see the `hydrated` flag and inline ESLint disable in `app/page.tsx`).

### ADR-5 — Weekly emails via a CLI script, not a queued worker
- **Decision:** A single `tsx` script walks all active subscriptions, decides per-row whether a new week has elapsed, and sends sequentially. Idempotency comes from comparing `weekOfLife(...)` against `lastSentWeek` before sending and updating it immediately after success.
- **Context:** Volume is tiny; a queue is premature engineering.
- **Alternatives considered:** BullMQ + Redis, Resend scheduled sends, per-user cron jobs.
- **Consequences:** (+) Simple, debuggable, no extra infra. (−) Sequential — at scale the loop becomes O(n) per tick. (−) A single failure logs and continues, but there's no retry queue or DLQ. (−) If the script runs twice simultaneously there's a race (no row-level locking); idempotency holds only because `lastSentWeek` rarely changes between runs.

### ADR-6 — In-memory rate limiting on subscribe
- **Decision:** A `Map<ip, { count, resetAt }>` in the process memory limits subscribe to 5 per IP per hour.
- **Context:** Simple abuse mitigation without introducing Redis.
- **Consequences:** (+) Zero-config. (−) Does not work across multiple serverless instances — on a multi-instance deployment the effective limit is `5 × instanceCount`. Acceptable while traffic is low; needs replacement at scale.

### ADR-7 — Prisma schema with soft-state flags rather than separate tables
- **Decision:** `Subscription` carries `confirmedAt`, `unsubscribedAt`, `lastSentWeek`, and `lastSentAt` in-row. Pending/active/cancelled states are encoded as timestamp presence.
- **Context:** One entity, no history requirements, no auditing needs.
- **Consequences:** (+) Trivial querying (`confirmedAt != null AND unsubscribedAt = null`). (−) No history of sends (can't answer "show me the last 5 emails this user received" without logs). (−) Re-subscribe resets `lastSentWeek` to 0 and nulls `unsubscribedAt`, erasing previous lifecycle state.

## 6. Data Model

Single model: `Subscription` (`prisma/schema.prisma`).

| Field | Type | Notes |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `email` | `String` | **Unique** — lowercased before insert (Zod `.toLowerCase()`). |
| `birthDate` | `DateTime @db.Date` | Stored as pure date (no time/tz). Migrated from `birthYear` Int in `20260416020000_birth_year_to_date`. |
| `lifeExpectancy` | `Int` | Range 60–100 enforced at the API layer (Zod). |
| `unsubscribeToken` | `String` | **Unique**. Stable for the row's lifetime; used for unsubscribe AND edit. |
| `confirmToken` | `String?` | **Unique when present**. Nulled on first successful confirm. |
| `confirmedAt` | `DateTime?` | Presence = subscription is active (once token is consumed). |
| `unsubscribedAt` | `DateTime?` | Presence = cancelled; re-subscribe clears it. |
| `lastSentWeek` | `Int @default(0)` | Highest week number for which an email has been sent. Guards idempotency. |
| `lastSentAt` | `DateTime?` | Last send timestamp (observability only). |
| `createdAt` | `DateTime @default(now())` | |

### Indexes
- Three unique indexes: `email`, `unsubscribeToken`, `confirmToken`.
- Composite `(confirmedAt, unsubscribedAt, lastSentAt)` — supports the scheduled job's filter and potential ordering.

### Relationships
None — single table.

### Non-obvious constraints
- **Re-subscribe overwrites**: `app/api/subscribe/route.ts` updates an existing row (including previously-cancelled ones) rather than inserting a second one. This is why `email` is unique.
- **`unsubscribeToken` must never be rotated** during normal edits — the live email links in the user's mailbox depend on it.
- **No soft-delete** of the row itself; cancellation is represented by `unsubscribedAt`.
- **No cleanup** of pending (`confirmedAt IS NULL`) rows older than N days — accumulates indefinitely.

## 7. Authentication & Authorization

There is **no user authentication system**. Access control is strictly token-based:

| Capability | Required token | Location |
|---|---|---|
| Create/re-create subscription | None (rate-limited by IP) | `POST /api/subscribe` |
| Activate subscription | `confirmToken` (single-use, then nulled) | `GET /api/confirm?token=...` |
| Cancel subscription | `unsubscribeToken` | `GET`/`POST /api/unsubscribe?token=...` |
| Read/edit preferences | `unsubscribeToken` | `GET`/`PATCH /api/subscription?token=...` and `/edit?token=...` |

### Token properties
- Generated with `crypto.randomBytes(32).toString("hex")` → 256 bits of entropy, 64-char hex.
- `confirmToken`: single-use, nulled on consumption.
- `unsubscribeToken`: stable for the lifetime of the row. No expiry.

### No refresh / no session
- Tokens never expire by design. A compromised `unsubscribeToken` can only: read that row's preferences, modify birth date & life expectancy, or cancel.
- There is no admin UI, admin auth, or service-to-service auth. The weekly sender runs with direct DB access via `DATABASE_URL`.

### Protected route guards
- `app/edit/page.tsx` resolves the token server-side and renders different shells for "missing/invalid token" / "already unsubscribed" / "valid" states before handing off to the client form.
- API routes return `400 missing_token`, `404 not_found`, or `200` with a rendered HTML page depending on the route.

## 8. Core Business Rules

1. **Subscriptions are unique by `email` (lowercased).** Two signup requests for the same email **do not** produce two rows — the existing row is reset (re-pending, `lastSentWeek = 0`, tokens refreshed where applicable). Violation = duplicate weekly emails.
2. **An email is "active" iff `confirmedAt != null AND unsubscribedAt = null`.** The weekly sender's `where` clause (`confirmedAt: { not: null }, unsubscribedAt: null`) enforces this in code. Breaking this invariant = sending to unconfirmed or cancelled users.
3. **Confirmation is single-use.** After first confirm, `confirmToken` is nulled. Clicking the link again shows "already confirmed."
4. **The weekly email is idempotent per week of life.** `if (currentWeek <= sub.lastSentWeek) continue;` — re-running the script the same day is safe. Violating this (e.g., updating `lastSentWeek` before send succeeds) = duplicate sends.
5. **No email is sent past the expected lifespan.** `if (currentWeek >= totalWeeks) continue;` — the simulated lifetime ends at `lifeExpectancy * 52` weeks.
6. **`totalWeeks = lifeExpectancy * 52`** in the email/job context, but the UI's `LifeStats` uses `Math.round(lifeExpectancy * 52)`. Keep consistent when modifying: the values line up only because `52` is an integer.
7. **`lifeExpectancy` is clamped to 60–100 years at the API boundary.** Enforced by Zod in `/api/subscribe` and `/api/subscription` PATCH. The homepage slider also clamps to this range.
8. **`birthDate` must be between 1900-01-01 and today.** UI-enforced via input `min/max` and `isValidBirthDate`; server-side only via Zod `.date()` (which **does not** enforce range — see "Technical Debt").
9. **Rate limit is 5 subscribe attempts per IP per hour** (in-memory). Over the limit → `429 too_many_requests`.
10. **`unsubscribeToken` authorizes edits.** Anyone who forwards their weekly email hands over full edit+cancel power. Rule is enforced by convention — every route checks the token.
11. **The homepage persists inputs in `localStorage` under the key `memento-mori:inputs`.** Changes to this key's shape must be backward-compatible (parser defensively ignores invalid types).
12. **Email "from" must match a Resend-verified domain.** Misconfiguring `EMAIL_FROM` breaks all sending with no fallback.
13. **The `send-weekly` script must run at least once per week per subscriber**, but running it hourly is safe (idempotent per week). Missing runs cause a week to be skipped silently and permanently (because `lastSentWeek` monotonically advances to current on the next run — the gap is never backfilled).
14. **Re-subscribing resets lifecycle state.** If a user cancels then resubscribes, `lastSentWeek` is reset to 0 but they will only receive mail for weeks going forward — the loop's `currentWeek <= lastSentWeek` check is not what prevents backfill; what prevents it is that `lastSentWeek` gets updated to `currentWeek` on the *first* post-resubscribe send. Reviewers should re-read `app/api/subscribe/route.ts` before changing this flow.
15. **All user-facing copy is Brazilian Portuguese.** Code comments and identifiers are English; strings are `pt-BR`. Keep mixed-language separation when contributing.

## 9. API Overview

- **Style:** REST-like JSON over HTTPS, hand-written Next.js route handlers. No OpenAPI/Swagger spec.
- **Base URL:** `${APP_URL}` (env). No versioning prefix (`/api/...`).
- **Auth:** No auth header. Per-endpoint token query param where needed.
- **Error format:** `{ "error": "<slug>", "issues"?: ZodIssue[] }` for JSON responses. HTML routes return `200` with a rendered error page (not ideal — see debt).

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/subscribe` | POST | none (rate-limited) | Create or re-create a pending subscription; triggers confirmation email. |
| `/api/confirm?token=...` | GET | `confirmToken` | Activate subscription; returns inline HTML page. |
| `/api/unsubscribe?token=...` | GET, POST | `unsubscribeToken` | Cancel; POST supports `application/x-www-form-urlencoded` for one-click (`List-Unsubscribe-Post`). |
| `/api/subscription?token=...` | GET | `unsubscribeToken` | Read current preferences as JSON. |
| `/api/subscription?token=...` | PATCH | `unsubscribeToken` | Update `birthDate` and `lifeExpectancy`. |

### Status code conventions
- `200` — success (JSON) or HTML-rendered state page.
- `201` — first-time subscription created.
- `400` — missing/invalid JSON or token; includes `invalid_input` with Zod issues.
- `404` — `not_found` (token does not match any row).
- `429` — `too_many_requests` (rate limit).
- `500` — `email_send_failed` (Resend threw).

## 10. State Management & Key Flows

### Frontend state
- No global store (no Zustand/Redux/Jotai). Plain React `useState` + `useEffect`.
- Homepage hydrates from `localStorage` (key `memento-mori:inputs`) after mount to avoid SSR mismatch.
- Edit page hydrates initial values from server-fetched subscription data.
- Form statuses are local string unions: `"idle" | "sending" | "sent" | "error"` (subscribe), `"idle" | "saving" | "saved" | "error"` (edit).

### Flow A — Anonymous visualization
1. Browser opens `/`.
2. Effect reads `localStorage`; if valid birth date present, immediately computes stats + shows the grid and quote.
3. User submits the form → recompute locally → persist to `localStorage`. No network call.

### Flow B — Subscribe + confirm
1. User clicks "Receber lembretes" on the homepage → `POST /api/subscribe`.
2. Backend validates, upserts `Subscription`, sends confirm email.
3. UI transitions to `sent` state with "check your inbox" copy.
4. User clicks the Resend email → `GET /api/confirm?token=...` → HTML success page.

### Flow C — Weekly send
1. Platform cron runs `npm run send-weekly` (at least weekly, safely more often).
2. Script loads active subs, computes `weekOfLife(birthDate, now)`.
3. Skips rows where `currentWeek <= lastSentWeek` or `currentWeek >= totalWeeks`.
4. For each eligible row: render email, send via Resend with `List-Unsubscribe` + `List-Unsubscribe-Post` headers, update `lastSentWeek`/`lastSentAt`.
5. Log send/skip/fail counts.

### Flow D — Edit preferences
1. User clicks "Editar preferências" in a weekly email → `/edit?token=...`.
2. Server Component reads subscription, renders `EditForm` with initial values.
3. Submit → `PATCH /api/subscription?token=...` with `{ birthDate, lifeExpectancy }`.
4. Server updates the row; UI shows "Suas preferências foram atualizadas."

### Real-time / async notes
- No WebSockets, SSE, or optimistic updates.
- Framer Motion animations are presentation-only.
- Email sends are awaited synchronously inside the API handler (subscribe blocks on Resend response).

## 11. Environment & Configuration

Env vars are loaded from a `.env` file via Next.js at runtime and explicitly via `tsx --env-file=.env` for the cron script.

| Variable | Category | Required | Notes |
|---|---|---|---|
| `DATABASE_URL` | Database | yes | Postgres connection string. Local default points at Docker Compose. |
| `RESEND_API_KEY` | Email provider | yes | Validated lazily via `requireEnv()` in `lib/resend.ts`. |
| `EMAIL_FROM` | Email provider | yes | Must be a domain verified in Resend. |
| `APP_URL` | App config | yes | Used to construct confirm/unsubscribe/edit URLs embedded in emails. |
| `NODE_ENV` | Runtime | no | Toggles Prisma log verbosity and skips global client cache in production. |

### Management
- `.env.example` is the source of truth for required keys. **No** secrets manager is integrated.
- No feature flags.
- Environment differences: only the values of the four env vars above change. There's no staging-specific code path.

## 12. Testing Strategy

**There are no tests in the repository.** No test runner, no spec files, no CI.

- **Unit tests:** absent. `lib/calculations.ts` and `lib/weeks.ts` are pure and would be trivial targets.
- **Integration tests:** absent. Route handlers are not exercised.
- **E2E:** absent.
- **Email template preview:** `ConfirmEmail.PreviewProps` and `WeeklyEmail.PreviewProps` are defined, suggesting templates are reviewed via `react-email` dev preview when needed, though no `npm` script wires it up.
- **How to run:** N/A — nothing to run. `npm run lint` (`eslint`) and `npm run build` (`prisma generate && next build`) are the only safety nets.

## 13. Known Limitations & Technical Debt

- **No tests, no CI.** Critical business logic (week calculation, re-subscribe flow, idempotency) is unguarded against regressions.
- **`DATABASE_URL` used by the weekly script holds write access.** No least-privilege role for the cron job.
- **In-memory rate limiter** fails open across multiple serverless instances — trivially bypassable in scale-out.
- **Confirm/unsubscribe routes return `200` even for errors** (invalid token, already used). Easier UX but breaks REST semantics; any future machine consumer will be misled.
- **No cleanup of stale pending subscriptions** (`confirmedAt IS NULL` + old `createdAt`). They accumulate indefinitely and hold the unique email slot.
- **Server-side birth-date range not enforced.** Zod `.date()` only validates shape; a body with `"1800-01-01"` would be accepted server-side (UI clamps it, so benign today).
- **Weekly sender is sequential with no retry / DLQ / jitter.** A transient Resend outage during a tick causes silent per-user skips; the gap is never re-tried.
- **Silent week gaps.** If the cron misses a tick for more than a week, the affected users do **not** get a backfilled email — they skip directly to the current week. This is an intentional trade-off (avoid email storms) but undocumented in-code.
- **Token leakage is catastrophic.** A forwarded weekly email hands over edit + cancel. No audit log of who accessed what.
- **Global timezone assumption.** `weekOfLife` uses UTC-based `Date` arithmetic against a `@db.Date` column — users near week boundaries could receive an email a few hours early/late depending on the cron's clock and their timezone.
- **Quote randomization has no anti-repetition across sends** (only the homepage's `pickRandomQuote(current)` excludes the current quote). The weekly script picks freshly each send with no memory, so users can see the same quote in consecutive weeks.
- **`/api/confirm` and `/api/unsubscribe` embed inline HTML strings.** Minor XSS footgun if ever made dynamic — currently safe because all interpolated strings are literals.
- **No robots/Sentry/analytics** — no observability on the API or job beyond `console.log`.

## 14. Conventions & Patterns

### Code style
- **ESLint:** `eslint-config-next` (`core-web-vitals` + `typescript` presets) in flat-config mode (`eslint.config.mjs`).
- **Formatter:** None pinned in repo (no Prettier config committed); rely on editor default. `npm run lint` is the only enforcement.
- **TypeScript:** strict mode, `moduleResolution: "bundler"`, path alias `@/*`.
- **Imports:** use the `@/` alias, not relative paths, across package boundaries.

### Git workflow
- **Branching:** trunk-based (`main` only, based on recent history). No develop/feature branch pattern visible.
- **Commit messages:** conventional-ish Portuguese+English mix, `type: description` style (`feat: add weekly email reminders...`). Not strictly enforced.
- **PR conventions:** unknown — no PR template, no CODEOWNERS, no GitHub workflow present.

### Project-specific patterns (follow these)
- **Keep the homepage computation-only.** Never add DB calls to `/` — it's the performance hook.
- **All email sending goes through `lib/resend.ts`.** Don't call the Resend SDK from a route handler directly; that's how you break the env-var gating and the React-Email rendering.
- **All API routes validate with Zod.** Don't trust request bodies.
- **Tokens are created via `lib/tokens.ts::randomToken`.** Never reuse a token across subscription rows.
- **Idempotency for the weekly send lives in `lastSentWeek`.** Any change to the scheduled job must preserve the `check → send → update` order.
- **Client-side inputs are mirrored in `localStorage`** under the key `memento-mori:inputs`. If you add fields to the homepage form, update the read/write shape defensively.
- **New Next.js patterns take precedence.** Per `AGENTS.md`, this is a breaking-change Next.js version (16.2) — consult `node_modules/next/dist/docs/` before using Next APIs from older training data.
- **User-facing strings in `pt-BR`.** Identifiers and comments in English.

## Questions to Resolve

1. **Where is production deployed?** Vercel, Fly, Railway, self-hosted? `APP_URL` is parameterized but the platform isn't declared — needed to document CI/CD and the cron trigger.
2. **How is `scripts/send-weekly.ts` scheduled in production?** Vercel Cron? An external cron calling `npm run send-weekly`? A managed scheduler? This is the most important runtime dependency and it's invisible in the repo.
3. **Where is the production Postgres hosted?** (Supabase, Neon, RDS, managed VPS?) Backup/retention strategy?
4. **Is there a Resend domain + DKIM/SPF configured** under `lucaseduardoschuster.com`? Are bounce/complaint webhooks wired anywhere?
5. **Is there any staging environment**, or does `main` deploy directly to production?
6. **Any legal/compliance requirements** (LGPD/GDPR) being tracked — e.g., data retention, right-to-deletion? Current cancel flow keeps the row forever with `unsubscribedAt` set.
7. **Intended public scope** — is this a personal site or something marketed to users? Shapes the priority of rate limiting, abuse protection, and observability debt.
8. **Do emails currently include unsubscribe compliance** beyond headers (visible footer link is present — good) and is Resend configured to honor it automatically?
9. **Quote set curation policy** — who approves additions? Currently a hardcoded TS array.
10. **Is there an admin ops path** (mark a row as bounced, blocklist an email, pause sends) or is direct DB access the only lever today?
