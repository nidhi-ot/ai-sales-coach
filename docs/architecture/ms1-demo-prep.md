# MS1 Demo Prep

Target: end of Day 3

## Demo Goal

Show that the repository foundation, CI flow, and walking skeleton are working end to end at a basic milestone level.

## Demo Scope

- repository structure is in place
- protected branch workflow is being used
- CI checks run on pull requests
- backend health and API health endpoints work
- realtime status endpoint responds
- Supabase connectivity check responds
- before-call context assembly works for a real rep/business
- canonical realtime session creation returns OpenAI realtime credentials

## Demo Run Order

1. Show the GitHub repository and active PR into `develop`
2. Show GitHub Actions passing on the PR
3. Start the backend locally
4. Start the frontend locally
5. Run `WALKING_SKELETON_REP_ID=<rep-uuid> bash scripts/test-walking-skeleton.sh`
6. Explain any known limitations or follow-up items

## Presenter Checklist

- [ ] Pull the latest version of the branch before demo
- [ ] Confirm backend `.env` values are present
- [ ] Confirm frontend `.env.local` values are present
- [ ] Confirm both backend and frontend start locally
- [ ] Keep a valid rep UUID ready for `WALKING_SKELETON_REP_ID`
- [ ] Keep the matching business UUID ready for `WALKING_SKELETON_BUSINESS_ID` if using seeded data
- [ ] Keep the PR link ready
- [ ] Keep terminal windows ready for backend and frontend
- [ ] Keep fallback screenshots ready if a live service is slow

## Known Risks

- Realtime session creation will fail if `OPENAI_API_KEY` is missing or invalid
- Supabase status will fail if Supabase environment variables are missing
- Before-call and realtime session checks will fail if the rep/business IDs do not exist
- Frontend flow may be blocked if backend base URL is incorrect

## Follow-up Notes During Demo

Capture:

- what worked as expected
- what failed
- whether the failure was code, config, or environment
- who owns the next fix
