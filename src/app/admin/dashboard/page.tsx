"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";

export default function Page() {
  return (
    <div>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <SectionCards />
      </div>
      <div className="px-4 lg:px-6 mt-6">
        <ChartAreaInteractive />
      </div>
    </div>
  );
}
