import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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

export const Route = createFileRoute("/_auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);

  const form = useForm({
    defaultValues: { email: "" },
    onSubmit: async ({ value }) => {
      await authClient.requestPasswordReset({
        email: value.email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // always claim success — don't leak which emails exist
      setSent(true);
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>
          We'll email you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="grid gap-4">
            <p className="text-sm">
              If an account exists for that email, a reset link is on its way.
            </p>
            <Button asChild variant="outline">
              <Link to="/login" search={{ redirect: undefined }}>
                Back to sign in
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
                  value.includes("@") ? undefined : "Enter a valid email",
              }}
            >
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Email</Label>
                  <Input
                    id={field.name}
                    type="email"
                    autoComplete="email"
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
            <form.Subscribe
              selector={(state) =>
                [state.canSubmit, state.isSubmitting] as const
              }
            >
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </Button>
              )}
            </form.Subscribe>
            <Button asChild variant="link" className="justify-self-center">
              <Link to="/login" search={{ redirect: undefined }}>
                Back to sign in
              </Link>
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
