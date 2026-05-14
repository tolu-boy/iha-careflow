"use client";

import * as React from "react";
import {
  IconCalendar,
  IconClipboardCheck,
  IconClipboardText,
  IconDashboard,
  IconFileText,
  IconInvoice,
  IconLockAccess,
  IconMessageCircle,
  IconSearch,
  IconSettings,
  IconShieldCheck,
  IconStethoscope,
  IconUserCog,
  IconUsersGroup,
} from "@tabler/icons-react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { auth, db } from "@/lib/firebase";
import {
  careModuleDefinitions,
  defaultRoles,
  getRoleLabel,
  hasPermission,
  normalizeRole,
  type PermissionKey,
  type PermissionLevel,
  type RoleKey,
  type RolePermissionConfig,
} from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";

type StaffUser = {
  id: string;
  name: string;
  email: string;
  role: RoleKey;
  status: "Active" | "Invited" | "Suspended";
  lastActive: string;
};

const moduleIconMap: Record<
  PermissionKey,
  typeof IconDashboard
> = {
  dashboard: IconDashboard,
  onboarding: IconClipboardCheck,
  patients: IconUsersGroup,
  billing: IconInvoice,
  notes: IconClipboardText,
  sign_notes: IconFileText,
  messages: IconMessageCircle,
  scheduling: IconCalendar,
  doctors: IconStethoscope,
  settings: IconSettings,
  audit: IconLockAccess,
};

const roleIconMap: Record<RoleKey, typeof IconShieldCheck> = {
  super_admin: IconShieldCheck,
  admin: IconUserCog,
  doctor: IconStethoscope,
  billing: IconInvoice,
  front_desk: IconUsersGroup,
  clinical_assistant: IconClipboardCheck,
};

const roleToneMap: Record<RoleKey, string> = {
  super_admin: "border-emerald-200 bg-emerald-50 text-emerald-700",
  admin: "border-blue-200 bg-blue-50 text-blue-700",
  doctor: "border-teal-200 bg-teal-50 text-teal-700",
  billing: "border-amber-200 bg-amber-50 text-amber-700",
  front_desk: "border-sky-200 bg-sky-50 text-sky-700",
  clinical_assistant: "border-purple-200 bg-purple-50 text-purple-700",
};

const levelLabels: Record<PermissionLevel, string> = {
  none: "No Access",
  view: "View",
  manage: "Manage",
};

const levelStyles: Record<PermissionLevel, string> = {
  none: "border-slate-200 bg-slate-50 text-slate-600",
  view: "border-blue-200 bg-blue-50 text-blue-700",
  manage: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const statusStyles: Record<StaffUser["status"], string> = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Invited: "border-amber-200 bg-amber-50 text-amber-700",
  Suspended: "border-red-200 bg-red-50 text-red-700",
};

let cachedStaff: StaffUser[] = [];
let cachedStaffLoaded = false;

