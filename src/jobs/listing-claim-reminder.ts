import { env } from "../config/env.js";
import { sendEmail } from "../emails/send.js";
import { GuestListingClaimReminderTemplate } from "../emails/guest-listing-claim-reminder.js";
import { Listing } from "../models/listing.model.js";

const CLAIM_REMINDER_MS = 24 * 60 * 60 * 1000;
const BATCH = 40;

export async function sendListingClaimReminders() {
  const cutoff = new Date(Date.now() - CLAIM_REMINDER_MS);
  const listings = await Listing.find({
    guestEmail: { $nin: [null, ""] },
    claimReminderSentAt: null,
    createdAt: { $lte: cutoff },
    $or: [{ seller: { $exists: false } }, { seller: null }],
  }).limit(BATCH);

  const signupUrl = env.APP_URL;
  for (const listing of listings) {
    await sendEmail(
      listing.guestEmail,
      "Sign up to see your listing tracking",
      GuestListingClaimReminderTemplate({
        name: listing.guestName || "there",
        title: listing.title,
        signupUrl,
      }),
    );
    listing.claimReminderSentAt = new Date();
    await listing.save();
  }
}

export function startListingClaimReminderJob() {
  const run = () => {
    void sendListingClaimReminders().catch((error) => {
      console.error("[claim-reminder]", error);
    });
  };
  run();
  setInterval(run, 15 * 60 * 1000);
}
