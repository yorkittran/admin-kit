import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { m } from "@/paraglide/messages";

export const Route = createFileRoute("/_app/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { session } = Route.useRouteContext();
  const router = useRouter();

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
    <div className="flex max-w-lg flex-col gap-6">
      <h1 className="font-bold text-2xl">{m.profile_title()}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{m.profile_account()}</CardTitle>
          <CardDescription>{session.user.email}</CardDescription>
        </CardHeader>
        <CardContent>
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
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>{m.common_name()}</Label>
                  <Input
                    id={field.name}
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
            </nameForm.Field>
            <nameForm.Subscribe
              selector={(state) =>
                [state.canSubmit, state.isSubmitting] as const
              }
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="justify-self-start"
                >
                  {isSubmitting ? m.common_saving() : m.common_save()}
                </Button>
              )}
            </nameForm.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m.profile_password()}</CardTitle>
          <CardDescription>{m.profile_password_hint()}</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              passwordForm.handleSubmit();
            }}
          >
            <passwordForm.Field name="currentPassword">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>
                    {m.profile_current_password()}
                  </Label>
                  <Input
                    id={field.name}
                    type="password"
                    autoComplete="current-password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
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
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>{m.profile_new_password()}</Label>
                  <Input
                    id={field.name}
                    type="password"
                    autoComplete="new-password"
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
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>
                    {m.profile_confirm_password()}
                  </Label>
                  <Input
                    id={field.name}
                    type="password"
                    autoComplete="new-password"
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
            </passwordForm.Field>
            {passwordError && (
              <p className="text-destructive text-sm">{passwordError}</p>
            )}
            <passwordForm.Subscribe
              selector={(state) =>
                [state.canSubmit, state.isSubmitting] as const
              }
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className="justify-self-start"
                >
                  {isSubmitting
                    ? m.common_saving()
                    : m.profile_change_password()}
                </Button>
              )}
            </passwordForm.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m.profile_appearance()}</CardTitle>
          <CardDescription>{m.profile_appearance_hint()}</CardDescription>
        </CardHeader>
        <CardContent>
          <ModeToggle />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{m.profile_language()}</CardTitle>
          <CardDescription>{m.profile_language_hint()}</CardDescription>
        </CardHeader>
        <CardContent>
          <LocaleSwitcher />
        </CardContent>
      </Card>
    </div>
  );
}
