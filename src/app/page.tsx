import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/auth-buttons";
import { auth } from "@/lib/auth";

export default async function Home({ searchParams }: PageProps<"/">) {
  const session = await auth.api.getSession({ headers: await headers() });
  // The dashboard will live here; until then, signed-in users start at Batches.
  if (session) redirect("/batches");
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Order Management System</h1>
      {error && (
        <p role="alert">
          {error === "NOT_INVITED"
            ? "This Google account hasn't been invited. Ask an Owner to invite it."
            : "Sign-in failed. Please try again."}
        </p>
      )}
      <SignInButton />
    </main>
  );
}
