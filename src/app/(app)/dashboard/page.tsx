import Link from "next/link";
import { dueLabel, dueSections, type DueRow } from "@/lib/dashboard";
import { formatDay, todayInManila } from "@/lib/dates";
import { PRODUCTION_STAGES, productionStageLabels } from "@/lib/enums";
import { formatPesos } from "@/lib/money";
import { requireUser } from "@/lib/session";
import { loadDueWork } from "./load";
import { loadBusinessStats } from "./stats";
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
  const [{ batches, orders }, stats] = await Promise.all([
    loadDueWork(today),
    loadBusinessStats(today),
  ]);
  const { overdue, dueSoon } = dueSections(batches, orders, today);
  const cards = [
    {
      label: `Rings ordered in ${today.slice(0, 4)}`,
      value: stats.ringsThisYear,
    },
    { label: "Rings in production", value: stats.ringsInProduction },
    { label: "Balance to collect", value: formatPesos(stats.balanceToCollect) },
    {
      label: "Collected this month",
      value: formatPesos(stats.collectedThisMonth),
    },
  ];
  // Bars are relative to the busiest Stage; Delivered isn't work in progress.
  const stages = PRODUCTION_STAGES.filter((s) => s !== "delivered");
  const busiest = Math.max(1, ...stats.ringsByStage.values());

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Rings, money and what's due, at a glance."
      />
      <dl className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex flex-col gap-1.5 rounded-xl border bg-card p-4"
          >
            <dt className="text-sm text-muted-foreground">{card.label}</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {card.value}
            </dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Rings by stage</h2>
        <ul className="flex flex-col gap-2 rounded-xl border bg-card p-5">
          {stages.map((stage) => {
            const rings = stats.ringsByStage.get(stage) ?? 0;
            return (
              <li
                key={stage}
                className="grid grid-cols-[8rem_1fr_3rem] items-center gap-3 text-sm"
              >
                <span>{productionStageLabels[stage]}</span>
                <span className="h-2.5 rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-sidebar-primary"
                    style={{ width: `${(rings / busiest) * 100}%` }}
                  />
                </span>
                <span className="text-right font-medium tabular-nums">
                  {rings}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <DueTable
        title="Due this week"
        empty="Nothing late and nothing due in the next 7 days."
        rows={[...overdue, ...dueSoon]}
      />
    </div>
  );
}

function DueTable({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: DueRow[];
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
                    {formatDay(r.dueDate)}{" "}
                    <span
                      className={
                        r.daysLeft < 0
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
