import { Text } from "@react-email/components";
import { BrandLayout, paragraph } from "./brand-layout.js";

export function FormDetailsTemplate({
  preview,
  heading,
  intro,
  rows,
}: {
  preview: string;
  heading: string;
  intro: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <BrandLayout preview={preview} heading={heading}>
      <Text style={paragraph}>{intro}</Text>
      {rows
        .filter((row) => row.value.trim())
        .map((row) => (
          <Text key={row.label} style={paragraph}>
            {row.label}: {row.value}
          </Text>
        ))}
    </BrandLayout>
  );
}
