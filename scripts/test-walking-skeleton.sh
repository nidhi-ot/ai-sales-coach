#!/bin/bash
set -euo pipefail

BASE_URL="http://localhost:8000"
TMP_RESPONSE_FILE="/tmp/walking-skeleton-response.json"

run_request() {
  local method="$1"
  local url="$2"

  curl -sS \
    -X "$method" \
    -o "$TMP_RESPONSE_FILE" \
    -w "%{http_code}" \
    "$url"
}

check_endpoint() {
  local label="$1"
  local url="$2"
  local status_code

  echo "Checking ${label}..."
  status_code=$(run_request "GET" "$url")
  if [[ "$status_code" =~ ^2 ]]; then
    echo "PASS: ${label}"
    cat "$TMP_RESPONSE_FILE"
    echo
  else
    echo "FAIL: ${label}"
    echo "Request to ${url} returned HTTP ${status_code}"
    cat "$TMP_RESPONSE_FILE"
    exit 1
  fi
}

check_json_field() {
  local label="$1"
  local method="$2"
  local url="$3"
  local field_name="$4"
  local status_code

  echo "Checking ${label}..."
  status_code=$(run_request "$method" "$url")
  if [[ "$status_code" =~ ^2 ]]; then
    if python3 - "$field_name" < "$TMP_RESPONSE_FILE" <<'PY'
import json
import sys

field_name = sys.argv[1]
payload = json.load(sys.stdin)
value = payload.get(field_name)

if value in (None, ""):
    raise SystemExit(1)

print(value)
PY
    then
      echo "PASS: ${label}"
      cat "$TMP_RESPONSE_FILE"
      echo
    else
      echo "FAIL: ${label}"
      echo "Response did not include '${field_name}'"
      cat "$TMP_RESPONSE_FILE"
      exit 1
    fi
  else
    echo "FAIL: ${label}"
    echo "Request to ${url} returned HTTP ${status_code}"
    cat "$TMP_RESPONSE_FILE"
    exit 1
  fi
}

echo "=== Walking Skeleton Integration Test ==="
check_endpoint "backend health" "${BASE_URL}/health"
check_endpoint "API health" "${BASE_URL}/api/v1/health"
check_json_field \
  "ephemeral token endpoint" \
  "POST" \
  "${BASE_URL}/api/v1/realtime/token" \
  "client_secret"
check_json_field \
  "Supabase connection" \
  "GET" \
  "${BASE_URL}/api/v1/realtime/supabase-status" \
  "status"
echo "=== Walking skeleton test passed ==="
