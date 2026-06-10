// Invites reuse Better Auth's password-reset token flow; this marker is how the
// sendResetPassword callback knows to render the invite template instead.
// In-memory is sufficient: mark + consume happen within one request on a
// single-process server.
const pending = new Set<string>();

export function markInvited(email: string) {
  pending.add(email);
}

export function consumeInvited(email: string): boolean {
  return pending.delete(email);
}
