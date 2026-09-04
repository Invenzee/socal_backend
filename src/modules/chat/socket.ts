import type { Server as HttpServer } from "node:http";
import { parse as parseCookie } from "cookie";
import { Server } from "socket.io";
import { env } from "../../config/env.js";
import { ACCESS_COOKIE } from "../../lib/cookies.js";
import { verifyAccessToken } from "../../lib/jwt.js";
import { User } from "../../models/user.model.js";
import { addMessage, markRead, notifyNewMessage } from "./chat.service.js";

let io: Server | null = null;
const online = new Map<string, Set<string>>();

export function getIo() {
  return io;
}

export function isOnline(userId: string) {
  return (online.get(userId)?.size ?? 0) > 0;
}

function trackJoin(userId: string, socketId: string) {
  const set = online.get(userId) ?? new Set();
  set.add(socketId);
  online.set(userId, set);
}

function trackLeave(userId: string, socketId: string) {
  const set = online.get(userId);
  if (!set) return;
  set.delete(socketId);
  if (!set.size) online.delete(userId);
}

export function attachSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      const tokenFromCookie = cookieHeader ? parseCookie(cookieHeader)[ACCESS_COOKIE] : undefined;
      const token = tokenFromCookie || (socket.handshake.auth?.token as string | undefined);
      if (!token) {
        next(new Error("unauthorized"));
        return;
      }
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub).select("role status emailVerifiedAt");
      if (!user || user.status !== "active" || !user.emailVerifiedAt) {
        next(new Error("unauthorized"));
        return;
      }
      socket.data.userId = String(user._id);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);
    trackJoin(userId, socket.id);
    io?.emit("presence", { userId, online: true });

    socket.on("conversation:join", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("typing", (payload: { conversationId: string; typing: boolean }) => {
      socket.to(`conversation:${payload.conversationId}`).emit("typing", {
        conversationId: payload.conversationId,
        userId,
        typing: payload.typing,
      });
    });

    socket.on("message:send", async (payload: { conversationId: string; body: string }, ack?: (res: unknown) => void) => {
      try {
        const result = await addMessage(userId, payload.conversationId, payload.body);
        const data = {
          message: result.message,
          conversationId: String(result.conversation._id),
        };
        io?.to(`user:${result.recipientId}`).emit("message:new", data);
        io?.to(`user:${userId}`).emit("message:new", data);
        if (!isOnline(result.recipientId)) {
          void notifyNewMessage(result.recipientId, result.conversation.lastMessagePreview);
        }
        ack?.({ ok: true, data });
      } catch (error) {
        ack?.({ ok: false, error: error instanceof Error ? error.message : "Failed" });
      }
    });

    socket.on("message:read", async (conversationId: string) => {
      try {
        await markRead(userId, conversationId);
        io?.to(`conversation:${conversationId}`).emit("message:read", { conversationId, userId });
      } catch {
        /* ignore */
      }
    });

    socket.on("disconnect", () => {
      trackLeave(userId, socket.id);
      if (!isOnline(userId)) {
        io?.emit("presence", { userId, online: false });
      }
    });
  });

  return io;
}
