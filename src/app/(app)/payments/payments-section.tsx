"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormError } from "@/components/form-fields";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { todayInManila } from "@/lib/dates";
import { paymentMethodLabels } from "@/lib/enums";
import { formatPesos, toPesos } from "@/lib/money";
import { paymentSummary } from "@/lib/payments";
import type { PaymentInput } from "@/lib/validation";
import { deletePayment, type PaymentParent } from "./actions";
import type { LoadedPayments } from "./load";
import { PaymentForm } from "./payment-form";

type Agent = { id: number; name: string; areaName: string };

// Payments on a Batch or Individual order page: what's paid, what's left, and the list.
export function PaymentsSection({
  parent,
  loaded: { totalCentavos, payments },
  agents,
  isAdmin,
}: {
  parent: PaymentParent;
  loaded: LoadedPayments;
  agents: Agent[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  // "new", a Payment id being edited, or null when no form is open.
  const [editing, setEditing] = useState<"new" | number | null>(null);
  const [error, setError] = useState<string>();
  const summary = paymentSummary(
    totalCentavos,
    payments.map((p) => p.payment),
  );

  function done() {
    setEditing(null);
    router.refresh(); // shows the saved Payment and the new totals
  }

  async function remove(id: number) {
    if (!confirm("Delete this Payment? This can't be undone.")) return;
    const result = await deletePayment(parent, id);
    if (!result.ok) return setError(result.formError);
    router.refresh();
  }

  const blank: PaymentInput = {
    amount: NaN, // an empty number box
    method: "cash",
    collectedByAgentId: null,
    receiptNo: null,
    paidOn: todayInManila(),
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold tracking-tight">Payments</h2>
      <p>
        {formatPesos(summary.paid)} of {formatPesos(summary.total)} paid ·{" "}
        {summary.overpaid ? (
          <span className="font-medium text-amber-800">
            Overpaid by {formatPesos(-summary.remaining)}
          </span>
        ) : (
          <span className="font-medium">
            {formatPesos(summary.remaining)} balance
          </span>
        )}
      </p>

      {payments.length > 0 && (
        <Card className="py-0">
          <Table className="tabular-nums">
            <TableHeader>
              <TableRow className="text-xs tracking-wider text-muted-foreground uppercase">
                <TableHead className="px-4">Date</TableHead>
                <TableHead className="px-4 text-right">Amount</TableHead>
                <TableHead className="px-4">Method</TableHead>
                <TableHead className="px-4">Collected by</TableHead>
                <TableHead className="px-4">Receipt</TableHead>
                <TableHead className="px-4">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(({ payment: p, agentName }) => (
                <TableRow key={p.id}>
                  <TableCell className="px-4 py-3.5">{p.paidOn}</TableCell>
                  <TableCell className="px-4 py-3.5 text-right">
                    {formatPesos(p.amount)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {paymentMethodLabels[p.method]}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {agentName ?? "Main office"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {p.receiptNo ?? "—"}
                  </TableCell>
                  <TableCell className="flex gap-3 px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => setEditing(p.id)}
                      className="underline"
                    >
                      Edit
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        className="text-red-700 underline"
                      >
                        Delete
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <FormError message={error} />

      {editing === null ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="self-start rounded border border-[#8a7b6e] px-4 py-2"
        >
          Add Payment
        </button>
      ) : (
        <PaymentForm
          // A new key resets the form when switching between Payments.
          key={editing}
          parent={parent}
          id={editing === "new" ? null : editing}
          agents={agents}
          onDone={done}
          defaultValues={
            editing === "new"
              ? blank
              : (() => {
                  const p = payments.find(
                    (x) => x.payment.id === editing,
                  )!.payment;
                  return {
                    amount: toPesos(p.amount),
                    method: p.method,
                    collectedByAgentId: p.collectedByAgentId,
                    receiptNo: p.receiptNo,
                    paidOn: p.paidOn,
                  };
                })()
          }
        />
      )}
    </section>
  );
}
