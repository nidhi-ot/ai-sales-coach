"use client";

import { useEffect, useState } from "react";

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState<"en" | "sv">("en");

  useEffect(() => {
    setCurrent(document.cookie.includes("NEXT_LOCALE=sv") ? "sv" : "en");
  }, []);

  function changeLanguage() {
    const nextLocale = current === "sv" ? "en" : "sv";

    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`;
    window.location.reload();
  }

  return (
    <button
      onClick={changeLanguage}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "13px 14px",
        borderRadius: "12px",
        border: "none",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        fontSize: "15px",
        fontWeight: 500,
        color: "#344054",
      }}
    >
      <span style={{ fontSize: "18px" }}>🌐</span>
      <span>{current === "en" ? "Svenska" : "English"}</span>
    </button>
  );
}