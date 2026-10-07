// Money is stored as integer centavos (design doc) and typed in pesos.

// Math.round, because 19.99 * 100 is 1998.9999999999998 in floating point.
export function toCentavos(pesos: number): number {
  return Math.round(pesos * 100);
}

export function toPesos(centavos: number): number {
  return centavos / 100;
}

const pesoFormat = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
});

export function formatPesos(centavos: number): string {
  return pesoFormat.format(toPesos(centavos));
}
