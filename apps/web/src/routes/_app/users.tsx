import { Badge } from "@astryxdesign/core/Badge";
import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Heading } from "@astryxdesign/core/Heading";
import {
  HStack,
  Layout,
  LayoutContent,
  LayoutFooter,
  VStack,
} from "@astryxdesign/core/Layout";
import { Selector } from "@astryxdesign/core/Selector";
import { Text } from "@astryxdesign/core/Text";
import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { UserPlus } from "lucide-react";
import { useCallback, useState } from "react";
import { DataTable } from "@/components/data-table/data-table";
import { SelectField } from "@/components/form/select-field";
import { TextField } from "@/components/form/text-field";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { decodeErrorMessage } from "@/lib/mutation-error";
import { useToast } from "@/lib/toast";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/users")({
  beforeLoad: ({ context }) => {
    if (context.session.user.role !== "admin") {
      throw redirect({ to: "/" });
    }
  },
  component: UsersPage,
});

type UserRow = {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  banned?: boolean | null;
};

const ROLE_OPTIONS = [
  { value: "admin", label: m.users_role_admin() },
  { value: "member", label: m.users_role_member() },
] as const;

function UsersPage() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { session } = Route.useRouteContext();
  const [search, setSearch] = useState("");

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

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const allUsers: UserRow[] = data?.users ?? [];
  const filteredUsers = search
    ? allUsers.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      )
    : allUsers;

  const columns: ColumnDef<UserRow>[] = [
    {
      accessorKey: "name",
      header: m.common_name(),
      cell: ({ row }) => (
        <Text type="body" weight="medium">
          {row.original.name}
        </Text>
      ),
    },
    {
      accessorKey: "email",
      header: m.common_email(),
    },
    {
      accessorKey: "role",
      header: m.users_role(),
      cell: ({ row }) => (
        <Selector
          label={m.users_role()}
          isLabelHidden
          size="sm"
          options={[...ROLE_OPTIONS]}
          value={row.original.role ?? "member"}
          isDisabled={row.original.id === session.user.id}
          onChange={(role) =>
            changeRole(row.original.id, role as "admin" | "member")
          }
        />
      ),
    },
    {
      accessorKey: "banned",
      header: m.common_status(),
      cell: ({ row }) =>
        row.original.banned ? (
          <Badge variant="error" label={m.users_banned()} />
        ) : (
          <Badge variant="success" label={m.users_active()} />
        ),
    },
    {
      id: "actions",
      header: m.common_actions(),
      cell: ({ row }) => (
        <HStack hAlign="end">
          <Button
            variant="secondary"
            size="sm"
            label={row.original.banned ? m.users_unban() : m.users_ban()}
            isDisabled={row.original.id === session.user.id}
            onClick={() => toggleBan(row.original)}
          />
        </HStack>
      ),
    },
  ];

  return (
    <VStack gap={4}>
      <HStack justify="between" vAlign="center">
        <Heading level={1}>{m.users_title()}</Heading>
        <InviteDialog onInvited={refresh} />
      </HStack>
      {isPending ? (
        <Text color="secondary">{m.common_loading()}</Text>
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers}
          getRowId={(u) => u.id}
          onSearchChange={handleSearchChange}
          searchPlaceholder={m.users_search_placeholder()}
        />
      )}
    </VStack>
  );
}

function InviteDialog({ onInvited }: { onInvited: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
      role: "member" as "admin" | "member",
    },
    onSubmit: async ({ value }) => {
      setServerError(null);
      const { data, error } = await api.users.invite.post(value);
      if (error) {
        setServerError(
          decodeErrorMessage(error.value) ?? m.users_invite_error(),
        );
        return;
      }
      toast.success(m.users_invite_sent({ email: value.email }));
      form.reset();
      setOpen(false);
      onInvited();
      return data;
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset();
      setServerError(null);
    }
    setOpen(next);
  }

  return (
    <>
      <Button
        label={m.users_invite()}
        variant="primary"
        icon={<UserPlus size={16} />}
        onClick={() => setOpen(true)}
      />
      <Dialog
        isOpen={open}
        onOpenChange={handleOpenChange}
        purpose="form"
        width={400}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <Layout
            height="auto"
            header={
              <DialogHeader
                title={m.users_invite()}
                subtitle={m.users_invite_description()}
                onOpenChange={handleOpenChange}
              />
            }
            content={
              <LayoutContent>
                <VStack gap={4}>
                  <form.Field
                    name="email"
                    validators={{
                      onChange: ({ value }) =>
                        value.includes("@")
                          ? undefined
                          : m.common_email_invalid(),
                    }}
                  >
                    {(field) => (
                      <TextField
                        field={field}
                        label={m.common_email()}
                        type="email"
                      />
                    )}
                  </form.Field>
                  <form.Field
                    name="name"
                    validators={{
                      onChange: ({ value }) =>
                        value.trim().length > 0
                          ? undefined
                          : m.common_name_required(),
                    }}
                  >
                    {(field) => (
                      <TextField field={field} label={m.common_name()} />
                    )}
                  </form.Field>
                  <form.Field name="role">
                    {(field) => (
                      <SelectField
                        field={field}
                        label={m.users_role()}
                        options={[...ROLE_OPTIONS]}
                      />
                    )}
                  </form.Field>
                  {serverError && <Banner status="error" title={serverError} />}
                </VStack>
              </LayoutContent>
            }
            footer={
              <LayoutFooter>
                <HStack gap={2} hAlign="end">
                  <Button
                    label={m.common_cancel()}
                    variant="secondary"
                    onClick={() => handleOpenChange(false)}
                  />
                  <form.Subscribe
                    selector={(state) =>
                      [state.canSubmit, state.isSubmitting] as const
                    }
                  >
                    {([canSubmit, isSubmitting]) => (
                      <Button
                        type="submit"
                        label={
                          isSubmitting
                            ? m.common_sending()
                            : m.users_invite_send()
                        }
                        variant="primary"
                        isDisabled={!canSubmit || isSubmitting}
                        isLoading={isSubmitting}
                      />
                    )}
                  </form.Subscribe>
                </HStack>
              </LayoutFooter>
            }
          />
        </form>
      </Dialog>
    </>
  );
}
