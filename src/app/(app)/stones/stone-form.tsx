"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { FormError, SubmitButton, TextField } from "@/components/form-fields";
import { applyErrors } from "@/lib/apply-errors";
import { stoneSchema, type StoneInput } from "@/lib/validation";
import { saveStone } from "./actions";

export function StoneForm({
  id = null,
  defaultValues = { name: "" },
}: {
  id?: number | null;
  defaultValues?: StoneInput;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoneInput>({
    resolver: zodResolver(stoneSchema), // checks in the browser before sending
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveStone(id, values);
    if (!result.ok) return applyErrors(result, setError);
    if (id === null) reset();
    else router.push("/stones");
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-md flex-col gap-3 rounded-xl border bg-card p-5"
    >
      <TextField
        label="Name"
        error={errors.name?.message}
        {...register("name")}
      />
      <FormError message={errors.root?.message} />
      <SubmitButton pending={isSubmitting}>
        {id === null ? "Add Stone" : "Save"}
      </SubmitButton>
    </form>
  );
}
