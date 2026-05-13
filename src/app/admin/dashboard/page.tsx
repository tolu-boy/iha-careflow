"use client";

import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";

import data from "./data.json";

export default function Page() {
  return (
    <div>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <SectionCards />
      </div>
      <div className="px-4 lg:px-6 mt-6">
        <ChartAreaInteractive />
      </div>

      <div className="px-4 lg:px-6 mt-6">
        <DataTable data={data} />
      </div>
    </div>
  );
}
