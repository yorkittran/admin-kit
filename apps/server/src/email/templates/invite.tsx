import { Text } from "@react-email/components";
import { EmailLayout } from "./layout";

export function InviteEmail({ name, url }: { name: string; url: string }) {
  return (
    <EmailLayout
      preview="You're invited to admin-kit"
      heading="You're invited"
      buttonUrl={url}
      buttonLabel="Set your password"
      footer="If you weren't expecting this, contact your administrator."
    >
      <Text>Hi {name},</Text>
      <Text>
        An account has been created for you on admin-kit. Set your password to
        get started. The link expires in 1 hour.
      </Text>
    </EmailLayout>
  );
}
