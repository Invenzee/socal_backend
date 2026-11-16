import { Router } from "express";
import type { CountryCode } from "libphonenumber-js";
import { ContactReceivedTemplate } from "../../emails/contact-received.js";
import { ContactThanksTemplate } from "../../emails/contact-thanks.js";
import { sendEmail, sendStaffEmail } from "../../emails/send.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { normalizePhone } from "../../lib/phone.js";
import { ContactMessage } from "../../models/contact-message.model.js";
import { contactLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/error.js";
import { createContactSchema } from "./contact.validators.js";

export const contactRouter = Router();

contactRouter.post(
  "/",
  contactLimiter,
  validate(createContactSchema),
  asyncHandler(async (req, res) => {
    const { fullName, email, phone, phoneCountry, message } = req.body as typeof req.body;
    const { e164, country } = normalizePhone(phone, (phoneCountry as CountryCode) || "US");
    const cleanEmail = email.toLowerCase().trim();
    const cleanName = fullName.trim();

    const item = await ContactMessage.create({
      fullName: cleanName,
      email: cleanEmail,
      phone: e164,
      phoneCountry: country,
      message: message.trim(),
    });

    await sendStaffEmail(
      `New contact message from ${cleanName}`,
      ContactReceivedTemplate({
        name: cleanName,
        email: cleanEmail,
        phone: e164,
        message: message.trim(),
      }),
      cleanEmail,
    );
    await sendEmail(cleanEmail, "We received your message", ContactThanksTemplate({ name: cleanName }));

    res.status(201).json({ success: true, data: { item } });
  }),
);
