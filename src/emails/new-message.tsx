import { Button, Text } from "@react-email/components";
import { BrandLayout, button, paragraph } from "./brand-layout.js";

export function NewMessageTemplate({
  name,
  preview,
  url,
}: {
  name: string;
  preview: string;
  url: string;
}) {
  return (
    <BrandLayout preview="You have a new message" heading="New message">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>{preview}</Text>
      <Button href={url} style={button}>
        Open chat
      </Button>
    </BrandLayout>
  );
}
