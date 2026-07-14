"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { clearBusinessLanguage } from "../lib/businessLanguage";

export default function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("rep");

  useEffect(() => {
    setRole(localStorage.getItem("role") || "rep");
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("rep_id");
    localStorage.removeItem("business_id");
    localStorage.removeItem("full_name");
    localStorage.removeItem("email");
    localStorage.removeItem("phone_number");
    localStorage.removeItem("employee_id");
    localStorage.removeItem("role");
    localStorage.removeItem("remember_me");
    localStorage.removeItem("last_session_id");
    clearBusinessLanguage();

    router.push("/");
  }

  const navItems =
    
  role === "admin"
    ? [
        { label: "Dashboard", href: "/dashboard", icon: "🏠" },
        { label: "Admin", href: "/admin", icon: "🛠️" },
        { label: "Settings", href: "/settings", icon: "⚙️" },
      ]
    : role === "manager"
      ? [
          { label: "Dashboard", href: "/dashboard", icon: "🏠" },
          { label: "Team", href: "/team", icon: "👥" },
          { label: "Settings", href: "/settings", icon: "⚙️" },
        ]
      : [
          { label: "Dashboard", href: "/dashboard", icon: "🏠" },
          { label: "Practice", href: "/scenarios", icon: "🎯" },
          { label: "History", href: "/history", icon: "🕘" },
          { label: "Scorecards", href: "/scorecards", icon: "📋" },
          { label: "Profile", href: "/profile", icon: "👤" },
          { label: "Progress", href: "/progress", icon: "📈" },
          { label: "Settings", href: "/settings", icon: "⚙️" },
        ];
    role === "manager"
      ? [
          { label: "Dashboard", href: "/dashboard", icon: "🏠" },
          { label: "Team", href: "/team", icon: "👥" },
          { label: "Settings", href: "/settings", icon: "⚙️" },
        ]
      : [
          { label: "Dashboard", href: "/dashboard", icon: "🏠" },
          { label: "Practice", href: "/scenarios", icon: "🎯" },
          { label: "History", href: "/history", icon: "🕘" },
          { label: "Scorecards", href: "/scorecards", icon: "📋" },
          { label: "Profile", href: "/profile", icon: "👤" },
          { label: "Progress", href: "/progress", icon: "📈" },
          { label: "Settings", href: "/settings", icon: "⚙️" },
          ...(role === "admin"
            ? [{ label: "Admin", href: "/admin", icon: "🛡️" }]
            : []),
        ];

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "#f7f9f8",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <aside
        style={{
          width: "280px",
          background: "linear-gradient(180deg, #ffffff 0%, #f8fbfa 100%)",
          borderRight: "1px solid #e5e7eb",
          padding: "28px 22px",
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          boxShadow: "8px 0 30px rgba(16, 24, 40, 0.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "32px",
            paddingBottom: "24px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <img
            src="/logo.png"
            alt="AI Sales Coach"
            style={{
              width: "110px",
              height: "110px",
              objectFit: "contain",
              marginBottom: "10px",
            }}
          />

          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              color: "#101828",
              fontWeight: 700,
            }}
          >
            AI Sales Coach
          </h2>
        </div>

        <nav
          style={{
            display: "grid",
            gap: "10px",
            flex: 1,
            alignContent: "start",
            gridAutoRows: "max-content",
          }}
        >
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "13px 14px",
                  borderRadius: "12px",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "15px",
                  fontWeight: active ? 700 : 500,
                  background: active
                    ? "linear-gradient(135deg, #006b4f 0%, #008f6b 100%)"
                    : "transparent",
                  color: active ? "white" : "#344054",
                  boxShadow: active
                    ? "0 10px 20px rgba(0, 107, 79, 0.18)"
                    : "none",
                }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <LanguageSwitcher />
        <button
          onClick={handleLogout}
          style={{
            marginTop: "20px",
            padding: "14px 16px",
            borderRadius: "14px",
            border: "1px solid #d0d5dd",
            background: "#ffffff",
            color: "#b42318",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          🚪 Logout
        </button>
      </aside>

      <section style={{ flex: 1, padding: "36px" }}>{children}</section>
    </main>
  );
}
