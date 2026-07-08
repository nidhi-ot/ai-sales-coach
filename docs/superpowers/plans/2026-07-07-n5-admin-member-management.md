# N5 Admin Member Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let admins list, promote, and deactivate business members, while inactive accounts are locked out of all protected routes.

**Architecture:** Add one new account flag in the database, enforce it once in `get_current_account()`, expose two small admin member endpoints, and build a dedicated `/admin/members` screen that uses the existing authenticated frontend fetch helper. Keep invite creation on `/admin` and member lifecycle management on `/admin/members`.

**Tech Stack:** FastAPI, Supabase/Postgres, Pydantic, Next.js App Router, TypeScript, pytest/unittest, black, ruff.

## Global Constraints

- Deactivation must not delete rows; it only flips `is_active` to `false`.
- Inactive users must be blocked by `get_current_account()` so every protected endpoint fails closed.
- Admin-only member APIs must stay scoped to the current admin’s `business_id`.
- Role values stay limited to `rep`, `manager`, and `admin`.
- The frontend must keep using `authFetch()` for protected API calls.

---

### Task 1: Add `is_active` and enforce it in account lookup

**Files:**
- Modify: `backend/db/Schema.sql`
- Modify: `backend/app/api/deps.py`
- Modify: `backend/tests/test_deps.py`
- Modify: `backend/tests/helpers.py`

**Interfaces:**
- Consumes: `salesperson_accounts` rows from Supabase
- Produces: `CurrentAccount` only for active accounts

- [ ] **Step 1: Write the failing backend test**

Add an inactive-account case to `backend/tests/test_deps.py`:

```python
async def test_get_current_account_rejects_inactive_account(self):
    fake_supabase = _FakeSupabase(
        [
            {
                "id": "rep-123",
                "business_id": "business-123",
                "role": "rep",
                "is_active": False,
            }
        ]
    )

    with patch("app.api.deps.get_supabase", return_value=fake_supabase):
        with self.assertRaises(HTTPException) as ctx:
            await get_current_account(current_user=SimpleNamespace(id="rep-123"))

    self.assertEqual(ctx.exception.status_code, 403)
```

- [ ] **Step 2: Run the test to confirm it fails**

Run:

```bash
PYTHONPATH=backend backend/.venv/bin/python -m unittest backend.tests.test_deps -q
```

Expected:
- the new inactive-account test fails until `get_current_account()` checks `is_active`

- [ ] **Step 3: Add the schema column**

Update `backend/db/Schema.sql`:

```sql
ALTER TABLE salesperson_accounts
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
```

- [ ] **Step 4: Enforce the new flag in `get_current_account()`**

Update the query in `backend/app/api/deps.py`:

```python
result = (
    supabase.table("salesperson_accounts")
    .select("id, role, business_id, is_active")
    .eq("id", current_user.id)
    .limit(1)
    .execute()
)
```

Then add:

```python
if account.get("is_active") is False:
    raise HTTPException(status_code=403, detail="Account is inactive")
```

Keep the existing role/business checks unchanged.

- [ ] **Step 5: Update the test helper**

In `backend/tests/helpers.py`, default `salesperson_accounts` rows should continue to work without extra boilerplate, but the fake table must preserve `is_active` when present in test rows.

- [ ] **Step 6: Run the test again**

Run:

```bash
PYTHONPATH=backend backend/.venv/bin/python -m unittest backend.tests.test_deps -q
```

Expected:
- the inactive-account test passes
- existing dependency tests still pass

- [ ] **Step 7: Commit**

```bash
git add backend/db/Schema.sql backend/app/api/deps.py backend/tests/test_deps.py backend/tests/helpers.py
git commit -m "feat: block inactive accounts in auth"
```

---

### Task 2: Add admin member APIs

**Files:**
- Modify: `backend/app/api/routes/admin.py`
- Modify: `backend/tests/test_admin_routes.py`

