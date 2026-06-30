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
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
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
    <VStack gap={4}>
      <VStack gap={1}>
        <Heading level={2}>{m.auth_forgot_password_title()}</Heading>
        <Text type="supporting" color="secondary">
          {m.auth_forgot_password_description()}
        </Text>
      </VStack>
      {sent ? (
        <VStack gap={4}>
          <Text type="body" as="p">
            {m.auth_reset_sent_notice()}
          </Text>
          <Button
            variant="secondary"
            label={m.auth_back_to_login()}
            onClick={() =>
              navigate({ to: "/login", search: { redirect: undefined } })
            }
          />
        </VStack>
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
          {networkError && <Banner status="error" title={networkError} />}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                label={
                  isSubmitting ? m.common_sending() : m.auth_send_reset_link()
                }
                variant="primary"
                isDisabled={!canSubmit || isSubmitting}
                isLoading={isSubmitting}
              />
            )}
          </form.Subscribe>
          <Link
            to="/login"
            search={{ redirect: undefined }}
            className="justify-self-center"
          >
            <Text type="label" color="accent">
              {m.auth_back_to_login()}
            </Text>
          </Link>
        </form>
      )}
    </VStack>
  );
}
