# MS1 Integration Checklist

Use this checklist before requesting final review for Milestone 1.

## Local Environment

- [ ] `backend/.env` is present and has valid OpenAI and Supabase values
- [ ] `frontend/.env.local` is present and points to the local backend
- [ ] Backend dependencies are installed
- [ ] Frontend dependencies are installed

## Backend Verification

- [ ] Backend starts successfully with `uvicorn app.main:app --reload`
- [ ] `GET /health` returns `200`
- [ ] `GET /api/v1/health` returns `200`
- [ ] `GET /api/v1/realtime/status` returns `200`
- [ ] `GET /api/v1/realtime/supabase-status` returns a success response
- [ ] `POST /api/v1/agent/before-call` returns a system instruction for a valid rep/business
- [ ] `POST /api/v1/realtime/session` returns `client_secret`, `session_id`, and `openai_session_id`

## Frontend Verification

- [ ] Frontend starts successfully with `npm run dev`
- [ ] Frontend loads at `http://localhost:3000`
- [ ] Frontend can reach the configured backend URL

## Quality Checks

- [ ] Backend lint passes: `ruff check app`
- [ ] Backend format check passes: `black --check .`
- [ ] Backend style check passes: `flake8 app/`
- [ ] Backend type-check passes: `mypy app/`
- [ ] Frontend lint passes: `npm run lint`
- [ ] Frontend type-check passes: `npm run type-check`

## Walking Skeleton

- [ ] Run `WALKING_SKELETON_REP_ID=<rep-uuid> bash scripts/test-walking-skeleton.sh`
- [ ] If using seeded data, set `WALKING_SKELETON_BUSINESS_ID=<business-profile-uuid>`
- [ ] Backend health check passes
- [ ] API health check passes
- [ ] Realtime status check passes
- [ ] Supabase status check passes
- [ ] Before-call context assembly check passes
- [ ] Canonical realtime session check passes
- [ ] Session cleanup check passes

## PR Readiness

- [ ] Branch is opened as a PR into `develop`
- [ ] GitHub Actions checks are green
- [ ] Required reviewers have been added
- [ ] Team members have tested related flows if needed

## Testing 
- [ ] Backend regression tests pass: `python -m unittest discover -s tests`
