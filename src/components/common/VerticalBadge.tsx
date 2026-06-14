import type { Vertical } from "@/lib/types";

export function VerticalBadge({ vertical, size = "sm" }: { vertical?: Vertical; size?: "sm" | "md" }) {
  if (!vertical) return null;
  const padding = size === "md" ? "px-2.5 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${padding}`}
      style={{
        backgroundColor: `${vertical.color}1f`,
        borderColor: `${vertical.color}55`,
        color: vertical.color,
      }}
    >
      <span className="leading-none">{vertical.icon}</span>
      <span>{vertical.name}</span>
    </span>
  );
}
