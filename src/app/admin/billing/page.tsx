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
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { toast } from "sonner";

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
import { db } from "@/lib/firebase";

type BillingStatus = "Verified" | "Pending" | "Missing Info";
type StatusFilter = BillingStatus | "All";

type BillingRecord = {
  id: string;
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
  reminderSentAt?: string;
  breakdown: {
    label: string;
    amount: string;
  }[];
};

const statusStyles: Record<BillingStatus, string> = {
  Verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  "Missing Info": "border-red-200 bg-red-50 text-red-700",
};

const currencyPattern = /-?\$?[\d,]+(?:\.\d{2})?/;

export default function BillingPage() {
  const [records, setRecords] = React.useState<BillingRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("All");

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "billingRecords"),
      (snapshot) => {
        const nextRecords = snapshot.docs
          .map((snapshotDoc) => toBillingRecord(snapshotDoc.id, snapshotDoc.data()))
          .sort((first, second) => first.patient.localeCompare(second.patient));

        setRecords(nextRecords);
        setIsLoading(false);
      },
      () => {
        setIsLoading(false);
        toast.error("Unable to load billing records", {
          description: "Check billing record permissions and try again.",
        });
      },
    );

    return unsubscribe;
  }, []);

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
  }, [records, search, statusFilter]);

  const summaryCards = React.useMemo(() => {
    const verified = records.filter((record) => record.status === "Verified").length;
    const pending = records.filter((record) => record.status === "Pending").length;
    const missing = records.filter(
      (record) => record.status === "Missing Info",
    ).length;
    const openBalance = records.reduce(
      (total, record) => total + parseCurrency(record.balance),
      0,
    );

    return [
      {
        label: "Verified coverage",
        value: String(verified),
        note: "Ready for upcoming visits",
        icon: IconShieldCheck,
      },
      {
        label: "Pending review",
        value: String(pending),
        note: "Eligibility or benefits in progress",
        icon: IconChecklist,
      },
      {
        label: "Missing info",
        value: String(missing),
        note: "Needs card, member ID, or subscriber detail",
        icon: IconAlertTriangle,
      },
      {
        label: "Open balance",
        value: formatCurrency(openBalance),
        note: "Estimated patient responsibility",
        icon: IconReceipt2,
      },
    ];
  }, [records]);

  async function sendReminder(record: BillingRecord) {
    try {
      await updateDoc(doc(db, "billingRecords", record.id), {
        reminderSentAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
      toast.success("Reminder sent", {
        description: `Payment reminder queued for ${record.patient}.`,
      });
    } catch {
      toast.error("Reminder was not sent", {
        description: "This billing record could not be updated.",
      });
    }
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
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadBillingCsv(filteredRecords)}
                >
                  <IconDownload />
                  Export CSV
                </Button>
              </div>
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
                    <TableRow key={record.id}>
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
                            onClick={() => sendReminder(record)}
                          >
                            <IconMailForward />
                            <span className="hidden xl:inline">
                              {record.reminderSentAt ? "Sent" : "Send Reminder"}
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
                        {isLoading
                          ? "Loading billing records..."
                          : records.length === 0
                            ? "No billing records yet."
                            : "No billing records match this view."}
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
  const [open, setOpen] = React.useState(false);
  const [notes, setNotes] = React.useState(record.notes);
  const [isSaving, setIsSaving] = React.useState(false);

  async function saveBillingReview() {
    setIsSaving(true);

    try {
      await updateDoc(doc(db, "billingRecords", record.id), {
        notes,
        updatedAt: serverTimestamp(),
      });
      toast.success("Billing review saved", {
        description: `${record.patient}'s billing notes were updated.`,
      });
    } catch {
      toast.error("Billing review was not saved", {
        description: "This billing record could not be updated.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer
      direction="right"
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (nextOpen) {
          setNotes(record.notes);
        }
      }}
    >
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
                onClick={() => downloadInvoicePdf(record)}
              >
                <IconDownload />
                PDF
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
              htmlFor={`${record.id}-notes`}
            >
              Billing notes
            </label>
            <Textarea
              id={`${record.id}-notes`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </div>

        <DrawerFooter>
          <Button onClick={saveBillingReview} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save billing review"}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

function toBillingRecord(id: string, data: Record<string, unknown>): BillingRecord {
  return {
    id,
    patient: getString(data.patient, "Unnamed patient"),
    dateOfBirth: getString(data.dateOfBirth, "Not provided"),
    provider: getString(data.provider, "Unassigned"),
    appointment: getString(data.appointment, "Not scheduled"),
    insurance: getString(data.insurance, "Not provided"),
    memberId: getString(data.memberId, "Missing"),
    status: getBillingStatus(data.status),
    balance: getString(data.balance, "$0.00"),
    invoice: getString(data.invoice, "Draft"),
    cardStatus: getString(data.cardStatus, "No card uploaded"),
    notes: getString(data.notes),
    reminderSentAt: getString(data.reminderSentAt),
    breakdown: getBreakdown(data.breakdown),
  };
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getBillingStatus(value: unknown): BillingStatus {
  if (value === "Verified" || value === "Pending" || value === "Missing Info") {
    return value;
  }

  return "Pending";
}

function getBreakdown(value: unknown): BillingRecord["breakdown"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;

      return {
        label: getString(record.label, "Line item"),
        amount: getString(record.amount, "$0.00"),
      };
    })
    .filter((item): item is BillingRecord["breakdown"][number] => item !== null);
}

function parseCurrency(value: string) {
  const match = value.match(currencyPattern);

  if (!match) {
    return 0;
  }

  return Number(match[0].replace(/[$,]/g, "")) || 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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

  downloadBlob("iha-billing-records.csv", toCsv(rows), "text/csv;charset=utf-8");
}

function downloadInvoicePdf(record: BillingRecord) {
  const lines = [
    "IHA CareFlow Invoice",
    `Invoice: ${record.invoice}`,
    `Patient: ${record.patient}`,
    `DOB: ${record.dateOfBirth}`,
    `Appointment: ${record.appointment}`,
    `Provider: ${record.provider}`,
    `Insurance: ${record.insurance}`,
    `Member ID: ${record.memberId}`,
    `Status: ${record.status}`,
    "",
    "Invoice breakdown",
    ...record.breakdown.map((item) => `${item.label}: ${item.amount}`),
    "",
    `Patient balance: ${record.balance}`,
    "",
    "Notes",
    record.notes || "No billing notes recorded.",
  ];

  const fileName = `${record.invoice || record.patient}-invoice`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  downloadBlob(`${fileName}.pdf`, createSimplePdf(lines), "application/pdf");
}

function createSimplePdf(lines: string[]) {
  const contentLines = lines
    .slice(0, 34)
    .map((line, index) => {
      const fontSize = index === 0 ? 18 : 11;
      const y = 760 - index * 20;

      return `BT /F1 ${fontSize} Tf 54 ${y} Td (${escapePdfText(line)}) Tj ET`;
    })
    .join("\n");
  const stream = `${contentLines}\n`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}endstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
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

function downloadBlob(fileName: string, content: BlobPart, type: string) {
  const blob = new Blob([content], { type });
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
