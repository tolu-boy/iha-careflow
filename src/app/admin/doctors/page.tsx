"use client";

import * as React from "react";
import {
  IconBuildingHospital,
  IconCalendarStats,
  IconCertificate,
  IconClockHour4,
  IconFileText,
  IconMail,
  IconPhone,
  IconSearch,
  IconStethoscope,
  IconUserPlus,
  IconUsersGroup,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type DoctorStatus = "Available" | "In Session" | "Out Today" | "Credentialing";

type Doctor = {
  id: string;
  name: string;
  title: string;
  specialty: string;
  license: string;
  npi: string;
  email: string;
  phone: string;
  status: DoctorStatus;
  todayAppointments: number;
  availableSlots: number;
  openNotes: number;
  nextAvailable: string;
  panelCount: number;
  highRiskPanel: number;
  capacity: number;
  location: string;
  networkStatus: string;
  upcoming: string[];
  focus: string;
};

const initialDoctors: Doctor[] = [
  {
    id: "dr-smith",
    name: "Dr Smith",
    title: "Clinical Psychologist",
    specialty: "Therapy",
    license: "PSY-48291",
    npi: "1847291044",
    email: "dr.smith@ihacareflow.com",
    phone: "(555) 018-1100",
    status: "In Session",
    todayAppointments: 7,
    availableSlots: 2,
    openNotes: 3,
    nextAvailable: "Today 2:30 PM",
    panelCount: 64,
    highRiskPanel: 6,
    capacity: 78,
    location: "Main Clinic",
    networkStatus: "Aetna, Cigna, BCBS",
    upcoming: [
      "10:00 AM - John Doe - Therapy",
      "11:30 AM - Mike Johnson - Lab review",
      "2:30 PM - Open slot",
    ],
    focus: "Anxiety, sleep disruption, trauma-informed therapy.",
  },
  {
    id: "dr-lee",
    name: "Dr Lee",
    title: "Psychiatric Nurse Practitioner",
    specialty: "Medication Management",
    license: "NP-77312",
    npi: "1729304818",
    email: "dr.lee@ihacareflow.com",
    phone: "(555) 019-2220",
    status: "Available",
    todayAppointments: 5,
    availableSlots: 3,
    openNotes: 1,
    nextAvailable: "Today 1:00 PM",
    panelCount: 51,
    highRiskPanel: 3,
    capacity: 62,
    location: "Telehealth",
    networkStatus: "Aetna, UnitedHealthcare",
    upcoming: [
      "9:00 AM - Intake review",
      "11:30 AM - Sarah Kim - Intake",
      "1:00 PM - Open slot",
    ],
    focus: "Medication follow-up, mood symptoms, intake review.",
  },
  {
    id: "dr-ross",
    name: "Dr Ross",
    title: "Integrative Medicine Physician",
    specialty: "Integrative Medicine",
    license: "MD-61028",
    npi: "1882930175",
    email: "dr.ross@ihacareflow.com",
    phone: "(555) 016-7300",
    status: "Available",
    todayAppointments: 4,
    availableSlots: 4,
    openNotes: 0,
    nextAvailable: "Tomorrow 10:00 AM",
    panelCount: 43,
    highRiskPanel: 2,
    capacity: 55,
    location: "Main Clinic",
    networkStatus: "BCBS, Self-pay",
    upcoming: [
      "1:00 PM - Avery Johnson - Follow-up",
      "3:00 PM - Taylor Smith - Follow-up",
      "4:00 PM - Open slot",
    ],
    focus: "Whole-person care, labs, fatigue, medication review.",
  },
  {
    id: "dr-maria-chen",
    name: "Dr Maria Chen",
    title: "Psychiatrist",
    specialty: "Psychiatry",
    license: "MD-90441",
    npi: "1902847291",
    email: "maria.chen@ihacareflow.com",
    phone: "(555) 014-6120",
    status: "Credentialing",
    todayAppointments: 0,
    availableSlots: 0,
    openNotes: 0,
    nextAvailable: "Pending credentialing",
    panelCount: 0,
    highRiskPanel: 0,
    capacity: 0,
    location: "Pending assignment",
    networkStatus: "Credentialing in progress",
    upcoming: [
      "Credentialing review",
      "Insurance panel setup",
      "Schedule template pending",
    ],
    focus: "Psychiatry and medication management.",
  },
];

const statusStyles: Record<DoctorStatus, string> = {
  Available: "border-emerald-200 bg-emerald-50 text-emerald-700",
  "In Session": "border-sky-200 bg-sky-50 text-sky-700",
  "Out Today": "border-slate-200 bg-slate-50 text-slate-600",
  Credentialing: "border-amber-200 bg-amber-50 text-amber-700",
};

const specialties = [
  "Therapy",
  "Medication Management",
  "Integrative Medicine",
  "Psychiatry",
  "Primary Care",
];
const statuses: DoctorStatus[] = [
  "Available",
  "In Session",
  "Out Today",
  "Credentialing",
];

export default function DoctorsPage() {
  const [doctors, setDoctors] = React.useState(initialDoctors);
  const [activeDoctorId, setActiveDoctorId] = React.useState(
    initialDoctors[0].id,
  );
  const [search, setSearch] = React.useState("");
  const [specialtyFilter, setSpecialtyFilter] = React.useState("All Specialties");
  const [statusFilter, setStatusFilter] = React.useState("All Statuses");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [draft, setDraft] = React.useState({
    name: "",
    title: "",
    specialty: "Therapy",
    email: "",
    phone: "",
    license: "",
    npi: "",
    status: "Available" as DoctorStatus,
  });

  const filteredDoctors = doctors.filter((doctor) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      doctor.name.toLowerCase().includes(query) ||
      doctor.specialty.toLowerCase().includes(query) ||
      doctor.email.toLowerCase().includes(query) ||
      doctor.location.toLowerCase().includes(query);
    const matchesSpecialty =
      specialtyFilter === "All Specialties" ||
      doctor.specialty === specialtyFilter;
    const matchesStatus =
      statusFilter === "All Statuses" || doctor.status === statusFilter;

    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const activeDoctor =
    doctors.find((doctor) => doctor.id === activeDoctorId) ?? doctors[0];

  const summaryCards = [
    {
      label: "Active doctors",
      value: doctors
        .filter((doctor) => doctor.status !== "Credentialing")
        .length.toString(),
      note: "Available for care workflows",
      icon: IconStethoscope,
    },
    {
      label: "Visits today",
      value: doctors
        .reduce((total, doctor) => total + doctor.todayAppointments, 0)
        .toString(),
      note: "Across provider schedules",
      icon: IconCalendarStats,
    },
    {
      label: "Open notes",
      value: doctors
        .reduce((total, doctor) => total + doctor.openNotes, 0)
        .toString(),
      note: "Need completion or signature",
      icon: IconFileText,
    },
    {
      label: "Available slots",
      value: doctors
        .reduce((total, doctor) => total + doctor.availableSlots, 0)
        .toString(),
      note: "Capacity for new appointments",
      icon: IconClockHour4,
    },
  ];

  function createDoctor() {
    if (!draft.name.trim()) return;

    const doctor: Doctor = {
      id: `doctor-${Date.now()}`,
      name: draft.name.trim(),
      title: draft.title || "Provider",
      specialty: draft.specialty,
      license: draft.license || "Pending",
      npi: draft.npi || "Pending",
      email: draft.email || "Not entered",
      phone: draft.phone || "Not entered",
      status: draft.status,
      todayAppointments: 0,
      availableSlots: draft.status === "Credentialing" ? 0 : 4,
      openNotes: 0,
      nextAvailable:
        draft.status === "Credentialing"
          ? "Pending credentialing"
          : "Schedule template needed",
      panelCount: 0,
      highRiskPanel: 0,
      capacity: 0,
      location: "Pending assignment",
      networkStatus:
        draft.status === "Credentialing"
          ? "Credentialing in progress"
          : "Network setup needed",
      upcoming: ["Schedule template needed", "Panel assignment pending"],
      focus: `${draft.specialty} care.`,
    };

    setDoctors((current) => [doctor, ...current]);
    setActiveDoctorId(doctor.id);
    setDialogOpen(false);
    setDraft({
      name: "",
      title: "",
      specialty: "Therapy",
      email: "",
      phone: "",
      license: "",
      npi: "",
      status: "Available",
    });
  }

  return (
    <div className="flex h-[calc(100svh-var(--header-height)-2rem)] min-h-[720px] flex-col gap-3 md:h-[calc(100svh-var(--header-height)-3rem)]">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Doctors & Providers
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage provider profiles, schedule capacity, open notes, and care
            team availability.
          </p>
        </div>
        <NewDoctorDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          draft={draft}
          onDraftChange={setDraft}
          onCreate={createDoctor}
        />
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
                <h3 className="font-semibold">Provider directory</h3>
                <p className="text-muted-foreground text-sm">
                  {filteredDoctors.length} matching providers
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative sm:w-72">
                  <IconSearch className="text-muted-foreground absolute left-3 top-2.5 size-4" />
                  <Input
                    className="pl-9"
                    placeholder="Search doctors"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
                <Select
                  value={specialtyFilter}
                  onValueChange={setSpecialtyFilter}
                >
                  <SelectTrigger className="w-full sm:w-52">
                    <SelectValue placeholder="Specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Specialties">
                      All specialties
                    </SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/80">
                <TableRow>
                  <TableHead>Doctor</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Specialty
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">
                    Today
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Next available
                  </TableHead>
                  <TableHead>Open notes</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDoctors.map((doctor) => (
                  <TableRow
                    key={doctor.id}
                    data-state={
                      doctor.id === activeDoctor.id ? "selected" : undefined
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <DoctorAvatar name={doctor.name} />
                        <div>
                          <p className="font-medium">{doctor.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {doctor.title}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>{doctor.specialty}</div>
                      <div className="text-muted-foreground text-xs">
                        {doctor.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusStyles[doctor.status]}
                      >
                        {doctor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {doctor.todayAppointments} visits
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {doctor.nextAvailable}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          doctor.openNotes
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }
                      >
                        {doctor.openNotes}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={
                          doctor.id === activeDoctor.id ? "default" : "outline"
                        }
                        onClick={() => setActiveDoctorId(doctor.id)}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredDoctors.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-muted-foreground h-24 text-center"
                    >
                      No providers match this search.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </section>

        <DoctorProfilePanel doctor={activeDoctor} />
      </div>
    </div>
  );
}

function NewDoctorDialog({
  open,
  onOpenChange,
  draft,
  onDraftChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: {
    name: string;
    title: string;
    specialty: string;
    email: string;
    phone: string;
    license: string;
    npi: string;
    status: DoctorStatus;
  };
  onDraftChange: React.Dispatch<
    React.SetStateAction<{
      name: string;
      title: string;
      specialty: string;
      email: string;
      phone: string;
      license: string;
      npi: string;
      status: DoctorStatus;
    }>
  >;
  onCreate: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <IconUserPlus />
          New doctor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New doctor profile</DialogTitle>
          <DialogDescription>
            Add a provider record for scheduling capacity, notes ownership, and
            patient panel assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Name"
            value={draft.name}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, name: value }))
            }
          />
          <TextField
            label="Title"
            value={draft.title}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, title: value }))
            }
          />
          <SelectField
            label="Specialty"
            value={draft.specialty}
            items={specialties}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, specialty: value }))
            }
          />
          <SelectField
            label="Status"
            value={draft.status}
            items={statuses}
            onChange={(value) =>
              onDraftChange((current) => ({
                ...current,
                status: value as DoctorStatus,
              }))
            }
          />
          <TextField
            label="Email"
            type="email"
            value={draft.email}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, email: value }))
            }
          />
          <TextField
            label="Phone"
            value={draft.phone}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, phone: value }))
            }
          />
          <TextField
            label="License"
            value={draft.license}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, license: value }))
            }
          />
          <TextField
            label="NPI"
            value={draft.npi}
            onChange={(value) =>
              onDraftChange((current) => ({ ...current, npi: value }))
            }
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate}>Create doctor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DoctorProfilePanel({ doctor }: { doctor: Doctor }) {
  return (
    <aside className="hidden min-h-0 overflow-y-auto rounded-lg border bg-card p-4 xl:block">
      <div className="mb-5 flex items-center gap-3">
        <DoctorAvatar name={doctor.name} size="lg" />
        <div>
          <h3 className="text-lg font-semibold">{doctor.name}</h3>
          <p className="text-muted-foreground text-sm">{doctor.title}</p>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <Badge variant="outline" className={statusStyles[doctor.status]}>
          {doctor.status}
        </Badge>
        <Badge variant="outline">
          {doctor.specialty}
        </Badge>
      </div>

      <div className="grid gap-4">
        <PanelSection title="Contact and credentials">
          <DetailLine icon={IconMail} label="Email" value={doctor.email} />
          <DetailLine icon={IconPhone} label="Phone" value={doctor.phone} />
          <DetailLine
            icon={IconCertificate}
            label="License"
            value={doctor.license}
          />
          <DetailText label="NPI" value={doctor.npi} />
          <DetailText label="Networks" value={doctor.networkStatus} />
        </PanelSection>

        <PanelSection title="Capacity">
          <div className="rounded-md border bg-muted/35 p-3">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Schedule load</span>
              <span className="font-medium">{doctor.capacity}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary"
                style={{ width: `${doctor.capacity}%` }}
              />
            </div>
          </div>
          <DetailText
            label="Today"
            value={`${doctor.todayAppointments} visits`}
          />
          <DetailText
            label="Available slots"
            value={doctor.availableSlots.toString()}
          />
          <DetailText label="Next available" value={doctor.nextAvailable} />
          <DetailText label="Open notes" value={doctor.openNotes.toString()} />
        </PanelSection>

        <PanelSection title="Patient panel">
          <DetailText label="Assigned patients" value={doctor.panelCount.toString()} />
          <DetailText
            label="High-risk patients"
            value={doctor.highRiskPanel.toString()}
          />
          <p className="text-muted-foreground text-sm">{doctor.focus}</p>
        </PanelSection>

        <PanelSection title="Today's workflow">
          {doctor.upcoming.map((item) => (
            <div
              key={item}
              className="rounded-md border bg-muted/35 px-3 py-2 text-sm"
            >
              {item}
            </div>
          ))}
        </PanelSection>

        <PanelSection title="Quick actions">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start">
              <IconCalendarStats />
              Schedule
            </Button>
            <Button variant="outline" className="justify-start">
              <IconUsersGroup />
              Panel
            </Button>
            <Button variant="outline" className="justify-start">
              <IconFileText />
              Notes
            </Button>
            <Button variant="outline" className="justify-start">
              <IconBuildingHospital />
              Network
            </Button>
          </div>
        </PanelSection>
      </div>
    </aside>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DoctorAvatar({
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
  icon: typeof IconMail;
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
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .replace(/^dr\.?\s+/i, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
