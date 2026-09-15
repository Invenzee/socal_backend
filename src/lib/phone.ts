import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import { ApiError } from "./apiError.js";

export function normalizePhone(raw: string, defaultCountry: CountryCode = "US") {
  const parsed = parsePhoneNumberFromString(raw, defaultCountry);
  // isPossible (length/format) not isValid — reserved NPAs like 555 still parse as real E.164.
  if (!parsed?.isPossible()) {
    throw ApiError.badRequest("Enter a valid phone number for the selected country.", "INVALID_PHONE");
  }
  return {
    e164: parsed.number,
    country: parsed.country ?? defaultCountry,
  };
}
