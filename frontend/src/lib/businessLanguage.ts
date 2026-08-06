export type SupportedBusinessLocale = "en" | "sv";

export function normalizeBusinessLocale(value: unknown): SupportedBusinessLocale {
  if (typeof value === "string" && value.toLowerCase().startsWith("sv")) {
    return "sv";
  }

  return "en";
}

export function applyBusinessLanguage(value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  const locale = normalizeBusinessLocale(value);

  window.localStorage.setItem("business_language", locale);
  document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

export function clearBusinessLanguage() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("business_language");
  document.cookie = "NEXT_LOCALE=en; path=/; max-age=31536000; SameSite=Lax";
}