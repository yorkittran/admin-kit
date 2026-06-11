import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/users")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  component: UsersPage,
});

function UsersPage() {
  const queryClient = useQueryClient();
  const { session } = Route.useRouteContext();
  const { data, isPending } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await authClient.admin.listUsers({
        query: { limit: 100, sortBy: "createdAt", sortDirection: "desc" },
      });
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  async function changeRole(userId: string, role: "admin" | "member") {
    try {
      // Better Auth types infer "user"|"admin" but runtime config uses "member" as defaultRole
      const { error } = await authClient.admin.setRole({
        userId,
        role: role as "user" | "admin",
      });
      if (error) {
        toast.error(error.message ?? m.users_role_error());
        return;
      }
    } catch {
      toast.error(m.common_connection_error());
      return;
    }
    toast.success(m.users_role_updated());
    refresh();
  }

  async function toggleBan(user: { id: string; banned?: boolean | null }) {
    try {
      const { error } = user.banned
        ? await authClient.admin.unbanUser({ userId: user.id })
        : await authClient.admin.banUser({ userId: user.id });
      if (error) {
        toast.error(error.message ?? m.users_update_error());
        return;
      }
    } catch {
      toast.error(m.common_connection_error());
      return;
    }
    toast.success(
      user.banned ? m.users_unbanned_toast() : m.users_banned_toast(),
    );
    refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">{m.users_title()}</h1>
        <InviteDialog onInvited={refresh} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{m.common_name()}</TableHead>
            <TableHead>{m.common_email()}</TableHead>
            <TableHead>{m.users_role()}</TableHead>
            <TableHead>{m.common_status()}</TableHead>
            <TableHead className="text-right">{m.common_actions()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isPending && (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                {m.common_loading()}
              </TableCell>
            </TableRow>
          )}
          {data?.users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  value={user.role ?? "member"}
                  disabled={user.id === session.user.id}
                  onValueChange={(role) =>
                    changeRole(user.id, role as "admin" | "member")
                  }
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      {m.users_role_admin()}
                    </SelectItem>
                    <SelectItem value="member">
                      {m.users_role_member()}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {user.banned ? (
                  <Badge variant="destructive">{m.users_banned()}</Badge>
                ) : (
                  <Badge variant="secondary">{m.users_active()}</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={user.id === session.user.id}
                  onClick={() => toggleBan(user)}
                >
                  {user.banned ? m.users_unban() : m.users_ban()}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function InviteDialog({ onInvited }: { onInvited: () => void }) {
  const [open, setOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
      role: "member" as "admin" | "member",
    },
    onSubmit: async ({ value }) => {
      const { data, error } = await api.users.invite.post(value);
      if (error) {
        const message =
          typeof error.value === "object" &&
          error.value !== null &&
          "message" in error.value
            ? String(error.value.message)
            : m.users_invite_error();
        toast.error(message);
        return;
      }
      toast.success(m.users_invite_sent({ email: value.email }));
      form.reset();
      setOpen(false);
      onInvited();
      return data;
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{m.users_invite()}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{m.users_invite()}</DialogTitle>
          <DialogDescription>{m.users_invite_description()}</DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                value.includes("@") ? undefined : m.common_email_invalid(),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor="invite-email">{m.common_email()}</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                value.trim().length > 0 ? undefined : m.common_name_required(),
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor="invite-name">{m.common_name()}</Label>
                <Input
                  id="invite-name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <p className="text-destructive text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          </form.Field>
          <form.Field name="role">
            {(field) => (
              <div className="grid gap-2">
                <Label>{m.users_role()}</Label>
                <Select
                  value={field.state.value}
                  onValueChange={(value) =>
                    field.handleChange(value as "admin" | "member")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      {m.users_role_member()}
                    </SelectItem>
                    <SelectItem value="admin">
                      {m.users_role_admin()}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </form.Field>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? m.common_sending() : m.users_invite_send()}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  );
}
