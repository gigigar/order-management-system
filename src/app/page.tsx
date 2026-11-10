import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/auth-buttons";
import { Brand } from "@/components/brand";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { auth } from "@/lib/auth";

export default async function Home({ searchParams }: PageProps<"/">) {
  const session = await auth.api.getSession({ headers: await headers() });
  // Signed-in users start at the Dashboard: what's late comes first.
  if (session) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm gap-6 py-8">
        <CardHeader className="px-8 text-center">
          <Brand variant="login" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-8">
          {error && (
            <p role="alert" className="text-center text-sm text-destructive">
              {error === "NOT_INVITED"
                ? "This Google account hasn't been invited. Ask an Owner to invite it."
                : "Sign-in failed. Please try again."}
            </p>
          )}
          <SignInButton />
        </CardContent>
      </Card>
    </main>
  );
}
