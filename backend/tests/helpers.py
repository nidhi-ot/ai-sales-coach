"""Shared Supabase fakes for backend route/service tests."""

from __future__ import annotations

from copy import deepcopy
from types import SimpleNamespace
from typing import Any

DEFAULT_SESSION = {
    "id": "session-123",
    "rep_id": "rep-456",
    "business_id": "business-789",
    "scenario": "cold_call",
    "profile_version": 3,
    "status": "active",
    "started_at": "2026-06-25T10:00:00+00:00",
    "ended_at": None,
    "duration_seconds": None,
    "metadata": {"system_instruction": "Test scenario"},
}

DEFAULT_BUSINESS_PROFILE = {
    "id": "business-789",
    "name": "Optimal Trappstadning",
    "framework": "BANT",
    "context_data": {"industry": "SaaS"},
    "products": "AI sales coaching",
    "icp": "Sales teams",
    "objections": "Too expensive",
    "language": "en",
    "created_at": "2026-06-25T10:00:00+00:00",
    "updated_at": "2026-06-25T10:00:00+00:00",
}


class FakeTable:
    def __init__(self, name: str, store: dict[str, Any]):
        self.name = name
        self.store = store
        self.filters: dict[str, Any] = {}
        self.in_filters: dict[str, set[Any]] = {}
        self.insert_payload: Any = None
        self.update_payload: dict[str, Any] | None = None
        self.order_column: str | None = None
        self.order_desc = False
        self.limit_value: int | None = None

    def select(self, *_args: Any, **_kwargs: Any) -> "FakeTable":
        return self

    def eq(self, key: str, value: Any) -> "FakeTable":
        self.filters[key] = value
        return self

    def is_(self, key: str, value: Any) -> "FakeTable":
        self.filters[key] = value
        return self

    def in_(self, key: str, values: list[Any]) -> "FakeTable":
        self.in_filters[key] = set(values)
        return self

    def limit(self, value: int) -> "FakeTable":
        self.limit_value = value
        return self

    def order(self, column: str, *_args: Any, **kwargs: Any) -> "FakeTable":
        self.order_column = column
        self.order_desc = bool(kwargs.get("desc", False))
        return self

    def insert(self, payload: Any) -> "FakeTable":
        self.insert_payload = payload
        return self

    def upsert(self, payload: Any, *_args: Any, **_kwargs: Any) -> "FakeTable":
        self.insert_payload = payload
        return self

    def update(self, payload: dict[str, Any]) -> "FakeTable":
        self.update_payload = payload
        return self

    def _iter_rows(self):
        table = self.store[self.name]
        return table.values() if isinstance(table, dict) else table

    def _matches(self, row: dict[str, Any]) -> bool:
        return all(row.get(k) == v for k, v in self.filters.items()) and all(
            row.get(k) in values for k, values in self.in_filters.items()
        )

    def _selected_rows(self) -> list[dict[str, Any]]:
        rows = [dict(row) for row in self._iter_rows() if self._matches(row)]
        if self.order_column is not None:
            rows.sort(
                key=lambda row: (
                    "" if row.get(self.order_column) is None else row.get(self.order_column)
                ),
                reverse=self.order_desc,
            )
        if self.limit_value is not None:
            rows = rows[: self.limit_value]
        return rows

    def execute(self):
        if self.name == "sessions":
            return self._execute_sessions()

        if self.name == "transcripts":
            return self._execute_transcripts()

        if self.name == "scorecards":
            return self._execute_scorecards()

        if self.name == "salesperson_profiles":
            return self._execute_salesperson_profiles()

        if self.name == "salesperson_accounts":
            return self._execute_list_table("salesperson_accounts", "account")

        if self.name == "business_profiles":
            return self._execute_list_table("business_profiles", "business")

        if self.name == "invites":
            return self._execute_list_table("invites", "invite")

        raise AssertionError(f"Unexpected table access: {self.name}")

    def _execute_list_table(self, table_name: str, id_prefix: str):
        if self.insert_payload is not None:
            payload = dict(self.insert_payload)
            row = {
                "id": payload.get("id") or f"{id_prefix}-{len(self.store[table_name]) + 1}",
                **payload,
            }
            self.store[table_name].append(row)
            return SimpleNamespace(data=[dict(row)])

        if self.update_payload is not None:
            rows = []
            for row in self.store[table_name]:
                if self._matches(row):
                    row.update(self.update_payload)
                    rows.append(dict(row))
            return SimpleNamespace(data=rows)

        return SimpleNamespace(data=self._selected_rows())

    def _execute_sessions(self):
        if self.insert_payload is not None:
            row = {
                "id": self.insert_payload.get("id") or f"session-{len(self.store['sessions']) + 1}",
                **self.insert_payload,
            }
            self.store["sessions"][row["id"]] = row
            return SimpleNamespace(data=[dict(row)])

        if self.update_payload is not None:
            rows = []
            for session in self.store["sessions"].values():
                if self._matches(session):
                    session.update(self.update_payload)
                    rows.append(dict(session))
            return SimpleNamespace(data=rows)

        return SimpleNamespace(data=self._selected_rows())

    def _execute_transcripts(self):
        if self.insert_payload is not None:
            payload = (
                self.insert_payload
                if isinstance(self.insert_payload, list)
                else [self.insert_payload]
            )
            rows = []
            for item in payload:
                row = {"id": f"transcript-{len(self.store['transcripts']) + 1}", **item}
                self.store["transcripts"].append(row)
                rows.append(dict(row))
            return SimpleNamespace(data=rows)

        return SimpleNamespace(data=self._selected_rows())

    def _execute_scorecards(self):
        if self.insert_payload is not None:
            payload = dict(self.insert_payload)
            existing = next(
                (
                    scorecard
                    for scorecard in self.store["scorecards"]
                    if scorecard.get("session_id") == payload.get("session_id")
                ),
                None,
            )
            if existing is not None:
                existing.update(payload)
                return SimpleNamespace(data=[dict(existing)])

            row = {
                "id": payload.get("id") or f"scorecard-{len(self.store['scorecards']) + 1}",
                **payload,
            }
            self.store["scorecards"].append(row)
            return SimpleNamespace(data=[dict(row)])

        if self.update_payload is not None:
            rows = []
            for scorecard in self.store["scorecards"]:
                if self._matches(scorecard):
                    scorecard.update(self.update_payload)
                    rows.append(dict(scorecard))
            return SimpleNamespace(data=rows)

        return SimpleNamespace(data=self._selected_rows())

    def _execute_salesperson_profiles(self):
        if self.insert_payload is not None:
            payload = dict(self.insert_payload)
            row = {
                "id": payload.get("id") or f"profile-{len(self.store['salesperson_profiles']) + 1}",
                **payload,
            }
            self.store["salesperson_profiles"].append(row)
            return SimpleNamespace(data=[dict(row)])

        return SimpleNamespace(data=self._selected_rows())


