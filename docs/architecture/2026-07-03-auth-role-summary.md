# Auth and Role Access Summary

## N2: Role and business access

We added a backend auth layer that understands both:

- who the logged-in user is
- what role they have: `rep`, `manager`, or `admin`
- which business they belong to

This lets the app protect manager-only data and keep access inside the correct business.

## What we changed

- `get_current_user()` already checks the login token.
- `get_current_account()` now loads the matching row from `salesperson_accounts`.
- missing roles are rejected with `403` instead of silently falling back to `rep`.
- `require_role("manager")` blocks non-managers.
- `ensure_business_access(...)` blocks cross-business access for non-admins.

We also added a manager route:

- `GET /api/v1/manager/business/{business_id}/team`

That route:

- requires manager access
- allows admins to read any business
- returns the business profile and the business's rep list

## Frontend impact

The login page already stores the backend `role` value in `localStorage`.

- `role` is saved during login
- the profile page displays it
- the current UI does not yet change menus based on role

So most of the role enforcement is backend-side for now.

## Why this matters

This work prevents:

- reps from calling manager endpoints
- managers from reading another business
- accounts with no role from being treated as reps
- future admin features from becoming unsafe

It gives us a clean base for team dashboards, business-level views, and admin settings later.

## How to check it

Run the backend test suite:

```bash
cd backend
../backend/.venv/bin/python -m unittest discover tests -q
```

Useful checks:

- rep calling manager endpoint should return `403`
- manager calling their own business should return `200`
- manager calling another business should return `403`
- admin should be able to read any business
- admin should pass the manager route check

## Current status

The role access foundation is in place locally.
The new manager route is working and covered by tests.

## N3: Admin framework control

Admins can now change the company sales framework with:

- `PATCH /api/v1/admin/business/framework`

Allowed values:

- `BANT`
- `MEDDIC`
- `SPIN`

This route:

- is admin-only
- updates the framework for the admin's own business
- returns a warning that the change only affects future sessions and should not happen often

Managers and reps are blocked with `403`.
