import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
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

export const Route = createFileRoute("/_auth/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { newPassword: "", confirm: "" },
    onSubmit: async ({ value }) => {
      if (!token) {
        setError("This link is invalid or has expired.");
        return;
      }
      setError(null);
      const { error } = await authClient.resetPassword({
        newPassword: value.newPassword,
        token,
      });
      if (error) {
        setError(error.message ?? "Could not reset password");
        return;
      }
      toast.success("Password set — sign in with it now");
      navigate({ to: "/login", search: { redirect: undefined } });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
        <CardDescription>Minimum 8 characters.</CardDescription>
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
                value.length >= 8 ? undefined : "At least 8 characters",
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>New password</Label>
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
          </form.Field>
          <form.Field
            name="confirm"
            validators={{
              onChangeListenTo: ["newPassword"],
              onChange: ({ value, fieldApi }) =>
                value === fieldApi.form.getFieldValue("newPassword")
                  ? undefined
                  : "Passwords do not match",
            }}
          >
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Confirm password</Label>
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
          </form.Field>
          {error && <p className="text-destructive text-sm">{error}</p>}
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting] as const}
          >
            {([canSubmit, isSubmitting]) => (
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? "Saving…" : "Set password"}
              </Button>
            )}
          </form.Subscribe>
          <Button asChild variant="link" className="justify-self-center">
            <Link to="/login" search={{ redirect: undefined }}>
              Back to sign in
            </Link>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
