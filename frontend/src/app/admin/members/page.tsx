"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../../../components/AppShell";
import { API_BASE_URL, authFetch } from "../../../lib/api";

type AdminMember = {
  id: string;
  full_name: string;
  email: string | null;
  phone_number: string;
  employee_id: string | null;
  role: "rep" | "manager" | "admin";
  is_active: boolean;
  created_at?: string | null;
};

type MemberDraft = {
  role: "rep" | "manager" | "admin";
  is_active: boolean;
};

type ApiError = {
  detail?: string;
};

function getErrorDetail(value: unknown, fallback: string): string {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "detail" in value
  ) {
    const detail = (value as { detail?: unknown }).detail;
    if (typeof detail === "string" && detail.trim()) {
      return detail;
    }
  }

  return fallback;
}

export default function AdminMembersPage() {
  const router = useRouter();
  const [members, setMembers] = useState<AdminMember[]>([]);
  const [drafts, setDrafts] = useState<Record<string, MemberDraft>>({});
  const [loading, setLoading] = useState(true);
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedRole = localStorage.getItem("role") || "rep";

    if (storedRole !== "admin") {
      router.replace("/dashboard");
      return;
    }

    async function loadMembers() {
      try {
        const response = await authFetch(`${API_BASE_URL}/admin/members`);
        const raw = await response.text();
        const data = raw ? (JSON.parse(raw) as unknown) : [];

        if (!response.ok) {
          setError(getErrorDetail(data, "Failed to load members"));
          return;
        }

        const list = Array.isArray(data) ? data : [];
        setMembers(list);
        setDrafts(
          Object.fromEntries(
            list.map((member) => [
              member.id,
              {
                role: member.role,
                is_active: member.is_active,
              },
            ])
          )
        );
      } catch (memberError) {
        console.error("Failed to load members:", memberError);

        if (memberError instanceof Error && memberError.message === "Unauthorized") {
          return;
        }

        setError(
          memberError instanceof Error
            ? memberError.message
            : "Could not connect to backend"
        );
      } finally {
        setLoading(false);
      }
    }

    loadMembers();
  }, [router]);

  async function handleSave(member: AdminMember) {
    const draft = drafts[member.id];

    if (!draft) {
      return;
    }

    setSavingMemberId(member.id);
    setError("");

    try {
      const response = await authFetch(`${API_BASE_URL}/admin/members/${member.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      const raw = await response.text();
      const data = raw ? (JSON.parse(raw) as unknown) : {};

      if (!response.ok) {
        setError(getErrorDetail(data, "Failed to update member"));
        return;
      }

      const updated = data as AdminMember;
      setMembers((current) =>
        current.map((currentMember) =>
          currentMember.id === updated.id ? updated : currentMember
        )
      );
      setDrafts((current) => ({
        ...current,
        [updated.id]: {
          role: updated.role,
          is_active: updated.is_active,
        },
      }));
    } catch (memberError) {
      console.error("Failed to update member:", memberError);

      if (memberError instanceof Error && memberError.message === "Unauthorized") {
        return;
      }

      setError(
        memberError instanceof Error
          ? memberError.message
          : "Could not connect to backend"
      );
    } finally {
      setSavingMemberId(null);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        <section style={heroStyle}>
          <p style={eyebrowStyle}>Admin</p>
          <h1 style={titleStyle}>Member management</h1>
          <p style={subtitleStyle}>
            Promote people, deactivate leavers, and keep access inside the business.
          </p>

          <button
            type="button"
            onClick={() => router.push("/admin")}
            style={backButtonStyle}
          >
            Back to invites
          </button>
        </section>

        {error ? <div style={errorStyle}>{error}</div> : null}

        <section style={cardStyle}>
          <div style={headerRowStyle}>
            <div>
              <h2 style={sectionTitleStyle}>Business members</h2>
              <p style={sectionSubtitleStyle}>
                Change roles and deactivate members without deleting their account.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/admin")}
              style={secondaryButtonStyle}
            >
              Invite member
            </button>
          </div>

          {loading ? (
            <p style={mutedTextStyle}>Loading members...</p>
          ) : members.length === 0 ? (
            <p style={mutedTextStyle}>No members found for this business.</p>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Email</th>
                    <th style={thStyle}>Employee ID</th>
                    <th style={thStyle}>Role</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const draft = drafts[member.id] ?? {
                      role: member.role,
                      is_active: member.is_active,
                    };

                    return (
                      <tr key={member.id}>
                        <td style={tdStyle}>
                          <div>
                            <strong style={{ color: "#101828" }}>
                              {member.full_name}
                            </strong>
                            <div style={subtleTextStyle}>{member.phone_number}</div>
                          </div>
                        </td>
                        <td style={tdStyle}>{member.email || "-"}</td>
                        <td style={tdStyle}>{member.employee_id || "-"}</td>
                        <td style={tdStyle}>
                          <select
                            value={draft.role}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [member.id]: {
                                  ...draft,
                                  role: event.target.value as
                                    | "rep"
                                    | "manager"
                                    | "admin",
                                },
                              }))
                            }
                            style={selectStyle}
                          >
                            <option value="rep">Rep</option>
                            <option value="manager">Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <span
                            style={{
                              ...statusPillStyle,
                              background: draft.is_active ? "#ecfdf3" : "#fef3f2",
                              color: draft.is_active ? "#027a48" : "#b42318",
                              borderColor: draft.is_active ? "#abefc6" : "#fecdca",
                            }}
                          >
                            {draft.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={actionGroupStyle}>
                            <button
                              type="button"
                              onClick={() =>
                                setDrafts((current) => ({
                                  ...current,
                                  [member.id]: {
                                    ...draft,
                                    is_active: !draft.is_active,
                                  },
                                }))
                              }
                              style={toggleButtonStyle}
                            >
                              {draft.is_active ? "Deactivate" : "Reactivate"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSave(member)}
                              disabled={savingMemberId === member.id}
                              style={saveButtonStyle}
                            >
                              {savingMemberId === member.id ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}

const heroStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, #ffffff 0%, #f0faf6 55%, #e6f4ef 100%)",
  border: "1px solid #dfeee8",
  borderRadius: "28px",
  padding: "34px",
  boxShadow: "0 20px 50px rgba(16, 24, 40, 0.08)",
  marginBottom: "24px",
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
  maxWidth: "720px",
};

const backButtonStyle: React.CSSProperties = {
  marginTop: "18px",
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #b7ddd0",
  background: "white",
  color: "#006b4f",
  fontWeight: 800,
  cursor: "pointer",
};

const errorStyle: React.CSSProperties = {
  marginBottom: "20px",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid #fecdca",
  background: "#fef3f2",
  color: "#b42318",
  fontWeight: 600,
};

const cardStyle: React.CSSProperties = {
  background: "white",
  borderRadius: "24px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 18px 40px rgba(16, 24, 40, 0.07)",
  padding: "28px",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "20px",
  flexWrap: "wrap",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#101828",
  fontSize: "24px",
  fontWeight: 800,
};

const sectionSubtitleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#667085",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "12px",
  border: "1px solid #d0d5dd",
  background: "#fff",
  color: "#344054",
  fontWeight: 700,
  cursor: "pointer",
};

const mutedTextStyle: React.CSSProperties = {
  color: "#667085",
};

const tableWrapStyle: React.CSSProperties = {
  overflowX: "auto",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "14px 12px",
  color: "#667085",
  fontSize: "13px",
  fontWeight: 700,
  borderBottom: "1px solid #eaecf0",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "16px 12px",
  borderBottom: "1px solid #f2f4f7",
  verticalAlign: "middle",
  color: "#344054",
};

const subtleTextStyle: React.CSSProperties = {
  marginTop: "4px",
  color: "#98a2b3",
  fontSize: "13px",
};

const selectStyle: React.CSSProperties = {
  width: "100%",
  minWidth: "120px",
  padding: "10px 12px",
  borderRadius: "10px",
  border: "1px solid #d0d5dd",
  background: "#fff",
  color: "#101828",
};

const statusPillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  border: "1px solid",
  fontSize: "13px",
  fontWeight: 700,
};

const actionGroupStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
};

const toggleButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid #d0d5dd",
  background: "#fff",
  color: "#344054",
  fontWeight: 700,
  cursor: "pointer",
};

const saveButtonStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #006b4f 0%, #008f6b 100%)",
  color: "white",
  fontWeight: 800,
  cursor: "pointer",
};
