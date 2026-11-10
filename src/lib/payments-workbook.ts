import ExcelJS from "exceljs";
import { paymentMethodLabels } from "./enums";
import { toPesos } from "./money";
import {
  collectedBy,
  isCancelled,
  paidBy,
  totalOf,
  totalsByMethod,
  type ReportPayment,
} from "./payment-report";

// Payments as an .xlsx file: one row each, then the totals. `month` is "" for all of them.
export async function buildPaymentsWorkbook(
  month: string,
  payments: ReportPayment[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const name = month ? `Payments ${month}` : "All payments";
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    {
      header: "Date",
      key: "paidOn",
      width: 12,
      style: { numFmt: "yyyy-mm-dd" },
    },
    { header: "Receipt no.", key: "receiptNo", width: 16 },
    { header: "Paid by", key: "paidBy", width: 32 },
    {
      header: "Amount (PHP)",
      key: "amount",
      width: 16,
      style: { numFmt: "#,##0.00" },
    },
    { header: "Method", key: "method", width: 15 },
    { header: "Collected by", key: "collectedBy", width: 20 },
    { header: "Note", key: "note", width: 12 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const p of payments) {
    sheet.addRow({
      paidOn: new Date(`${p.paidOn}T00:00:00Z`),
      receiptNo: p.receiptNo,
      paidBy: paidBy(p),
      amount: toPesos(p.amount),
      method: paymentMethodLabels[p.method],
      collectedBy: collectedBy(p),
      note: isCancelled(p) ? "Cancelled" : "",
    });
  }

  sheet.addRow({});
  const total = toPesos(totalOf(payments));
  const totalRow = sheet.addRow({
    paidBy: "Total",
    // A formula, so the total stays right if the accountant edits a row.
    amount:
      payments.length === 0
        ? 0
        : { formula: `SUM(D2:D${payments.length + 1})`, result: total },
  });
  totalRow.font = { bold: true };
  for (const { method, total: methodTotal } of totalsByMethod(payments)) {
    sheet.addRow({
      paidBy: paymentMethodLabels[method],
      amount: toPesos(methodTotal),
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
