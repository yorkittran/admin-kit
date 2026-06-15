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
import type { ReactNode } from "react";

export function EmailLayout({
  preview,
  heading,
  children,
  buttonUrl,
  buttonLabel,
  footer,
}: {
  preview: string;
  heading: string;
  children: ReactNode;
  buttonUrl: string;
  buttonLabel: string;
  footer: string;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
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
          <Heading as="h2">{heading}</Heading>
          {children}
          <Button
            href={buttonUrl}
            style={{
              backgroundColor: "#171717",
              borderRadius: 6,
              color: "#ffffff",
              padding: "12px 20px",
            }}
          >
            {buttonLabel}
          </Button>
          <Text style={{ color: "#737373", fontSize: 13 }}>{footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
