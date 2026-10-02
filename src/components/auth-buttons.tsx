"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignInButton() {
  return (
    <button
      type="button"
      className="rounded border px-4 py-2"
      onClick={() =>
        authClient.signIn.social({
          provider: "google",
          callbackURL: "/",
          errorCallbackURL: "/",
        })
      }
    >
      Sign in with Google
    </button>
  );
}

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded border px-4 py-2"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
      }}
    >
      Sign out
    </button>
  );
}
