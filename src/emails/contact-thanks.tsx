import { Text } from "@react-email/components";
import { BrandLayout, paragraph } from "./brand-layout.js";

export function ContactThanksTemplate({ name }: { name: string }) {
  return (
    <BrandLayout preview="We received your message" heading="We got your message">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        Thanks for contacting SoCal Truck Trade. We received your message and will get back to you
        shortly.
      </Text>
    </BrandLayout>
  );
}
