import { asc } from "drizzle-orm";
import { db } from "@/db";
import { invite } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { InviteForm } from "./invite-form";
import { RemoveInviteButton } from "./remove-invite-button";

export default async function InvitesPage() {
  await requireAdmin();
  const invites = await db.select().from(invite).orderBy(asc(invite.email));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Invites</h1>
        <p className="text-sm text-gray-600">
          Only invited Google accounts can sign in. Owners can always sign in.
        </p>
      </div>
      <InviteForm />
      {invites.length === 0 ? (
        <p>No invites yet.</p>
      ) : (
        <ul className="divide-y rounded border">
          {invites.map((i) => (
            <li key={i.id} className="flex justify-between gap-3 p-3">
              <span>
                {i.email} <span className="text-gray-600">· {i.role}</span>
              </span>
              <RemoveInviteButton id={i.id} email={i.email} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
