"use client";

import { useTransition } from "react";
import { removeInvite } from "./actions";

export function RemoveInviteButton({
  id,
  email,
}: {
  id: number;
  email: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="underline disabled:opacity-50"
      onClick={() => {
        if (!confirm(`Remove ${email}? They'll be signed out right away.`))
          return;
        startTransition(() => removeInvite(id));
      }}
    >
      {pending ? "Removing…" : "Remove"}{" "}
      <span className="sr-only">{email}</span>
    </button>
  );
}
