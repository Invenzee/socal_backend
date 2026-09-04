import { Text } from "@react-email/components";
import { BrandLayout, paragraph } from "./brand-layout.js";

export function NewLeadTemplate({
  name,
  listingTitle,
  buyerName,
}: {
  name: string;
  listingTitle: string;
  buyerName: string;
}) {
  return (
    <BrandLayout preview="A buyer viewed your number" heading="New phone lead">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        {buyerName} revealed the phone number on “{listingTitle}”.
      </Text>
    </BrandLayout>
  );
}
