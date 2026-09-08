import { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role?: string;
      registrationCompleted?: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    registrationCompleted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    registrationCompleted?: boolean;
  }
}
