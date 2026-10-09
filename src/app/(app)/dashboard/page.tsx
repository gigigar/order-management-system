import Link from "next/link";
import { dueLabel, dueSections, type DueRow } from "@/lib/dashboard";
import { todayInManila } from "@/lib/dates";
import { productionStageLabels } from "@/lib/enums";
import { formatPesos } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { loadDueWork } from "./load";

export default async function DashboardPage() {
  await requireUser();
  const today = todayInManila();
  const { batches, orders } = await loadDueWork(today);
  const { overdue, dueSoon } = dueSections(batches, orders, today);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <DueTable title="Overdue" empty="Nothing overdue." rows={overdue} late />
      <DueTable
        title="Due soon (next 7 days)"
        empty="Nothing due in the next 7 days."
        rows={dueSoon}
      />
    </div>
  );
}

function DueTable({
  title,
  empty,
  rows,
  late = false,
}: {
  title: string;
  empty: string;
  rows: DueRow[];
  late?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">
        {title} · {rows.length}
      </h2>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Due date</th>
                <th className="p-3">Production</th>
                <th className="p-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={`${r.kind}-${r.id}`}>
                  <td className="p-3">
                    <Link
                      href={
                        r.kind === "batch"
                          ? `/batches/${r.id}`
                          : `/orders/${r.id}`
                      }
                      className="underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="p-3">
                    {r.kind === "batch" ? "Batch" : "Individual"}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {r.dueDate}{" "}
                    <span
                      className={
                        late
                          ? "font-medium text-red-800"
                          : "text-muted-foreground"
                      }
                    >
                      · {dueLabel(r.daysLeft)}
                    </span>
                  </td>
                  <td className="p-3">
                    {r.stage ? productionStageLabels[r.stage] : "—"}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {r.balance > 0 ? formatPesos(r.balance) : "Paid"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
