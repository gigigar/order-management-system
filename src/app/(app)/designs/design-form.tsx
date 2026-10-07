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
import { designSchema, type DesignInput } from "@/lib/validation";
import { saveDesign } from "./actions";

export function DesignForm({
  id = null,
  defaultValues = { description: "", year: null } as DesignInput,
  schools,
}: {
  id?: number | null;
  defaultValues?: DesignInput;
  schools: { id: number; name: string; areaName: string }[];
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DesignInput>({
    resolver: zodResolver(designSchema),
    defaultValues,
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveDesign(id, values);
    if (!result.ok) return applyErrors(result, setError);
    if (id === null) reset();
    else router.push("/designs");
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-md flex-col gap-3"
    >
      <SelectField
        label="School"
        error={errors.schoolId?.message}
        defaultValue=""
        {...register("schoolId", { valueAsNumber: true })}
      >
        <option value="" disabled>
          Choose a School
        </option>
        {schools.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.areaName})
          </option>
        ))}
      </SelectField>
      <TextField
        label="Year (leave empty if the School keeps one Design)"
        inputMode="numeric"
        error={errors.year?.message}
        {...register("year", {
          // Typed text, or the saved year/null when the field isn't touched.
          setValueAs: (v: unknown) =>
            v === null || v === undefined || String(v).trim() === ""
              ? null
              : Number(v),
        })}
      />
      <TextField
        label="Description"
        error={errors.description?.message}
        {...register("description")}
      />
      <FormError message={errors.root?.message} />
      <SubmitButton pending={isSubmitting}>
        {id === null ? "Add Design" : "Save"}
      </SubmitButton>
    </form>
  );
}
