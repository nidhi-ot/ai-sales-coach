# Homepage and Login Redesign

## Goal
Create a lightweight public homepage at `/` that introduces AI Sales Coach and routes users into a separate `/login` page for authentication.

## Context
The current root page is a login form. The request is to make the front page feel more like a product landing page, while keeping the existing app styling and login flow.

## Proposed Approach
Use the current visual language already present in the app:
- soft green and neutral backgrounds
- rounded cards
- clear hierarchy
- minimal marketing sections

Keep the homepage intentionally simple:
- hero section with product name and value proposition
- short feature highlights
- clear login CTA
- secondary CTA for new users

Move the current login form into its own `/login` route so the homepage stays focused on product messaging.

## Page Structure
### `/`
Public landing page.
- Brand header
- Hero statement
- short supporting copy
- feature highlights
- primary `Login` button
- secondary `Start Practicing` button or similar CTA

### `/login`
Authentication page.
- reuse the existing login form UI
- preserve the current login behavior
- continue routing to `/dashboard` after success

## Content Direction
The homepage copy should stay aligned with the product:
- practice realistic AI customer conversations
- receive scorecards after each session
- track progress over time
- use the app for rep coaching and review

The page should not try to become a long marketing site. It should stay compact and useful.

## Implementation Notes
- Keep existing styling patterns from the app shell and auth screens.
- Do not introduce a separate design system.
- Preserve the current backend login flow and localStorage-based session info.
- Keep the scorecard/history/session pages unchanged unless routing needs small adjustments.

## Success Criteria
- Visiting `/` shows a landing page, not the login form.
- Visiting `/login` shows the login form.
- Login still works and routes to `/dashboard`.
- The homepage uses the existing app look and feel.
- The experience feels clean on desktop and mobile.

## Out of Scope
- No backend auth changes.
- No major branding overhaul.
- No new public marketing sections beyond the lightweight landing page.
- No change to post-login dashboard behavior.
