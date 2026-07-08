# N5: Admin Member Management Design

## Goal

Give admins a dedicated member management flow so they can:

- view business members
- promote or demote roles
- deactivate people who leave

Deactivation must cut off access immediately by making inactive accounts fail `get_current_account()` on every protected request.

## Why this exists

The invite flow created a controlled way to add people to a business. N5 closes the loop by letting admins manage the people already in the business.

This is important for two reasons:

- role changes are part of normal admin operations
- inactive accounts must not keep consuming OpenAI or using the app after offboarding

## Scope

In scope:

- add `is_active` to `salesperson_accounts`
- add `GET /api/v1/admin/members`
- add `PATCH /api/v1/admin/members/{id}`
- add a dedicated `/admin/members` page
- make `get_current_account()` reject inactive accounts

Out of scope:

- deleting accounts from the database
- inviting new members from this page
- bulk CSV import/export
- manager self-service role changes

## Recommended UI Split

Use two admin surfaces:

- `/admin` for invite creation and company settings
- `/admin/members` for member management

This keeps the invite workflow separate from lifecycle management and leaves room for the members table to grow.

## Data Model

Add `is_active BOOLEAN DEFAULT TRUE` to `salesperson_accounts`.

Behavior:

- new accounts start active
- admins can deactivate an account by setting `is_active = false`
- inactive accounts remain in the table for history/audit
- `get_current_account()` should return `403` if the stored account is inactive

Suggested member record fields for the UI:

- `id`
- `full_name`
- `email`
- `phone_number`
- `employee_id`
- `role`
- `is_active`
- `created_at`

## Backend API

### `GET /api/v1/admin/members`

Returns all accounts for the current admin’s business.

Rules:

- admin only
- list only members from the admin’s `business_id`
- include role and active status

### `PATCH /api/v1/admin/members/{id}`

Updates a single member.

Allowed updates:

- `role`
- `is_active`

Rules:

- admin only
- only members in the current admin’s business can be updated
- role changes must stay within the existing role set: `rep`, `manager`, `admin`
- deactivating a member should be allowed

## Auth Rule

Update `get_current_account()` so it rejects inactive users immediately.

Required check order:

1. load the account row by `auth.user.id`
2. verify the row exists
3. verify `business_id` exists
4. verify `role` exists
5. verify `is_active` is true

If `is_active` is false, return `403 Forbidden`.

This is the single lockout gate for all protected routes, so deactivated users are blocked everywhere without extra route-specific checks.

## Frontend Behavior

The `/admin/members` page should show:

- a table of members
- current role
- active/inactive state
- controls to change role
- a deactivate/reactivate action

Suggested interaction pattern:

- role changes happen inline or through a small edit modal
- active state uses a toggle or action button
- inactive members should be visually distinct

## Error Handling

- `403` when a non-admin hits admin member endpoints
- `404` when the business or target member does not exist
- `400` when the payload contains an invalid role or invalid state
- `403` when the target member belongs to a different business

## Testing

Backend tests should cover:

- admin can list members in own business
- admin can update role and active state
- non-admin cannot access member endpoints
- inactive account is blocked by `get_current_account()`
- inactive account cannot call any protected endpoint

Frontend checks should cover:

- `/admin/members` loads the list
- role changes persist
- deactivate removes access on the next request

## Implementation Notes

Keep the backend behavior simple:

- do not delete rows when deactivating
- do not add new role types
- keep business scoping enforced server-side

This feature is about lifecycle control, not identity redesign.
