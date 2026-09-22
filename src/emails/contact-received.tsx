import { Text } from "@react-email/components";
import { BrandLayout, paragraph } from "./brand-layout.js";

export function ContactReceivedTemplate({
  name,
  email,
  phone,
  message,
}: {
  name: string;
  email: string;
  phone: string;
  message: string;
}) {
  return (
    <BrandLayout preview={`New message from ${name}`} heading="New contact message">
      <Text style={paragraph}>{name} sent a message from the website.</Text>
      <Text style={paragraph}>
        Email: {email}
        <br />
        Phone: {phone}
      </Text>
      <Text style={paragraph}>{message}</Text>
    </BrandLayout>
  );
}
