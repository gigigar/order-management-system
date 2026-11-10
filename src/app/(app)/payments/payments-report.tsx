"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useState } from "react";
import { SelectField, TextField } from "@/components/form-fields";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDay } from "@/lib/dates";
import {
  PAYMENT_METHODS,
  paymentMethodLabels,
  type PaymentMethod,
} from "@/lib/enums";
import { formatPesos } from "@/lib/money";
import {
  applyView,
  collectedBy,
  defaultView,
  isCancelled,
  paidBy,
  totalOf,
  totalsByMethod,
  viewToParams,
  type ReportPayment,
  type ReportView,
  type SortKey,
} from "@/lib/payment-report";

const columns: { key: SortKey; label: string; right?: boolean }[] = [
  { key: "date", label: "Date" },
  { key: "receipt", label: "Receipt no." },
  { key: "paidBy", label: "Paid by" },
  { key: "amount", label: "Amount", right: true },
  { key: "method", label: "Method" },
  { key: "collectedBy", label: "Collected by" },
];

// Client component because sorting and filtering happen in the browser, without a reload.
export function PaymentsReport({
  payments,
  canDownload,
}: {
  payments: ReportPayment[];
  canDownload: boolean;
}) {
  const [view, setView] = useState<ReportView>(defaultView);
  const shown = applyView(payments, view);
  const filtered =
    view.month !== "" || view.search !== "" || view.method !== "all";

  function sortBy(sort: SortKey) {
    setView((v) => ({
      ...v,
      sort,
      direction: v.sort === sort && v.direction === "asc" ? "desc" : "asc",
    }));
  }

  const cards = [
    { label: "Total received", value: totalOf(shown) },
    ...totalsByMethod(shown).map(({ method, total }) => ({
      label: paymentMethodLabels[method],
      value: total,
    })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader title="Payments" description="Every payment received." />
        {canDownload && (
          <a
            href={`/payments/export?${viewToParams(view)}`}
            className="inline-flex min-h-11 items-center rounded-lg bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Download Excel
          </a>
        )}
      </div>

      <dl className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col gap-1.5 rounded-xl border bg-card p-4"
          >
            <dt className="text-sm text-muted-foreground">{card.label}</dt>
            <dd className="text-xl font-semibold tabular-nums">
              {formatPesos(card.value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-2">
        <div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_14rem]">
          <TextField
            label="Month"
            type="month"
            value={view.month}
            onChange={(e) => setView((v) => ({ ...v, month: e.target.value }))}
          />
          <TextField
            label="Search"
            type="search"
            placeholder="Receipt no., name, or collector"
            value={view.search}
            onChange={(e) => setView((v) => ({ ...v, search: e.target.value }))}
          />
          <SelectField
            label="Method"
            value={view.method}
            onChange={(e) =>
              setView((v) => ({
                ...v,
                method: e.target.value as PaymentMethod | "all",
              }))
            }
          >
            <option value="all">All methods</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {paymentMethodLabels[m]}
              </option>
            ))}
          </SelectField>
        </div>
        {filtered && (
          <button
            type="button"
            onClick={() =>
              setView((v) => ({ ...v, month: "", search: "", method: "all" }))
            }
            className="self-end text-sm underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {shown.length === 0 ? (
        <p className="text-muted-foreground">No payments to show.</p>
      ) : (
        <Card className="py-0">
          <Table className="tabular-nums">
            <TableHeader>
              <TableRow className="text-xs tracking-wider text-muted-foreground uppercase">
                {columns.map((column) => {
                  const active = view.sort === column.key;
                  const ascending = view.direction === "asc";
                  return (
                    <TableHead
                      key={column.key}
                      className={column.right ? "px-4 text-right" : "px-4"}
                      aria-sort={
                        active
                          ? ascending
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button
                        type="button"
                        onClick={() => sortBy(column.key)}
                        className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                      >
                        {column.label}
                        {active &&
                          (ascending ? (
                            <ArrowUp aria-hidden="true" className="size-3" />
                          ) : (
                            <ArrowDown aria-hidden="true" className="size-3" />
                          ))}
                      </button>
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="px-4 py-3.5">
                    {formatDay(p.paidOn)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">{p.receiptNo}</TableCell>
                  <TableCell className="px-4 py-3.5">
                    {paidBy(p)}
                    {isCancelled(p) && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        (cancelled)
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right">
                    {formatPesos(p.amount)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {paymentMethodLabels[p.method]}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {collectedBy(p)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
