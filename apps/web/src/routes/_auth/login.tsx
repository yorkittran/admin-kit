import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { TextField } from "@/components/form/text-field";
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
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={2}>admin-kit</Heading>
        <Text type="supporting" color="secondary">
          {m.auth_sign_in_description()}
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
        {error && <Banner status="error" title={error} />}
        <Link
          to="/forgot-password"
          className="text-accent text-sm justify-self-end"
        >
          {m.auth_forgot_password()}
        </Link>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting] as const}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              label={isSubmitting ? m.auth_signing_in() : m.auth_sign_in()}
              variant="primary"
              isDisabled={!canSubmit || isSubmitting}
              isLoading={isSubmitting}
            />
          )}
        </form.Subscribe>
      </form>
    </VStack>
  );
}
