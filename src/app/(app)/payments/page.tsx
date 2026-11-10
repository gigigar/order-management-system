import { requireUser } from "@/lib/session";
import { loadAllPayments } from "./all-payments";
import { PaymentsReport } from "./payments-report";

export default async function PaymentsPage() {
  const user = await requireUser();

  return (
    <PaymentsReport
      payments={await loadAllPayments()}
      canDownload={user.role === "admin"}
    />
  );
}
