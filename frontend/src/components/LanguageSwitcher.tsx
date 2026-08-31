"use client";

import { useEffect, useState } from "react";
import { applyBusinessLanguage } from "../lib/businessLanguage";


function getLocaleFromCookie(): "en" | "sv" {
  const localeCookie = document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("NEXT_LOCALE="));

  const value = localeCookie?.split("=")[1];

  return value === "sv" ? "sv" : "en";
}

export default function LanguageSwitcher() {
  const [current, setCurrent] = useState<"en" | "sv">("en");

  useEffect(() => {
    setCurrent(getLocaleFromCookie());
  }, []);

  function changeLanguage() {
    const nextLocale = current === "sv" ? "en" : "sv";

    applyBusinessLanguage(nextLocale);
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