import "server-only";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/lib/auth";

// Every page and Server Action that touches data calls this first. cache() means one
// session lookup per request, however many components call it.
export const requireUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  return session.user;
});

// Admin-only pages and actions. Members get a plain 404, so admin pages stay hidden.
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") notFound();
  return user;
}
