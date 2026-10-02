import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as schema from "@/db/schema";

// Owners can always sign in, as admins, so nobody can lock them out (design doc: Security).
const ownerEmails = (process.env.OWNER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

type Role = (typeof schema.userRole.enumValues)[number];

// The role a Google account signs in with, or null if it isn't allowed in.
async function roleFor(email: string): Promise<Role | null> {
  const normalized = email.toLowerCase();
  if (ownerEmails.includes(normalized)) return "admin";
  const [found] = await db
    .select({ role: schema.invite.role })
    .from(schema.invite)
    .where(eq(schema.invite.email, normalized));
  return found?.role ?? null;
}

// The code makes Better Auth redirect to errorCallbackURL with ?error=NOT_INVITED
// instead of showing raw JSON.
const notInvited = () =>
  new APIError("FORBIDDEN", {
    code: "NOT_INVITED",
    message: "This Google account hasn't been invited.",
  });

// Vercel sets these; locally they're undefined and sign-in goes straight to Google.
const productionURL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined;
const deploymentURL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? deploymentURL,
  database: drizzleAdapter(db, { provider: "pg", schema }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },
  user: {
    additionalFields: {
      role: {
        type: ["admin", "member"],
        required: true,
        defaultValue: "member",
        input: false, // only the server sets it, from the invite
      },
    },
  },
  databaseHooks: {
    user: {
      // First sign-in: refuse uninvited accounts, copy the role from the invite.
      create: {
        before: async (user) => {
          const role = await roleFor(user.email);
          if (!role) throw notInvited();
          return { data: { ...user, role } };
        },
      },
    },
    session: {
      // Every sign-in: removing someone's invite locks them out at their next sign-in.
      create: {
        before: async (session) => {
          const [user] = await db
            .select({ email: schema.user.email })
            .from(schema.user)
            .where(eq(schema.user.id, session.userId));
          if (!user || !(await roleFor(user.email))) throw notInvited();
          return { data: session };
        },
      },
    },
  },
  // Previews get a new URL each time, which Google won't accept, so their sign-in
  // goes through production and back (Better Auth's OAuth proxy).
  trustedOrigins: [
    "http://localhost:3000",
    "https://order-management-system-*-regina-2055.vercel.app",
  ],
  plugins: [
    ...(productionURL
      ? [
          oAuthProxy({
            productionURL,
            secret: process.env.OAUTH_PROXY_SECRET!,
          }),
        ]
      : []),
    nextCookies(), // must stay last
  ],
});
