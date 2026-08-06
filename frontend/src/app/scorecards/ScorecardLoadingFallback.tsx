"use client";

import { useTranslations } from "next-intl";

export default function ScorecardLoadingFallback() {
  const t = useTranslations("Scorecard");

  return <div>{t("loading")}</div>;
}
