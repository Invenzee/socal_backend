import { Text } from "@react-email/components";
import { BrandLayout, codeBox, paragraph } from "./brand-layout.js";

export function PasswordResetTemplate({ name, code }: { name: string; code: string }) {
  return (
    <BrandLayout preview="Reset your SoCal Truck Trade password" heading="Reset your password">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>Use this code to choose a new password. It expires in 30 minutes.</Text>
      <Text style={codeBox}>{code}</Text>
    </BrandLayout>
  );
}
