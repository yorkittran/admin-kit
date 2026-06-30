import { Banner } from "@astryxdesign/core/Banner";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Heading } from "@astryxdesign/core/Heading";
import { VStack } from "@astryxdesign/core/Layout";
import { Text } from "@astryxdesign/core/Text";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { TextField } from "@/components/form/text-field";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";
import { useToast } from "@/lib/toast";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const toast = useToast();

  const nameForm = useForm({
    defaultValues: { name: session.user.name },
    onSubmit: async ({ value }) => {
      try {
        const { error } = await authClient.updateUser({ name: value.name });
        if (error) {
          toast.error(error.message ?? m.profile_name_update_error());
          return;
        }
      } catch {
        toast.error(m.common_connection_error());
        return;
      }
      toast.success(m.profile_name_updated());
      router.invalidate();
    },
  });

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const passwordForm = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirm: "" },
    onSubmit: async ({ value }) => {
      setPasswordError(null);
      try {
        const { error } = await authClient.changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
          revokeOtherSessions: true,
        });
        if (error) {
          setPasswordError(error.message ?? m.profile_password_change_error());
          return;
        }
      } catch {
        setPasswordError(m.common_connection_error());
        return;
      }
      passwordForm.reset();
      toast.success(m.profile_password_changed());
    },
  });

  return (
    <VStack gap={6} className="max-w-lg">
      <Heading level={1}>{m.profile_title()}</Heading>

      <Card>
        <VStack gap={4}>
          <VStack gap={1}>
            <Heading level={2}>{m.profile_account()}</Heading>
            <Text type="supporting" color="secondary">
              {session.user.email}
            </Text>
          </VStack>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              nameForm.handleSubmit();
            }}
          >
            <nameForm.Field
              name="name"
              validators={{
                onChange: ({ value }) =>
                  value.trim().length > 0
                    ? undefined
                    : m.common_name_required(),
              }}
            >
              {(field) => <TextField field={field} label={m.common_name()} />}
            </nameForm.Field>
            <nameForm.Subscribe
              selector={(state) =>
                [state.canSubmit, state.isSubmitting] as const
              }
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  label={isSubmitting ? m.common_saving() : m.common_save()}
                  variant="primary"
                  isDisabled={!canSubmit || isSubmitting}
                  isLoading={isSubmitting}
                />
              )}
            </nameForm.Subscribe>
          </form>
        </VStack>
      </Card>

      <Card>
        <VStack gap={4}>
          <VStack gap={1}>
            <Heading level={2}>{m.profile_password()}</Heading>
            <Text type="supporting" color="secondary">
              {m.profile_password_hint()}
            </Text>
          </VStack>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              passwordForm.handleSubmit();
            }}
          >
            <passwordForm.Field name="currentPassword">
              {(field) => (
                <TextField
                  field={field}
                  label={m.profile_current_password()}
                  type="password"
                  autoComplete="current-password"
                />
              )}
            </passwordForm.Field>
            <passwordForm.Field
              name="newPassword"
              validators={{
                onChange: ({ value }) =>
                  value.length >= 8 ? undefined : m.common_password_min(),
              }}
            >
              {(field) => (
                <TextField
                  field={field}
                  label={m.profile_new_password()}
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </passwordForm.Field>
            <passwordForm.Field
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
                  label={m.profile_confirm_password()}
                  type="password"
                  autoComplete="new-password"
                />
              )}
            </passwordForm.Field>
            {passwordError && <Banner status="error" title={passwordError} />}
            <passwordForm.Subscribe
              selector={(state) =>
                [state.canSubmit, state.isSubmitting] as const
              }
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  label={
                    isSubmitting
                      ? m.common_saving()
                      : m.profile_change_password()
                  }
                  variant="primary"
                  isDisabled={!canSubmit || isSubmitting}
                  isLoading={isSubmitting}
                />
              )}
            </passwordForm.Subscribe>
          </form>
        </VStack>
      </Card>

      <Card>
        <VStack gap={4}>
          <VStack gap={1}>
            <Heading level={2}>{m.profile_appearance()}</Heading>
            <Text type="supporting" color="secondary">
              {m.profile_appearance_hint()}
            </Text>
          </VStack>
          <ModeToggle />
        </VStack>
      </Card>

      <Card>
        <VStack gap={4}>
          <VStack gap={1}>
            <Heading level={2}>{m.profile_language()}</Heading>
            <Text type="supporting" color="secondary">
              {m.profile_language_hint()}
            </Text>
          </VStack>
          <LocaleSwitcher />
        </VStack>
      </Card>
    </VStack>
  );
}
