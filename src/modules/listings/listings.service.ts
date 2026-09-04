import { ListingSubmittedTemplate } from "../../emails/listing-submitted.js";
import { NewLeadTemplate } from "../../emails/new-lead.js";
import { sendEmail } from "../../emails/send.js";
import { ApiError } from "../../lib/apiError.js";
import { paginationMeta, parsePagination } from "../../lib/paginate.js";
import { Lead } from "../../models/lead.model.js";
import { Listing } from "../../models/listing.model.js";
import { TruckModel } from "../../models/truck-model.model.js";
import { User } from "../../models/user.model.js";
import type { ListingStatus } from "../../types/roles.js";

const POPULATE = [
  { path: "make", select: "name slug" },
  { path: "model", select: "name slug make" },
  { path: "category", select: "name slug" },
  { path: "condition", select: "name slug" },
  { path: "fuel", select: "name slug" },
  { path: "transmission", select: "name slug" },
  { path: "features", select: "name slug" },
  { path: "seller", select: "fullName role" },
];

function ids(value?: string) {
  return value ? value.split(",").filter((id) => /^[a-fA-F0-9]{24}$/.test(id)) : [];
}

function maskListing(doc: Record<string, unknown>, revealPhone: boolean) {
  const listing = { ...doc };
  if (!revealPhone) listing.contactPhone = null;
  return listing;
}

export async function listPublic(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = { status: "approved" };

  const make = ids(query.make as string);
  const model = ids(query.model as string);
  const category = ids(query.category as string);
  const condition = ids(query.condition as string);
  const fuel = ids(query.fuel as string);
  const transmission = ids(query.transmission as string);

  if (make.length) filter.make = { $in: make };
  if (model.length) filter.model = { $in: model };
  if (category.length) filter.category = { $in: category };
  if (condition.length) filter.condition = { $in: condition };
  if (fuel.length) filter.fuel = { $in: fuel };
  if (transmission.length) filter.transmission = { $in: transmission };
  if (query.color) filter.exteriorColor = new RegExp(String(query.color), "i");
  if (query.priceMin || query.priceMax) {
    filter.price = {
      ...(query.priceMin ? { $gte: Number(query.priceMin) } : {}),
      ...(query.priceMax ? { $lte: Number(query.priceMax) } : {}),
    };
  }
  if (query.yearMin || query.yearMax) {
    filter.year = {
      ...(query.yearMin ? { $gte: Number(query.yearMin) } : {}),
      ...(query.yearMax ? { $lte: Number(query.yearMax) } : {}),
    };
  }
  if (query.mileageMin || query.mileageMax) {
    filter.mileage = {
      ...(query.mileageMin ? { $gte: Number(query.mileageMin) } : {}),
      ...(query.mileageMax ? { $lte: Number(query.mileageMax) } : {}),
    };
  }
  if (query.q) filter.$text = { $search: String(query.q) };

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    year_desc: { year: -1 },
    newest: { createdAt: -1 },
  };
  const sort = sortMap[String(query.sort || "newest")] ?? { createdAt: -1 };

  const [items, total] = await Promise.all([
    Listing.find(filter).sort(sort).skip(skip).limit(limit).populate(POPULATE),
    Listing.countDocuments(filter),
  ]);

  return {
    items: items.map((item) => maskListing(item.toJSON() as Record<string, unknown>, false)),
    meta: paginationMeta(total, page, limit),
  };
}

function sellerIdOf(listing: { seller: unknown }) {
  const seller = listing.seller as { _id?: unknown } | string;
  if (seller && typeof seller === "object") return String(seller._id);
  return String(seller);
}

export async function getPublicListing(id: string, user?: { id: string; role: string }) {
  const listing = await Listing.findById(id).populate(POPULATE);
  if (!listing) throw ApiError.notFound("Listing not found.");

  const owner = Boolean(user && (user.role === "admin" || sellerIdOf(listing) === user.id));
  if (listing.status !== "approved" && !owner) {
    throw ApiError.notFound("Listing not found.");
  }

  if (listing.status === "approved" && !owner) {
    listing.views += 1;
    await listing.save();
  }

  return maskListing(listing.toJSON() as Record<string, unknown>, owner);
}

