import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TextField } from "@/components/form/text-field";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/lib/toast";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_auth/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { newPassword: "", confirm: "" },
    onSubmit: async ({ value }) => {
      if (!token) {
        setError(m.auth_reset_link_invalid());
        return;
      }
      setError(null);
      const { error } = await authClient.resetPassword({
        newPassword: value.newPassword,
        token,
      });
      if (error) {
        setError(error.message ?? m.auth_reset_password_error());
        return;
      }
      toast.success(m.auth_password_set_toast());
      await navigate({ to: "/login", search: { redirect: undefined } });
    },
  });

  return (
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={2}>{m.auth_set_new_password()}</Heading>
        <Text type="supporting" color="secondary">
          {m.auth_password_min_hint()}
        </Text>
      </VStack>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field
          name="newPassword"
          validators={{
            onChange: ({ value }) =>
              value.length >= 8 ? undefined : m.common_password_min(),
          }}
        >
          {(field) => (
            <TextField
              field={field}
              label={m.auth_new_password()}
              type="password"
              autoComplete="new-password"
            />
          )}
        </form.Field>
        <form.Field
          name="confirm"
          validators={{
            onChangeListenTo: ["newPassword"],
            onChange: ({ value, fieldApi }) =>
              value === fieldApi.form.getFieldValue("newPassword")
                ? undefined
                : m.common_passwords_no_match(),
          }}
        >
          {(field) => (
            <TextField
              field={field}
              label={m.auth_confirm_password()}
              type="password"
              autoComplete="new-password"
            />
          )}
        </form.Field>
        {error && <Banner status="error" title={error} />}
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              label={isSubmitting ? m.common_saving() : m.auth_set_password()}
              variant="primary"
              isDisabled={!canSubmit || isSubmitting}
              isLoading={isSubmitting}
            />
          )}
        </form.Subscribe>
        <Link
          to="/login"
          search={{ redirect: undefined }}
          className="text-accent text-sm justify-self-center"
        >
          {m.auth_back_to_login()}
        </Link>
      </form>
    </VStack>
  );
}
