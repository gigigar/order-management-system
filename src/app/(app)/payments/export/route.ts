import type { NextRequest } from "next/server";
import { applyView, viewFromParams } from "@/lib/payment-report";
import { buildPaymentsWorkbook } from "@/lib/payments-workbook";
import { requireAdmin } from "@/lib/session";
import { loadAllPayments } from "../all-payments";

// Owners only: the file has customer names and every amount received.
export async function GET(request: NextRequest) {
  await requireAdmin();
  const view = viewFromParams(request.nextUrl.searchParams);

  const file = await buildPaymentsWorkbook(
    view.month,
    applyView(await loadAllPayments(), view),
  );
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="payments-${view.month || "all"}.xlsx"`,
    },
  });
}
