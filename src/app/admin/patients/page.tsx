"use client";

import * as React from "react";
import {
  IconActivityHeartbeat,
  IconCalendarPlus,
  IconClipboardCheck,
  IconFileText,
  IconMail,
  IconPhone,
  IconSearch,
  IconShieldCheck,
  IconUserCheck,
  IconUsersGroup,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PatientStatus = "Active" | "Intake Pending" | "Care Review" | "Inactive";
type RiskLevel = "Low" | "Medium" | "High";
type InsuranceStatus = "Verified" | "Pending" | "Missing Info";

type Patient = {
  id: string;
  name: string;
  age: number;
  dob: string;
  gender: string;
  phone: string;
  email: string;
  emergencyContact: string;
  status: PatientStatus;
  risk: RiskLevel;
  provider: string;
  reason: string;
  nextAppointment: string;
  insurancePlan: string;
  memberId: string;
  insuranceStatus: InsuranceStatus;
  onboardingComplete: boolean;
  consentSigned: boolean;
  openNotes: number;
  balance: string;
  lastMessage: string;
  carePlan: string;
};

const initialPatients: Patient[] = [
  {
    id: "john-doe",
    name: "John Doe",
    age: 34,
    dob: "1992-03-18",
    gender: "Male",
    phone: "(555) 014-2100",
    email: "john.doe@email.com",
    emergencyContact: "Maria Doe - (555) 019-8821",
    status: "Active",
    risk: "Medium",
    provider: "Dr Smith",
    reason: "Anxiety and sleep disruption",
    nextAppointment: "May 14, 10:00 AM",
    insurancePlan: "Aetna",
    memberId: "AET-47291",
    insuranceStatus: "Verified",
    onboardingComplete: true,
    consentSigned: true,
    openNotes: 1,
    balance: "$35.00",
    lastMessage: "Sleep symptoms updated this morning.",
    carePlan: "Weekly therapy with medication monitoring.",
  },
  {
    id: "sarah-kim",
    name: "Sarah Kim",
    age: 29,
    dob: "1997-10-04",
    gender: "Female",
    phone: "(555) 018-4430",
    email: "sarah.kim@email.com",
    emergencyContact: "Daniel Kim - (555) 013-0021",
    status: "Intake Pending",
    risk: "Low",
    provider: "Dr Lee",
    reason: "Medication follow-up",
    nextAppointment: "May 14, 11:30 AM",
    insurancePlan: "BlueCross BlueShield",
    memberId: "BCBS-88421",
    insuranceStatus: "Pending",
    onboardingComplete: false,
    consentSigned: true,
    openNotes: 0,
    balance: "$0.00",
    lastMessage: "Asked to confirm appointment time.",
    carePlan: "Intake review before provider assignment.",
  },
  {
    id: "mike-johnson",
    name: "Mike Johnson",
    age: 42,
    dob: "1984-06-22",
    gender: "Male",
    phone: "(555) 016-9944",
    email: "mike.johnson@email.com",
    emergencyContact: "Alicia Johnson - (555) 011-4490",
    status: "Care Review",
    risk: "High",
    provider: "Dr Smith",
    reason: "Sleep disturbance and fatigue",
    nextAppointment: "May 14, 10:00 AM",
    insurancePlan: "Cigna",
    memberId: "CIG-11820",
    insuranceStatus: "Verified",
    onboardingComplete: true,
    consentSigned: true,
    openNotes: 2,
    balance: "$60.00 est.",
    lastMessage: "Lab results uploaded.",
    carePlan: "Review labs, sleep history, and medication response.",
  },
  {
    id: "avery-johnson",
    name: "Avery Johnson",
    age: 35,
    dob: "1991-04-18",
    gender: "Female",
    phone: "(555) 015-2218",
    email: "avery.johnson@email.com",
    emergencyContact: "Chris Johnson - (555) 015-7720",
    status: "Active",
    risk: "Low",
    provider: "Dr Ross",
    reason: "Medication check",
    nextAppointment: "May 15, 1:00 PM",
    insurancePlan: "Aetna",
    memberId: "AET-53177",
    insuranceStatus: "Verified",
    onboardingComplete: true,
    consentSigned: true,
    openNotes: 0,
    balance: "$0.00",
    lastMessage: "No new messages.",
    carePlan: "Monthly medication management.",
  },
  {
    id: "Jordan-rivera",
    name: "Jordan Rivera",
    age: 30,
    dob: "1996-12-11",
    gender: "Non-binary",
    phone: "(555) 010-6811",
    email: "jordan.rivera@email.com",
    emergencyContact: "Pat Rivera - (555) 012-3308",
    status: "Intake Pending",
    risk: "Medium",
    provider: "Dr Lee",
    reason: "Initial consult",
    nextAppointment: "Not scheduled",
    insurancePlan: "UnitedHealthcare",
    memberId: "Missing",
    insuranceStatus: "Missing Info",
    onboardingComplete: true,
    consentSigned: false,
    openNotes: 0,
    balance: "Unknown",
    lastMessage: "Needs insurance card upload.",
    carePlan: "Complete billing readiness before scheduling.",
  },
];

const statusStyles: Record<PatientStatus, string> = {
  Active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "Intake Pending": "border-amber-200 bg-amber-50 text-amber-700",
  "Care Review": "border-sky-200 bg-sky-50 text-sky-700",
  Inactive: "border-slate-200 bg-slate-50 text-slate-600",
};

const riskStyles: Record<RiskLevel, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-red-200 bg-red-50 text-red-700",
};

