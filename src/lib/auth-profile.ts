import type { User } from "firebase/auth";
import type { DocumentData } from "firebase/firestore";

import type { AuthUser } from "@/stores/auth-store";

export function buildAuthUser(
  firebaseUser: User,
  profile?: DocumentData,
): AuthUser {
  const email = firebaseUser.email ?? getString(profile?.email);
  const fullName =
    getString(profile?.fullName) ||
    getString(profile?.displayName) ||
    firebaseUser.displayName ||
    email.split("@")[0] ||
    "IHA Care Team";

  return {
    uid: firebaseUser.uid,
    userId:
      getString(profile?.userId) || getString(profile?.uid) || firebaseUser.uid,
    email,
    fullName,
    displayName: getString(profile?.displayName) || fullName,
    photoURL: firebaseUser.photoURL ?? getString(profile?.photoURL),
    role: getString(profile?.role) || "admin",
    active: typeof profile?.active === "boolean" ? profile.active : true,
  };
}

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}
