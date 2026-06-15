import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
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
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      setNetworkError(null);
      try {
        await authClient.requestPasswordReset({
          email: value.email,
          redirectTo: `${window.location.origin}/reset-password`,
        });
      } catch {
        setNetworkError(m.auth_send_email_error());
        return;
      }
      // always claim success — don't leak which emails exist
      setSent(true);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{m.auth_forgot_password_title()}</CardTitle>
        <CardDescription>
          {m.auth_forgot_password_description()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="grid gap-4">
            <p className="text-sm">{m.auth_reset_sent_notice()}</p>
            <Button asChild variant="outline">
              <Link to="/login" search={{ redirect: undefined }}>
                {m.auth_back_to_login()}
              </Link>
            </Button>
          </div>
        ) : (
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
                <TextField
                  field={field}
                  label={m.common_email()}
                  type="email"
                  autoComplete="email"
                />
              )}
            </form.Field>
            {networkError && (
              <p className="text-destructive text-sm">{networkError}</p>
            )}
            <form.Subscribe
              selector={(state) =>
                [state.canSubmit, state.isSubmitting] as const
              }
            >
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? m.common_sending() : m.auth_send_reset_link()}
                </Button>
              )}
            </form.Subscribe>
            <Button asChild variant="link" className="justify-self-center">
              <Link to="/login" search={{ redirect: undefined }}>
                {m.auth_back_to_login()}
              </Link>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
