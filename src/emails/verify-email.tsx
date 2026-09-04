import { Text } from "@react-email/components";
import { BrandLayout, codeBox, paragraph } from "./brand-layout.js";

export function VerifyEmailTemplate({ name, code }: { name: string; code: string }) {
  return (
    <BrandLayout preview="Your SoCal Truck Trade verification code" heading="Verify your email">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        Use this 6-digit code to verify your email. It expires in 15 minutes.
      </Text>
      <Text style={codeBox}>{code}</Text>
    </BrandLayout>
  );
}
