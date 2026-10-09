// Dates are calendar days ("2026-10-17") in the business's time zone, so "today"
// doesn't change at 8 am because a server runs on UTC.

const TIME_ZONE = "Asia/Manila";

export function todayInManila(now = new Date()): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

export function addDays(day: string, days: number): string {
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

// Whole days from one calendar day to another: negative when `to` is earlier.
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

const dayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC", // the string is already a calendar day; don't shift it
});

// "2026-10-03" → "Oct 3, 2026", for showing dates in lists.
export function formatDay(day: string): string {
  return dayFormat.format(new Date(`${day}T00:00:00Z`));
}
