import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle>{m.auth_set_new_password()}</CardTitle>
        <CardDescription>{m.auth_password_min_hint()}</CardDescription>
      </CardHeader>
      <CardContent>
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
          {error && <p className="text-destructive text-sm">{error}</p>}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? m.common_saving() : m.auth_set_password()}
              </Button>
            )}
          </form.Subscribe>
          <Button asChild variant="link" className="justify-self-center">
            <Link to="/login" search={{ redirect: undefined }}>
              {m.auth_back_to_login()}
            </Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
