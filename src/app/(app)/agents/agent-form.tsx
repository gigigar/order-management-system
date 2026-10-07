"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  FormError,
  SelectField,
  SubmitButton,
  TextField,
} from "@/components/form-fields";
import { applyErrors } from "@/lib/apply-errors";
import { agentSchema, type AgentInput } from "@/lib/validation";
import { saveAgent } from "./actions";

export function AgentForm({
  id = null,
  defaultValues,
  areas,
}: {
  id?: number | null;
  defaultValues?: AgentInput;
  areas: { id: number; name: string }[];
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AgentInput>({
    resolver: zodResolver(agentSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveAgent(id, values);
    if (!result.ok) return applyErrors(result, setError);
    if (id === null) reset();
    else router.push("/agents");
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-md flex-col gap-3"
    >
      <TextField
        label="Name"
        error={errors.name?.message}
        {...register("name")}
      />
      <SelectField
        label="Area"
        error={errors.areaId?.message}
        defaultValue=""
        {...register("areaId", { valueAsNumber: true })}
      >
        <option value="" disabled>
          Choose an Area
        </option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </SelectField>
      <FormError message={errors.root?.message} />
      <SubmitButton pending={isSubmitting}>
        {id === null ? "Add Agent" : "Save"}
      </SubmitButton>
    </form>
  );
}
