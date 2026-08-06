import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const defaultLocale = "en";
const supportedLocales = ["en", "sv"] as const;

type SupportedLocale = (typeof supportedLocales)[number];

function normalizeLocale(value: string | undefined): SupportedLocale {
  const normalized = value?.trim().toLowerCase().replace("_", "-");

  if (normalized?.startsWith("sv")) {
    return "sv";
  }

  return defaultLocale;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const cookieLocale = cookies().get("NEXT_LOCALE")?.value;
  const requestedLocale = await requestLocale;

  const locale = normalizeLocale(cookieLocale || requestedLocale);

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});