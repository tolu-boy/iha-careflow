import { IconDotsVertical, IconPlus } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CareQueueItem = {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

const statusTone: Record<string, string> = {
  Done: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "In Process": "border-amber-200 bg-amber-50 text-amber-700",
  "Not Started": "border-slate-200 bg-slate-50 text-slate-700",
};

export function DataTable({ data }: { data: CareQueueItem[] }) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <Tabs defaultValue="active" className="w-full lg:w-auto">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="active">Active Queue</TabsTrigger>
            <TabsTrigger value="clinical">Clinical</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button variant="outline" size="sm" className="w-full lg:w-auto">
          <IconPlus />
          Add Task
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader className="bg-muted/70">
            <TableRow>
              <TableHead>Workflow Item</TableHead>
              <TableHead className="hidden md:table-cell">Area</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden text-right sm:table-cell">
                Open
              </TableHead>
              <TableHead className="hidden text-right lg:table-cell">
                Due
              </TableHead>
              <TableHead className="hidden md:table-cell">Owner</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{item.header}</span>
                    <span className="text-muted-foreground text-xs md:hidden">
                      {item.type} · {item.reviewer}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">{item.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusTone[item.status] ?? statusTone["Not Started"]}
                  >
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {item.target}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">
                  {item.limit}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {item.reviewer}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <IconDotsVertical />
                        <span className="sr-only">Open workflow actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Open details</DropdownMenuItem>
                      <DropdownMenuItem>Assign owner</DropdownMenuItem>
                      <DropdownMenuItem>Mark complete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
