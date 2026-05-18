"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useRolePermissions } from "@/hooks/use-role-permissions";
import { getRoleLabel } from "@/lib/permissions";
import { useAuthStore } from "@/stores/auth-store";

export function SiteHeader() {
  const user = useAuthStore((state) => state.user);
  const { roles } = useRolePermissions();
  const roleLabel = getRoleLabel(user?.role, roles);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-base font-medium">CareFlow Command Center</h1>
          <p className="text-muted-foreground hidden text-xs sm:block">
            Whole-person care operations for onboarding, visits, billing, and follow-up.
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
            {roleLabel}
          </Badge>
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://www.integrativehealthcarealliance.com/"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              IHA Website
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
