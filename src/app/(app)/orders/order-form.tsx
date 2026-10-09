"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
} from "react-hook-form";
import {
  FormError,
  SelectField,
  SubmitButton,
  TextField,
} from "@/components/form-fields";
import { useWarnOnLeave } from "@/components/unsaved-changes";
import { applyErrors } from "@/lib/apply-errors";
import { PRODUCTION_STAGES, productionStageLabels } from "@/lib/enums";
import { emptyToNull, emptyToNullNumber } from "@/lib/form-values";
import { formatPesos, toCentavos } from "@/lib/money";
import {
  individualOrderSchema,
  type IndividualOrderInput,
} from "@/lib/validation";
import type { BatchFormOptions } from "../batches/options";
import { saveIndividualOrder } from "./actions";
import { ItemFields, blankItem } from "@/components/item-fields";

export const emptyOrder: Omit<IndividualOrderInput, "schoolId"> = {
  customerName: "",
  customerPhone: "",
  address: null,
  dueDate: "",
  productionStage: "order_received",
  agentId: null,
  secondAgentId: null,
  secondAgentShare: null,
  items: [blankItem("ring")],
};

type Options = Pick<BatchFormOptions, "schools" | "agents" | "stones">;

export function OrderForm({
  id = null,
  defaultValues,
  options,
}: {
  id?: number | null;
  defaultValues?: IndividualOrderInput;
  options: Options;
}) {
  const router = useRouter();
  const form = useForm<IndividualOrderInput>({
    resolver: zodResolver(individualOrderSchema),
    defaultValues: defaultValues ?? (emptyOrder as IndividualOrderInput),
  });
  const {
    register,
    handleSubmit,
    setError,
    getValues,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = form;
  useWarnOnLeave(isDirty);
  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const hasSecondAgent = useWatch({ control, name: "secondAgentId" }) !== null;
  const items = useWatch({ control, name: "items" });
  // Live total while typing; rows with a blank or invalid price count as 0.
  const total = items.reduce((sum, i) => {
    const line = (i.quantity ?? 0) * (i.unitPrice ?? 0);
    return sum + (Number.isFinite(line) ? toCentavos(line) : 0);
  }, 0);

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveIndividualOrder(id, values);
    if (!result.ok) return applyErrors(result, setError);
    if (id === null) return router.push(`/orders/${result.id}`);
    // New items now have ids, so the next save updates them instead of re-adding them.
    reset({
      ...values,
      items: values.items.map((i, k) => ({ ...i, id: result.itemIds[k] })),
    });
    router.refresh();
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex max-w-3xl flex-col gap-6"
      >
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-semibold">Customer</legend>
          <TextField
            label="Name"
            error={errors.customerName?.message}
            {...register("customerName")}
          />
          <TextField
            label="Phone"
            type="tel"
            error={errors.customerPhone?.message}
            {...register("customerPhone")}
          />
          <SelectField
            label="School"
            error={errors.schoolId?.message}
            defaultValue=""
            {...register("schoolId", { valueAsNumber: true })}
          >
            <option value="" disabled>
              Choose a School
            </option>
            {options.schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.areaName})
              </option>
            ))}
          </SelectField>
          <TextField
            label="Delivery address (optional)"
            error={errors.address?.message}
            {...register("address", { setValueAs: emptyToNull })}
          />
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-semibold">Items</legend>
          {fields.map((f, index) => (
            <ItemFields
              key={f.id}
              name={`items.${index}`}
              legend={`Item ${index + 1}`}
              stones={options.stones}
              onKindChange={(kind) => {
                const { id, quantity, unitPrice } = getValues(`items.${index}`);
                update(index, blankItem(kind, { id, quantity, unitPrice }));
              }}
              onRemove={fields.length > 1 ? () => remove(index) : undefined}
            />
          ))}
          <FormError
            message={errors.items?.message ?? errors.items?.root?.message}
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => append(blankItem("ring"))}
              className="rounded border border-[#8a7b6e] px-3 py-1.5 text-sm"
            >
              Add item
            </button>
            <p className="font-medium">Total: {formatPesos(total)}</p>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-semibold">Progress</legend>
          <TextField
            label="Due date"
            type="date"
            error={errors.dueDate?.message}
            {...register("dueDate")}
          />
          <SelectField
            label="Production stage"
            error={errors.productionStage?.message}
            {...register("productionStage")}
          >
            {PRODUCTION_STAGES.map((s) => (
              <option key={s} value={s}>
                {productionStageLabels[s]}
              </option>
            ))}
          </SelectField>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 font-semibold">
            Agents (for Commission)
          </legend>
          <SelectField
            label="Agent"
            error={errors.agentId?.message}
            {...register("agentId", { setValueAs: emptyToNullNumber })}
          >
            <option value="">None (Main office)</option>
            {options.agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.areaName})
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Second Agent (optional)"
            error={errors.secondAgentId?.message}
            {...register("secondAgentId", { setValueAs: emptyToNullNumber })}
          >
            <option value="">None</option>
            {options.agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.areaName})
              </option>
            ))}
          </SelectField>
          {hasSecondAgent && (
            <TextField
              label="Second Agent's share (%)"
              inputMode="numeric"
              error={errors.secondAgentShare?.message}
              {...register("secondAgentShare", {
                setValueAs: emptyToNullNumber,
              })}
            />
          )}
        </fieldset>

        <FormError message={errors.root?.message} />
        <SubmitButton pending={isSubmitting}>
          {id === null ? "Create Order" : isDirty ? "Save changes" : "Saved"}
        </SubmitButton>
      </form>
    </FormProvider>
  );
}
