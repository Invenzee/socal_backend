import { Button, Text } from "@react-email/components";
import { BrandLayout, button, paragraph } from "./brand-layout.js";

export function ListingApprovedTemplate({
  name,
  title,
  url,
}: {
  name: string;
  title: string;
  url: string;
}) {
  return (
    <BrandLayout preview="Your listing is live" heading="Listing approved">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>“{title}” is now live on SoCal Truck Trade.</Text>
      <Button href={url} style={button}>
        View listing
      </Button>
    </BrandLayout>
  );
}
