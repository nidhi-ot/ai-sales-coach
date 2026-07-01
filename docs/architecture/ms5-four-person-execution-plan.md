# MS5 Four-Person Execution Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the remaining MS5 work so the product has a reliable public entry flow, a working practice loop, stable scorecard persistence, and rep-facing screens that all read from the same backend truth.

**Architecture:** Keep the public landing page separate from authenticated app screens, treat session completion as the source of truth for scorecards and learning-profile updates, and let dashboard/history/scorecard/profile/progress all reflect the same session data. The work should stay close to the existing routes and components so each owner can ship and test independently before we run the full end-to-end call loop.

**Tech Stack:** Next.js App Router, React + TypeScript, FastAPI, Pydantic, Supabase, browser microphone/WebRTC APIs, pytest, Ruff, and Black.

---

## Shared Contract Gate: Align the Team Before Splitting Work

**Files:**
- Read: `docs/contracts/CONTRACTS.md`
- Read: `docs/architecture/beforecallassembler.md`
- Read: `frontend/src/app/page.tsx`
- Read: `frontend/src/app/login/page.tsx`
- Read: `frontend/src/app/practice-setup/PracticeSetupPage.tsx`
- Read: `frontend/src/app/call/CallPageClient.tsx`
- Read: `backend/app/api/routes/sessions.py`
- Read: `backend/app/api/routes/scorecards.py`

- [ ] **Step 1: Confirm the public-to-authenticated navigation path**

Verify that the homepage sends new users to login, login persists the token and rep metadata, and practice setup can read the token before it recommends a focus area.

- [ ] **Step 2: Confirm the session-end payload and response shape**

Agree on what `/api/v1/sessions/{session_id}/end` must accept and return so the frontend, scorecard flow, and learning-profile update all stay aligned.

- [ ] **Step 3: Confirm the scorecard and history contract**

Lock the fields that the history page and scorecard page consume: `overall_score`, `shared_with_manager`, scorecard summary fields, and the session timestamps/duration values.

- [ ] **Step 4: Confirm the empty-state language**

Decide once how the UI should describe missing data so pending analysis does not look like a failed call. Keep `Not scored`, `Pending`, and `No session ID found` behavior consistent across screens.

---

