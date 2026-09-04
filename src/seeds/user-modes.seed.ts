import { User } from "../models/user.model.js";

export async function backfillUserModes() {
  const users = await User.find({
    $or: [{ originalRole: { $exists: false } }, { originalRole: null }, { currentMode: { $exists: false } }],
  });

  for (const user of users) {
    const original = user.role === "admin" ? "admin" : user.role;
    user.originalRole = user.originalRole || original;
    if (user.role === "admin") {
      user.currentMode = user.currentMode || "buyer";
    } else {
      user.currentMode = user.currentMode || (user.role === "seller" ? "seller" : "buyer");
      if (user.role === "seller" && !user.sellerEnabledAt) {
        user.sellerEnabledAt = user.createdAt || new Date();
      }
    }
    await user.save();
  }

  if (users.length) {
    console.log(`User modes backfilled (${users.length}).`);
  }
}
