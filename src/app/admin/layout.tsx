"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { canAccessPath, getRoleLabel } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const authStatus = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const { roles, isLoadingRoles } = useRolePermissions();
  const canAccessCurrentPage =
    Boolean(user?.active) && canAccessPath(pathname, roles, user?.role);

  React.useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  if (authStatus !== "authenticated" || isLoadingRoles) {
    return (
      <div className="grid min-h-svh place-items-center bg-background px-6">
        <div className="rounded-lg border bg-card p-6 text-center shadow-sm">
          <p className="font-medium">Checking care team access</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Please wait while IHA CareFlow verifies your session.
          </p>
        </div>
      </div>
    );
  }

  if (!canAccessCurrentPage) {
    return (
      <div className="grid min-h-svh place-items-center bg-background px-6">
        <div className="max-w-md rounded-lg border bg-card p-6 text-center shadow-sm">
          <p className="font-medium">Access not allowed</p>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Your current role, {getRoleLabel(user?.role, roles)}, does not have
            permission to open this page. Ask an administrator to update your
            role or permissions in Care Settings.
          </p>
          <Button
            className="mt-4"
            onClick={() => router.replace("/admin/dashboard")}
          >
            Go to Command Center
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <Sidebar collapsible="offcanvas">
        {/* sidebar content */}
        <AppSidebar />
      </Sidebar>

      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
