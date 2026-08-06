"use client";

import { useTranslations } from "next-intl";

export default function CallLoadingFallback() {
  const t = useTranslations("Call");

  return <div>{t("loading")}</div>;
}