**Interfaces:**
- Consumes: `CurrentAccount` from `require_role("admin")`
- Produces: `GET /api/v1/admin/members`
- Produces: `PATCH /api/v1/admin/members/{id}`

- [ ] **Step 1: Write the failing tests**

Add tests in `backend/tests/test_admin_routes.py` for:

```python
def test_admin_can_list_members(self): ...
def test_admin_can_update_member_role(self): ...
def test_admin_can_deactivate_member(self): ...
def test_admin_cannot_update_cross_business_member(self): ...
```

The list test should expect `id`, `full_name`, `email`, `phone_number`, `employee_id`, `role`, `is_active`, and `created_at`.

The update test should expect payloads like:

```python
{"role": "manager"}
{"is_active": False}
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run:

```bash
PYTHONPATH=backend backend/.venv/bin/python -m unittest backend.tests.test_admin_routes -q
```

Expected:
- the new member-management tests fail until the endpoints exist

- [ ] **Step 3: Add request/response models and helpers**

Extend `backend/app/api/routes/admin.py` with:

```python
class AdminMemberResponse(BaseModel):
    id: str
    full_name: str
    email: str | None
    phone_number: str
    employee_id: str | None
    role: Literal["rep", "manager", "admin"]
    is_active: bool
    created_at: str | None = None


class UpdateAdminMemberRequest(BaseModel):
    role: Literal["rep", "manager", "admin"] | None = None
    is_active: bool | None = None
```

Add a small row helper if needed:

```python
def _member_rows(data: Any) -> list[dict[str, Any]]:
    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]
