import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { ProductionStage } from "@/lib/enums";
import { loadOpenBalances } from "./load";

// The business numbers at the top of the Dashboard. One round trip each; all money
// is centavos. A School order's Stage is its own when held back, else its Batch's.
export async function loadBusinessStats(today: string) {
  const yearStart = `${today.slice(0, 4)}-01-01`;
  const monthStart = `${today.slice(0, 7)}-01`;

  // Rings that count: not cancelled, and for School orders, the Batch is signed and not cancelled.
  const liveRings = sql`
    from item i
    join "order" o on o.id = i.order_id
    left join batch b on b.id = o.batch_id
    where i.kind = 'ring'
      and o.cancelled_at is null
      and (o.batch_id is null
           or (b.cancelled_at is null and b.deal_stage = 'agreement_signed'))`;
  const stage = sql`coalesce(o.production_stage, b.production_stage)`;

  const [totals, byStage, balance, collected] = await Promise.all([
    db.execute<{ this_year: number; in_production: number }>(sql`
      select
        coalesce(sum(i.quantity) filter (where i.created_at >=
          (${yearStart}::date::timestamp at time zone 'Asia/Manila')), 0)::int as this_year,
        coalesce(sum(i.quantity) filter (where ${stage} <> 'delivered'), 0)::int as in_production
      ${liveRings}`),
    db.execute<{ stage: ProductionStage; rings: number }>(sql`
      select ${stage} as stage, sum(i.quantity)::int as rings
      ${liveRings} and ${stage} <> 'delivered'
      group by 1`),
    loadOpenBalances(),
    db.execute<{ total: number }>(sql`
      select coalesce(sum(amount), 0)::int as total from payment
      where paid_on >= ${monthStart}::date`),
  ]);

  return {
    ringsThisYear: totals.rows[0].this_year,
    ringsInProduction: totals.rows[0].in_production,
    ringsByStage: new Map(byStage.rows.map((r) => [r.stage, r.rings])),
    balanceToCollect: balance.total,
    collectedThisMonth: collected.rows[0].total,
  };
}
