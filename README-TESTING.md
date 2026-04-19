# Testing

This project uses **Vitest** for unit / integration / DOM tests and **Playwright** for end-to-end. All tests run against a real PostgreSQL test database; Resend is mocked in-process.

## Prerequisites

1. Node 20+.
2. PostgreSQL 16 running locally. The Docker Compose service works:
   ```
   docker compose up -d postgres
   ```
3. Install dependencies:
   ```
   npm install
   npx playwright install --with-deps chromium
   ```
4. A dedicated test database. Create it once:
   ```
   psql "postgresql://memento:memento@localhost:5432/postgres" \
     -c 'CREATE DATABASE memento_mori_test;'
   ```
5. Export the connection string:
   ```
   export TEST_DATABASE_URL="postgresql://memento:memento@localhost:5432/memento_mori_test"
   ```
   (`DATABASE_URL` is used as a fallback if `TEST_DATABASE_URL` is unset, but keep them separate to avoid truncating your dev data.)

Migrations are applied automatically the first time integration helpers run (`prisma migrate deploy`).

## Running the suites

`TEST_DATABASE_URL` must be visible to every command below — either `export`ed in the shell or prefixed inline:

```
TEST_DATABASE_URL=postgresql://memento:memento@localhost:5432/memento_mori_test npm test
```

| Command | What it runs |
|---|---|
| `npm test` | All Vitest suites: unit, integration (DB), DOM. |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run test:coverage` | Vitest with coverage report. Fails below the configured thresholds. |
| `npm run test:e2e` | Playwright E2E spec. Boots `next dev` automatically. |

Integration / DOM tests run in a single fork (`fileParallelism: false`) because they share the test database and module-level state (Prisma client, Resend mock, rate-limit map). Do not re-enable parallelism without sharding the DB.

### Playwright system dependencies

On a fresh Linux host the Chromium binary needs extra shared libraries. `npx playwright install --with-deps chromium` installs them but requires `sudo`. If that step was skipped (e.g. running non-interactively) and `test:e2e` fails with `libnspr4.so: cannot open shared object file`, install them manually:

```
sudo apt-get install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
  libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2t64
```

## Coverage thresholds

Configured in `vitest.config.ts`:

- `lib/**` — ≥90% statements, ≥85% branches.
- `app/api/**` — ≥90% statements, ≥85% branches.
- `scripts/**` — ≥90% statements, ≥85% branches.
- `components/**` — ≥80% statements.

Open `coverage/index.html` after `npm run test:coverage` for per-file breakdowns.

## Feature → test mapping

Every item in the original feature inventory is covered by at least one test:

| Feature | Test file |
|---|---|
| A.1 `calculateLifeStats` | `tests/unit/calculations.test.ts` |
| A.2 `isValidBirthDate` | `tests/unit/calculations.test.ts` |
| A.3 `parseBirthDate` | `tests/unit/calculations.test.ts` |
| A.4 `weekOfLife` | `tests/unit/weeks.test.ts` |
| A.5 `pickRandomQuote` | `tests/unit/quotes.test.ts` |
| A.6 `randomToken` | `tests/unit/tokens.test.ts` |
| B.7 `POST /api/subscribe` | `tests/integration/api.subscribe.test.ts` |
| B.8 `GET /api/confirm` | `tests/integration/api.confirm.test.ts` |
| B.9 `/api/unsubscribe` | `tests/integration/api.unsubscribe.test.ts` |
| B.10 `GET /api/subscription` | `tests/integration/api.subscription.test.ts` |
| B.11 `PATCH /api/subscription` | `tests/integration/api.subscription.test.ts` |
| C.12 `sendConfirmEmail` / `sendWeeklyEmail` | `tests/unit/resend.test.ts` |
| D.13 `scripts/send-weekly.ts` | `tests/integration/send-weekly.test.ts` |
| E.14 `LifeForm` | `tests/dom/LifeForm.test.tsx` |
| E.15 `SubscribeForm` | `tests/dom/SubscribeForm.test.tsx` |
| E.16 `EditForm` | `tests/dom/EditForm.test.tsx` |
| E.17 `WeeksGrid` | `tests/dom/WeeksGrid.test.tsx` |
| E.18 `LifeStats` / `LifeBar` / `Quote` | `tests/dom/LifeStats.test.tsx` |
| F.19 Home page | `tests/dom/home.test.tsx` |
| F.20 Edit page | `tests/dom/edit.test.tsx` |
| G.21 Full flow | `tests/e2e/full-flow.spec.ts` |

## Extending the factory

Add new defaults or overrides in `tests/helpers/db.ts::createSubscription`. The factory already supports:

```ts
await createSubscription({
  email: "custom@example.com",
  birthDate: new Date("1988-03-14T00:00:00Z"),
  lifeExpectancy: 90,
  confirmedAt: new Date("2026-01-01T00:00:00Z"),
  unsubscribedAt: null,
  lastSentWeek: 42,
  unsubscribeToken: "known_for_tests",
  confirmToken: null, // default; pass a string for pending rows
});
```

To cover a new API state, seed with the exact DB shape you want, then invoke the route handler directly via helpers in `tests/helpers/request.ts`.

## Production-code changes made for testability

Exactly one, documented in-source:

- `app/api/subscribe/route.ts` exports `__resetRateLimit()` so the in-memory rate-limit map can be cleared between tests. This is safe: the function only clears a Map and is never called from production request paths.

## Tips

- Tests default to a fixed system clock (`2026-04-19T12:00:00Z`) via `vitest.setup.ts`. Only `Date` is faked — `setTimeout` / `setInterval` stay real so `userEvent` and Prisma work. Override inside a test with `vi.setSystemTime(new Date(...))`.
- DOM tests rely on jsdom polyfills added in `vitest.setup.ts` (`ResizeObserver`, `hasPointerCapture`, `scrollIntoView`) so Radix UI primitives render. Adding a new Radix component may require extending that list.
- Email-template assertions use real `@react-email/render` output — expect HTML, not snapshots.
- If you see "relation \"Subscription\" does not exist", run `DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy` manually.
- Playwright runs a real dev server; its env is wired inside `playwright.config.ts`. To point it at a prebuilt production server, override `E2E_BASE_URL` and disable `webServer` locally.
