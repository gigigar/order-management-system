// Vertical bars, one per Stage, in production order. Heights are relative to the busiest Stage.
export function StageChart({
  stages,
}: {
  stages: { label: string; rings: number }[];
}) {
  const busiest = Math.max(1, ...stages.map((s) => s.rings));

  return (
    <ul className="flex items-start gap-1 rounded-xl border bg-card p-5 sm:gap-3">
      {stages.map(({ label, rings }) => (
        <li key={label} className="flex min-w-0 flex-1 flex-col gap-2">
          {/* pt-6 keeps room for the number above the tallest bar. */}
          <div className="flex h-48 items-end justify-center border-b pt-6">
            <div
              className="relative w-full max-w-12 rounded-t bg-sidebar-primary"
              style={{ height: `${(rings / busiest) * 100}%` }}
            >
              <span className="absolute inset-x-0 bottom-full mb-1 text-center text-sm font-medium tabular-nums">
                {rings}
              </span>
            </div>
          </div>
          <span className="text-center text-[10px] text-muted-foreground sm:text-xs">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
