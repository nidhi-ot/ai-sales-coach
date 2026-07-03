#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000}"
API_BASE_URL="${API_BASE_URL:-${BASE_URL}/api/v1}"

SCENARIO="${SCENARIO:-cold_call}"
BUSINESS_CONTEXT="${BUSINESS_CONTEXT:-apartment_association}"
FRAMEWORK="${FRAMEWORK:-BANT}"
FOCUS_AREA="${FOCUS_AREA:-handling_objections}"

REP_ID="${WALKING_SKELETON_REP_ID:-${REP_ID:-}}"
BUSINESS_ID="${WALKING_SKELETON_BUSINESS_ID:-${BUSINESS_ID:-aa1712fd-ad13-433b-a353-a047dedb74d0}}"
LOGIN_IDENTIFIER="${WALKING_SKELETON_LOGIN_IDENTIFIER:-${LOGIN_IDENTIFIER:-}}"
LOGIN_PASSWORD="${WALKING_SKELETON_LOGIN_PASSWORD:-${LOGIN_PASSWORD:-}}"
AUTH_TOKEN=""

TMP_RESPONSE_FILE="$(mktemp "${TMPDIR:-/tmp}/walking-skeleton-response.XXXXXX")"
TMP_REQUEST_FILE="$(mktemp "${TMPDIR:-/tmp}/walking-skeleton-request.XXXXXX")"

cleanup() {
  rm -f "$TMP_RESPONSE_FILE" "$TMP_REQUEST_FILE"
}
trap cleanup EXIT

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "FAIL: python3 or python is required for JSON validation"
  exit 1
fi

run_request() {
  local method="$1"
  local url="$2"
  local body_file="${3:-}"

  local curl_args=(
    -sS
    -X "$method"
    -o "$TMP_RESPONSE_FILE"
    -w "%{http_code}"
  )

  if [[ -n "$body_file" ]]; then
    curl_args+=(
      -H "Content-Type: application/json"
      --data-binary "@${body_file}"
    )
  fi

  if [[ -n "$AUTH_TOKEN" ]]; then
    curl_args+=(
      -H "Authorization: Bearer ${AUTH_TOKEN}"
    )
  fi

  curl "${curl_args[@]}" "$url"
}

print_response() {
  "$PYTHON_BIN" -m json.tool "$TMP_RESPONSE_FILE" 2>/dev/null || cat "$TMP_RESPONSE_FILE"
  echo
}

fail_request() {
  local label="$1"
  local url="$2"
  local status_code="$3"

  echo "FAIL: ${label}"
  echo "Request to ${url} returned HTTP ${status_code}"
  print_response
  exit 1
}

extract_json_field() {
  local field_path="$1"

  "$PYTHON_BIN" - "$field_path" "$TMP_RESPONSE_FILE" <<'PY'
import json
import sys

field_path = sys.argv[1].split(".")
response_file = sys.argv[2]

with open(response_file, encoding="utf-8") as handle:
    payload = json.load(handle)

value = payload
for key in field_path:
    if isinstance(value, dict):
        value = value.get(key)
    elif isinstance(value, list) and key.isdigit():
        index = int(key)
        value = value[index] if index < len(value) else None
    else:
        value = None
        break

if value in (None, "", [], {}):
    raise SystemExit(1)

if isinstance(value, (dict, list)):
    print(json.dumps(value))
else:
    print(value)
PY
}

assert_json_field() {
  local label="$1"
  local field_path="$2"

  if ! extract_json_field "$field_path" >/dev/null 2>&1; then
    echo "FAIL: ${label}"
    echo "Response did not include '${field_path}'"
    print_response
    exit 1
  fi
}

check_json_field() {
  local label="$1"
  local method="$2"
  local url="$3"
  local field_path="$4"
  local body_file="${5:-}"
  local status_code

  echo "Checking ${label}..."
  if ! status_code=$(run_request "$method" "$url" "$body_file"); then
    fail_request "$label" "$url" "${status_code:-curl_error}"
  fi

  if [[ ! "$status_code" =~ ^2 ]]; then
    fail_request "$label" "$url" "$status_code"
  fi

  assert_json_field "$label" "$field_path"
  echo "PASS: ${label}"
  print_response
}

require_realtime_config() {
  if [[ -z "$REP_ID" ]]; then
    echo "FAIL: missing rep id"
    echo "Set WALKING_SKELETON_REP_ID to a valid Supabase rep UUID."
    echo "If you seeded local data, use the Test rep ID printed by backend/scripts/seed_data.py."
    exit 1
  fi

  if [[ -z "$BUSINESS_ID" ]]; then
    echo "FAIL: missing business id"
    echo "Set WALKING_SKELETON_BUSINESS_ID to a valid business_profiles UUID."
    exit 1
  fi
}

build_before_call_payload() {
  "$PYTHON_BIN" - "$TMP_REQUEST_FILE" "$SCENARIO" "$REP_ID" "$BUSINESS_ID" <<'PY'
import json
import sys

output_file, scenario, rep_id, business_id = sys.argv[1:]

with open(output_file, "w", encoding="utf-8") as handle:
    json.dump(
        {
            "scenario": scenario,
            "rep_id": rep_id,
            "business_id": business_id,
        },
        handle,
    )
PY
}

