import Link from "next/link";
import { requireUser } from "@/lib/session";
import { BatchForm } from "../batch-form";
import { batchFormOptions } from "../options";

export default async function NewBatchPage() {
  await requireUser();
  const options = await batchFormOptions();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">New Batch</h1>
      {options.schools.length === 0 ? (
        <p>
          Add a{" "}
          <Link href="/schools" className="underline">
            School
          </Link>{" "}
          first.
        </p>
      ) : (
        <BatchForm options={options} />
      )}
    </div>
  );
}
