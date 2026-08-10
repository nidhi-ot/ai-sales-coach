# Week 1 Frontend QA

Tester: Bharathi
Branch: review/fortuna-step8
Date:

| Route | Role | English | Swedish | Loads | Console/API error | Mobile issue | Notes |
|---|---|---|---|---|---|---|---|
| / | Public | | | | | | |
| /login | Public | | | | | | |
| /register | Public | | | | | | |
| /dashboard | Rep | | | | | | |
| /scenarios | Rep | | | | | | |
| /practice-setup?scenario=cold_call | Rep | | | | | | |
| /call?scenario=cold_call | Rep | | | | | | |
| /history | Rep | | | | | | |
| /scorecards | Rep | | | | | | |
| /progress | Rep | | | | | | |
| /profile | Rep | | | | | | |
| /settings | Rep | | | | | | |
| /dashboard | Manager | | | | | | |
| /team | Manager | | | | | | |
| /team/reps/[rep_id]?business_id=[business_id] | Manager | | | | | | |
| /dashboard | Admin | | | | | | |
| /admin | Admin | English works | Swedish incomplete | Page loads | No API error | Admin page content remains in English after switching UI language to Swedish |
| /settings | Admin | | | | | | |


## Bug: Admin page does not switch to Swedish

Role: Admin  
Route: `/admin`  
Expected: When UI language is changed to Swedish, all Admin page headings, tabs, labels, buttons, help text, warnings, and form text should appear in Swedish.  
Actual: Sidebar and other pages switch to Swedish, but the Admin page content remains in English.  
Severity: High  
Notes: Business language is set to Swedish, but the Admin interface still contains hardcoded English text.



## Cloudflare Setup Investigation

### Objective

The Week 1 task included starting the Cloudflare deployment setup for the frontend.

The goal of this investigation was to:

- Check whether Cloudflare deployment was already configured in the repository.
- Identify the appropriate deployment approach for the Next.js frontend.
- Verify whether the current frontend dependencies are compatible with the Cloudflare deployment tooling.
- Avoid making production or framework-level changes without confirming compatibility first.

---

### Existing Cloudflare Configuration Check

The repository was checked for existing Cloudflare and Wrangler configuration using:

```bash
dir /s /b *wrangler*
dir /s /b *open-next*
git grep -n -i "cloudflare"
git grep -n -i "wrangler"

Result

No existing Cloudflare deployment configuration was found.

The repository currently does not contain:

wrangler.toml
wrangler.jsonc
open-next.config.ts
@opennextjs/cloudflare
Wrangler configuration
Cloudflare-specific deployment scripts

The frontend package.json was also reviewed and did not contain Cloudflare/OpenNext dependencies.

Baseline Verification

Before making any Cloudflare-related changes, a new branch was created from the latest develop:

git checkout develop
git pull origin develop
git checkout -b chore/cloudflare-setup

The existing Next.js application was then built to establish a clean baseline:

cd frontend
npm run build
Result

The production build completed successfully.

The application generated all expected routes successfully.

There were some existing warnings related to React Hook dependencies and the use of <img> instead of Next.js <Image />, but these warnings did not prevent the production build from completing.

This confirmed that the frontend was building successfully before attempting Cloudflare configuration.

Current Frontend Framework Version

The frontend currently uses:

Next.js 14.2.5

The relevant dependency in frontend/package.json is:

"next": "14.2.5"
Cloudflare/OpenNext Installation Attempt

The following command was used to begin the Cloudflare setup:

npm install @opennextjs/cloudflare@latest
Installation Result

The installation failed with an npm dependency resolution error:

ERESOLVE unable to resolve dependency tree

npm identified the following version conflict:

Current project:
next@14.2.5

Requested package:
@opennextjs/cloudflare@1.20.2

Required peer dependency:
next >=15.5.21 <16 || >=16.2.11

Therefore, the latest version of @opennextjs/cloudflare cannot be installed normally with the application's current Next.js 14.2.5 dependency.

Safety Decision

The installation was intentionally stopped at this point.

The following options were NOT used:

npm install --force

or:

npm install --legacy-peer-deps

Forcing the installation could bypass npm's dependency validation while leaving the application with an unsupported combination of Next.js and the Cloudflare adapter.

Next.js was also NOT upgraded as part of this task.

Moving from the application's current Next.js 14.2.5 version to a newer major version could introduce application-wide changes and should be handled as a separate framework upgrade with appropriate testing and team approval.

No production Cloudflare deployment was attempted.

Final Conclusion

The Week 1 Cloudflare task was started by reviewing the repository, confirming that no Cloudflare configuration currently exists, establishing a successful frontend build baseline, and attempting to add the current Cloudflare OpenNext deployment adapter.

The setup could not safely continue because the application currently uses Next.js 14.2.5, while the latest @opennextjs/cloudflare package selected during installation requires a newer Next.js version.

The dependency conflict was not bypassed, Next.js was not upgraded, and no Cloudflare deployment was performed. This avoids introducing an unsupported dependency combination or an unapproved framework upgrade.

The technical blocker and available paths forward have now been identified. Cloudflare setup can continue once the team confirms whether to upgrade Next.js or use a Cloudflare/OpenNext version compatible with the existing Next.js application.