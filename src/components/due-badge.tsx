import type { DueStatus } from "@/lib/dates";

// Next to a Due date in lists. Delivered work gets its own badge, so a past Due date
// doesn't read as Overdue.
const badges = {
  overdue: { label: "Overdue", className: "bg-red-100 text-red-800" },
  due_soon: { label: "Due soon", className: "bg-amber-100 text-amber-900" },
  delivered: { label: "Delivered", className: "bg-green-100 text-green-800" },
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
    <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${badge.className}`}>
      {badge.label}
    </span>
  );
}
