// frontend/src/components/dashboard/StatCard.tsx

type StatCardProps = {
  title: string;
  value: string | number;
  icon?: string;
};

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div
      style={{
        background: "white",
        padding: "24px",
        borderRadius: "18px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
      }}
    >
      <p style={{ color: "#667085", marginBottom: "8px" }}>
        {icon && <span style={{ marginRight: "8px" }}>{icon}</span>}
        {title}
      </p>

      <h2 style={{ margin: 0, color: "#101828" }}>{value}</h2>
    </div>
  );
}