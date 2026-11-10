"use client";

import { useState, useTransition } from "react";

// Cancel, Undo, and Delete for a Batch or an Individual order. `canDelete` only hides the
// button: the Server Action checks the role and the Payments again.
export function RecordActions({
  noun,
  cancelled,
  canDelete,
  setCancelled,
  remove,
}: {
  noun: string;
  cancelled: boolean;
  canDelete: boolean;
  setCancelled: (cancelled: boolean) => Promise<void>;
  remove: () => Promise<{ error: string } | void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  function toggleCancelled() {
    if (
      !cancelled &&
      !confirm(
        `Cancel this ${noun}? It stays on record with its payments, but stops counting toward rings, balances, and commissions.`,
      )
    )
      return;
    startTransition(() => setCancelled(!cancelled));
  }

  function deleteRecord() {
    if (!confirm(`Delete this ${noun} for good? This can't be undone.`)) return;
    setError(undefined);
    startTransition(async () => {
      const result = await remove();
      if (result) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-3">
        {cancelled && (
          <span className="text-sm font-medium text-amber-800">Cancelled</span>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={toggleCancelled}
          className="rounded-lg border border-[#8a7b6e] px-4 py-2 text-sm disabled:opacity-50"
        >
          {cancelled ? "Undo cancel" : `Cancel ${noun}`}
        </button>
        {canDelete && (
          <button
            type="button"
            disabled={pending}
            onClick={deleteRecord}
            className="text-sm text-red-700 underline disabled:opacity-50"
          >
            Delete
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
