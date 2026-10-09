import type { DueStatus } from "@/lib/dates";

// Next to a Due date in lists. Delivered work gets its own badge, so a past Due date
// doesn't read as Overdue.
const badges = {
  overdue: { label: "Overdue", className: "bg-[#fbe4de] text-[#8f2a17]" },
  due_soon: { label: "Due soon", className: "bg-[#fbefcf] text-[#7a4f00]" },
  delivered: { label: "Delivered", className: "bg-[#e3eedf] text-[#2f5a26]" },
} as const;

export function DueBadge({
  status,
  delivered,
}: {
  status: DueStatus;
  delivered: boolean;
}) {
  const badge = delivered ? badges.delivered : status && badges[status];
  if (!badge) return null;
  return (
    <span
      className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}
