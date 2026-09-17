import { Button, Text } from "@react-email/components";
import { BrandLayout, button, paragraph } from "./brand-layout.js";

export function GuestListingClaimReminderTemplate({
  name,
  title,
  signupUrl,
}: {
  name: string;
  title: string;
  signupUrl: string;
}) {
  return (
    <BrandLayout preview="Sign up to track your listing" heading="See your listing tracking">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        “{title}” is still in our review queue. Create an account to follow its status and manage it
        from your dashboard.
      </Text>
      <Button href={signupUrl} style={button}>
        Sign up to see listing tracking
      </Button>
    </BrandLayout>
  );
}
