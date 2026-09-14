export const OFFER_STATUSES = ["new", "contacted", "offered", "won", "lost"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];
