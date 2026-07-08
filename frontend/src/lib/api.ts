export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8011/api/v1";

const AUTH_STORAGE_KEYS = [
  "access_token",
  "user_id",
  "rep_id",
  "business_id",
  "full_name",
  "email",
  "phone_number",
  "employee_id",
  "role",
  "remember_me",
  "last_session_id",
] as const;

function clearAuthStorage() {
  if (typeof window === "undefined") {
    return;
  }

  for (const key of AUTH_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }
}

export async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
  const headers = new Headers(input instanceof Request ? input.headers : undefined);

  if (init?.headers) {
    const initHeaders = new Headers(init.headers);

    initHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  if (typeof window !== "undefined") {
    const accessToken = window.localStorage.getItem("access_token");

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    clearAuthStorage();
    window.location.assign("/login");
    throw new Error("Unauthorized");
  }

  return response;
}
