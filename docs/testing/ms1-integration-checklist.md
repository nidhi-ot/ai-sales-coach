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
- [ ] `POST /api/v1/realtime/token` returns a response with `client_secret`
- [ ] `GET /api/v1/realtime/supabase-status` returns a success response

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

- [ ] Run `bash scripts/test-walking-skeleton.sh`
- [ ] Backend health check passes
- [ ] API health check passes
- [ ] Realtime token endpoint check passes
- [ ] Supabase status check passes

## PR Readiness

- [ ] Branch is opened as a PR into `develop`
- [ ] GitHub Actions checks are green
- [ ] Required reviewers have been added
- [ ] Team members have tested related flows if needed
