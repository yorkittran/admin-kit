import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_auth/login")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const search = Route.useSearch();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      setError(null);
      const { error } = await authClient.signIn.email(value);
      if (error) {
        setError(error.message ?? m.auth_sign_in_failed());
        return;
      }
      await router.navigate({ to: search.redirect ?? "/" });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>admin-kit</CardTitle>
        <CardDescription>{m.auth_sign_in_description()}</CardDescription>
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
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) =>
                value.length >= 8 ? undefined : m.common_password_min(),
            }}
          >
            {(field) => (
              <TextField
                field={field}
                label={m.auth_password()}
                type="password"
                autoComplete="current-password"
              />
            )}
          </form.Field>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button asChild variant="link" className="justify-self-end px-0">
            <Link to="/forgot-password">{m.auth_forgot_password()}</Link>
          </Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? m.auth_signing_in() : m.auth_sign_in()}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
    </Card>
  );
}
