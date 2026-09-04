import { Router } from "express";
import { z } from "zod";
import { authenticate, requireVerified } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/error.js";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { param } from "../../lib/param.js";
import {
  addMessage,
  getConversation,
  listConversations,
  listMessages,
  markRead,
  notifyNewMessage,
  startConversation,
  unreadCount,
} from "./chat.service.js";
import { getIo } from "./socket.js";

export const chatRouter = Router();
chatRouter.use(authenticate, requireVerified);

const startSchema = z.object({
  listingId: z.string().regex(/^[a-fA-F0-9]{24}$/),
  message: z.string().trim().max(4000).optional(),
});

const messageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

chatRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const side = req.query.side === "buying" || req.query.side === "selling" ? req.query.side : undefined;
    const items = await listConversations(req.user!.id, side);
    res.json({ success: true, data: { items } });
  }),
);

chatRouter.get(
  "/unread",
  asyncHandler(async (req, res) => {
    const count = await unreadCount(req.user!.id);
    res.json({ success: true, data: { count } });
  }),
);

chatRouter.post(
  "/",
  validate(startSchema),
  asyncHandler(async (req, res) => {
    const item = await startConversation(req.user!.id, req.body.listingId, req.body.message);
    res.status(201).json({ success: true, data: { item } });
  }),
);

chatRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await getConversation(req.user!.id, param(req.params.id));
    res.json({ success: true, data: { item } });
  }),
);

chatRouter.get(
  "/:id/messages",
  asyncHandler(async (req, res) => {
    const data = await listMessages(req.user!.id, param(req.params.id), req.query as Record<string, unknown>);
    res.json({ success: true, data });
  }),
);

chatRouter.post(
  "/:id/messages",
  validate(messageSchema),
  asyncHandler(async (req, res) => {
    const result = await addMessage(req.user!.id, param(req.params.id), req.body.body);
    const payload = {
      message: result.message,
      conversationId: String(result.conversation._id),
    };
    getIo()?.to(`user:${result.recipientId}`).emit("message:new", payload);
    getIo()?.to(`user:${req.user!.id}`).emit("message:new", payload);
    void notifyNewMessage(result.recipientId, result.conversation.lastMessagePreview);
    res.status(201).json({ success: true, data: { item: result.message } });
  }),
);

chatRouter.post(
  "/:id/read",
  asyncHandler(async (req, res) => {
    const id = param(req.params.id);
    const item = await markRead(req.user!.id, id);
    getIo()?.to(`conversation:${id}`).emit("message:read", {
      conversationId: id,
      userId: req.user!.id,
    });
    res.json({ success: true, data: { item } });
  }),
);
