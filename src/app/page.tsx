import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SignInButton, SignOutButton } from "./auth-buttons";

export default async function Home({ searchParams }: PageProps<"/">) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 p-6">
      {session ? (
        <>
          <p>
            Signed in as {session.user.name} ({session.user.role})
          </p>
          <SignOutButton />
        </>
      ) : (
        <>
          {error && (
            <p role="alert">
              {error === "NOT_INVITED"
                ? "This Google account hasn't been invited. Ask an Owner to invite it."
                : "Sign-in failed. Please try again."}
            </p>
          )}
          <SignInButton />
        </>
      )}
    </main>
  );
}
