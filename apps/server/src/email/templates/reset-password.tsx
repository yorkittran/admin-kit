import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export function ResetPasswordEmail({
  name,
  url,
}: {
  name: string;
  url: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>Reset your admin-kit password</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 8,
            margin: "40px auto",
            maxWidth: 480,
            padding: 32,
          }}
        >
          <Heading as="h2">Reset your password</Heading>
          <Text>Hi {name},</Text>
          <Text>
            Someone requested a password reset for your admin-kit account. The
            link expires in 1 hour.
          </Text>
          <Button
            href={url}
            style={{
              backgroundColor: "#171717",
              borderRadius: 6,
              color: "#ffffff",
              padding: "12px 20px",
            }}
          >
            Reset password
          </Button>
          <Text style={{ color: "#737373", fontSize: 13 }}>
            If you didn't request this, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
