import { useId, type ComponentProps } from "react";

// Native inputs with a label and an error message wired up for screen readers.
// React Hook Form's register() spreads name, ref and handlers straight onto them.

type FieldProps = { label: string; error?: string };

function Field({
  id,
  label,
  error,
  children,
}: FieldProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

const inputClass =
  "rounded border border-gray-400 px-3 py-2 aria-invalid:border-red-700";

export function TextField({
  label,
  error,
  ...props
}: FieldProps & ComponentProps<"input">) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <input
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  label,
  error,
  children,
  ...props
}: FieldProps & ComponentProps<"select">) {
  const id = useId();
  return (
    <Field id={id} label={label} error={error}>
      <select
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-sm text-red-700">
      {message}
    </p>
  );
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="self-start rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
