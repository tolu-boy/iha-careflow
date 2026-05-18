"use client";

import * as React from "react";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  defaultRoles,
  normalizeRole,
  type RolePermissionConfig,
} from "@/lib/permissions";

let cachedRoles: RolePermissionConfig[] = defaultRoles;
let cachedLoaded = true;
let unsubscribeRoles: (() => void) | undefined;
const listeners = new Set<
  React.Dispatch<
    React.SetStateAction<{
      roles: RolePermissionConfig[];
      isLoadingRoles: boolean;
    }>
  >
>();

export function useRolePermissions() {
  const [state, setState] = React.useState({
    roles: cachedRoles,
    isLoadingRoles: !cachedLoaded,
  });

  React.useEffect(() => {
    listeners.add(setState);

    if (!unsubscribeRoles) {
      unsubscribeRoles = onSnapshot(
        collection(db, "roles"),
        (snapshot) => {
          const nextRoles = snapshot.docs
            .map((item) => toRoleConfig(item.id, item.data()))
            .sort(
              (first, second) =>
                defaultRoles.findIndex((role) => role.key === first.key) -
                defaultRoles.findIndex((role) => role.key === second.key),
            );

          cachedRoles = nextRoles.length > 0 ? nextRoles : defaultRoles;
          cachedLoaded = true;
          notifyListeners();
        },
        () => {
          cachedRoles = defaultRoles;
          cachedLoaded = true;
          notifyListeners();
        },
      );
    }

    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}

function notifyListeners() {
  for (const listener of listeners) {
    listener({
      roles: cachedRoles,
      isLoadingRoles: !cachedLoaded,
    });
  }
}

function toRoleConfig(
  fallbackKey: string,
  data: Record<string, unknown>,
): RolePermissionConfig {
  const key = normalizeRole(getString(data.key, fallbackKey));
  const fallbackRole =
    defaultRoles.find((role) => role.key === key) ?? defaultRoles[1];

  return {
    key,
    label: getString(data.label, fallbackRole.label),
    description: getString(data.description, fallbackRole.description),
    permissions: {
      ...fallbackRole.permissions,
      ...(isPermissionMap(data.permissions) ? data.permissions : {}),
    },
  };
}

function isPermissionMap(
  value: unknown,
): value is RolePermissionConfig["permissions"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  return Object.values(value).every(
    (level) => level === "none" || level === "view" || level === "manage",
  );
}

function getString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}
