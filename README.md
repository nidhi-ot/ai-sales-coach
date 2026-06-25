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

## Initial Setup

1. Add GitHub remote:
   - `git remote add origin https://github.com/nidhi-ot/ai-sales-coach.git`
2. Create the first commit:
   - `git add .`
   - `git commit -m "Initial monorepo scaffold"`
3. Push `main`:
   - `git push -u origin main`
4. Create and push `develop`:
   - `git checkout -b develop`
   - `git push -u origin develop`
