export type RoleKey =
  | "super_admin"
  | "admin"
  | "doctor"
  | "billing"
  | "front_desk"
  | "clinical_assistant";

export type StoredRoleKey = RoleKey | "provider";

export type PermissionKey =
  | "dashboard"
  | "onboarding"
  | "patients"
  | "billing"
  | "notes"
  | "sign_notes"
  | "messages"
  | "scheduling"
  | "doctors"
  | "settings"
  | "audit";

export type PermissionLevel = "none" | "view" | "manage";

export type RolePermissionConfig = {
  key: RoleKey;
  label: string;
  description: string;
  permissions: Record<PermissionKey, PermissionLevel>;
};

export type CareModuleDefinition = {
  key: PermissionKey;
  label: string;
  description: string;
  protectedData?: boolean;
};

export const permissionLevels: PermissionLevel[] = ["none", "view", "manage"];

export const permissionRank: Record<PermissionLevel, number> = {
  none: 0,
  view: 1,
  manage: 2,
};

export const careModuleDefinitions: CareModuleDefinition[] = [
  {
    key: "dashboard",
    label: "Command Center",
    description: "Practice overview and operational metrics",
  },
  {
    key: "onboarding",
    label: "Patient Onboarding",
    description: "Intake forms, demographics, and care readiness",
  },
  {
    key: "patients",
    label: "Patients",
    description: "Patient profiles, contact details, and care context",
    protectedData: true,
  },
  {
    key: "billing",
    label: "Billing & Insurance",
    description: "Insurance status, invoices, balances, and reminders",
    protectedData: true,
  },
  {
    key: "notes",
    label: "Clinical Notes",
    description: "SOAP notes, progress notes, and visit documentation",
    protectedData: true,
  },
  {
    key: "sign_notes",
    label: "Sign Clinical Notes",
    description: "Ability to sign and finalize clinical documentation",
    protectedData: true,
  },
  {
    key: "messages",
    label: "Patient Messages",
    description: "Patient conversations, triage, and follow-up replies",
    protectedData: true,
  },
  {
    key: "scheduling",
    label: "Scheduling",
    description: "Appointments, reminders, and rescheduling",
  },
  {
    key: "doctors",
    label: "Doctors",
    description: "Doctor directory, credentials, and capacity",
  },
  {
    key: "settings",
    label: "Settings",
    description: "Roles, permissions, and staff access controls",
    protectedData: true,
  },
  {
    key: "audit",
    label: "Access History",
    description: "Review who accessed or changed protected information",
    protectedData: true,
  },
];

export const defaultRoles: RolePermissionConfig[] = [
  {
    key: "super_admin",
    label: "Super Admin",
    description: "Full access to every area, including roles and audit history.",
    permissions: createPermissions("manage"),
  },
  {
    key: "admin",
    label: "Admin",
    description: "Runs daily operations across intake, scheduling, care, and billing.",
    permissions: {
      ...createPermissions("manage"),
      settings: "manage",
      audit: "view",
    },
  },
  {
    key: "doctor",
    label: "Doctor",
    description: "Clinical care access for patients, notes, messages, and schedule.",
    permissions: {
      ...createPermissions("none"),
      dashboard: "view",
      patients: "view",
      billing: "view",
      notes: "manage",
      sign_notes: "manage",
      messages: "manage",
      scheduling: "view",
    },
  },
  {
    key: "billing",
    label: "Billing",
    description: "Handles insurance verification, invoices, and payment follow-up.",
    permissions: {
      ...createPermissions("none"),
      dashboard: "view",
      patients: "view",
      billing: "manage",
      scheduling: "view",
    },
  },
  {
    key: "front_desk",
    label: "Front Desk",
    description: "Manages intake, scheduling, reminders, and patient coordination.",
    permissions: {
      ...createPermissions("none"),
      dashboard: "view",
      onboarding: "manage",
      patients: "view",
      messages: "view",
      scheduling: "manage",
      doctors: "view",
    },
  },
  {
    key: "clinical_assistant",
    label: "Clinical Assistant",
    description: "Supports intake review, draft notes, messages, and appointment prep.",
    permissions: {
      ...createPermissions("none"),
      dashboard: "view",
      onboarding: "manage",
      patients: "view",
      notes: "manage",
      messages: "manage",
      scheduling: "view",
    },
  },
];

export const routePermissionMap: Array<{
  prefix: string;
  permission: PermissionKey;
  level: PermissionLevel;
}> = [
  { prefix: "/admin/dashboard", permission: "dashboard", level: "view" },
  { prefix: "/admin/onboarding", permission: "onboarding", level: "view" },
  { prefix: "/admin/patients", permission: "patients", level: "view" },
  { prefix: "/admin/billing", permission: "billing", level: "view" },
  { prefix: "/admin/clinical-notes", permission: "notes", level: "view" },
  { prefix: "/admin/messages", permission: "messages", level: "view" },
  { prefix: "/admin/scheduling", permission: "scheduling", level: "view" },
  { prefix: "/admin/doctors", permission: "doctors", level: "view" },
  { prefix: "/admin/settings", permission: "settings", level: "view" },
];

export function createPermissions(level: PermissionLevel) {
  return careModuleDefinitions.reduce(
    (permissions, module) => ({
      ...permissions,
      [module.key]: level,
    }),
    {} as Record<PermissionKey, PermissionLevel>,
  );
}

export function normalizeRole(role: string | undefined): RoleKey {
  if (role === "provider") return "doctor";

  if (
    role === "super_admin" ||
    role === "admin" ||
    role === "doctor" ||
    role === "billing" ||
    role === "front_desk" ||
    role === "clinical_assistant"
  ) {
    return role;
  }

  return "admin";
}

export function hasPermission(
  roles: RolePermissionConfig[],
  roleKey: string | undefined,
  permission: PermissionKey,
  minimumLevel: PermissionLevel = "view",
) {
  const role = getRoleConfig(roles, roleKey);
  const currentLevel = role?.permissions[permission] ?? "none";

  return permissionRank[currentLevel] >= permissionRank[minimumLevel];
}

export function canAccessPath(
  pathname: string,
  roles: RolePermissionConfig[],
  roleKey: string | undefined,
) {
  if (pathname === "/admin") return true;

  const routePermission = routePermissionMap
    .slice()
    .sort((first, second) => second.prefix.length - first.prefix.length)
    .find((item) => pathname.startsWith(item.prefix));

  if (!routePermission) return true;

  return hasPermission(
    roles,
    roleKey,
    routePermission.permission,
    routePermission.level,
  );
}

export function getRoleConfig(
  roles: RolePermissionConfig[],
  roleKey: string | undefined,
) {
  const normalizedRole = normalizeRole(roleKey);

  return (
    roles.find((role) => role.key === normalizedRole) ??
    defaultRoles.find((role) => role.key === normalizedRole) ??
    defaultRoles[1]
  );
}

export function getRoleLabel(
  roleKey: string | undefined,
  roles: RolePermissionConfig[] = defaultRoles,
) {
  return getRoleConfig(roles, roleKey)?.label ?? "Admin";
}
