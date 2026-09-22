import { Router } from "express";
import type { CountryCode } from "libphonenumber-js";
import { env } from "../../config/env.js";
import { ContactReceivedTemplate } from "../../emails/contact-received.js";
import { ContactThanksTemplate } from "../../emails/contact-thanks.js";
import { sendEmail } from "../../emails/send.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { normalizePhone } from "../../lib/phone.js";
import { ContactMessage } from "../../models/contact-message.model.js";
import { contactLimiter } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/error.js";
import { createContactSchema } from "./contact.validators.js";

const FALLBACK_INBOX = "so.caltrucktrade@gmail.com";

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

    const inbox = env.MAIL_REPLY_TO || env.ADMIN_EMAIL || FALLBACK_INBOX;
    await sendEmail(
      inbox,
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
