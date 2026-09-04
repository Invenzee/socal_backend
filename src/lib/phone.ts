import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { ApiError } from "./apiError.js";

export function normalizePhone(raw: string, defaultCountry: CountryCode = "US") {
  const parsed = parsePhoneNumberFromString(raw, defaultCountry);
  if (!parsed?.isValid()) {
    throw ApiError.badRequest("Enter a valid phone number for the selected country.", "INVALID_PHONE");
  }
  return {
    e164: parsed.number,
    country: parsed.country ?? defaultCountry,
  };
}