export default function CareSettingsPage() {
  const authUser = useAuthStore((state) => state.user);
  const { roles: savedRoles } = useRolePermissions();
  const [roles, setRoles] =
    React.useState<RolePermissionConfig[]>(savedRoles);
  const [staff, setStaff] = React.useState<StaffUser[]>(cachedStaff);
  const [activeRoleKey, setActiveRoleKey] =
    React.useState<RoleKey>("super_admin");
  const [staffSearch, setStaffSearch] = React.useState("");
  const [isLoadingStaff, setIsLoadingStaff] =
    React.useState(!cachedStaffLoaded);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasLocalRoleChanges, setHasLocalRoleChanges] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const users = snapshot.docs
          .map((item) => toStaffUser(item.id, item.data()))
          .sort((first, second) => first.name.localeCompare(second.name));

        cachedStaff = users;
        cachedStaffLoaded = true;
        setStaff(users);
        setIsLoadingStaff(false);
      },
      (error) => {
        let fallbackStaff = cachedStaff;

        if (authUser) {
          fallbackStaff = [
            {
              id: authUser.uid,
              name: authUser.fullName || authUser.displayName,
              email: authUser.email,
              role: normalizeRole(authUser.role),
              status: authUser.active ? "Active" : "Suspended",
              lastActive: "Current session",
            },
          ];
        }

        cachedStaff = fallbackStaff;
        cachedStaffLoaded = true;
        setStaff(fallbackStaff);
        setIsLoadingStaff(false);
        toast.error("Unable to load staff users", {
          description: error.message,
        });
      },
    );

    return unsubscribe;
  }, [authUser]);

  const visibleRoles = hasLocalRoleChanges ? roles : savedRoles;
  const activeRole =
    visibleRoles.find((role) => role.key === activeRoleKey) ??
    visibleRoles.find((role) => role.key === "admin") ??
    visibleRoles[0];
  const canManageSettings = hasPermission(
    visibleRoles,
    authUser?.role,
    "settings",
    "manage",
  );
  const assignedStaff = staff.filter((user) => user.role === activeRole.key);
  const protectedManageCount = careModuleDefinitions.filter(
    (module) =>
      module.protectedData && activeRole.permissions[module.key] === "manage",
  ).length;
  const filteredStaff = staff.filter((user) => {
    const query = staffSearch.trim().toLowerCase();

    if (!query) return true;

    return `${user.name} ${user.email} ${getRoleLabel(user.role, visibleRoles)}`
      .toLowerCase()
      .includes(query);
  });

  function updatePermission(
    roleKey: RoleKey,
    permissionKey: PermissionKey,
    level: PermissionLevel,
  ) {
    if (!canManageSettings) {
      toast.error("You can view roles, but cannot change permissions.");
      return;
    }

    setRoles((current) => {
      const sourceRoles = hasLocalRoleChanges ? current : visibleRoles;

      return sourceRoles.map((role) =>
        role.key === roleKey
          ? {
              ...role,
              permissions: {
                ...role.permissions,
                [permissionKey]: level,
              },
            }
          : role,
      );
    });
    setHasLocalRoleChanges(true);
  }

  async function updateStaffRole(userId: string, role: RoleKey) {
    if (!canManageSettings) {
      toast.error("You can view staff access, but cannot change roles.");
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", userId), {
        role,
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid ?? null,
      });
      toast.success("Staff role updated");
    } catch (error) {
      toast.error("Staff role was not updated", {
        description:
          error instanceof Error ? error.message : "Please check Firestore rules.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleStaffStatus(userId: string, enabled: boolean) {
    if (!canManageSettings) {
      toast.error("You can view staff access, but cannot suspend users.");
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", userId), {
        active: enabled,
        status: enabled ? "Active" : "Suspended",
        updatedAt: serverTimestamp(),
        updatedBy: auth.currentUser?.uid ?? null,
      });
      toast.success(enabled ? "Staff access enabled" : "Staff access suspended");
    } catch (error) {
      toast.error("Staff access was not updated", {
        description:
          error instanceof Error ? error.message : "Please check Firestore rules.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function saveRoles() {
    if (!canManageSettings) {
      toast.error("You do not have permission to save role changes.");
      return;
    }

    setIsSaving(true);
    try {
      const batch = writeBatch(db);

      for (const role of visibleRoles) {
        batch.set(
          doc(db, "roles", role.key),
          {
            key: role.key,
            label: role.label,
            description: role.description,
            permissions: role.permissions,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser?.uid ?? null,
          },
          { merge: true },
        );
      }

      await batch.commit();
      setHasLocalRoleChanges(false);
      toast.success("Roles and permissions saved");
    } catch (error) {
      toast.error("Roles were not saved", {
        description:
          error instanceof Error ? error.message : "Please check Firestore rules.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function resetLocalChanges() {
    if (!canManageSettings) {
      toast.error("You do not have permission to reset role changes.");
      return;
    }

    setRoles(defaultRoles);
    setHasLocalRoleChanges(true);
    toast.info("Role permissions reset locally", {
      description: "Click Save changes to store the defaults.",
    });
  }

  return (
    <div className="flex h-[calc(100svh-var(--header-height)-2rem)] min-h-[720px] flex-col gap-4 md:h-[calc(100svh-var(--header-height)-3rem)]">
      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <Badge variant="outline" className="mb-3 gap-1">
            <IconShieldCheck className="size-3.5" />
            Roles & Permissions
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight">
            Care Settings
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Decide what each staff role can see or manage across patient care,
            billing, clinical documentation, messaging, scheduling, and settings.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={resetLocalChanges}
            disabled={!canManageSettings || isSaving}
          >
            Reset changes
          </Button>
          <Button onClick={saveRoles} disabled={!canManageSettings || isSaving}>
            <IconShieldCheck />
            Save changes
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
          <div className="border-b p-4">
            <h3 className="font-semibold">Roles</h3>
            <p className="text-muted-foreground text-sm">
              Select a role to review its access.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="grid gap-2">
              {visibleRoles.map((role) => {
                const RoleIcon = roleIconMap[role.key];

                return (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => setActiveRoleKey(role.key)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      role.key === activeRole.key
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:bg-muted/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <RoleIcon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-medium">{role.label}</p>
                          <Badge variant="outline" className="shrink-0">
                            {
                              staff.filter((user) => user.role === role.key)
                                .length
                            }
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
          <div className="border-b p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={roleToneMap[activeRole.key]}
                  >
                    {activeRole.label}
                  </Badge>
                  <Badge variant="outline">
                    {assignedStaff.length} assigned
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      protectedManageCount
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }
                  >
                    {protectedManageCount} protected manage
                  </Badge>
                </div>
                <h3 className="font-semibold">Role access</h3>
                <p className="text-muted-foreground text-sm">
                  {activeRole.description}
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid gap-3">
              {careModuleDefinitions.map((module) => {
                const currentLevel = activeRole.permissions[module.key];
                const ModuleIcon = moduleIconMap[module.key];

                return (
                  <div
                    key={module.key}
                    className="grid gap-3 rounded-lg border p-4 lg:grid-cols-[1fr_180px]"
                  >
                    <div className="flex min-w-0 gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                        <ModuleIcon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <p className="font-medium">{module.label}</p>
                          {module.protectedData ? (
                            <Badge
                              variant="outline"
                              className="border-amber-200 bg-amber-50 text-amber-700"
                            >
                              Protected data
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground text-sm leading-6">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 lg:justify-end">
                      <Badge
                        variant="outline"
                        className={levelStyles[currentLevel]}
                      >
                        {levelLabels[currentLevel]}
                      </Badge>
                      <Select
                        value={currentLevel}
                        onValueChange={(level) =>
                          updatePermission(
                            activeRole.key,
                            module.key,
                            level as PermissionLevel,
                          )
                        }
                        disabled={isSaving || !canManageSettings}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Access" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Access</SelectItem>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="manage">Manage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
          <div className="border-b p-4">
            <h3 className="font-semibold">Staff</h3>
            <p className="text-muted-foreground text-sm">
              Assign people to roles and turn access on or off.
            </p>
            <div className="relative mt-3">
              <IconSearch className="text-muted-foreground absolute left-3 top-2.5 size-4" />
              <Input
                className="pl-9"
                placeholder="Search staff"
                value={staffSearch}
                onChange={(event) => setStaffSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="grid gap-3">
              {filteredStaff.map((user) => (
                <div key={user.id} className="rounded-lg border p-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={statusStyles[user.status]}
                    >
                      {user.status}
                    </Badge>
                  </div>

                  <div className="grid gap-3">
                    <div className="grid gap-1.5">
                      <span className="text-muted-foreground text-xs">Role</span>
                      <Select
                        value={user.role}
                        onValueChange={(role) =>
                          updateStaffRole(user.id, role as RoleKey)
                        }
                        disabled={isSaving || !canManageSettings}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {visibleRoles.map((role) => (
                            <SelectItem key={role.key} value={role.key}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/35 px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">Access enabled</p>
                        <p className="text-muted-foreground text-xs">
                          Last active: {user.lastActive}
                        </p>
                      </div>
                      <Checkbox
                        checked={user.status !== "Suspended"}
                        onCheckedChange={(checked) =>
                          toggleStaffStatus(user.id, checked === true)
                        }
                        disabled={isSaving || !canManageSettings}
                        aria-label={`Toggle ${user.name} access`}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {!isLoadingStaff && filteredStaff.length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm">
                  <p className="font-medium">No staff users found</p>
                  <p className="text-muted-foreground mt-1">
                    Registered users will appear here.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function toStaffUser(id: string, data: Record<string, unknown>): StaffUser {
  const active = data.active !== false && data.status !== "Suspended";
  const fullName =
    getString(data.fullName, "") ||
    getString(data.displayName, "") ||
    getString(data.name, "Unnamed Staff");

  return {
    id,
    name: fullName,
    email: getString(data.email, "No email"),
    role: normalizeRole(getString(data.role, "admin")),
    status: active
      ? getString(data.status, "") === "Invited"
        ? "Invited"
        : "Active"
      : "Suspended",
    lastActive: getString(data.lastActive, "Not tracked"),
  };
}

function getString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}
