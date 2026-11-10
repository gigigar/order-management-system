"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SignInButton() {
  return (
    <Button
      type="button"
      size="lg"
      className="w-full"
      onClick={() =>
        authClient.signIn.social({
          provider: "google",
          callbackURL: "/",
          errorCallbackURL: "/",
        })
      }
    >
      Sign in with Google
    </Button>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-lg border border-sidebar-border px-4 py-2 text-sidebar-foreground hover:bg-sidebar-accent"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
      }}
    >
      Sign out
    </button>
  );
}
