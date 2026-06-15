import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

export function ResetPasswordEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <EmailLayout
      preview="Reset your admin-kit password"
      heading="Reset your password"
      buttonUrl={url}
      buttonLabel="Reset password"
      footer="If you didn't request this, you can safely ignore this email."
    >
      <Text>Hi {name},</Text>
      <Text>
        Someone requested a password reset for your admin-kit account. The link
        expires in 1 hour.
      </Text>
    </EmailLayout>
  );
}