const insuranceStyles: Record<InsuranceStatus, string> = {
  Verified: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  "Missing Info": "border-red-200 bg-red-50 text-red-700",
};

const statuses: PatientStatus[] = [
  "Active",
  "Intake Pending",
  "Care Review",
  "Inactive",
];
const risks: RiskLevel[] = ["Low", "Medium", "High"];

export default function PatientsPage() {
  const patients = initialPatients;
  const [activePatientId, setActivePatientId] = React.useState(
    initialPatients[0].id,
  );
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("All Statuses");
  const [riskFilter, setRiskFilter] = React.useState("All Risks");

  const filteredPatients = patients.filter((patient) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      patient.name.toLowerCase().includes(query) ||
      patient.email.toLowerCase().includes(query) ||
      patient.phone.toLowerCase().includes(query) ||
      patient.provider.toLowerCase().includes(query);
    const matchesStatus =
      statusFilter === "All Statuses" || patient.status === statusFilter;
    const matchesRisk = riskFilter === "All Risks" || patient.risk === riskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  const activePatient =
    patients.find((patient) => patient.id === activePatientId) ?? patients[0];

  const summaryCards = [
    {
      label: "Total patients",
      value: patients.length.toString(),
      note: "Profiles in care directory",
      icon: IconUsersGroup,
    },
    {
      label: "Intake pending",
      value: patients
        .filter((patient) => patient.status === "Intake Pending")
        .length.toString(),
      note: "Needs onboarding or consent",
      icon: IconClipboardCheck,
    },
    {
      label: "High risk",
      value: patients
        .filter((patient) => patient.risk === "High")
        .length.toString(),
      note: "Prioritized for follow-up",
      icon: IconActivityHeartbeat,
    },
    {
      label: "Billing gaps",
      value: patients
        .filter((patient) => patient.insuranceStatus !== "Verified")
        .length.toString(),
      note: "Insurance not fully ready",
      icon: IconShieldCheck,
    },
  ];

  return (
    <div className="flex h-[calc(100svh-var(--header-height)-2rem)] min-h-[720px] flex-col gap-3 md:h-[calc(100svh-var(--header-height)-3rem)]">
      <div className="rounded-lg border bg-card p-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Patients
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage patient profiles, intake readiness, insurance status, and
            connected care workflows.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-muted-foreground text-sm">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold">{card.value}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <card.icon className="size-5" />
              </div>
            </div>
            <p className="text-muted-foreground mt-3 text-sm">{card.note}</p>
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
          <div className="border-b p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="font-semibold">Patient directory</h3>
                <p className="text-muted-foreground text-sm">
                  {filteredPatients.length} matching profiles
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative sm:w-72">
                  <IconSearch className="text-muted-foreground absolute left-3 top-2.5 size-4" />
                  <Input
                    className="pl-9"
                    placeholder="Search patients"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Statuses">All statuses</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-full sm:w-36">
                    <SelectValue placeholder="Risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Risks">All risks</SelectItem>
                    {risks.map((risk) => (
                      <SelectItem key={risk} value={risk}>
                        {risk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/80">
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Contact
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Provider
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Next appointment
                  </TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow
                    key={patient.id}
                    data-state={
                      patient.id === activePatient.id ? "selected" : undefined
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <PatientAvatar name={patient.name} />
                        <div>
                          <p className="font-medium">{patient.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {patient.age ? `${patient.age} yrs` : "New"} -{" "}
                            {patient.reason}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>{patient.phone}</div>
                      <div className="text-muted-foreground text-xs">
                        {patient.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={statusStyles[patient.status]}
                        >
                          {patient.status}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={riskStyles[patient.risk]}
                        >
                          {patient.risk}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {patient.provider}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {patient.nextAppointment}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={insuranceStyles[patient.insuranceStatus]}
                      >
                        {patient.insuranceStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={
                          patient.id === activePatient.id ? "default" : "outline"
                        }
                        onClick={() => setActivePatientId(patient.id)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground h-24 text-center"
                    >
                      No patient profiles match this search.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </section>

        <PatientProfilePanel patient={activePatient} />
      </div>
    </div>
  );
}

function PatientProfilePanel({ patient }: { patient: Patient }) {
  return (
    <aside className="hidden min-h-0 overflow-y-auto rounded-lg border bg-card p-4 xl:block">
      <div className="mb-5 flex items-center gap-3">
        <PatientAvatar name={patient.name} size="lg" />
        <div>
          <h3 className="text-lg font-semibold">{patient.name}</h3>
          <p className="text-muted-foreground text-sm">
            {patient.age ? `${patient.age} yrs` : "New patient"} -{" "}
            {patient.provider}
          </p>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <Badge variant="outline" className={statusStyles[patient.status]}>
          {patient.status}
        </Badge>
        <Badge variant="outline" className={riskStyles[patient.risk]}>
          Risk: {patient.risk}
        </Badge>
      </div>

      <div className="grid gap-4">
        <PanelSection title="Contact">
          <DetailLine icon={IconPhone} label="Phone" value={patient.phone} />
          <DetailLine icon={IconMail} label="Email" value={patient.email} />
          <DetailLine
            icon={IconUserCheck}
            label="Emergency"
            value={patient.emergencyContact}
          />
        </PanelSection>

        <PanelSection title="Care readiness">
          <ReadinessItem
            label="Onboarding"
            ready={patient.onboardingComplete}
            readyText="Complete"
            blockedText="Incomplete"
          />
          <ReadinessItem
            label="Insurance"
            ready={patient.insuranceStatus === "Verified"}
            readyText="Verified"
            blockedText={patient.insuranceStatus}
          />
          <ReadinessItem
            label="Consent"
            ready={patient.consentSigned}
            readyText="Signed"
            blockedText="Missing"
          />
          <ReadinessItem
            label="Appointment"
            ready={patient.nextAppointment !== "Not scheduled"}
            readyText={patient.nextAppointment}
            blockedText="Not scheduled"
          />
        </PanelSection>

        <PanelSection title="Insurance and billing">
          <DetailText label="Plan" value={patient.insurancePlan} />
          <DetailText label="Member ID" value={patient.memberId} />
          <DetailText label="Balance" value={patient.balance} />
        </PanelSection>

        <PanelSection title="Connected workflows">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start">
              <IconCalendarPlus />
              Schedule
            </Button>
            <Button variant="outline" className="justify-start">
              <IconMail />
              Message
            </Button>
            <Button variant="outline" className="justify-start">
              <IconFileText />
              Note
            </Button>
            <Button variant="outline" className="justify-start">
              <IconShieldCheck />
              Billing
            </Button>
          </div>
        </PanelSection>

        <PanelSection title="Care context">
          <p className="text-sm">{patient.reason}</p>
          <p className="text-muted-foreground text-sm">{patient.carePlan}</p>
          <div className="rounded-md border bg-muted/35 p-3 text-sm">
            <p className="font-medium">Last message</p>
            <p className="text-muted-foreground mt-1">{patient.lastMessage}</p>
          </div>
        </PanelSection>
      </div>
    </aside>
  );
}

function PatientAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "md" | "lg";
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground ${
        size === "lg" ? "size-12 text-base" : "size-10 text-sm"
      }`}
    >
      {getInitials(name)}
    </div>
  );
}

function PanelSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border p-3">
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <div className="grid gap-3">{children}</div>
    </section>
  );
}

function DetailLine({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof IconPhone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="text-primary mt-0.5 size-4" />
      <div>
        <p className="text-muted-foreground">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}

function DetailText({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function ReadinessItem({
  label,
  ready,
  readyText,
  blockedText,
}: {
  label: string;
  ready: boolean;
  readyText: string;
  blockedText: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge
        variant="outline"
        className={
          ready
            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
            : "border-amber-200 bg-amber-50 text-amber-700"
        }
      >
        {ready ? readyText : blockedText}
      </Badge>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
