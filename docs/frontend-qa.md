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