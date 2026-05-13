"use client";

import * as React from "react";
import {
  IconCalendar,
  IconClipboardText,
  IconDashboard,
  IconHeartHandshake,
  IconInvoice,
  IconMessageCircle,
  IconFileWord,
  IconHelp,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";

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
    },
    {
      title: "Patient Onboarding",
      url: "/admin/onboarding",
      icon: IconListDetails,
    },
    {
      title: "Billing & Insurance",
      url: "/admin/billing",
      icon: IconInvoice,
    },
    {
      title: "Clinical Notes",
      url: "/admin/dashboard",
      icon: IconClipboardText,
    },
    {
      title: "Patient Messages",
      url: "/admin/dashboard",
      icon: IconMessageCircle,
    },
    {
      title: "Scheduling",
      url: "/admin/dashboard",
      icon: IconCalendar,
    },
  ],
  navSecondary: [
    {
      title: "Care Settings",
      url: "#",
      icon: IconSettings,
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
  ],
  documents: [
    {
      name: "Care Pathways",
      url: "#",
      icon: IconHeartHandshake,
    },
    {
      name: "Operations Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Templates",
      url: "#",
      icon: IconFileWord,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
