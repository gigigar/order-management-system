import Link from "next/link";
import { requireUser } from "@/lib/session";
import { batchFormOptions } from "../../batches/options";
import { OrderForm } from "../order-form";
import { PageHeader } from "@/components/page-header";

export default async function NewOrderPage() {
  await requireUser();
  const options = await batchFormOptions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="New Individual order" />
      {options.schools.length === 0 ? (
        <p>
          Add a{" "}
          <Link href="/schools" className="underline">
            School
          </Link>{" "}
          first.
        </p>
      ) : (
        <OrderForm options={options} />
      )}
    </div>
  );
}
