import { requireUser } from "@/lib/session";
import { loadOpenBalances } from "../dashboard/load";
import { BalancesReport } from "./balances-report";

export default async function BalancesPage() {
  await requireUser();
  return <BalancesReport {...await loadOpenBalances()} />;
}
