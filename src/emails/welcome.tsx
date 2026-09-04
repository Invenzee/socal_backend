import { Text } from "@react-email/components";
import { BrandLayout, paragraph } from "./brand-layout.js";

export function WelcomeTemplate({ name, role }: { name: string; role: string }) {
  return (
    <BrandLayout preview="Welcome to SoCal Truck Trade" heading="You are in">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        Your {role} account is verified. Browse listings, save trucks you like, or list a vehicle
        when you are ready.
      </Text>
    </BrandLayout>
  );
}
