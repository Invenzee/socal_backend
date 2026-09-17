import { Listing } from "../models/listing.model.js";
import { OfferLead } from "../models/offer-lead.model.js";
import { User } from "../models/user.model.js";
import { isGuestId } from "./guest-id.js";

export async function claimGuestAssets(userId: string, guestId?: string) {
  if (!isGuestId(guestId)) return;

  const user = await User.findById(userId);
  if (!user) return;

  const now = new Date();
  const unclaimed = await Listing.find({
    guestId,
    $or: [{ seller: { $exists: false } }, { seller: null }],
  });

  for (const listing of unclaimed) {
    listing.seller = user._id;
    listing.claimedAt = now;
    if (!listing.contactPhone) listing.contactPhone = user.phone;
    await listing.save();
  }

  await OfferLead.updateMany(
    { guestId, $or: [{ user: { $exists: false } }, { user: null }] },
    { $set: { user: user._id, claimedAt: now } },
  );

  if (user.role !== "admin" && user.originalRole !== "admin") {
    if (!user.sellerEnabledAt) user.sellerEnabledAt = now;
    user.currentMode = "seller";
    user.role = "seller";
    await user.save();
  }
}
