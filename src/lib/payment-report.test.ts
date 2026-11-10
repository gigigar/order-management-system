import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  applyView,
  collectedBy,
  defaultView,
  isCancelled,
  paidBy,
  totalOf,
  totalsByMethod,
  viewFromParams,
  viewToParams,
  type ReportPayment,
} from "./payment-report";
import { buildPaymentsWorkbook } from "./payments-workbook";

const batchPayment: ReportPayment = {
  id: 1,
  paidOn: "2026-11-03",
  receiptNo: "0012",
  amount: 150_050,
  method: "cash",
  schoolName: "St. Mary's",
  customerName: null,
  collectedBy: "Ben",
  batchCancelledAt: null,
  orderCancelledAt: null,
};
const orderPayment: ReportPayment = {
  ...batchPayment,
  id: 2,
  paidOn: "2026-11-20",
  receiptNo: "=SUM(A1)",
  amount: 50_000,
  method: "gcash",
  schoolName: null,
  customerName: "Ana Cruz",
  collectedBy: null,
  orderCancelledAt: new Date("2026-11-21T00:00:00Z"),
};
const payments = [batchPayment, orderPayment];

describe("payment report", () => {
  it("names who paid", () => {
    expect(paidBy(batchPayment)).toBe("St. Mary's (Batch)");
    expect(paidBy(orderPayment)).toBe("Ana Cruz");
  });

  it("treats no Agent as the Main office", () => {
    expect(collectedBy(batchPayment)).toBe("Ben");
    expect(collectedBy(orderPayment)).toBe("Main office");
  });

  it("marks cancelled entries", () => {
    expect(isCancelled(batchPayment)).toBe(false);
    expect(isCancelled(orderPayment)).toBe(true);
  });

  it("totals overall and by method", () => {
    expect(totalOf(payments)).toBe(200_050);
    expect(totalsByMethod(payments)).toEqual([
      { method: "cash", total: 150_050 },
      { method: "gcash", total: 50_000 },
      { method: "bank", total: 0 },
      { method: "check", total: 0 },
    ]);
  });
});

describe("applyView", () => {
  const ids = (view: Partial<typeof defaultView>) =>
    applyView(payments, { ...defaultView, ...view }).map((p) => p.id);

  it("defaults to oldest first", () => {
    expect(ids({})).toEqual([1, 2]);
  });

  it("sorts by amount in either direction", () => {
    expect(ids({ sort: "amount" })).toEqual([2, 1]);
    expect(ids({ sort: "amount", direction: "desc" })).toEqual([1, 2]);
  });

  it("sorts receipt numbers like numbers", () => {
    const receipts = ["10", "9"].map((receiptNo, i) => ({
      ...batchPayment,
      id: i,
      receiptNo,
    }));
    const sorted = applyView(receipts, { ...defaultView, sort: "receipt" });
    expect(sorted.map((p) => p.receiptNo)).toEqual(["9", "10"]);
  });

  it("filters by method", () => {
    expect(ids({ method: "gcash" })).toEqual([2]);
  });

  it("filters by month, and shows everything without one", () => {
    const other = { ...batchPayment, id: 3, paidOn: "2026-12-01" };
    const list = [...payments, other];
    const view = { ...defaultView, month: "2026-11" };
    expect(applyView(list, view).map((p) => p.id)).toEqual([1, 2]);
    expect(applyView(list, defaultView).map((p) => p.id)).toEqual([1, 2, 3]);
  });

  it("searches receipt, name, and collector, ignoring case", () => {
    expect(ids({ search: "0012" })).toEqual([1]);
    expect(ids({ search: "  ana " })).toEqual([2]);
    expect(ids({ search: "MAIN OFFICE" })).toEqual([2]);
    expect(ids({ search: "nobody" })).toEqual([]);
  });

  it("doesn't reorder the list it was given", () => {
    const original = [orderPayment, batchPayment];
    applyView(original, defaultView);
    expect(original.map((p) => p.id)).toEqual([2, 1]);
  });
});

describe("view params", () => {
  it("round-trips a view", () => {
    const view = {
      month: "2026-11",
      search: "ana & co",
      method: "bank",
      sort: "amount",
      direction: "desc",
    } as const;
    expect(viewFromParams(viewToParams(view))).toEqual(view);
  });

  it("falls back on anything unrecognized", () => {
    const params = new URLSearchParams(
      "month=2026-13&method=x&sort=y&direction=z",
    );
    expect(viewFromParams(params)).toEqual(defaultView);
  });
});

async function read(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  return workbook.worksheets[0];
}

describe("buildPaymentsWorkbook", () => {
  it("writes one row per Payment, in pesos", async () => {
    const sheet = await read(await buildPaymentsWorkbook("2026-11", payments));
    expect(sheet.name).toBe("Payments 2026-11");
    const row = sheet.getRow(2);
    expect(row.getCell(1).value).toEqual(new Date("2026-11-03T00:00:00Z"));
    expect(row.getCell(2).value).toBe("0012");
    expect(row.getCell(3).value).toBe("St. Mary's (Batch)");
    expect(row.getCell(4).value).toBe(1500.5);
    expect(row.getCell(5).value).toBe("Cash");
    expect(row.getCell(6).value).toBe("Ben");
  });

  it("keeps a receipt number that looks like a formula as text", async () => {
    const sheet = await read(await buildPaymentsWorkbook("2026-11", payments));
    expect(sheet.getRow(3).getCell(2).value).toBe("=SUM(A1)");
  });

  it("adds a formula total and method totals", async () => {
    const sheet = await read(await buildPaymentsWorkbook("2026-11", payments));
    const total = sheet.getRow(5);
    expect(total.getCell(3).value).toBe("Total");
    expect(total.getCell(4).value).toMatchObject({
      formula: "SUM(D2:D3)",
      result: 2000.5,
    });
    expect(sheet.getRow(6).getCell(3).value).toBe("Cash");
    expect(sheet.getRow(6).getCell(4).value).toBe(1500.5);
  });

  it("names the sheet for all Payments", async () => {
    const sheet = await read(await buildPaymentsWorkbook("", payments));
    expect(sheet.name).toBe("All payments");
  });

  it("handles a month with no Payments", async () => {
    const sheet = await read(await buildPaymentsWorkbook("2026-10", []));
    expect(sheet.getRow(3).getCell(3).value).toBe("Total");
    expect(sheet.getRow(3).getCell(4).value).toBe(0);
  });
});
