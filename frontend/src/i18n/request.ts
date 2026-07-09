import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const defaultLocale = "en";
const supportedLocales = ["en", "sv"] as const;

type SupportedLocale = (typeof supportedLocales)[number];

function normalizeLocale(value: string | undefined): SupportedLocale {
  if (value?.startsWith("sv")) {
    return "sv";
  }

  return defaultLocale;
}

export default getRequestConfig(async () => {
  const locale = normalizeLocale(cookies().get("NEXT_LOCALE")?.value);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});