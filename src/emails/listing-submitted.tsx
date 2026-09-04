import { Text } from "@react-email/components";
import { BrandLayout, paragraph } from "./brand-layout.js";

export function ListingSubmittedTemplate({ name, title }: { name: string; title: string }) {
  return (
    <BrandLayout preview="Your listing is in review" heading="Listing submitted">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        “{title}” is now in the admin review queue. We will email you when it is approved or if we
        need changes.
      </Text>
    </BrandLayout>
  );
}
