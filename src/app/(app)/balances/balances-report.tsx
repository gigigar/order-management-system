import Link from "next/link";
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
import type { OpenBalance } from "@/lib/balances";
import { formatDay } from "@/lib/dates";
import { formatPesos } from "@/lib/money";

export function BalancesReport({
  rows,
  total,
}: {
  rows: OpenBalance[];
  total: number;
}) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Balance to collect"
        description="Signed Batches and Individual orders that aren't fully paid, including Delivered ones."
      />
      <p className="text-2xl font-semibold tabular-nums">
        {formatPesos(total)}
      </p>
      {rows.length === 0 ? (
        <p className="text-muted-foreground">Nothing left to collect.</p>
      ) : (
        <Card className="py-0">
          <Table className="tabular-nums">
            <TableHeader>
              <TableRow className="text-xs tracking-wider text-muted-foreground uppercase">
                <TableHead className="px-4">Name</TableHead>
                <TableHead className="px-4">Type</TableHead>
                <TableHead className="px-4">Due date</TableHead>
                <TableHead className="px-4 text-right">Total</TableHead>
                <TableHead className="px-4 text-right">Paid</TableHead>
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
                    {r.dueDate ? formatDay(r.dueDate) : "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right">
                    {formatPesos(r.owed)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right">
                    {formatPesos(r.paid)}
                  </TableCell>
                  <TableCell className="px-4 py-3.5 text-right font-medium">
                    {formatPesos(r.balance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
