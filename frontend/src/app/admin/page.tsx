"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../components/AppShell";
import { API_BASE_URL, authFetch } from "../../lib/api";

type InviteResponse = {
  invite_id: string;
  email: string;
  business_id: string;
  role: "rep" | "manager" | "admin";
  token: string;
  registration_link: string;
  expires_at: string;
  warning: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"rep" | "manager" | "admin">("rep");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InviteResponse | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "rep";
    if (storedRole !== "admin") {
      router.replace("/dashboard");
    }
  }, [router]);

  const inviteLink = useMemo(() => result?.registration_link ?? "", [result]);

  async function handleCreateInvite() {
    setError("");
    setResult(null);

    if (!email.trim()) {
      setError("Please enter an email address");
      return;
    }

    const parsedDays = Number.parseInt(expiresInDays, 10);

    if (!Number.isFinite(parsedDays) || parsedDays <= 0) {
      setError("Expiry must be a positive number of days");
      return;
    }

    setLoading(true);

    try {
      const response = await authFetch(`${API_BASE_URL}/admin/invites`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          role: inviteRole,
          expires_in_days: parsedDays,
        }),
      });

      const rawBody = await response.text();
      const data = rawBody
        ? (JSON.parse(rawBody) as Partial<InviteResponse> & { detail?: string })
        : ({} as Partial<InviteResponse> & { detail?: string });

      if (!response.ok) {
        setError(data.detail || "Invite creation failed");
        return;
      }

      setResult(data as InviteResponse);
    } catch (inviteError) {
      console.error(inviteError);
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : "Could not connect to backend"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "1040px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <p style={eyebrowStyle}>Admin</p>
          <h1 style={titleStyle}>Invite team members</h1>
          <p style={subtitleStyle}>
            Create invite links for reps, managers, and admins in your business.
          </p>
        </section>

        <div style={gridStyle}>
          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>Create invite</h2>

            <label style={labelStyle}>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@company.com"
              type="email"
              style={inputStyle}
            />

            <label style={labelStyle}>Role</label>
            <select
              value={inviteRole}
              onChange={(e) =>
                setInviteRole(e.target.value as "rep" | "manager" | "admin")
              }
              style={inputStyle}
            >
              <option value="rep">Rep</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>

            <label style={labelStyle}>Invite expires in days</label>
            <input
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              type="number"
              min="1"
              style={inputStyle}
            />

            {error && <p style={errorStyle}>{error}</p>}

            <button onClick={handleCreateInvite} disabled={loading} style={buttonStyle}>
              {loading ? "Creating..." : "Create Invite"}
            </button>
          </section>

          <section style={panelStyle}>
            <h2 style={sectionTitleStyle}>Invite details</h2>

            {!result ? (
              <p style={{ color: "#667085", marginTop: "16px" }}>
                Create an invite to generate a registration link.
              </p>
            ) : (
              <div style={{ display: "grid", gap: "14px", marginTop: "16px" }}>
                <InfoRow label="Email" value={result.email} />
                <InfoRow label="Role" value={result.role} />
                <InfoRow label="Expires" value={result.expires_at} />
                <InfoRow label="Invite ID" value={result.invite_id || "-"} />

                <div style={linkCardStyle}>
                  <div style={{ overflowWrap: "anywhere" }}>{inviteLink}</div>
                </div>

                <p style={warningStyle}>{result.warning}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoRowStyle}>
      <span style={{ color: "#667085", fontSize: "14px" }}>{label}</span>
      <strong style={{ color: "#101828" }}>{value}</strong>
    </div>
  );
}

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
  border: "1px solid #dfeee8",
  borderRadius: "28px",
  padding: "34px",
  boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
  marginBottom: "28px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: "0 0 8px",
  color: "#006b4f",
  fontWeight: 800,
  fontSize: "14px",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "36px",
  fontWeight: 900,
  color: "#101828",
};

const subtitleStyle: React.CSSProperties = {
  color: "#667085",
  fontSize: "16px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "20px",
};

const panelStyle: React.CSSProperties = {
  background: "white",
  padding: "28px",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "24px",
  fontWeight: 800,
  color: "#101828",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  margin: "18px 0 8px",
  fontWeight: 700,
  color: "#344054",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #d0d5dd",
  fontSize: "15px",
  color: "#101828",
  background: "white",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "22px",
  width: "100%",
  padding: "14px 18px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg, #006b4f 0%, #008f6b 100%)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 22px rgba(0, 107, 79, 0.2)",
};

const errorStyle: React.CSSProperties = {
  color: "#b42318",
  background: "#fef3f2",
  border: "1px solid #fecdca",
  padding: "12px 14px",
  borderRadius: "12px",
  fontSize: "14px",
  marginTop: "18px",
};

const infoRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
  padding: "14px 16px",
  borderRadius: "14px",
  background: "#f9fafb",
  border: "1px solid #eef2f6",
};

const linkCardStyle: React.CSSProperties = {
  padding: "16px",
  borderRadius: "14px",
  background: "#ecfdf3",
  border: "1px solid #abefc6",
  color: "#027a48",
  fontSize: "14px",
};

const warningStyle: React.CSSProperties = {
  margin: 0,
  color: "#b54708",
  background: "#fffaeb",
  border: "1px solid #fedf89",
  borderRadius: "12px",
  padding: "12px 14px",
};
