import Link from "next/link";
import { Building2, Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <main style={pageStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>💬</div>

        <h1 style={titleStyle}>Contact Us</h1>

        <p style={subtitleStyle}>
          Have questions about the AI Sales Coach?
          <br />
          If you need assistance with the application or would like more
          information, feel free to contact us.
        </p>

        <div style={infoGrid}>
          <InfoCard
            icon={<Building2 size={28} color="#00704f" />}
            title="Organization"
            value="Optimal Trappstädning"
          />

          <InfoCard
            icon={<Mail size={28} color="#00704f" />}
            title="Email"
            value="info@optimaltrappstadning.se"
          />

          <InfoCard
            icon={<Phone size={28} color="#00704f" />}
            title="Phone"
            value="08-23 15 00"
          />

          <InfoCard
            icon={<MapPin size={28} color="#00704f" />}
            title="Address"
            value={`Baltzar von Platens gata 11
112 42 Stockholm
Sweden`}
          />
        </div>

        <div style={buttonRow}>
          <Link href="/" style={secondaryButton}>
            ← Back to Home
          </Link>

          <Link href="/login" style={primaryButton}>
            Go to Login →
          </Link>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div style={infoCard}>
      <div style={infoIcon}>{icon}</div>
      <h3 style={infoTitle}>{title}</h3>
      <p style={infoValue}>{value}</p>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "linear-gradient(180deg,#f8fbf9 0%,#eef7f2 100%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: "40px",
  fontFamily: "Inter, sans-serif",
};

const cardStyle = {
  maxWidth: "900px",
  width: "100%",
  background: "#ffffff",
  borderRadius: "30px",
  padding: "50px",
  boxShadow: "0 30px 80px rgba(15,23,42,0.08)",
  border: "1px solid #e5e7eb",
};

const iconStyle = {
  width: "90px",
  height: "90px",
  borderRadius: "24px",
  background: "#dff5ea",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  fontSize: "42px",
  marginBottom: "20px",
};

const titleStyle = {
  margin: 0,
  fontSize: "42px",
  fontWeight: 900,
};

const subtitleStyle = {
  marginTop: "15px",
  color: "#667085",
  fontSize: "18px",
  lineHeight: 1.7,
};

const infoGrid = {
  marginTop: "45px",
  display: "grid",
  gridTemplateColumns: "repeat(2,1fr)",
  gap: "20px",
};

const infoCard = {
  padding: "25px",
  borderRadius: "20px",
  background: "#f8fbf9",
  border: "1px solid #e5e7eb",
};

const infoIcon = {
  fontSize: "30px",
};

const infoTitle = {
  marginTop: "15px",
  marginBottom: "8px",
  fontSize: "18px",
};

const infoValue = {
  color: "#667085",
  whiteSpace: "pre-line" as const,
  lineHeight: 1.6,
};

const buttonRow = {
  marginTop: "45px",
  display: "flex",
  justifyContent: "space-between",
};

const primaryButton = {
  background: "#00704f",
  color: "#fff",
  textDecoration: "none",
  padding: "15px 28px",
  borderRadius: "14px",
  fontWeight: 700,
};

const secondaryButton = {
  background: "#fff",
  color: "#00704f",
  textDecoration: "none",
  padding: "15px 28px",
  borderRadius: "14px",
  border: "1px solid #00704f",
  fontWeight: 700,
};