"use client";

import * as React from "react";
import {
  IconAlertTriangle,
  IconChecklist,
  IconCreditCard,
  IconDownload,
  IconFileInvoice,
  IconId,
  IconMailForward,
  IconReceipt2,
  IconSearch,
  IconShieldCheck,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type BillingStatus = "Verified" | "Pending" | "Missing Info";
type StatusFilter = BillingStatus | "All";

type BillingRecord = {
  patient: string;
  dateOfBirth: string;
  provider: string;
  appointment: string;
  insurance: string;
  memberId: string;
  status: BillingStatus;
  balance: string;
  invoice: string;
  cardStatus: string;
  notes: string;
  breakdown: {
    label: string;
    amount: string;
  }[];
};

const records: BillingRecord[] = [
  {
    patient: "Avery Johnson",
    dateOfBirth: "1991-04-18",
    provider: "Dr. Maria Chen",
    appointment: "May 14, 10:00 AM",
    insurance: "Aetna",
    memberId: "AET-47291",
    status: "Verified",
    balance: "$35.00",
    invoice: "INV-1048",
    cardStatus: "Front and back uploaded",
    notes: "Benefits confirmed. Patient prefers card on file for copay.",
    breakdown: [
      { label: "Initial psychiatry evaluation", amount: "$325.00" },
      { label: "Insurance estimate", amount: "-$245.00" },
      { label: "Patient copay", amount: "$35.00" },
    ],
  },
  {
    patient: "Morgan Lee",
    dateOfBirth: "1987-09-02",
    provider: "Dr. Maria Chen",
    appointment: "May 15, 1:30 PM",
    insurance: "BlueCross BlueShield",
    memberId: "BCBS-88421",
    status: "Pending",
    balance: "$0.00",
    invoice: "Draft",
    cardStatus: "Card uploaded, awaiting verification",
    notes: "Eligibility portal timed out. Recheck before appointment reminder.",
    breakdown: [
      { label: "Medication management visit", amount: "$185.00" },
      { label: "Estimated insurance", amount: "Pending" },
      { label: "Patient balance", amount: "Pending" },
    ],
  },
  {
    patient: "Jordan Rivera",
    dateOfBirth: "1996-12-11",
    provider: "Dr. Natalie Ross",
    appointment: "May 16, 9:00 AM",
    insurance: "UnitedHealthcare",
    memberId: "Missing",
    status: "Missing Info",
    balance: "Unknown",
    invoice: "Hold",
    cardStatus: "Insurance card missing",
    notes: "Patient needs to upload card and confirm subscriber details.",
    breakdown: [
      { label: "Initial consult", amount: "$325.00" },
      { label: "Insurance estimate", amount: "Missing info" },
      { label: "Patient balance", amount: "Unknown" },
    ],
  },
  {
    patient: "Taylor Smith",
    dateOfBirth: "1979-06-24",
    provider: "Dr. Natalie Ross",
    appointment: "May 16, 3:00 PM",
    insurance: "Self-pay",
    memberId: "N/A",
    status: "Verified",
    balance: "$185.00",
    invoice: "INV-1051",
    cardStatus: "No insurance card required",
    notes: "Self-pay agreement acknowledged.",
    breakdown: [
      { label: "Follow-up visit", amount: "$185.00" },
      { label: "Discounts", amount: "$0.00" },
      { label: "Patient balance", amount: "$185.00" },
    ],
  },
  {
    patient: "Riley Patel",
    dateOfBirth: "1993-01-30",
    provider: "Dr. Maria Chen",
    appointment: "May 17, 11:00 AM",
    insurance: "Cigna",
    memberId: "CIG-11820",
    status: "Pending",
    balance: "$60.00 est.",
    invoice: "Draft",
    cardStatus: "Front uploaded, back missing",
    notes: "Need back of card and deductible confirmation.",
    breakdown: [
      { label: "Therapy intake", amount: "$250.00" },
      { label: "Insurance estimate", amount: "-$190.00" },
      { label: "Estimated patient balance", amount: "$60.00" },
    ],
  },
];

const summaryCards = [
  {
    label: "Verified coverage",
    value: "24",
    note: "Ready for upcoming visits",
    icon: IconShieldCheck,
  },
  {
    label: "Pending review",
    value: "8",
    note: "Eligibility or benefits in progress",
    icon: IconChecklist,
  },
  {
    label: "Missing info",
    value: "3",
    note: "Needs card, member ID, or subscriber detail",
    icon: IconAlertTriangle,
  },
  {
    label: "Open balance",
    value: "$2,410",
    note: "Estimated patient responsibility",
    icon: IconReceipt2,
  },
];

const statusStyles: Record<BillingStatus, string> = {
  Verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  "Missing Info": "border-red-200 bg-red-50 text-red-700",
};

export default function BillingPage() {
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("All");
  const [sentReminders, setSentReminders] = React.useState<string[]>([]);

  const filteredRecords = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        record.patient.toLowerCase().includes(query) ||
        record.insurance.toLowerCase().includes(query) ||
        record.invoice.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter]);

  function sendReminder(patient: string) {
    setSentReminders((current) =>
      current.includes(patient) ? current : [...current, patient],
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-3 px-4 lg:flex-row lg:items-end lg:justify-between lg:px-6">
        <div>
          <Badge variant="outline" className="mb-3">
            Billing and insurance
          </Badge>
          <h2 className="text-2xl font-semibold tracking-tight">
            Billing review dashboard
          </h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Review insurance readiness, payment status, invoice estimates, and
            missing billing details before patient visits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 xl:grid-cols-4 lg:px-6">
        {summaryCards.map((card) => (
          <Card key={card.label} className="rounded-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardDescription>{card.label}</CardDescription>
                <CardTitle className="mt-2 text-3xl">{card.value}</CardTitle>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <card.icon className="size-5" />
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              {card.note}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="px-4 lg:px-6">
        <Card className="rounded-lg">
          <CardHeader className="flex flex-col gap-4">
            <div>
              <CardTitle>Patient billing records</CardTitle>
              <CardDescription>
                Color-coded insurance and invoice status by patient.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative sm:w-72">
                  <IconSearch className="text-muted-foreground absolute left-3 top-2.5 size-4" />
                  <Input
                    className="pl-9"
                    placeholder="Search patients by name"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    setStatusFilter(value as StatusFilter)
                  }
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All statuses</SelectItem>
                    <SelectItem value="Verified">Verified</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Missing Info">Missing Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadBillingCsv(filteredRecords)}
              >
                <IconDownload />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/70">
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Insurance
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Appointment
                    </TableHead>
                    <TableHead className="hidden text-right sm:table-cell">
                      Balance
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={`${record.patient}-${record.invoice}`}>
                      <TableCell>
                        <div className="font-medium">{record.patient}</div>
                        <div className="text-muted-foreground text-xs">
                          DOB {record.dateOfBirth}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>{record.insurance}</div>
                        <div className="text-muted-foreground text-xs">
                          {record.memberId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusStyles[record.status]}
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {record.appointment}
                      </TableCell>
                      <TableCell className="hidden text-right sm:table-cell">
                        {record.balance}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => sendReminder(record.patient)}
                          >
                            <IconMailForward />
                            <span className="hidden xl:inline">
                              {sentReminders.includes(record.patient)
                                ? "Sent"
                                : "Send Reminder"}
                            </span>
                          </Button>
                          <BillingDetailsDrawer record={record} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-muted-foreground h-24 text-center"
                      >
                        No billing records match this search.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BillingDetailsDrawer({ record }: { record: BillingRecord }) {
  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <Button size="sm" variant="outline">
          View
        </Button>
      </DrawerTrigger>
      <DrawerContent className="overflow-y-auto sm:max-w-xl">
        <DrawerHeader>
          <DrawerTitle>{record.patient}</DrawerTitle>
          <DrawerDescription>
            Insurance, invoice, verification, and notes for {record.appointment}
          </DrawerDescription>
        </DrawerHeader>

        <div className="grid gap-5 px-4 pb-4">
          <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div>
              <p className="text-sm font-medium">Verification status</p>
              <p className="text-muted-foreground text-sm">
                {record.insurance} · {record.memberId}
              </p>
            </div>
            <Badge variant="outline" className={statusStyles[record.status]}>
              {record.status}
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailBlock
              icon={IconId}
              label="Insurance details"
              lines={[
                record.insurance,
                `Member ID: ${record.memberId}`,
                `Provider: ${record.provider}`,
              ]}
            />
            <DetailBlock
              icon={IconCreditCard}
              label="Uploaded insurance card"
              lines={[record.cardStatus, "Card preview stored with intake"]}
            />
          </div>

          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <IconFileInvoice className="text-primary size-5" />
                <h3 className="font-medium">Invoice breakdown</h3>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadInvoiceBreakdown(record)}
              >
                <IconDownload />
                Download
              </Button>
            </div>
            <div className="grid gap-2">
              {record.breakdown.map((item) => (
                <div
                  key={`${record.patient}-${item.label}`}
                  className="flex items-center justify-between gap-4 text-sm"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.amount}</span>
                </div>
              ))}
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Invoice</span>
              <span>{record.invoice}</span>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">Insurance card preview</h3>
            <div className="grid aspect-[1.58] place-items-center rounded-lg border border-dashed bg-muted/50 p-4 text-center">
              <div>
                <IconCreditCard className="text-muted-foreground mx-auto mb-2 size-8" />
                <p className="text-sm font-medium">{record.cardStatus}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Visual upload placeholder for front/back card files.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label
              className="text-sm font-medium"
              htmlFor={`${record.patient}-notes`}
            >
              Billing notes
            </label>
            <Textarea
              id={`${record.patient}-notes`}
              defaultValue={record.notes}
            />
          </div>
        </div>

        <DrawerFooter>
          <Button>Save billing review</Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function downloadBillingCsv(billingRecords: BillingRecord[]) {
  const rows = [
    [
      "Patient",
      "Date of Birth",
      "Provider",
      "Appointment",
      "Insurance",
      "Member ID",
      "Status",
      "Balance",
      "Invoice",
      "Card Status",
      "Notes",
    ],
    ...billingRecords.map((record) => [
      record.patient,
      record.dateOfBirth,
      record.provider,
      record.appointment,
      record.insurance,
      record.memberId,
      record.status,
      record.balance,
      record.invoice,
      record.cardStatus,
      record.notes,
    ]),
  ];

  downloadTextFile("iha-billing-records.csv", toCsv(rows));
}

function downloadInvoiceBreakdown(record: BillingRecord) {
  const rows = [
    ["Patient", record.patient],
    ["Invoice", record.invoice],
    ["Insurance", record.insurance],
    ["Member ID", record.memberId],
    ["Status", record.status],
    ["Balance", record.balance],
    [],
    ["Line Item", "Amount"],
    ...record.breakdown.map((item) => [item.label, item.amount]),
  ];

  const fileName = `${record.invoice || record.patient}-invoice-breakdown.csv`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  downloadTextFile(`${fileName}.csv`, toCsv(rows));
}

function toCsv(rows: string[][]) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = String(cell ?? "");
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(","),
    )
    .join("\n");
}

function downloadTextFile(fileName: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function DetailBlock({
  icon: Icon,
  label,
  lines,
}: {
  icon: typeof IconId;
  label: string;
  lines: string[];
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="text-primary size-5" />
        <h3 className="font-medium">{label}</h3>
      </div>
      <div className="grid gap-1 text-sm">
        {lines.map((line) => (
          <p key={line} className="text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