export async function listSellerLeads(userId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = { seller: userId };
  if (query.type === "phone" || query.type === "chat") filter.type = query.type;
  const [items, total] = await Promise.all([
    Lead.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("listing", "title images status price")
      .populate("buyer", "fullName email phone"),
    Lead.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function listMine(userId: string, query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = { seller: userId };
  if (query.status) filter.status = query.status;
  if (query.q) filter.title = new RegExp(String(query.q).trim(), "i");
  const [items, total] = await Promise.all([
    Listing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(POPULATE),
    Listing.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function createListing(userId: string, body: Record<string, unknown>) {
  const seller = await User.findById(userId);
  if (!seller) throw ApiError.notFound("Seller not found.");

  const truckModel = await TruckModel.findById(body.model);
  if (!truckModel || String(truckModel.make) !== String(body.make)) {
    throw ApiError.badRequest("Model does not belong to the selected make.");
  }

  const listing = await Listing.create({
    ...body,
    seller: userId,
    contactPhone: seller.phone,
    status: "pending",
    rejectionReason: "",
  });

  await sendEmail(
    seller.email,
    "Listing submitted for review",
    ListingSubmittedTemplate({ name: seller.fullName, title: listing.title }),
  );

  return Listing.findById(listing._id).populate(POPULATE);
}

export async function updateListing(userId: string, id: string, body: Record<string, unknown>, isAdmin = false) {
  const listing = await Listing.findById(id);
  if (!listing) throw ApiError.notFound("Listing not found.");
  if (!isAdmin && String(listing.seller) !== userId) throw ApiError.forbidden();

  Object.assign(listing, body);
  if (!isAdmin && listing.status === "approved") {
    listing.status = "pending";
    listing.rejectionReason = "";
  }
  await listing.save();

  const seller = await User.findById(listing.seller);
  if (seller && listing.status === "pending" && !isAdmin) {
    await sendEmail(
      seller.email,
      "Listing submitted for review",
      ListingSubmittedTemplate({ name: seller.fullName, title: listing.title }),
    );
  }

  return Listing.findById(listing._id).populate(POPULATE);
}

export async function deleteListing(userId: string, id: string, isAdmin = false) {
  const listing = await Listing.findById(id);
  if (!listing) throw ApiError.notFound("Listing not found.");
  if (!isAdmin && String(listing.seller) !== userId) throw ApiError.forbidden();
  await listing.deleteOne();
}

export async function revealPhone(userId: string, listingId: string) {
  const listing = await Listing.findById(listingId).populate("seller", "fullName email");
  if (!listing || listing.status !== "approved") throw ApiError.notFound("Listing not found.");
  if (String(listing.seller) === userId) {
    return { phone: listing.contactPhone };
  }

  const buyer = await User.findById(userId);
  if (!buyer) throw ApiError.unauthorized();

  await Lead.create({
    listing: listing._id,
    buyer: userId,
    seller: listing.seller,
    type: "phone",
  });

  const seller = listing.seller as unknown as { email: string; fullName: string };
  await sendEmail(
    seller.email,
    "New phone lead",
    NewLeadTemplate({ name: seller.fullName, listingTitle: listing.title, buyerName: buyer.fullName }),
  );

  return { phone: listing.contactPhone };
}

export async function listAdmin(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status as ListingStatus;
  if (query.q) filter.title = new RegExp(String(query.q).trim(), "i");
  const [items, total] = await Promise.all([
    Listing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate(POPULATE),
    Listing.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, page, limit) };
}

export async function setListingStatus(
  id: string,
  status: Extract<ListingStatus, "approved" | "rejected" | "sold">,
  reason?: string,
) {
  const listing = await Listing.findById(id).populate("seller", "fullName email");
  if (!listing) throw ApiError.notFound("Listing not found.");
  listing.status = status;
  listing.rejectionReason = status === "rejected" ? reason || "Does not meet listing guidelines." : "";
  await listing.save();
  return listing;
}
