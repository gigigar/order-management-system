"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormError } from "@/components/form-fields";
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
      <h2 className="text-lg font-semibold">Payments</h2>
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4 text-right">Amount</th>
                <th className="py-2 pr-4">Method</th>
                <th className="py-2 pr-4">Collected by</th>
                <th className="py-2 pr-4">Receipt</th>
                <th className="py-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {payments.map(({ payment: p, agentName }) => (
                <tr key={p.id} className="border-b align-top">
                  <td className="py-2 pr-4">{p.paidOn}</td>
                  <td className="py-2 pr-4 text-right">
                    {formatPesos(p.amount)}
                  </td>
                  <td className="py-2 pr-4">{paymentMethodLabels[p.method]}</td>
                  <td className="py-2 pr-4">{agentName ?? "Main office"}</td>
                  <td className="py-2 pr-4">{p.receiptNo ?? "—"}</td>
                  <td className="flex gap-3 py-2">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <FormError message={error} />

      {editing === null ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="self-start rounded border border-gray-400 px-4 py-2"
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
