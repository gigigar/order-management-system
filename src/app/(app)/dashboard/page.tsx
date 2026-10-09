import Link from "next/link";
import { dueLabel, dueSections, type DueRow } from "@/lib/dashboard";
import { todayInManila } from "@/lib/dates";
import { productionStageLabels } from "@/lib/enums";
import { formatPesos } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { loadDueWork } from "./load";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function DashboardPage() {
  await requireUser();
  const today = todayInManila();
  const { batches, orders } = await loadDueWork(today);
  const { overdue, dueSoon } = dueSections(batches, orders, today);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Late and due-this-week work, most late first."
      />
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
        <Card className="py-0">
          <Table className="tabular-nums">
            <TableHeader>
              <TableRow className="text-xs tracking-wider text-muted-foreground uppercase">
                <TableHead className="px-4">Name</TableHead>
                <TableHead className="px-4">Type</TableHead>
                <TableHead className="px-4">Due date</TableHead>
                <TableHead className="px-4">Production</TableHead>
                <TableHead className="px-4 text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={`${r.kind}-${r.id}`}>
                  <TableCell className="px-4 py-3.5">
                    <Link
                      href={
                        r.kind === "batch"
                          ? `/batches/${r.id}`
                          : `/orders/${r.id}`
                      }
                      className="font-medium hover:text-[#8a6420] hover:underline"
                    >
                      {r.name}
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {r.kind === "batch" ? "Batch" : "Individual"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
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
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    {r.stage ? productionStageLabels[r.stage] : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right">
                    {r.balance > 0 ? formatPesos(r.balance) : "Paid"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </section>
  );
}
