"use server";

import { getAuthContext } from "@/lib/auth/context";
import { db } from "@/lib/data/store";

export async function updateProfileName(displayName: string) {
  const { user } = await getAuthContext();
  const profile = db.profiles.find((item) => item.id === user.id);
  if (!profile) throw new Error("Profile not found");
  profile.displayName = displayName.trim();
  return profile;
}

export async function changePassword(currentPassword: string, nextPassword: string) {
  if (!currentPassword) throw new Error("Current password is required");
  if (nextPassword.length < 8) throw new Error("Password must contain at least 8 characters");
  return { ok: true };
}
