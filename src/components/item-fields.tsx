"use client";

import Link from "next/link";
import { get, useFormContext, useWatch } from "react-hook-form";
import { SelectField, TextField } from "@/components/form-fields";
import {
  BLOOD_TYPES,
  FACES,
  ITEM_KINDS,
  KARATS,
  MATERIALS,
  RING_TYPES,
  faceLabels,
  itemKindLabels,
  materialLabels,
  ringTypeLabels,
  type ItemKind,
} from "@/lib/enums";
import { emptyToNull, emptyToNullNumber } from "@/lib/form-values";
import type { ItemInput } from "@/lib/validation";

// A new row of the chosen kind, keeping what every kind shares. Its own fields start
// empty, and the schema asks for them on save.
export function blankItem<K extends ItemKind>(
  kind: K,
  keep: Pick<ItemInput, "id" | "quantity" | "unitPrice"> = {
    id: null,
    quantity: 1,
    unitPrice: null as unknown as number,
  },
): Extract<ItemInput, { kind: K }> {
  return { ...keep, kind } as Extract<ItemInput, { kind: K }>;
}

// One item's fields, used wherever items are entered: an Individual order, extra
// items on a student's row, and Batch items. `name` is the item's path in the form
// (e.g. "items.0" or "orders.3.items.1"), read through the surrounding FormProvider.
// Paths are built at runtime, so they're plain strings here; the form's Zod schema
// still checks every value.
export function ItemFields({
  name,
  legend,
  kinds = ITEM_KINDS,
  stones,
  onKindChange,
  onRemove,
}: {
  name: string;
  legend: string;
  // Which kinds the Kind dropdown offers (Batch items: pin and other only).
  kinds?: readonly ItemKind[];
  stones: { id: number; name: string }[];
  onKindChange: (kind: ItemKind) => void;
  onRemove?: () => void;
}) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();
  const kind = useWatch({ control, name: `${name}.kind` });
  const material = useWatch({ control, name: `${name}.material` });
  const face = useWatch({ control, name: `${name}.face` });
  const error = (field: string): string | undefined =>
    get(errors, `${name}.${field}`)?.message;

  return (
    <fieldset className="flex flex-col gap-3 rounded border p-3">
      <legend className="px-1 font-medium">{legend}</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SelectField
          label="Kind"
          {...register(`${name}.kind`, {
            onChange: (event) => onKindChange(event.target.value as ItemKind),
          })}
        >
          {kinds.map((k) => (
            <option key={k} value={k}>
              {itemKindLabels[k]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Quantity"
          inputMode="numeric"
          error={error("quantity")}
          {...register(`${name}.quantity`, {
            setValueAs: emptyToNullNumber,
          })}
        />
        <TextField
          label="Price each (₱)"
          inputMode="decimal"
          error={error("unitPrice")}
          {...register(`${name}.unitPrice`, {
            setValueAs: emptyToNullNumber,
          })}
        />
      </div>

      {kind === "ring" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SelectField
            label="Ring type"
            defaultValue=""
            error={error("ringType")}
            {...register(`${name}.ringType`, {
              setValueAs: emptyToNull,
            })}
          >
            <option value="" disabled>
              Choose
            </option>
            {RING_TYPES.map((t) => (
              <option key={t} value={t}>
                {ringTypeLabels[t]}
              </option>
            ))}
          </SelectField>
          <SelectField
            label="Material"
            defaultValue=""
            error={error("material")}
            {...register(`${name}.material`, {
              setValueAs: emptyToNull,
            })}
          >
            <option value="" disabled>
              Choose
            </option>
            {MATERIALS.map((m) => (
              <option key={m} value={m}>
                {materialLabels[m]}
              </option>
            ))}
          </SelectField>
          {material === "gold" && (
            <SelectField
              label="Karat"
              defaultValue=""
              error={error("karat")}
              {...register(`${name}.karat`, {
                setValueAs: emptyToNullNumber,
              })}
            >
              <option value="" disabled>
                Choose
              </option>
              {KARATS.map((k) => (
                <option key={k} value={k}>
                  {k}k
                </option>
              ))}
            </SelectField>
          )}
          <TextField
            label="Size"
            inputMode="decimal"
            error={error("size")}
            {...register(`${name}.size`, {
              setValueAs: emptyToNullNumber,
            })}
          />
          <SelectField
            label="Face"
            defaultValue=""
            error={error("face")}
            {...register(`${name}.face`, { setValueAs: emptyToNull })}
          >
            <option value="" disabled>
              Choose
            </option>
            {FACES.map((f) => (
              <option key={f} value={f}>
                {faceLabels[f]}
              </option>
            ))}
          </SelectField>
          {face === "stone" &&
            (stones.length === 0 ? (
              <p className="self-end text-sm">
                No stones yet: add them in{" "}
                <Link href="/stones" className="underline">
                  Stones
                </Link>
                .
              </p>
            ) : (
              <SelectField
                label="Stone"
                defaultValue=""
                error={error("stoneId")}
                {...register(`${name}.stoneId`, {
                  setValueAs: emptyToNullNumber,
                })}
              >
                <option value="" disabled>
                  Choose
                </option>
                {stones.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </SelectField>
            ))}
          <TextField
            label="Engraving (optional)"
            error={error("engraving")}
            {...register(`${name}.engraving`, {
              setValueAs: emptyToNull,
            })}
          />
        </div>
      )}

      {kind === "dog_tag" && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <TextField
              label="Birthday"
              type="date"
              error={error("birthday")}
              {...register(`${name}.birthday`, {
                setValueAs: emptyToNull,
              })}
            />
            <SelectField
              label="Blood type"
              defaultValue=""
              error={error("bloodType")}
              {...register(`${name}.bloodType`, {
                setValueAs: emptyToNull,
              })}
            >
              <option value="" disabled>
                Choose
              </option>
              {BLOOD_TYPES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </SelectField>
          </div>
          {/* Philippine Data Privacy Act: say why sensitive data is collected (design doc). */}
          <p className="text-sm text-gray-600">
            Birthday and blood type are collected only to engrave this dog tag.
            They are never shown on the public order status page.
          </p>
        </>
      )}

      {kind === "other" && (
        <TextField
          label="Description (e.g. medal, plaque)"
          error={error("description")}
          {...register(`${name}.description`, {
            setValueAs: emptyToNull,
          })}
        />
      )}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="self-start text-sm text-red-700 underline"
        >
          Remove {legend.toLowerCase()}
        </button>
      )}
    </fieldset>
  );
}
