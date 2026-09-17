import { Button, Text } from "@react-email/components";
import { BrandLayout, button, paragraph } from "./brand-layout.js";

export function GuestListingReceivedTemplate({
  name,
  title,
  signupUrl,
}: {
  name: string;
  title: string;
  signupUrl: string;
}) {
  return (
    <BrandLayout preview="We received your listing" heading="We got your listing">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        We received “{title}” and it is now in review. To see the status of your listing, please sign
        up.
      </Text>
      <Button href={signupUrl} style={button}>
        Sign up to see listing tracking
      </Button>
    </BrandLayout>
  );
}