```

- [ ] **Step 4: Implement `GET /admin/members`**

Add:

```python
@router.get("/members", response_model=list[AdminMemberResponse])
async def list_members(
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()
    result = (
        supabase.table("salesperson_accounts")
        .select("id, full_name, email, phone_number, employee_id, role, is_active, created_at")
        .eq("business_id", current_account.business_id)
        .order("created_at", desc=True)
        .execute()
    )
    return _member_rows(result.data)
```

- [ ] **Step 5: Implement `PATCH /admin/members/{id}`**

Add:

```python
@router.patch("/members/{member_id}", response_model=AdminMemberResponse)
async def update_member(
    member_id: str,
    data: UpdateAdminMemberRequest,
    current_account: CurrentAccount = Depends(require_role("admin")),
):
    supabase = get_supabase()
    query = (
        supabase.table("salesperson_accounts")
        .select("id, full_name, email, phone_number, employee_id, role, is_active, business_id, created_at")
        .eq("id", member_id)
        .limit(1)
        .execute()
    )
    rows = _member_rows(query.data)
    if not rows:
        raise HTTPException(status_code=404, detail="Member not found")
    member = rows[0]
    if str(member["business_id"]) != str(current_account.business_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    patch_payload: dict[str, Any] = {}
    if data.role is not None:
        patch_payload["role"] = data.role
    if data.is_active is not None:
        patch_payload["is_active"] = data.is_active

    updated = (
        supabase.table("salesperson_accounts")
        .update(patch_payload)
        .eq("id", member_id)
        .execute()
    )
    updated_rows = _member_rows(updated.data)
    return updated_rows[0] if updated_rows else member
```

Keep the endpoint narrow:
- only update `role` and `is_active`
- no delete endpoint
- no business reassignment

- [ ] **Step 6: Run formatting and tests**

Run:

```bash
backend/.venv/bin/ruff check backend/app/api/routes/admin.py backend/tests/test_admin_routes.py
backend/.venv/bin/black --check backend/app/api/routes/admin.py backend/tests/test_admin_routes.py
PYTHONPATH=backend backend/.venv/bin/python -m unittest backend.tests.test_admin_routes -q
```

Expected:
- no lint errors
- no formatting errors
- the admin member tests pass

- [ ] **Step 7: Commit**

```bash
git add backend/app/api/routes/admin.py backend/tests/test_admin_routes.py
git commit -m "feat: add admin member management apis"
```

---

### Task 3: Build the `/admin/members` frontend page

**Files:**
- Create: `frontend/src/app/admin/members/page.tsx`
- Modify: `frontend/src/app/admin/page.tsx`
- Modify: `frontend/src/components/AppShell.tsx` only if a new nav entry is needed later; not required for the first pass
- Modify: `frontend/src/lib/api.ts` only if a shared helper shape needs to change; otherwise reuse as-is

**Interfaces:**
- Consumes: `GET /api/v1/admin/members`
- Consumes: `PATCH /api/v1/admin/members/{id}`
- Produces: member table UI with role and active-state controls

- [ ] **Step 1: Sketch the page contract in code**

Create the page with these frontend types:

```ts
type AdminMember = {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  employee_id: string | null;
  role: "rep" | "manager" | "admin";
  is_active: boolean;
  created_at?: string | null;
};
```

Load members with:

```ts
const response = await authFetch(`${API_BASE_URL}/admin/members`);
```

- [ ] **Step 2: Write the page**

Build `/admin/members` as an `AppShell` page that:

- redirects non-admins back to `/dashboard`
- loads the member list on mount
- renders a table with name, email, phone, employee ID, role, status, and actions
- allows role changes via a select
- allows active/inactive toggling via a button or switch

Suggested update handler:

```ts
await authFetch(`${API_BASE_URL}/admin/members/${member.id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ role: nextRole, is_active: nextActive }),
});
```

Prefer one save action per row to keep behavior obvious and easy to test.

- [ ] **Step 3: Add a route entry from `/admin`**

Update `frontend/src/app/admin/page.tsx` to include a visible link/button to `/admin/members`, so admins can reach the new page without needing a separate nav change.

Example:

```tsx
<button onClick={() => router.push("/admin/members")}>Manage Members</button>
```

- [ ] **Step 4: Run the frontend type-check**

Run:

```bash
cd frontend && npm run type-check
```

Expected:
- no TypeScript errors

- [ ] **Step 5: Manual browser check**

Verify in the browser:

1. log in as admin
2. open `/admin`
3. click through to `/admin/members`
4. confirm members load
5. change a role
6. deactivate a member
7. confirm a deactivated member gets `403` on the next protected request

- [ ] **Step 6: Commit**

```bash
git add frontend/src/app/admin/members/page.tsx frontend/src/app/admin/page.tsx frontend/src/lib/api.ts
git commit -m "feat: add admin members management page"
```

---

### Task 4: Final verification

**Files:**
- Read: `backend/app/api/deps.py`
- Read: `backend/app/api/routes/admin.py`
- Read: `frontend/src/app/admin/page.tsx`
- Read: `frontend/src/app/admin/members/page.tsx`

**Interfaces:**
- Confirms the whole N5 flow works end to end

- [ ] **Step 1: Run backend checks**

Run:

```bash
PYTHONPATH=backend backend/.venv/bin/python -m unittest backend.tests.test_deps backend.tests.test_admin_routes -q
backend/.venv/bin/ruff check backend/app/api/deps.py backend/app/api/routes/admin.py backend/tests/test_deps.py backend/tests/test_admin_routes.py
backend/.venv/bin/black --check backend/app/api/deps.py backend/app/api/routes/admin.py backend/tests/test_deps.py backend/tests/test_admin_routes.py
```

Expected:
- tests pass
- lint passes
- formatting passes

- [ ] **Step 2: Run frontend checks**

Run:

```bash
cd frontend && npm run type-check
```

Expected:
- no TypeScript errors

- [ ] **Step 3: Verify the functional flow manually**

Check this sequence:

1. admin logs in
2. `/admin` shows invite creation
3. `/admin/members` shows member list
4. role change persists
5. deactivation blocks access on the next protected request

- [ ] **Step 4: Commit anything left**

If the verification steps uncover follow-up fixes, commit them before opening the PR.
