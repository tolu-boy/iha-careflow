import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function SiteHeader() {
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