class FakeRpc:
    def __init__(self, supabase: "FakeSupabase", name: str, params: dict[str, Any]):
        self.supabase = supabase
        self.name = name
        self.params = params

    def execute(self):
        self.supabase.rpc_calls.append((self.name, self.params))
        if self.name == "update_admin_member":
            return self._execute_update_admin_member()
        if self.name == "delete_member_data":
            return self._execute_delete_member_data()

        rep_profiles = [
            profile
            for profile in self.supabase.store["salesperson_profiles"]
            if profile["rep_id"] == self.params["p_rep_id"]
        ]
        version = max((profile["version"] for profile in rep_profiles), default=0) + 1
        profile = {
            "id": f"profile-{version}",
            "rep_id": self.params["p_rep_id"],
            "business_id": self.params["p_business_id"],
            "version": version,
            "call_id": self.params["p_call_id"],
            "metric_scores": self.params["p_metric_scores"],
            "weakest_dimension": self.params["p_weakest_dimension"],
        }
        self.supabase.store["salesperson_profiles"].append(profile)
        return SimpleNamespace(data=profile)

    def _execute_update_admin_member(self):
        member = next(
            (
                account
                for account in self.supabase.store["salesperson_accounts"]
                if account["id"] == self.params["p_member_id"]
                and account.get("business_id") == self.params["p_business_id"]
            ),
            None,
        )

        if member is None:
            raise RuntimeError("Member not found")

        would_remove_admin_privileges = (
            self.params.get("p_role") is not None and self.params["p_role"] != "admin"
        ) or self.params.get("p_is_active") is False

        if (
            member.get("role") == "admin"
            and member.get("is_active", True)
            and would_remove_admin_privileges
        ):
            other_active_admins = [
                account
                for account in self.supabase.store["salesperson_accounts"]
                if account.get("business_id") == self.params["p_business_id"]
                and account.get("role") == "admin"
                and account.get("is_active", True)
                and account["id"] != self.params["p_member_id"]
            ]
            if not other_active_admins:
                raise RuntimeError("Cannot remove the last active admin from the business")

        if self.params.get("p_role") is not None:
            member["role"] = self.params["p_role"]
        if self.params.get("p_is_active") is not None:
            member["is_active"] = self.params["p_is_active"]
        member["updated_at"] = "2026-07-08T00:00:00+00:00"
        return SimpleNamespace(data=[dict(member)])

    def _execute_delete_member_data(self):
        member_id = self.params["p_member_id"]
        business_id = self.params["p_business_id"]

        member = next(
            (
                account
                for account in self.supabase.store["salesperson_accounts"]
                if account["id"] == member_id and account.get("business_id") == business_id
            ),
            None,
        )
        if member is None:
            raise RuntimeError("Member not found")

        if (
            member.get("role") == "admin"
            and member.get("is_active", True)
            and not any(
                account.get("business_id") == business_id
                and account.get("role") == "admin"
                and account.get("is_active", True)
                and account.get("id") != member_id
                for account in self.supabase.store["salesperson_accounts"]
            )
        ):
            raise RuntimeError("Cannot delete the last active admin from the business")

        session_ids = {
            session["id"]
            for session in self.supabase.store["sessions"].values()
            if session.get("rep_id") == member_id and session.get("business_id") == business_id
        }

        self.supabase.store["transcripts"] = [
            transcript
            for transcript in self.supabase.store["transcripts"]
            if transcript.get("session_id") not in session_ids
        ]
        self.supabase.store["scorecards"] = [
            scorecard
            for scorecard in self.supabase.store["scorecards"]
            if scorecard.get("session_id") not in session_ids
        ]
        self.supabase.store["sessions"] = {
            session_id: session
            for session_id, session in self.supabase.store["sessions"].items()
            if not (
                session.get("rep_id") == member_id and session.get("business_id") == business_id
            )
        }
        self.supabase.store["salesperson_profiles"] = [
            profile
            for profile in self.supabase.store["salesperson_profiles"]
            if not (
                profile.get("rep_id") == member_id and profile.get("business_id") == business_id
            )
        ]
        self.supabase.store["salesperson_accounts"] = [
            account
            for account in self.supabase.store["salesperson_accounts"]
            if not (account.get("id") == member_id and account.get("business_id") == business_id)
        ]
        return SimpleNamespace(data=None)


class FakeSupabase:
    def __init__(self, *, with_default_session: bool = True):
        self.rpc_calls: list[tuple[str, dict[str, Any]]] = []
        self.deleted_users: list[str] = []
        self.store = {
            "sessions": {},
            "transcripts": [],
            "scorecards": [],
            "salesperson_profiles": [],
            "salesperson_accounts": [],
            "business_profiles": [],
            "invites": [],
        }
        self.auth = SimpleNamespace(
            admin=SimpleNamespace(
                delete_user=self._delete_user,
            )
        )
        if with_default_session:
            self.store["sessions"][DEFAULT_SESSION["id"]] = deepcopy(DEFAULT_SESSION)
            self.store["business_profiles"].append(deepcopy(DEFAULT_BUSINESS_PROFILE))

    def table(self, name: str) -> FakeTable:
        return FakeTable(name, self.store)

    def rpc(self, name: str, params: dict[str, Any]) -> FakeRpc:
        return FakeRpc(self, name, params)

    def _delete_user(self, user_id: str):
        self.deleted_users.append(user_id)
        return SimpleNamespace()
