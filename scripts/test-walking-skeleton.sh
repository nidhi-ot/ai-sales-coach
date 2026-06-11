#!/bin/bash
set -e

BASE_URL="http://localhost:8000"

check_endpoint() {
  local label="$1"
  local url="$2"

  echo "Checking ${label}..."
  if curl -fsS "$url" > /tmp/walking-skeleton-response.txt; then
    echo "PASS: ${label}"
    cat /tmp/walking-skeleton-response.txt
    echo
  else
    echo "FAIL: ${label}"
    echo "Could not reach ${url}"
    exit 1
  fi
}

echo "=== Walking Skeleton Integration Test ==="
check_endpoint "backend health" "${BASE_URL}/health"
check_endpoint "API health" "${BASE_URL}/api/v1/health"
check_endpoint "realtime status" "${BASE_URL}/api/v1/realtime/status"
echo "=== Walking skeleton test passed ==="
