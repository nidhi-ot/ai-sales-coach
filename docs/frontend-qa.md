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

## Shareing Button
Sharing button check: Not applicable in the current codebase. The Share button was previously removed from the scorecard, so there is no sharing action available to test. The task description appears to refer to an older implementation.

The current backend still exposes the shared_with_manager field in session/history responses, but there is no active API endpoint for changing it. The frontend Share button was already removed, so the roadmap note about a broken Share button refers to an older implementation.

## Sharing flow check

- No Share button exists in the current scorecard UI.
- Backend still reads and returns `shared_with_manager`.
- No API route was found that updates `shared_with_manager`.
- The roadmap note about a broken Share button appears to refer to an older implementation.