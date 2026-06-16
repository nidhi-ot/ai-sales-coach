"use client";

import { usePathname, useRouter } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: "🏠" },
    { label: "Practice", path: "/scenarios", icon: "🎯" },
    { label: "History", path: "/history", icon: "🕘" },
    { label: "Scorecards", path: "/scorecards", icon: "📋" },
    { label: "Profile", path: "/profile", icon: "👤" },
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
          width: "260px",
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          padding: "28px 20px",
        }}
      >
        <h2 style={{ marginBottom: "32px", color: "#101828" }}>
          AI Sales Coach
        </h2>

        <nav style={{ display: "grid", gap: "10px" }}>
          {navItems.map((item) => {
            const active = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
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
                  background: active ? "#006b4f" : "transparent",
                  color: active ? "#ffffff" : "#344054",
                }}
              >
                <span style={{ fontSize: "18px" }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section style={{ flex: 1, padding: "36px" }}>{children}</section>
    </main>
  );
}