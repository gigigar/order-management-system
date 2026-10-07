"use client";

import Link from "next/link";
import {
  type Control,
  type FieldErrors,
  type UseFormRegister,
  useWatch,
} from "react-hook-form";
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
import type { IndividualOrderInput, ItemInput } from "@/lib/validation";

// A new row of the chosen kind, keeping what every kind shares. Its own fields start
// empty, and the schema asks for them on save.
export function blankItem(
  kind: ItemKind,
  keep: Pick<ItemInput, "id" | "quantity" | "unitPrice"> = {
    id: null,
    quantity: 1,
    unitPrice: null as unknown as number,
  },
): ItemInput {
  return { ...keep, kind } as ItemInput;
}

// Each item kind has different fields, and React Hook Form types errors on a union
// as only the shared ones, so they're read by field name here.
type RowErrors = Partial<Record<string, { message?: string }>>;

export function ItemFields({
  index,
  stones,
  control,
  register,
  errors,
  onKindChange,
  onRemove,
}: {
  index: number;
  stones: { id: number; name: string }[];
  control: Control<IndividualOrderInput>;
  register: UseFormRegister<IndividualOrderInput>;
  errors: FieldErrors<IndividualOrderInput>;
  onKindChange: (kind: ItemKind) => void;
  onRemove?: () => void;
}) {
  const kind = useWatch({ control, name: `items.${index}.kind` });
  const material = useWatch({ control, name: `items.${index}.material` });
  const face = useWatch({ control, name: `items.${index}.face` });
  const e = (errors.items?.[index] ?? {}) as RowErrors;

  return (
    <fieldset className="flex flex-col gap-3 rounded border p-3">
      <legend className="px-1 font-medium">Item {index + 1}</legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SelectField
          label="Kind"
          {...register(`items.${index}.kind`, {
            onChange: (event) => onKindChange(event.target.value as ItemKind),
          })}
        >
          {ITEM_KINDS.map((k) => (
            <option key={k} value={k}>
              {itemKindLabels[k]}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Quantity"
          inputMode="numeric"
          error={e.quantity?.message}
          {...register(`items.${index}.quantity`, {
            setValueAs: emptyToNullNumber,
          })}
        />
        <TextField
          label="Price each (₱)"
          inputMode="decimal"
          error={e.unitPrice?.message}
          {...register(`items.${index}.unitPrice`, {
            setValueAs: emptyToNullNumber,
          })}
        />
      </div>

      {kind === "ring" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SelectField
            label="Ring type"
            defaultValue=""
            error={e.ringType?.message}
            {...register(`items.${index}.ringType`, {
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
            error={e.material?.message}
            {...register(`items.${index}.material`, {
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
              error={e.karat?.message}
              {...register(`items.${index}.karat`, {
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
            error={e.size?.message}
            {...register(`items.${index}.size`, {
              setValueAs: emptyToNullNumber,
            })}
          />
          <SelectField
            label="Face"
            defaultValue=""
            error={e.face?.message}
            {...register(`items.${index}.face`, { setValueAs: emptyToNull })}
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
                error={e.stoneId?.message}
                {...register(`items.${index}.stoneId`, {
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
            error={e.engraving?.message}
            {...register(`items.${index}.engraving`, {
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
              error={e.birthday?.message}
              {...register(`items.${index}.birthday`, {
                setValueAs: emptyToNull,
              })}
            />
            <SelectField
              label="Blood type"
              defaultValue=""
              error={e.bloodType?.message}
              {...register(`items.${index}.bloodType`, {
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
          error={e.description?.message}
          {...register(`items.${index}.description`, {
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
          Remove item {index + 1}
        </button>
      )}
    </fieldset>
  );
}
