// Total, paid and remaining for one Batch or Individual order, all in centavos.
// Overpaying is allowed (rounding, advance payments), so remaining can go below 0;
// the page shows it as a warning, not an error.
export function paymentSummary(
  totalCentavos: number,
  payments: { amount: number }[],
) {
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalCentavos - paid;
  return { total: totalCentavos, paid, remaining, overpaid: remaining < 0 };
}
