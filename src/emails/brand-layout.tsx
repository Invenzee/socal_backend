import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

type BrandLayoutProps = {
  preview: string;
  heading: string;
  children: ReactNode;
};

export function BrandLayout({ preview, heading, children }: BrandLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SoCal Truck Trade</Text>
          </Section>
          <Section style={card}>
            <Text style={h1}>{heading}</Text>
            {children}
          </Section>
          <Text style={footer}>SoCal Truck Trade · Southern California commercial vehicles</Text>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#f4f6f9",
  fontFamily: "Poppins, Arial, sans-serif",
  margin: 0,
  padding: "24px 0",
};

const container = { maxWidth: "560px", margin: "0 auto" };

const header = {
  backgroundColor: "#014BAD",
  borderRadius: "12px 12px 0 0",
  padding: "20px 28px",
};

const logo = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: 700,
  margin: 0,
};

const card = {
  backgroundColor: "#ffffff",
  padding: "28px",
  borderRadius: "0 0 12px 12px",
};

const h1 = {
  color: "#000000",
  fontSize: "22px",
  fontWeight: 600,
  margin: "0 0 16px",
};

const footer = {
  color: "#6b7280",
  fontSize: "12px",
  textAlign: "center" as const,
  marginTop: "16px",
};

export const paragraph = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

export const codeBox = {
  backgroundColor: "#f3f4f6",
  borderRadius: "10px",
  color: "#014BAD",
  fontSize: "28px",
  fontWeight: 700,
  letterSpacing: "8px",
  padding: "16px",
  textAlign: "center" as const,
};

export const button = {
  backgroundColor: "#FF3232",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 22px",
  textDecoration: "none",
};

export { Hr };
