import type { ItemOwner, Scanner } from "@reparte/types";

export const USER_NAMES: Record<Scanner, string> = {
  user1: "Kauã",
  user2: "Ruan",
};

export const SHARED_LABEL = "Compartilhado";
export const UNASSIGNED_LABEL = "A definir";

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? "http://localhost:3002";

export function ownerLabel(owner: ItemOwner): string {
  if (owner === "shared") return SHARED_LABEL;
  if (owner === "unassigned") return UNASSIGNED_LABEL;
  return USER_NAMES[owner];
}
