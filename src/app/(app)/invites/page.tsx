import { asc } from "drizzle-orm";
import { db } from "@/db";
import { invite } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { InviteForm } from "./invite-form";
import { RemoveInviteButton } from "./remove-invite-button";
import { PageHeader } from "@/components/page-header";

export default async function InvitesPage() {
  await requireAdmin();
  const invites = await db.select().from(invite).orderBy(asc(invite.email));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <PageHeader
          title="Invites"
          description="Google accounts allowed to sign in, and their roles."
        />
        <p className="text-sm text-muted-foreground">
          Only invited Google accounts can sign in. Owners can always sign in.
        </p>
      </div>
      <InviteForm />
      {invites.length === 0 ? (
        <p>No invites yet.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {invites.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 p-3">
              <span>
                {i.email}{" "}
                <span className="text-muted-foreground">· {i.role}</span>
              </span>
              <RemoveInviteButton id={i.id} email={i.email} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
