import type { UserRole } from "../types/roles.js";

export type ModeUser = {
  role: UserRole;
  originalRole?: UserRole | null;
  currentMode?: "buyer" | "seller" | null;
  sellerEnabledAt?: Date | null;
};

export function isStaff(user: ModeUser) {
  return user.role === "admin" || user.originalRole === "admin";
}

export function originalRoleOf(user: ModeUser): UserRole {
  return user.originalRole || user.role;
}

export function currentModeOf(user: ModeUser): "buyer" | "seller" {
  if (user.currentMode === "buyer" || user.currentMode === "seller") return user.currentMode;
  return user.role === "seller" ? "seller" : "buyer";
}

export function sessionRoleOf(user: ModeUser): UserRole {
  if (isStaff(user)) return "admin";
  return currentModeOf(user);
}

export function canSellOf(user: ModeUser) {
  if (isStaff(user)) return true;
  return originalRoleOf(user) === "seller" || Boolean(user.sellerEnabledAt);
}

export function canBuyOf(user: ModeUser) {
  return !isStaff(user);
}
