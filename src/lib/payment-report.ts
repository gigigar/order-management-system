import {
  PAYMENT_METHODS,
  paymentMethodLabels,
  type PaymentMethod,
} from "./enums";
import { isMonth } from "./dates";

// One Payment as the monthly report shows it. Amounts are centavos.
export type ReportPayment = {
  id: number;
  paidOn: string;
  receiptNo: string;
  amount: number;
  method: PaymentMethod;
  schoolName: string | null;
  customerName: string | null;
  collectedBy: string | null;
  batchCancelledAt: Date | null;
  orderCancelledAt: Date | null;
};

export function paidBy(p: ReportPayment): string {
  return p.customerName ?? `${p.schoolName} (Batch)`;
}

export function collectedBy(p: ReportPayment): string {
  return p.collectedBy ?? "Main office";
}

export function isCancelled(p: ReportPayment): boolean {
  return p.batchCancelledAt !== null || p.orderCancelledAt !== null;
}

export function totalOf(payments: ReportPayment[]): number {
  return payments.reduce((sum, p) => sum + p.amount, 0);
}

export const SORT_KEYS = [
  "date",
  "receipt",
  "paidBy",
  "amount",
  "method",
  "collectedBy",
] as const;
export type SortKey = (typeof SORT_KEYS)[number];

// What the table is showing. The Excel download uses the same view, so they match.
export type ReportView = {
  // "2026-11", or "" for every month.
  month: string;
  search: string;
  method: PaymentMethod | "all";
  sort: SortKey;
  direction: "asc" | "desc";
};

export const defaultView: ReportView = {
  month: "",
  search: "",
  method: "all",
  sort: "date",
  direction: "asc",
};

const sortValue: Record<SortKey, (p: ReportPayment) => string | number> = {
  date: (p) => p.paidOn,
  receipt: (p) => p.receiptNo,
  paidBy,
  amount: (p) => p.amount,
  method: (p) => paymentMethodLabels[p.method],
  collectedBy,
};

function compare(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  // numeric: true puts receipt 9 before receipt 10.
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function applyView(
  payments: ReportPayment[],
  view: ReportView,
): ReportPayment[] {
  const search = view.search.trim().toLowerCase();
  const value = sortValue[view.sort];
  const sign = view.direction === "asc" ? 1 : -1;

  return payments
    .filter((p) => view.month === "" || p.paidOn.startsWith(view.month))
    .filter((p) => view.method === "all" || p.method === view.method)
    .filter(
      (p) =>
        search === "" ||
        [p.receiptNo, paidBy(p), collectedBy(p)].some((text) =>
          text.toLowerCase().includes(search),
        ),
    )
    .sort((a, b) => sign * compare(value(a), value(b)) || a.id - b.id);
}

export function viewToParams(view: ReportView): URLSearchParams {
  return new URLSearchParams(view);
}

// Anything unrecognized falls back to the default, since the URL can say anything.
export function viewFromParams(params: URLSearchParams): ReportView {
  const month = params.get("month");
  const method = params.get("method");
  const sort = params.get("sort");
  return {
    month: isMonth(month) ? month : "",
    search: params.get("search") ?? "",
    method: PAYMENT_METHODS.find((m) => m === method) ?? "all",
    sort: SORT_KEYS.find((k) => k === sort) ?? defaultView.sort,
    direction: params.get("direction") === "desc" ? "desc" : "asc",
  };
}

export function totalsByMethod(
  payments: ReportPayment[],
): { method: PaymentMethod; total: number }[] {
  return PAYMENT_METHODS.map((method) => ({
    method,
    total: totalOf(payments.filter((p) => p.method === method)),
  }));
}
