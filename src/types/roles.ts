export const USER_ROLES = ["admin", "buyer", "seller"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "suspended"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const LISTING_STATUSES = ["draft", "pending", "approved", "rejected", "sold"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];
