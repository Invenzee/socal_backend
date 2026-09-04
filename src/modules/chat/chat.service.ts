import { env } from "../../config/env.js";
import { NewMessageTemplate } from "../../emails/new-message.js";
import { sendEmail } from "../../emails/send.js";
import { ApiError } from "../../lib/apiError.js";
import { paginationMeta, parsePagination } from "../../lib/paginate.js";
import { Conversation } from "../../models/conversation.model.js";
import { Lead } from "../../models/lead.model.js";
import { Listing } from "../../models/listing.model.js";
import { Message } from "../../models/message.model.js";
import { User } from "../../models/user.model.js";

const POPULATE = [
  { path: "listing", select: "title images status price" },
  { path: "buyer", select: "fullName email" },
  { path: "seller", select: "fullName email" },
];

export function conversationUnreadFor(conv: { buyer: unknown; seller: unknown; buyerUnread: number; sellerUnread: number }, userId: string) {
  return String(conv.buyer) === userId || (typeof conv.buyer === "object" && conv.buyer && String((conv.buyer as { _id: unknown })._id) === userId)
    ? conv.buyerUnread
    : conv.sellerUnread;
}

function isBuyer(conv: { buyer: unknown }, userId: string) {
  const id = typeof conv.buyer === "object" && conv.buyer ? String((conv.buyer as { _id: unknown })._id) : String(conv.buyer);
  return id === userId;
}

export async function listConversations(userId: string, side?: "buying" | "selling") {
  const filter =
    side === "buying"
      ? { buyer: userId }
      : side === "selling"
        ? { seller: userId }
        : { $or: [{ buyer: userId }, { seller: userId }] };

  const items = await Conversation.find(filter)
    .sort({ lastMessageAt: -1 })
    .populate(POPULATE);

  return items.map((item) => {
    const json = item.toJSON() as Record<string, unknown>;
    json.unread = isBuyer(item, userId) ? item.buyerUnread : item.sellerUnread;
    return json;
  });
}

export async function unreadCount(userId: string) {
  const items = await Conversation.find({
    $or: [{ buyer: userId }, { seller: userId }],
  }).select("buyer seller buyerUnread sellerUnread");
  return items.reduce((sum, item) => sum + (isBuyer(item, userId) ? item.buyerUnread : item.sellerUnread), 0);
}

export async function getConversation(userId: string, id: string) {
  const conv = await Conversation.findById(id).populate(POPULATE);
  if (!conv) throw ApiError.notFound("Conversation not found.");
  if (String(conv.buyer) !== userId && String(conv.seller) !== userId) {
    const buyerId = String((conv.buyer as { _id?: unknown })._id ?? conv.buyer);
    const sellerId = String((conv.seller as { _id?: unknown })._id ?? conv.seller);
    if (buyerId !== userId && sellerId !== userId) throw ApiError.forbidden();
  }
  return conv;
}

export async function startConversation(userId: string, listingId: string, firstMessage?: string) {
  const listing = await Listing.findById(listingId);
  if (!listing || listing.status !== "approved") throw ApiError.notFound("Listing not found.");
  if (String(listing.seller) === userId) {
    throw ApiError.badRequest("You cannot chat on your own listing.");
  }

  let conv = await Conversation.findOne({ listing: listingId, buyer: userId });
  if (!conv) {
    conv = await Conversation.create({
      listing: listingId,
      buyer: userId,
      seller: listing.seller,
    });
    await Lead.create({
      listing: listing._id,
      buyer: userId,
      seller: listing.seller,
      type: "chat",
    });
  }

  if (firstMessage?.trim()) {
    await addMessage(userId, String(conv._id), firstMessage.trim());
  }

  return getConversation(userId, String(conv._id));
}

export async function listMessages(userId: string, conversationId: string, query: Record<string, unknown>) {
  await getConversation(userId, conversationId);
  const { page, limit, skip } = parsePagination({ ...query, limit: query.limit ?? 50 });
  const [items, total] = await Promise.all([
    Message.find({ conversation: conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "fullName"),
    Message.countDocuments({ conversation: conversationId }),
  ]);
  return { items: items.reverse(), meta: paginationMeta(total, page, limit) };
}

export async function addMessage(userId: string, conversationId: string, body: string) {
  const conv = await Conversation.findById(conversationId);
  if (!conv) throw ApiError.notFound("Conversation not found.");
  const buyerId = String(conv.buyer);
  const sellerId = String(conv.seller);
  if (buyerId !== userId && sellerId !== userId) throw ApiError.forbidden();

  const message = await Message.create({
    conversation: conv._id,
    sender: userId,
    body: body.trim(),
  });

  conv.lastMessageAt = new Date();
  conv.lastMessagePreview = body.trim().slice(0, 140);
  if (buyerId === userId) conv.sellerUnread += 1;
  else conv.buyerUnread += 1;
  await conv.save();

  const recipientId = buyerId === userId ? sellerId : buyerId;
  return { message, conversation: conv, recipientId };
}

export async function markRead(userId: string, conversationId: string) {
  const conv = await Conversation.findById(conversationId);
  if (!conv) throw ApiError.notFound("Conversation not found.");
  const buyerId = String(conv.buyer);
  const sellerId = String(conv.seller);
  if (buyerId !== userId && sellerId !== userId) throw ApiError.forbidden();

  if (buyerId === userId) conv.buyerUnread = 0;
  else conv.sellerUnread = 0;
  await conv.save();

  await Message.updateMany(
    { conversation: conv._id, sender: { $ne: userId }, readAt: null },
    { readAt: new Date() },
  );

  return conv;
}

export async function notifyNewMessage(recipientId: string, preview: string) {
  const user = await User.findById(recipientId);
  if (!user) return;
  await sendEmail(
    user.email,
    "New message on SoCal Truck Trade",
    NewMessageTemplate({
      name: user.fullName,
      preview,
      url: `${env.APP_URL}/dashboard/messages`,
    }),
  );
}
