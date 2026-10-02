"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FormError, SubmitButton, TextField } from "@/components/form-fields";
import { applyErrors } from "@/lib/apply-errors";
import { areaSchema, type AreaInput } from "@/lib/validation";
import { saveArea } from "./actions";

export function AreaForm({
  id = null,
  defaultValues = { name: "" },
}: {
  id?: number | null;
  defaultValues?: AreaInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AreaInput>({
    resolver: zodResolver(areaSchema), // checks in the browser before sending
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveArea(id, values);
    if (!result.ok) return applyErrors(result, setError);
    if (id === null) reset();
    else router.push("/areas");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <TextField
        label="Name"
        error={errors.name?.message}
        {...register("name")}
      />
      <FormError message={errors.root?.message} />
      <SubmitButton pending={isSubmitting}>
        {id === null ? "Add Area" : "Save"}
      </SubmitButton>
    </form>
  );
}
