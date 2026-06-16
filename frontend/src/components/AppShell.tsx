"use client";

import { useRouter, usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const items = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Practice", path: "/scenarios" },
    { label: "History", path: "/history" },
    { label: "Scorecards", path: "/scorecards" },
    { label: "Profile", path: "/profile" },
  ];

  return (
    <main style={{ minHeight: "100vh", display: "flex", background: "#f6f8f7" }}>
      <aside
        style={{
          width: "260px",
          background: "#064236",
          color: "white",
          padding: "28px 20px",
        }}
      >
        <h2 style={{ marginBottom: "40px" }}>AI Sales Coach</h2>

        <nav style={{ display: "grid", gap: "10px" }}>
          {items.map((item) => {
            const active = pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                style={{
                  padding: "13px 16px",
                  borderRadius: "12px",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  color: "white",
                  background: active ? "rgba(255,255,255,0.18)" : "transparent",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <section style={{ flex: 1, padding: "36px" }}>{children}</section>
    </main>
  );
}