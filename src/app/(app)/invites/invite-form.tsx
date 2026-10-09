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
import { inviteSchema, type InviteInput } from "@/lib/validation";
import { addInvite } from "./actions";

export function InviteForm() {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteInput>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: "", role: "member" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await addInvite(values);
    if (!result.ok) return applyErrors(result, setError);
    reset();
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex max-w-md flex-col gap-3 rounded-xl border bg-card p-5"
    >
      <TextField
        label="Google account email"
        type="email"
        autoComplete="off"
        error={errors.email?.message}
        {...register("email")}
      />
      <SelectField
        label="Role"
        error={errors.role?.message}
        {...register("role")}
      >
        <option value="member">Member (Staff, Agents)</option>
        <option value="admin">Admin (Owners)</option>
      </SelectField>
      <FormError message={errors.root?.message} />
      <SubmitButton pending={isSubmitting}>Invite</SubmitButton>
    </form>
  );
}
