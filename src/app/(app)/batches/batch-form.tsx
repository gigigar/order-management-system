"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import {
  FormError,
  SelectField,
  SubmitButton,
  TextField,
} from "@/components/form-fields";
import { useWarnOnLeave } from "@/components/unsaved-changes";
import { applyErrors } from "@/lib/apply-errors";
import { emptyToNull, emptyToNullNumber } from "@/lib/form-values";
import {
  DEAL_STAGES,
  PRODUCTION_STAGES,
  dealStageLabels,
  productionStageLabels,
} from "@/lib/enums";
import { batchSchema, type BatchInput } from "@/lib/validation";
import { saveBatch } from "./actions";
import type { BatchFormOptions } from "./options";

export const emptyBatch: Omit<BatchInput, "schoolId"> = {
  designId: null,
  repName: null,
  repPhone: null,
  dueDate: null,
  dealStage: "meeting",
  productionStage: "order_received",
  agreementSignedOn: null,
  agentId: null,
  secondAgentId: null,
  secondAgentShare: null,
};

export function BatchForm({
  id = null,
  defaultValues,
  options,
}: {
  id?: number | null;
  defaultValues?: BatchInput;
  options: BatchFormOptions;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BatchInput>({
    resolver: zodResolver(batchSchema),
    defaultValues: defaultValues ?? (emptyBatch as BatchInput),
  });
  useWarnOnLeave(isDirty);

  // Only the chosen School's Designs; a second Agent only after a first.
  const schoolId = useWatch({ control, name: "schoolId" });
  const designs = options.designs.filter((d) => d.schoolId === schoolId);
  const hasSecondAgent = useWatch({ control, name: "secondAgentId" }) !== null;

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveBatch(id, values);
    if (!result.ok) return applyErrors(result, setError);
    if (id === null) return router.push(`/batches/${result.id}`);
    reset(values); // the saved values become the new "unchanged" state
    router.refresh();
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-3xl flex-col gap-6"
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">School</legend>
        <SelectField
          label="School"
          error={errors.schoolId?.message}
          defaultValue=""
          {...register("schoolId", {
            valueAsNumber: true,
            onChange: () => setValue("designId", null),
          })}
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
        <SelectField
          label="Design"
          error={errors.designId?.message}
          {...register("designId", { setValueAs: emptyToNullNumber })}
        >
          <option value="">Not chosen yet</option>
          {designs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.year ? `${d.year} · ` : ""}
              {d.description}
            </option>
          ))}
        </SelectField>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">Rep</legend>
        <TextField
          label="Rep name"
          error={errors.repName?.message}
          {...register("repName", { setValueAs: emptyToNull })}
        />
        <TextField
          label="Rep phone"
          type="tel"
          error={errors.repPhone?.message}
          {...register("repPhone", { setValueAs: emptyToNull })}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-semibold">Progress</legend>
        <SelectField
          label="Deal stage"
          error={errors.dealStage?.message}
          {...register("dealStage")}
        >
          {DEAL_STAGES.map((s) => (
            <option key={s} value={s}>
              {dealStageLabels[s]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Agreement signed on"
          type="date"
          error={errors.agreementSignedOn?.message}
          {...register("agreementSignedOn", { setValueAs: emptyToNull })}
        />
        <TextField
          label="Due date"
          type="date"
          error={errors.dueDate?.message}
          {...register("dueDate", { setValueAs: emptyToNull })}
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
        <legend className="mb-2 font-semibold">Agents (for Commission)</legend>
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
            {...register("secondAgentShare", { setValueAs: emptyToNullNumber })}
          />
        )}
      </fieldset>

      <FormError message={errors.root?.message} />
      <SubmitButton pending={isSubmitting}>
        {id === null ? "Create Batch" : isDirty ? "Save changes" : "Saved"}
      </SubmitButton>
    </form>
  );
}
