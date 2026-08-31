# AI Sales Coach

Monorepo for the AI Sales Coach platform.

## Structure

- `backend/` — FastAPI backend
- `frontend/` — Next.js frontend
- `docs/contracts/` — frozen API contracts
- `docs/architecture/` — architecture and workflow docs
- `scripts/` — helper scripts

## Branching Strategy

- `main` — production-ready branch
- `develop` — integration branch for active work
- `feature/<short-name>` — new features
- `bugfix/<short-name>` — bug fixes
- `hotfix/<short-name>` — urgent production fixes

### Pull Request Flow

- Open feature and bugfix pull requests into `develop`
- Promote tested changes from `develop` into `main`
- Keep interface changes aligned with `docs/contracts/CONTRACTS.md`

## Day 1 CI

GitHub Actions currently runs linting only:

- Python linting for `backend/`
- Frontend linting for `frontend/`

## Prerequisites

- Python `3.11`
- Node.js `20`
- `npm`
- GitHub access to `nidhi-ot/ai-sales-coach`

## Initial Setup

1. Clone the repository:
   - `git clone https://github.com/nidhi-ot/ai-sales-coach.git`
   - `cd ai-sales-coach`
2. Start from the integration branch:
   - `git checkout develop`
   - `git pull`
3. Create local env files:
   - `cp backend/.env.example backend/.env`
   - `cp frontend/.env.example frontend/.env.local`
4. Install backend dependencies:
   - `cd backend`
   - `python3.11 -m venv .venv`
   - `source .venv/bin/activate`
   - `pip install -r requirements.txt`
5. Install frontend dependencies:
   - `cd ../frontend`
   - `npm install`

## Environment Setup

### Backend

Update `backend/.env` with:

- `OPENAI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ENVIRONMENT=development`
- `API_PREFIX=/api/v1`

### Frontend

Update `frontend/.env.local` with:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`
- `NEXT_PUBLIC_APP_ENV=development`
- `NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-supabase-publishable-key>`

## Local Development Workflow

### Start the backend

From `backend/`:

- `source .venv/bin/activate`
- `uvicorn app.main:app --reload`

Backend URLs:

- health check: `http://localhost:8000/health`
- API health: `http://localhost:8000/api/v1/health`

### Start the frontend

From `frontend/`:

- `npm run dev`

Frontend URL:

- `http://localhost:3000`

### Run local checks

From `backend/`:

- `ruff check app`
- `black --check .`
- `flake8 app/`
- `mypy app/`

From `frontend/`:

- `npm run lint`
- `npm run type-check`

## Integration Testing

Run the walking skeleton script from the repo root:

- `WALKING_SKELETON_REP_ID=<rep-uuid> bash scripts/test-walking-skeleton.sh`

Optional overrides:

- `WALKING_SKELETON_BUSINESS_ID=<business-profile-uuid>`
- `BASE_URL=http://localhost:8000`
- `SCENARIO=cold_call`

If you use `backend/scripts/seed_data.py`, pass the printed rep ID and business ID.

This script checks:

- backend health
- API health
- realtime status endpoint
- Supabase status endpoint
- before-call context assembly
- canonical realtime session creation
- session cleanup through the after-call endpoint

The realtime session check requires valid backend `OPENAI_API_KEY` and Supabase
settings. It creates and then ends a practice session.

See also:

- `docs/testing/ms1-integration-checklist.md`
- `docs/architecture/ms1-demo-prep.md`

## Team Workflow

1. Update your local `develop` branch:
   - `git checkout develop`
   - `git pull`
2. Create a feature branch:
   - `git checkout -b feature/<short-name>`
3. Make changes and run local checks
4. Push the branch:
   - `git push -u origin feature/<short-name>`
5. Open a pull request into `develop`
6. Request review from teammates
7. Merge only after checks pass and review is complete