build_realtime_session_payload() {
  "$PYTHON_BIN" - \
    "$TMP_REQUEST_FILE" \
    "$SCENARIO" \
    "$REP_ID" \
    "$BUSINESS_ID" \
    "$BUSINESS_CONTEXT" \
    "$FRAMEWORK" \
    "$FOCUS_AREA" <<'PY'
import json
import sys

(
    output_file,
    scenario,
    rep_id,
    business_id,
    business_context,
    framework,
    focus_area,
) = sys.argv[1:]

with open(output_file, "w", encoding="utf-8") as handle:
    json.dump(
        {
            "scenario": scenario,
            "rep_id": rep_id,
            "business_id": business_id,
            "business_context": business_context,
            "framework": framework,
            "focus_area": focus_area,
            "vad": {
                "threshold": 0.5,
                "silence_duration_ms": 500,
            },
        },
        handle,
    )
PY
}

build_end_session_payload() {
  "$PYTHON_BIN" - "$TMP_REQUEST_FILE" <<'PY'
from datetime import UTC, datetime
import json
import sys

with open(sys.argv[1], "w", encoding="utf-8") as handle:
    json.dump(
        {
            "ended_at": datetime.now(UTC).isoformat(),
            "duration_seconds": 0,
            "end_reason": "walking_skeleton",
            "entries": [],
        },
        handle,
    )
PY
}

login() {
  if [[ -z "$LOGIN_IDENTIFIER" || -z "$LOGIN_PASSWORD" ]]; then
    echo "FAIL: missing login credentials"
    echo "Set WALKING_SKELETON_LOGIN_IDENTIFIER and WALKING_SKELETON_LOGIN_PASSWORD."
    exit 1
  fi

  "$PYTHON_BIN" - "$TMP_REQUEST_FILE" "$LOGIN_IDENTIFIER" "$LOGIN_PASSWORD" <<'PY'
import json
import sys

output_file, identifier, password = sys.argv[1:]

with open(output_file, "w", encoding="utf-8") as handle:
    json.dump(
        {
            "identifier": identifier,
            "password": password,
        },
        handle,
    )
PY

  local status_code
  if ! status_code=$(run_request "POST" "${API_BASE_URL}/auth/login" "$TMP_REQUEST_FILE"); then
    fail_request "login" "${API_BASE_URL}/auth/login" "${status_code:-curl_error}"
  fi

  if [[ ! "$status_code" =~ ^2 ]]; then
    fail_request "login" "${API_BASE_URL}/auth/login" "$status_code"
  fi

  AUTH_TOKEN=$("$PYTHON_BIN" - "$TMP_RESPONSE_FILE" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    payload = json.load(handle)

token = payload.get("access_token")
if not token:
    raise SystemExit(1)

print(token)
PY
)

  if [[ -z "$REP_ID" ]]; then
    REP_ID=$("$PYTHON_BIN" - "$TMP_RESPONSE_FILE" <<'PY'
import json
import sys

with open(sys.argv[1], encoding="utf-8") as handle:
    payload = json.load(handle)

rep_id = payload.get("rep_id") or payload.get("user_id")
if not rep_id:
    raise SystemExit(1)

print(rep_id)
PY
)
  fi
}

echo "=== Walking Skeleton Integration Test ==="
echo "Backend: ${BASE_URL}"
echo "API: ${API_BASE_URL}"

check_json_field "backend health" "GET" "${BASE_URL}/health" "status"
check_json_field "API health" "GET" "${API_BASE_URL}/health" "status"
check_json_field "realtime status" "GET" "${API_BASE_URL}/realtime/status" "status"

require_realtime_config

login

check_json_field "Supabase connection" "GET" "${API_BASE_URL}/realtime/supabase-status" "status"

echo "Using scenario=${SCENARIO}"
echo "Using rep_id=${REP_ID}"
echo "Using business_id=${BUSINESS_ID}"

build_before_call_payload
check_json_field \
  "before-call context assembly" \
  "POST" \
  "${API_BASE_URL}/agent/before-call" \
  "system_instruction" \
  "$TMP_REQUEST_FILE"

build_realtime_session_payload
check_json_field \
  "canonical realtime session endpoint" \
  "POST" \
  "${API_BASE_URL}/realtime/session" \
  "client_secret" \
  "$TMP_REQUEST_FILE"

SESSION_ID="$(extract_json_field "session_id")"
assert_json_field "canonical realtime session endpoint" "openai_session_id"
echo "Created session_id=${SESSION_ID}"

build_end_session_payload
check_json_field \
  "session cleanup" \
  "POST" \
  "${API_BASE_URL}/sessions/${SESSION_ID}/end" \
  "score_card_status" \
  "$TMP_REQUEST_FILE"

echo "=== Walking skeleton test passed ==="
