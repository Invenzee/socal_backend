import { Text } from "@react-email/components";
import { BrandLayout, paragraph } from "./brand-layout.js";

export function ListingRejectedTemplate({
  name,
  title,
  reason,
}: {
  name: string;
  title: string;
  reason: string;
}) {
  return (
    <BrandLayout preview="Your listing needs changes" heading="Listing not approved">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>“{title}” was not approved.</Text>
      <Text style={paragraph}>Reason: {reason || "Please review and resubmit."}</Text>
    </BrandLayout>
  );
}