## Task 1: Fortuna - Public Entry, Login, Practice Setup, and Call Start

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/login/page.tsx`
- Modify: `frontend/src/app/register/page.tsx`
- Modify: `frontend/src/app/practice-setup/page.tsx`
- Modify: `frontend/src/app/practice-setup/PracticeSetupPage.tsx`
- Modify: `frontend/src/app/call/page.tsx`
- Modify: `frontend/src/app/call/CallPageClient.tsx`
- Read: `frontend/src/components/AppShell.tsx`

- [ ] **Step 1: Make the public homepage a clean handoff into auth**

Keep the landing page lightweight, with a clear message, a `Contact Us` action, and separate `Login` and `Create Account` paths that do not fight each other.

- [ ] **Step 2: Make login preserve the values the rest of the app depends on**

Ensure a successful login stores `access_token`, `user_id`, `rep_id`, `business_id`, `full_name`, `email`, `phone_number`, `role`, and `remember_me`, because practice setup and the app shell both depend on those values.

- [ ] **Step 3: Make registration point into the same authenticated flow**

Keep the sign-in / sign-up navigation consistent so a new user can switch between `/login` and `/register` without landing on the wrong screen.

- [ ] **Step 4: Make practice setup actually use the learning recommendation**

Read `/profile/me/latest` with the stored token, map the weakest dimension to a focus area, and fall back to the default focus when the token or profile is unavailable.

- [ ] **Step 5: Make the selected scenario and focus survive the transition into the call**

Pass scenario, business context, framework, and focus area from practice setup to the call page so the user starts the session they intended to start.

- [ ] **Step 6: Make call start and stop feel dependable**

Confirm microphone permission, realtime session creation, transcript buffering, and teardown all work without leaving the call page stuck in an error or loading state.

- [ ] **Step 7: Validate the full front-door path end to end**

Run the browser path from `/` to `/login` to `/practice-setup` to `/call`, then confirm the session id is saved for later history and scorecard navigation.

---

## Task 2: Bharati - Session Contract, Scorecards, and Learning Loop

**Files:**
- Modify: `backend/app/api/routes/sessions.py`
- Modify: `backend/app/api/routes/scorecards.py`
- Modify: `backend/app/services/scorecards.py`
- Modify: `backend/app/services/session_analytics.py`
- Modify: `backend/app/services/scenarios.py`
- Modify: `backend/db/Schema.sql`
- Read: `docs/contracts/CONTRACTS.md`
- Read: `docs/architecture/beforecallassembler.md`

- [ ] **Step 1: Keep the session-end contract stable**

Protect the shape of `POST /api/v1/sessions/{session_id}/end` so it can accept transcripts, duration, and end reason without breaking the browser call flow.

- [ ] **Step 2: Make scorecard persistence safe to retry**

Ensure a completed call creates or updates one scorecard row, and that a retry does not create duplicate scorecards or lose the existing shared-state flag.

- [ ] **Step 3: Make the stub path honest**

When analysis cannot run yet, return a stub scorecard instead of failing the whole session end flow, so the user still sees a consistent result state.

- [ ] **Step 4: Make the profile update happen exactly once per finished session**

Use the scorecard outcome to advance the salesperson profile version, and keep retry behavior idempotent so a second end request does not create a second profile version.

- [ ] **Step 5: Make the before-call assembler reflect the latest weakness**

Trace the data from session history and scorecard output into the before-call prompt so the next scenario recommendation is based on the newest profile version.

- [ ] **Step 6: Make the two-call learning loop observable**

Run one call, confirm the profile/version changes, then run a second call and verify the weak point shifts in the expected direction instead of resetting.

- [ ] **Step 7: Tighten schema rules only if they protect the learning loop**

If duplicate scorecards or duplicate profile versions are still possible, add the smallest schema or upsert fix that prevents regression while preserving the current API contract.

---

## Task 3: Nidhi - Dashboard, History, Scorecards, Profile, and Progress

**Files:**
- Modify: `frontend/src/app/dashboard/page.tsx`
- Modify: `frontend/src/app/history/page.tsx`
- Modify: `frontend/src/app/scorecards/ScorecardClients.tsx`
- Modify: `frontend/src/components/scorecards/ScorecardView.tsx`
- Modify: `frontend/src/app/profile/page.tsx`
- Modify: `frontend/src/app/progress/page.tsx`
- Modify: `backend/app/api/routes/sessions.py`
- Modify: `backend/app/api/routes/scorecards.py`

- [ ] **Step 1: Keep the dashboard honest and data-driven**

Make the summary cards, recent practice list, and progress preview all read from the same backend session and scorecard data instead of mixing cached values with live values.

- [ ] **Step 2: Keep history rows aligned with backend truth**

Show scenario, start time, duration, status, score, and manager-sharing state in the history list, and make sure the `View Details` and `View Scorecard` buttons point to the correct session routes.

- [ ] **Step 3: Make scorecard loading and empty states explicit**

Support loading, no-session-id, no-scorecard-found, and no-score-generated states so users can tell the difference between pending analysis and a real failure.

- [ ] **Step 4: Keep the reusable scorecard component aligned with the new state model**

If `ScorecardView.tsx` is still used anywhere in the app, make sure it uses the same pending / not-scored language and does not present missing values as real `0/10` results.

- [ ] **Step 5: Keep profile and progress screens light but credible**

Read the profile data from storage when available, and keep the progress screen as a clear placeholder until there is enough session data to show meaningful trends.

- [ ] **Step 6: Keep nav and shell behavior consistent across the app**

Verify the shared shell, active nav, logout, and page transitions do not send users into dead ends or duplicate screens.

- [ ] **Step 7: Verify the user can move through the rep-facing flow without surprises**

Confirm the user can go from dashboard to practice, from history to scorecard, and back to the call or setup screens without losing context.

---

## Task 4: Shalu - Regression, Integration, and Merge Safety

**Files:**
- Modify: `backend/tests/test_session_end.py`
- Modify: `backend/tests/test_scorecards.py`
- Modify: `backend/tests/test_auth_register.py`
- Modify: `docs/testing/ms1-integration-checklist.md` only if the command list or expectations need to match the current behavior

- [ ] **Step 1: Cover the call-end happy path**

Write or extend tests that prove a completed session saves transcripts, updates the session row, creates the scorecard, and returns the generated profile update payload.

- [ ] **Step 2: Cover the incomplete-transcript fallback**

Verify the backend returns a stub scorecard and a safe status when the transcript is too short to score, instead of failing the end-of-call flow.

- [ ] **Step 3: Cover history, scorecard fetch, and share toggles**

Check that rep history includes score and sharing state, scorecards can be fetched by `session_id`, and manager-sharing persists without losing the scorecard record.

- [ ] **Step 4: Cover login and practice setup token flow**

Make sure `/login` stores `access_token`, and practice setup can read it and fetch the latest recommendation. This is the part that protects the recommendation flow from the Greptile regression.

- [ ] **Step 5: Run the regression set and close the gaps**

Use the repo’s current backend and frontend checks, then rerun the failures until the branch is clean enough to merge.

- [ ] **Step 6: Smoke test the same user journey the product cares about**

Validate the full route chain from landing page to login, practice setup, call, history, and scorecard so the tests reflect real user behavior, not just API calls.

---

## Recommended Sequence

1. Fortuna stabilizes the front door first, because every later screen depends on the login-to-practice handoff.
2. Bharati confirms the backend learning loop next, because the scorecard/profile behavior is the core MS5 outcome.
3. Nidhi keeps the rep-facing pages aligned with the data model, so users always see the right score and sharing state.
4. Shalu verifies the full stack with regression coverage before the branch is merged.

## Dependency Map

### Can Start Immediately In Parallel

- Fortuna can work on homepage, login, practice setup, and call entry right away.
- Bharati can work on session-end and profile-version logic right away using the current contract in `docs/contracts/CONTRACTS.md`.
- Nidhi can work on dashboard/history/scorecard/profile/progress UI right away using the current session and scorecard shapes.
- Shalu can start test coverage right away by extending the current backend tests around session end and scorecards.

### Main Dependency Chain

- Fortuna’s login and practice setup work is the front door for the rest of the flow.
- Bharati depends on the session-end payload, scorecard analysis, and profile versioning to prove the learning loop.
- Nidhi depends on the session and scorecard APIs staying stable enough to render the correct history and sharing state.
- Shalu depends on the final response shapes from the other three workstreams when running the full regression set.

### Where Conflicts Are Most Likely

- Fortuna and Bharati both touch the practice entry and session-end path, so they should agree on the request and response shapes before editing.
- Bharati and Nidhi both rely on scorecard fields like `overall_score` and `shared_with_manager`, so they should not rename fields independently.
- Shalu should treat the backend contract as the source of truth and add tests around it instead of changing behavior while testing.

### Safe Parallel Start Order

1. First, confirm the shared login, practice setup, session-end, and scorecard contract.
2. Then let Fortuna and Bharati work in parallel on entry flow and learning-loop behavior.
3. Let Nidhi build against the agreed dashboard/history/scorecard contract.
4. Let Shalu keep adding regression coverage as the others land changes.

## Done Criteria For This Plan

The MS5 branch is ready when:

- a user can land on the new homepage, log in, and reach practice setup without losing their token
- practice setup can recommend a focus area from the latest learning profile
- one full call can start, run, and end cleanly
- a scorecard is saved for the completed session, even on fallback paths
- the next call uses the updated profile version
- history, dashboard, scorecard, profile, and progress screens show consistent data or honest empty states
- regression tests cover the end-to-end flow
