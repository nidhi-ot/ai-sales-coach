"use client";

import { useTranslations } from "next-intl";

export default function PracticeSetupLoadingFallback() {
  const t = useTranslations("PracticeSetup");

  return <div>{t("loading")}</div>;
}
