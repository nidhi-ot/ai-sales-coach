type StatCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
};

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
}: StatCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: "20px",
        padding: "22px",
        border: "1px solid #eef2f6",
        boxShadow: "0 12px 28px rgba(16,24,40,.06)",
        transition: "all .25s ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow =
          "0 20px 40px rgba(16,24,40,.10)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 12px 28px rgba(16,24,40,.06)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
        }}
      >
        <span
          style={{
            color: "#667085",
            fontSize: "15px",
            fontWeight: 500,
          }}
        >
          {title}
        </span>

        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "14px",
            background: "#e7f4ef",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "22px",
          }}
        >
          {icon}
        </div>
      </div>

      <h2
        style={{
          margin: 0,
          fontSize: "34px",
          fontWeight: 700,
          color: "#101828",
        }}
      >
        {value}
      </h2>

      <p
        style={{
          marginTop: "8px",
          color: "#16a34a",
          fontWeight: 600,
          fontSize: "14px",
        }}
      >
        {subtitle ?? "Updated today"}
      </p>
    </div>
  );
}