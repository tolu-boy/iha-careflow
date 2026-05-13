"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Sidebar } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const authStatus = useAuthStore((state) => state.status);

  React.useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.replace("/login");
    }
  }, [authStatus, router]);

  if (authStatus !== "authenticated") {
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
