import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      workspaceId: string;
      workspaceSlug: string;
    } & DefaultSession["user"];
  }

  interface User {
    workspaceId?: string;
    workspaceSlug?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    workspaceId?: string;
    workspaceSlug?: string;
  }
}
