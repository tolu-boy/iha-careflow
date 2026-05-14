"use client";

import * as React from "react";
import { collection, onSnapshot } from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  defaultRoles,
  normalizeRole,
  type RolePermissionConfig,
} from "@/lib/permissions";

export function useRolePermissions() {
  const [roles, setRoles] =
    React.useState<RolePermissionConfig[]>(defaultRoles);
  const [isLoadingRoles, setIsLoadingRoles] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "roles"),
      (snapshot) => {
        const nextRoles = snapshot.docs
          .map((item) => toRoleConfig(item.id, item.data()))
          .sort(
            (first, second) =>
              defaultRoles.findIndex((role) => role.key === first.key) -
              defaultRoles.findIndex((role) => role.key === second.key),
          );

        setRoles(nextRoles.length > 0 ? nextRoles : defaultRoles);
        setIsLoadingRoles(false);
      },
      () => {
        setRoles(defaultRoles);
        setIsLoadingRoles(false);
      },
    );

    return unsubscribe;
  }, []);

  return { roles, isLoadingRoles };
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
