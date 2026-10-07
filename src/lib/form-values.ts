// Empty inputs become null, so "not filled in yet" is stored as NULL, not "".
// Used with React Hook Form's setValueAs.
export const emptyToNull = (v: unknown) =>
  v === undefined || v === null || String(v).trim() === "" ? null : v;

export const emptyToNullNumber = (v: unknown) => {
  const value = emptyToNull(v);
  return value === null ? null : Number(value);
};
