"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { type ComponentProps } from "react";
import {
  FormProvider,
  get,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { FormError, SubmitButton } from "@/components/form-fields";
import { ItemFields, blankItem } from "@/components/item-fields";
import { useWarnOnLeave } from "@/components/unsaved-changes";
import { applyErrors } from "@/lib/apply-errors";
import {
  BATCH_ITEM_KINDS,
  FACES,
  KARATS,
  MATERIALS,
  RING_TYPES,
  faceLabels,
  materialLabels,
  ringTypeLabels,
  type BatchItemKind,
  type ItemKind,
} from "@/lib/enums";
import { emptyToNull, emptyToNullNumber } from "@/lib/form-values";
import { formatPesos, toCentavos } from "@/lib/money";
import {
  batchEntrySchema,
  type BatchEntryInput,
  type ItemInput,
  type SchoolOrderInput,
} from "@/lib/validation";
import { saveBatchEntry } from "./actions";

type Stone = { id: number; name: string };
type Ring = Extract<ItemInput, { kind: "ring" }>;

// A new student row. It copies the ring spec from the row above (most of a Batch
// orders the same ring); name, phone, size and engraving start blank.
function newStudent(above?: Ring): SchoolOrderInput {
  const ring = {
    id: null,
    kind: "ring",
    quantity: 1,
    unitPrice: above?.unitPrice ?? null,
    ringType: above?.ringType ?? null,
    material: above?.material ?? null,
    karat: above?.karat ?? null,
    face: above?.face ?? null,
    stoneId: above?.stoneId ?? null,
    size: null,
    engraving: null,
  } as unknown as Ring; // blanks are filled in before save; the schema checks them
  return { id: null, customerName: "", customerPhone: null, items: [ring] };
}

// Line totals while typing; blank or invalid numbers count as 0.
function totalOf(items: { quantity?: number; unitPrice?: number }[]) {
  return items.reduce((sum, i) => {
    const line = (i.quantity ?? 0) * (i.unitPrice ?? 0);
    return sum + (Number.isFinite(line) ? toCentavos(line) : 0);
  }, 0);
}

export function BatchEntry({
  batchId,
  defaultValues,
  stones,
}: {
  batchId: number;
  defaultValues: BatchEntryInput;
  stones: Stone[];
}) {
  const router = useRouter();
  const form = useForm<BatchEntryInput>({
    resolver: zodResolver(batchEntrySchema),
    defaultValues,
  });
  const {
    control,
    getValues,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = form;
  const students = useFieldArray({ control, name: "orders" });
  const batchItems = useFieldArray({ control, name: "batchItems" });

  // A Rep's list can be 40+ students: warn before leaving with unsaved rows.
  useWarnOnLeave(isDirty);

  const orders = useWatch({ control, name: "orders" });
  const extras = useWatch({ control, name: "batchItems" });
  const total =
    orders.reduce((sum, o) => sum + totalOf(o.items), 0) + totalOf(extras);

  const addStudent = () => {
    const rows = getValues("orders");
    const above = rows.at(-1)?.items[0];
    students.append(newStudent(above), {
      focusName: `orders.${rows.length}.customerName`,
    });
  };

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveBatchEntry(batchId, values);
    if (!result.ok) return applyErrors(result, setError);
    // New rows now have ids, so the next save updates them instead of re-adding them.
    reset({
      orders: values.orders.map((o, k) => ({
        ...o,
        id: result.orders[k].id,
        items: o.items.map((i, j) => ({
          ...i,
          id: result.orders[k].itemIds[j],
        })) as SchoolOrderInput["items"],
      })),
      batchItems: values.batchItems.map((i, j) => ({
        ...i,
        id: result.batchItemIds[j],
      })),
    });
    router.refresh();
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            Students{" "}
            <span className="font-normal text-muted-foreground">
              ({students.fields.length})
            </span>
          </h2>
          {students.fields.length > 0 && (
            <div className="overflow-x-auto rounded-xl border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted text-xs tracking-wider whitespace-nowrap text-muted-foreground uppercase">
                  <tr>
                    <th className="p-2">#</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Ring type</th>
                    <th className="p-2">Material</th>
                    <th className="p-2">Karat</th>
                    <th className="p-2">Size</th>
                    <th className="p-2">Face</th>
                    <th className="p-2">Stone</th>
                    <th className="p-2">Engraving</th>
                    <th className="p-2">Price (₱)</th>
                    <th className="p-2">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                {students.fields.map((f, index) => (
                  <StudentRow
                    key={f.id}
                    index={index}
                    stones={stones}
                    onRemove={() => students.remove(index)}
                  />
                ))}
              </table>
            </div>
          )}
          <button
            type="button"
            onClick={addStudent}
            className="self-start rounded border border-[#8a7b6e] px-3 py-1.5 text-sm"
          >
            Add student
          </button>
        </section>

        <section className="flex max-w-3xl flex-col gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Batch items</h2>
          <p className="text-sm text-muted-foreground">
            Ordered for the whole Batch rather than one student, such as pins.
          </p>
          {batchItems.fields.map((f, index) => (
            <ItemFields
              key={f.id}
              name={`batchItems.${index}`}
              legend={`Batch item ${index + 1}`}
              kinds={BATCH_ITEM_KINDS}
              stones={stones}
              onKindChange={(kind) => {
                const { id, quantity, unitPrice } = getValues(
                  `batchItems.${index}`,
                );
                // The dropdown only offers BATCH_ITEM_KINDS.
                batchItems.update(
                  index,
                  blankItem(kind as BatchItemKind, { id, quantity, unitPrice }),
                );
              }}
              onRemove={() => batchItems.remove(index)}
            />
          ))}
          <button
            type="button"
            onClick={() => batchItems.append(blankItem("pin"))}
            className="self-start rounded border border-[#8a7b6e] px-3 py-1.5 text-sm"
          >
            Add Batch item
          </button>
        </section>

        <p className="font-medium">Batch total: {formatPesos(total)}</p>
        <FormError
          message={
            errors.root?.message ??
            errors.orders?.message ??
            errors.batchItems?.message
          }
        />
        <SubmitButton pending={isSubmitting}>
          {isDirty ? "Save students and items" : "Saved"}
        </SubmitButton>
      </form>
    </FormProvider>
  );
}

// The ring's columns on a student's row, with the labels used in error messages.
const ringErrorLabels: [string, string][] = [
  ["customerName", "Name"],
  ["customerPhone", "Phone"],
  ["items.0.ringType", "Ring type"],
  ["items.0.material", "Material"],
  ["items.0.karat", "Karat"],
  ["items.0.size", "Size"],
  ["items.0.face", "Face"],
  ["items.0.stoneId", "Stone"],
  ["items.0.engraving", "Engraving"],
  ["items.0.unitPrice", "Price"],
];

// One student: a table row for their ring, plus any extra items (e.g. a dog tag)
// and error messages in rows underneath. Paths are runtime strings, like ItemFields.
function StudentRow({
  index,
  stones,
  onRemove,
}: {
  index: number;
  stones: Stone[];
  onRemove: () => void;
}) {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext();
  const row = `orders.${index}`;
  const ring = `${row}.items.0`;
  const extras = useFieldArray({ control, name: `${row}.items` });
  const material = useWatch({ control, name: `${ring}.material` });
  const face = useWatch({ control, name: `${ring}.face` });
  const customerName = useWatch({ control, name: `${row}.customerName` });
  const who = customerName || `student ${index + 1}`;

  const rowErrors = ringErrorLabels.flatMap(([field, label]) => {
    const message: string | undefined = get(errors, `${row}.${field}`)?.message;
    return message ? [{ field, label, message }] : [];
  });
  const invalid = (field: string) => rowErrors.some((e) => e.field === field);
  // Each cell shows its column name until filled in (headers scroll out of view).
  const cell = (field: string, label: string) => ({
    name: `${row}.${field}`,
    label: `${label}, ${who}`,
    placeholder: label,
    invalid: invalid(field),
  });

  return (
    <tbody className="border-t">
      <tr className="align-top">
        <td className="p-2 text-muted-foreground">{index + 1}</td>
        <td className="p-1">
          <CellInput {...cell("customerName", "Name")} className="w-40" />
        </td>
        <td className="p-1">
          <CellInput
            {...cell("customerPhone", "Phone")}
            type="tel"
            className="w-32"
            setValueAs={emptyToNull}
          />
        </td>
        <td className="p-1">
          <CellSelect {...cell("items.0.ringType", "Ring type")}>
            {RING_TYPES.map((t) => (
              <option key={t} value={t}>
                {ringTypeLabels[t]}
              </option>
            ))}
          </CellSelect>
        </td>
        <td className="p-1">
          <CellSelect {...cell("items.0.material", "Material")}>
            {MATERIALS.map((m) => (
              <option key={m} value={m}>
                {materialLabels[m]}
              </option>
            ))}
          </CellSelect>
        </td>
        <td className="p-1">
          {material === "gold" ? (
            <CellSelect {...cell("items.0.karat", "Karat")} numeric>
              {KARATS.map((k) => (
                <option key={k} value={k}>
                  {k}k
                </option>
              ))}
            </CellSelect>
          ) : (
            <span className="block p-2 text-muted-foreground">—</span>
          )}
        </td>
        <td className="p-1">
          <CellInput
            {...cell("items.0.size", "Size")}
            inputMode="decimal"
            className="w-16"
            setValueAs={emptyToNullNumber}
          />
        </td>
        <td className="p-1">
          <CellSelect {...cell("items.0.face", "Face")}>
            {FACES.map((f) => (
              <option key={f} value={f}>
                {faceLabels[f]}
              </option>
            ))}
          </CellSelect>
        </td>
        <td className="p-1">
          {face === "stone" ? (
            <CellSelect {...cell("items.0.stoneId", "Stone")} numeric>
              {stones.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </CellSelect>
          ) : (
            <span className="block p-2 text-muted-foreground">—</span>
          )}
        </td>
        <td className="p-1">
          <CellInput
            {...cell("items.0.engraving", "Engraving")}
            className="w-32"
            setValueAs={emptyToNull}
          />
        </td>
        <td className="p-1">
          <CellInput
            {...cell("items.0.unitPrice", "Price")}
            inputMode="decimal"
            className="w-24"
            setValueAs={emptyToNullNumber}
          />
        </td>
        <td className="p-1 whitespace-nowrap">
          <button
            type="button"
            onClick={() => extras.append(blankItem("dog_tag"))}
            className="p-2 text-sm underline"
          >
            + Item<span className="sr-only"> for {who}</span>
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 text-sm text-red-700 underline"
          >
            Remove<span className="sr-only"> {who}</span>
          </button>
        </td>
      </tr>

      {rowErrors.length > 0 && (
        <tr>
          <td />
          <td colSpan={11} className="px-2 pb-2">
            <ul className="text-sm text-red-700">
              {rowErrors.map((e) => (
                <li key={e.field}>
                  {e.label}: {e.message}
                </li>
              ))}
            </ul>
          </td>
        </tr>
      )}

      {/* Extra items: index 0 is the ring in the columns above. */}
      {extras.fields.length > 1 && (
        <tr>
          <td />
          <td colSpan={11} className="px-2 pb-3">
            <div className="flex max-w-3xl flex-col gap-2">
              {extras.fields.map((f, k) =>
                k === 0 ? null : (
                  <ItemFields
                    key={f.id}
                    name={`${row}.items.${k}`}
                    legend={`Extra item ${k} for ${who}`}
                    stones={stones}
                    onKindChange={(kind: ItemKind) => {
                      const { id, quantity, unitPrice } = getValues(
                        `${row}.items.${k}`,
                      );
                      extras.update(
                        k,
                        blankItem(kind, { id, quantity, unitPrice }),
                      );
                    }}
                    onRemove={() => extras.remove(k)}
                  />
                ),
              )}
            </div>
          </td>
        </tr>
      )}
    </tbody>
  );
}

// Table cells: no visible label (the column header is one), so each gets an
// aria-label with the student's name for screen readers.

const cellClass =
  "rounded border border-[#8a7b6e] px-2 py-1.5 aria-invalid:border-red-700 aria-invalid:bg-red-50";

function CellInput({
  name,
  label,
  invalid,
  setValueAs,
  className = "",
  ...props
}: {
  name: string;
  label: string;
  invalid: boolean;
  setValueAs?: (v: unknown) => unknown;
} & Omit<ComponentProps<"input">, "name">) {
  const { register } = useFormContext();
  return (
    <input
      aria-label={label}
      aria-invalid={invalid || undefined}
      className={`${cellClass} ${className}`}
      {...props}
      {...register(name, setValueAs ? { setValueAs } : undefined)}
    />
  );
}

function CellSelect({
  name,
  label,
  placeholder,
  invalid,
  numeric = false,
  children,
}: {
  name: string;
  label: string;
  placeholder: string;
  invalid: boolean;
  numeric?: boolean;
  children: React.ReactNode;
}) {
  const { register } = useFormContext();
  return (
    <select
      aria-label={label}
      aria-invalid={invalid || undefined}
      defaultValue=""
      className={`${cellClass} bg-white`}
      {...register(name, {
        setValueAs: numeric ? emptyToNullNumber : emptyToNull,
      })}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {children}
    </select>
  );
}
