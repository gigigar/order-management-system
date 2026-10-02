import { createAuthClient } from "better-auth/react";

// No baseURL: the client talks to whichever site it's loaded from.
export const authClient = createAuthClient();
