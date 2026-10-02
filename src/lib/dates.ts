// Dates are calendar days ("2026-10-17") in the business's time zone, so "today"
// doesn't change at 8 am because a server runs on UTC.

const TIME_ZONE = "Asia/Manila";

export function todayInManila(now = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export type DueStatus = "overdue" | "due_soon" | null;

// CONTEXT.md: Overdue = past its Due date and not Delivered. Due soon = within the
// next 7 days and not Delivered. Cancelled work is neither.
export function dueStatus(
  dueDate: string | null,
  today: string,
  { delivered, cancelled }: { delivered: boolean; cancelled: boolean },
): DueStatus {
  if (!dueDate || delivered || cancelled) return null;
  if (dueDate < today) return "overdue";
  if (dueDate <= addDays(today, 7)) return "due_soon";
  return null;
}
