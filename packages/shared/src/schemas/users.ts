import { Type } from "@sinclair/typebox";

// Role union must stay aligned with the Better Auth runtime config
// (defaultRole: "member", adminRoles: ["admin"]) in apps/server/src/auth/auth.ts.
export const UserInviteSchema = Type.Object({
  email: Type.String({ format: "email" }),
  name: Type.String({ minLength: 1 }),
  role: Type.Union([Type.Literal("admin"), Type.Literal("member")]),
});

export type UserInvite = typeof UserInviteSchema.static;
