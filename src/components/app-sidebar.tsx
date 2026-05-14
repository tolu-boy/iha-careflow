"use client";

import * as React from "react";
import {
  IconCalendar,
  IconClipboardText,
  IconDashboard,
  IconInvoice,
  IconMessageCircle,
  IconHelp,
  IconListDetails,
  IconSearch,
  IconSettings,
  IconStethoscope,
  IconUsersGroup,
} from "@tabler/icons-react";

import { NavCareDirectory } from "@/components/nav-care-directory";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { hasPermission, type PermissionKey } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

type SidebarNavItem = {
  title: string;
  url: string;
  icon: typeof IconDashboard;
  permission?: PermissionKey;
};

type SidebarCareItem = {
  name: string;
  url: string;
  icon: typeof IconUsersGroup;
  permission?: PermissionKey;
};

const data = {
  user: {
    name: "IHA Care Team",
    email: "hello@integrativehealthcarealliance.com",
    avatar: "",
  },
  navMain: [
    {
      title: "Command Center",
      url: "/admin/dashboard",
      icon: IconDashboard,
      permission: "dashboard",
    },
    {
      title: "Patient Onboarding",
      url: "/admin/onboarding",
      icon: IconListDetails,
      permission: "onboarding",
    },
    {
      title: "Billing & Insurance",
      url: "/admin/billing",
      icon: IconInvoice,
      permission: "billing",
    },
    {
      title: "Clinical Notes",
      url: "/admin/clinical-notes",
      icon: IconClipboardText,
      permission: "notes",
    },
    {
      title: "Patient Messages",
      url: "/admin/messages",
      icon: IconMessageCircle,
      permission: "messages",
    },
    {
      title: "Scheduling",
      url: "/admin/scheduling",
      icon: IconCalendar,
      permission: "scheduling",
    },
  ] satisfies SidebarNavItem[],
  navSecondary: [
    {
      title: "Care Settings",
      url: "/admin/settings",
      icon: IconSettings,
      permission: "settings",
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ] satisfies SidebarNavItem[],
  careDirectory: [
    {
      name: "Patients",
      url: "/admin/patients",
      icon: IconUsersGroup,
      permission: "patients",
    },
    {
      name: "Doctors",
      url: "/admin/doctors",
      icon: IconStethoscope,
      permission: "doctors",
    },
  ] satisfies SidebarCareItem[],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAuthStore((state) => state.user);
  const { roles } = useRolePermissions();
  const visibleMainItems = data.navMain.filter((item) =>
    canShowNavItem(item.permission, user?.role, user?.active, roles),
  );
  const visibleCareDirectory = data.careDirectory.filter((item) =>
    canShowNavItem(item.permission, user?.role, user?.active, roles),
  );
  const visibleSecondaryItems = data.navSecondary.filter((item) =>
    canShowNavItem(item.permission, user?.role, user?.active, roles),
  );

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <span className="text-primary-foreground text-xs font-bold">
              IHA
            </span>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-sidebar-foreground">
              IHA CareFlow
            </span>
            <span className="text-muted-foreground text-[11px] font-medium">
              Practice Operations
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={visibleMainItems} />
        <NavCareDirectory items={visibleCareDirectory} />
        <NavSecondary items={visibleSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

function canShowNavItem(
  permission: PermissionKey | undefined,
  role: string | undefined,
  active: boolean | undefined,
  roles: Parameters<typeof hasPermission>[0],
) {
  if (active === false) return false;
  if (!permission) return true;

  return hasPermission(roles, role, permission, "view");
}
