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
  "rounded-lg border border-[#8a7b6e] bg-white px-3 py-2 aria-invalid:border-red-700";

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
      {/* The browser's own arrow sits at the very edge; this one lines up with the padding. */}
      <div className="relative">
        <select
          id={id}
          className={`${inputClass} w-full appearance-none bg-white pr-9`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
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
      className="inline-flex min-h-11 items-center self-start rounded-lg bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? "Saving…" : children}
    </button>
  );
}
