import { Text } from "@react-email/components";
import { BrandLayout, paragraph } from "./brand-layout.js";

export function OfferPriceTemplate({
  name,
  vehicle,
  price,
  message,
}: {
  name: string;
  vehicle: string;
  price: string;
  message?: string;
}) {
  return (
    <BrandLayout preview={`Your offer for ${vehicle}`} heading="We have an offer for your truck">
      <Text style={paragraph}>Hi {name},</Text>
      <Text style={paragraph}>
        SoCal Truck Trade is offering <strong>{price}</strong> for your {vehicle}.
      </Text>
      {message ? <Text style={paragraph}>{message}</Text> : null}
      <Text style={paragraph}>Reply to this email or call us if you would like to move forward.</Text>
    </BrandLayout>
  );
}
