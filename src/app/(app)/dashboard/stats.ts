import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { ProductionStage } from "@/lib/enums";

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
    // Unpaid amount of each open Batch and Individual order, never below 0 (overpaid rows).
    db.execute<{ total: number }>(sql`
      select coalesce(sum(greatest(owed - paid, 0)), 0)::int as total from (
        select
          (select coalesce(sum(i.quantity * i.unit_price), 0) from item i
            where i.batch_id = b.id
               or i.order_id in (select o.id from "order" o
                                 where o.batch_id = b.id and o.cancelled_at is null)) as owed,
          (select coalesce(sum(p.amount), 0) from payment p where p.batch_id = b.id) as paid
        from batch b
        where b.production_stage <> 'delivered' and b.cancelled_at is null
          and b.deal_stage = 'agreement_signed'
        union all
        select
          (select coalesce(sum(i.quantity * i.unit_price), 0) from item i
            where i.order_id = o.id),
          (select coalesce(sum(p.amount), 0) from payment p where p.order_id = o.id)
        from "order" o
        where o.batch_id is null and o.production_stage <> 'delivered'
          and o.cancelled_at is null
      ) open_work`),
    db.execute<{ total: number }>(sql`
      select coalesce(sum(amount), 0)::int as total from payment
      where paid_on >= ${monthStart}::date`),
  ]);

  return {
    ringsThisYear: totals.rows[0].this_year,
    ringsInProduction: totals.rows[0].in_production,
    ringsByStage: new Map(byStage.rows.map((r) => [r.stage, r.rings])),
    balanceToCollect: balance.rows[0].total,
    collectedThisMonth: collected.rows[0].total,
  };
}
