import { asyncHandler } from "../../lib/asyncHandler.js";
import { param } from "../../lib/param.js";
import {
  createListing,
  deleteListing,
  getPublicListing,
  listMine,
  listPublic,
  listSellerLeads,
  revealPhone,
  updateListing,
} from "./listings.service.js";

export const publicIndex = asyncHandler(async (req, res) => {
  const data = await listPublic(req.query as Record<string, unknown>);
  res.json({ success: true, data });
});

export const publicShow = asyncHandler(async (req, res) => {
  const item = await getPublicListing(param(req.params.id), req.user);
  res.json({ success: true, data: { item } });
});

export const sellerLeads = asyncHandler(async (req, res) => {
  const data = await listSellerLeads(req.user!.id, req.query as Record<string, unknown>);
  res.json({ success: true, data });
});

export const mine = asyncHandler(async (req, res) => {
  const data = await listMine(req.user!.id, req.query as Record<string, unknown>);
  res.json({ success: true, data });
});

export const create = asyncHandler(async (req, res) => {
  const item = await createListing(req.user!.id, req.body);
  res.status(201).json({ success: true, data: { item } });
});

export const update = asyncHandler(async (req, res) => {
  const item = await updateListing(req.user!.id, param(req.params.id), req.body, req.user!.role === "admin");
  res.json({ success: true, data: { item } });
});

export const remove = asyncHandler(async (req, res) => {
  await deleteListing(req.user!.id, param(req.params.id), req.user!.role === "admin");
  res.json({ success: true, data: { ok: true } });
});

export const reveal = asyncHandler(async (req, res) => {
  const data = await revealPhone(req.user!.id, param(req.params.id));
  res.json({ success: true, data });
});
