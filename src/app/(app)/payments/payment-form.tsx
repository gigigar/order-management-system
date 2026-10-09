"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  FormError,
  SelectField,
  SubmitButton,
  TextField,
} from "@/components/form-fields";
import { applyErrors } from "@/lib/apply-errors";
import { PAYMENT_METHODS, paymentMethodLabels } from "@/lib/enums";
import { emptyToNull, emptyToNullNumber } from "@/lib/form-values";
import { paymentSchema, type PaymentInput } from "@/lib/validation";
import { savePayment, type PaymentParent } from "./actions";

type Agent = { id: number; name: string; areaName: string };

// Adds a Payment (id null) or edits one. The amount is typed in pesos.
export function PaymentForm({
  parent,
  id,
  defaultValues,
  agents,
  onDone,
}: {
  parent: PaymentParent;
  id: number | null;
  defaultValues: PaymentInput;
  agents: Agent[];
  onDone: () => void;
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await savePayment(parent, id, values);
    if (!result.ok) return applyErrors(result, setError);
    onDone();
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="grid max-w-2xl gap-3 rounded-xl border bg-card p-5 sm:grid-cols-3"
    >
      <TextField
        label="Amount (₱)"
        type="number"
        inputMode="decimal"
        step="0.01"
        error={errors.amount?.message}
        {...register("amount", { valueAsNumber: true })}
      />
      <TextField
        label="Date paid"
        type="date"
        error={errors.paidOn?.message}
        {...register("paidOn")}
      />
      <SelectField
        label="Method"
        error={errors.method?.message}
        {...register("method")}
      >
        {PAYMENT_METHODS.map((m) => (
          <option key={m} value={m}>
            {paymentMethodLabels[m]}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Collected by"
        error={errors.collectedByAgentId?.message}
        {...register("collectedByAgentId", { setValueAs: emptyToNullNumber })}
      >
        <option value="">Main office</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.areaName})
          </option>
        ))}
      </SelectField>
      <TextField
        label="Receipt no. (optional)"
        error={errors.receiptNo?.message}
        {...register("receiptNo", { setValueAs: emptyToNull })}
      />
      <div className="flex flex-col gap-2 sm:col-span-3">
        <FormError message={errors.root?.message} />
        <div className="flex gap-3">
          <SubmitButton pending={isSubmitting}>
            {id === null ? "Add Payment" : "Save"}
          </SubmitButton>
          <button type="button" onClick={onDone} className="px-4 py-2">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
