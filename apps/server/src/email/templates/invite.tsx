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

export function InviteEmail({ name, url }: { name: string; url: string }) {
  return (
    <Html>
      <Head />
      <Preview>You're invited to admin-kit</Preview>
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
          <Heading as="h2">You're invited</Heading>
          <Text>Hi {name},</Text>
          <Text>
            An account has been created for you on admin-kit. Set your password
            to get started. The link expires in 1 hour.
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
            Set your password
          </Button>
          <Text style={{ color: "#737373", fontSize: 13 }}>
            If you weren't expecting this, contact your administrator.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
