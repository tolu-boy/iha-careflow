"use client";

import * as React from "react";
import {
  IconBellRinging,
  IconCalendarCancel,
  IconCalendarPlus,
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconMessageCircle,
  IconPlayerPlay,
  IconRefresh,
  IconShieldCheck,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AppointmentStatus = "Pending" | "Confirmed" | "Cancelled";
type ViewMode = "Today" | "Week" | "Month";

type Appointment = {
  id: string;
  patient: string;
  provider: string;
  day: string;
  date: number;
  time: string;
  duration: string;
  type: string;
  status: AppointmentStatus;
  risk: "Low" | "Medium" | "High";
  reason: string;
  billing: string;
  notes: string;
  message: string;
};

const days = [
  { label: "Mon", date: 11 },
  { label: "Tue", date: 12 },
  { label: "Wed", date: 13 },
  { label: "Thu", date: 14 },
  { label: "Fri", date: 15 },
  { label: "Sat", date: 16 },
  { label: "Sun", date: 17 },
];

const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];
const providers = ["All Providers", "Dr Smith", "Dr Lee", "Dr Ross"];
const patients = ["John Doe", "Sarah Kim", "Mike Johnson", "Avery Johnson", "Morgan Lee"];
const visitTypes = ["Therapy", "Intake", "Lab review", "Follow-up"];

const initialAppointments: Appointment[] = [
  {
    id: "john-13",
    patient: "John Doe",
    provider: "Dr Smith",
    day: "Wed",
    date: 13,
    time: "10:00 AM",
    duration: "50 min",
    type: "Therapy",
    status: "Confirmed",
    risk: "Medium",
    reason: "Anxiety and sleep disruption",
    billing: "Insurance verified",
    notes: "SOAP draft ready",
    message: "Sleep symptoms updated this morning.",
  },
  {
    id: "sarah-14",
    patient: "Sarah Kim",
    provider: "Dr Lee",
    day: "Thu",
    date: 14,
    time: "11:30 AM",
    duration: "60 min",
    type: "Intake",
    status: "Pending",
    risk: "Low",
    reason: "Medication follow-up",
    billing: "Insurance verification incomplete",
    notes: "Not started",
    message: "Asked to confirm appointment time.",
  },
  {
    id: "mike-14",
    patient: "Mike Johnson",
    provider: "Dr Smith",
    day: "Thu",
    date: 14,
    time: "10:00 AM",
    duration: "45 min",
    type: "Lab review",
    status: "Pending",
    risk: "High",
    reason: "Sleep disturbance and fatigue",
    billing: "Insurance verified",
    notes: "Template selected",
    message: "Lab results uploaded.",
  },
  {
    id: "avery-15",
    patient: "Avery Johnson",
    provider: "Dr Ross",
    day: "Fri",
    date: 15,
    time: "1:00 PM",
    duration: "30 min",
    type: "Follow-up",
    status: "Confirmed",
    risk: "Low",
    reason: "Medication check",
    billing: "Insurance verified",
    notes: "Open note",
    message: "No new messages.",
  },
  {
    id: "morgan-15",
    patient: "Morgan Lee",
    provider: "Dr Lee",
    day: "Fri",
    date: 15,
    time: "2:30 PM",
    duration: "50 min",
    type: "Therapy",
    status: "Cancelled",
    risk: "Medium",
    reason: "Depressed mood",
    billing: "Insurance verified",
    notes: "Cancellation note needed",
    message: "Cancelled through portal.",
  },
];

const statusStyles: Record<AppointmentStatus, string> = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-red-200 bg-red-50 text-red-700",
};

const blockStyles: Record<AppointmentStatus, string> = {
  Pending: "border-l-amber-500 bg-amber-50 hover:bg-amber-100",
  Confirmed: "border-l-emerald-500 bg-emerald-50 hover:bg-emerald-100",
  Cancelled: "border-l-red-500 bg-red-50 hover:bg-red-100",
};

const riskStyles: Record<Appointment["risk"], string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-red-200 bg-red-50 text-red-700",
};

export default function SchedulingPage() {
  const [appointments, setAppointments] = React.useState(initialAppointments);
  const [activeAppointmentId, setActiveAppointmentId] = React.useState(
    initialAppointments[0].id,
  );
  const [viewMode, setViewMode] = React.useState<ViewMode>("Week");
  const [providerFilter, setProviderFilter] = React.useState("All Providers");
  const [remindersSent, setRemindersSent] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [newPatient, setNewPatient] = React.useState(patients[0]);
  const [newProvider, setNewProvider] = React.useState("Dr Smith");
  const [newDay, setNewDay] = React.useState("Wed");
  const [newTime, setNewTime] = React.useState("2:30 PM");
  const [newType, setNewType] = React.useState(visitTypes[0]);

  const visibleAppointments = appointments.filter(
    (appointment) =>
      providerFilter === "All Providers" ||
      appointment.provider === providerFilter,
  );
  const activeAppointment =
    appointments.find((appointment) => appointment.id === activeAppointmentId) ??
    appointments[0];

  function createAppointment() {
    const day = days.find((item) => item.label === newDay) ?? days[2];
    const appointment: Appointment = {
      id: `appt-${Date.now()}`,
      patient: newPatient,
      provider: newProvider,
      day: day.label,
      date: day.date,
      time: newTime,
      duration: "50 min",
      type: newType,
      status: "Pending",
      risk: newPatient === "Mike Johnson" ? "High" : "Medium",
      reason: "New appointment request",
      billing: newPatient === "Sarah Kim" ? "Insurance verification incomplete" : "Insurance verified",
      notes: "Not started",
      message: "New appointment created.",
    };

    setAppointments((current) => [appointment, ...current]);
    setActiveAppointmentId(appointment.id);
    setDialogOpen(false);
  }

  function updateStatus(status: AppointmentStatus) {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === activeAppointment.id
          ? { ...appointment, status }
          : appointment,
      ),
    );
  }

  return (
    <div className="flex h-[calc(100svh-var(--header-height)-2rem)] min-h-[700px] flex-col gap-3 md:h-[calc(100svh-var(--header-height)-3rem)]">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Scheduling Dashboard
          </h2>
          <p className="text-muted-foreground text-sm">
            Calendar-first scheduling with provider filters, appointment details,
            and reminder automation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NewAppointmentDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            patient={newPatient}
            provider={newProvider}
            day={newDay}
            time={newTime}
            type={newType}
            onPatientChange={setNewPatient}
            onProviderChange={setNewProvider}
            onDayChange={setNewDay}
            onTimeChange={setNewTime}
            onTypeChange={setNewType}
            onCreate={createAppointment}
          />
          <div className="flex rounded-md border bg-background p-1">
            {(["Today", "Week", "Month"] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={viewMode === mode ? "default" : "ghost"}
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="icon">
            <IconChevronLeft />
          </Button>
          <Button variant="outline" size="icon">
            <IconChevronRight />
          </Button>
          <Select value={providerFilter} onValueChange={setProviderFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((provider) => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
        <div className="flex items-center gap-3">
          <IconBellRinging className="size-5" />
          <p className="text-sm font-medium">
            5 patients have appointments tomorrow with no confirmation. Send reminders?
          </p>
        </div>
        <Button size="sm" onClick={() => setRemindersSent(true)}>
          {remindersSent ? "Reminders Sent" : "Send All"}
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[250px_minmax(0,1fr)_320px]">
        <aside className="hidden min-h-0 overflow-hidden rounded-lg border bg-card xl:flex xl:flex-col">
          <div className="border-b p-4">
            <h3 className="font-semibold">May 2026</h3>
            <p className="text-muted-foreground text-sm">Mini calendar</p>
          </div>
          <MiniCalendar
            selectedDate={activeAppointment.date}
            appointmentDates={appointments.map((appointment) => appointment.date)}
            onSelectDate={(date) => {
              const appointment = appointments.find((item) => item.date === date);
              if (appointment) setActiveAppointmentId(appointment.id);
            }}
          />
        </aside>

        <main className="min-h-0 overflow-hidden rounded-lg border bg-card">
          <div className="grid grid-cols-[72px_repeat(7,minmax(120px,1fr))] border-b bg-muted/60">
            <div className="border-r p-3 text-sm font-medium">Time</div>
            {days.map((day) => (
              <button
                key={day.label}
                type="button"
                className={`border-r p-3 text-left text-sm last:border-r-0 ${
                  day.date === activeAppointment.date ? "bg-primary/10" : ""
                }`}
              >
                <p className="font-medium">{day.label}</p>
                <p className="text-muted-foreground">{day.date}</p>
              </button>
            ))}
          </div>
          <div className="max-h-full overflow-auto">
            {timeSlots.map((time) => (
              <div
                key={time}
                className="grid min-h-24 grid-cols-[72px_repeat(7,minmax(120px,1fr))] border-b last:border-b-0"
              >
                <div className="border-r p-3 text-xs text-muted-foreground">
                  {time}
                </div>
                {days.map((day) => {
                  const slotAppointments = visibleAppointments.filter(
                    (appointment) =>
                      appointment.day === day.label && appointment.time === time,
                  );

                  return (
                    <div key={`${day.label}-${time}`} className="border-r p-2 last:border-r-0">
                      {slotAppointments.map((appointment) => (
                        <button
                          key={appointment.id}
                          type="button"
                          onClick={() => setActiveAppointmentId(appointment.id)}
                          className={`mb-2 w-full rounded-md border border-l-4 p-2 text-left text-xs transition-colors ${
                            blockStyles[appointment.status]
                          } ${
                            appointment.id === activeAppointment.id
                              ? "ring-2 ring-primary/40"
                              : ""
                          }`}
                        >
                          <p className="font-semibold">{appointment.patient}</p>
                          <p>{appointment.type}</p>
                          <p className="text-muted-foreground">{appointment.provider}</p>
                          <Badge
                            variant="outline"
                            className={`mt-2 ${statusStyles[appointment.status]}`}
                          >
                            {appointment.status}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </main>

        <AppointmentDetailPanel
          appointment={activeAppointment}
          onConfirm={() => updateStatus("Confirmed")}
          onCancel={() => updateStatus("Cancelled")}
        />
      </div>
    </div>
  );
}

function MiniCalendar({
  selectedDate,
  appointmentDates,
  onSelectDate,
}: {
  selectedDate: number;
  appointmentDates: number[];
  onSelectDate: (date: number) => void;
}) {
  const dates = Array.from({ length: 35 }, (_, index) => index + 1);

  return (
    <div className="grid grid-cols-7 gap-1 p-4 text-center text-sm">
      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
        <div key={`${day}-${index}`} className="text-muted-foreground py-2 text-xs">
          {day}
        </div>
      ))}
      {dates.map((date) => {
        const hasAppointment = appointmentDates.includes(date);
        const selected = selectedDate === date;

        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelectDate(date)}
            className={`relative rounded-md py-2 text-sm ${
              selected
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {date}
            {hasAppointment ? (
              <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function AppointmentDetailPanel({
  appointment,
  onConfirm,
  onCancel,
}: {
  appointment: Appointment;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <aside className="hidden min-h-0 overflow-y-auto rounded-lg border bg-card p-4 xl:block">
      <div className="mb-5 flex items-center gap-3">
        <PatientAvatar name={appointment.patient} />
        <div>
          <h3 className="font-semibold">{appointment.patient}</h3>
          <p className="text-muted-foreground text-sm">{appointment.reason}</p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="outline" className={statusStyles[appointment.status]}>
          {appointment.status}
        </Badge>
        <Badge variant="outline" className={riskStyles[appointment.risk]}>
          Risk: {appointment.risk}
        </Badge>
      </div>
      <div className="grid gap-4 text-sm">
        <DetailRow label="Date" value={`${appointment.date}`} />
        <DetailRow label="Time" value={appointment.time} />
        <DetailRow label="Duration" value={appointment.duration} />
        <DetailRow label="Appointment type" value={appointment.type} />
        <DetailRow label="Provider" value={appointment.provider} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button onClick={onConfirm}>Confirm</Button>
        <Button variant="outline">
          <IconRefresh />
          Reschedule
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <IconCalendarCancel />
          Cancel
        </Button>
        <Button variant="outline">
          <IconBellRinging />
          Reminder
        </Button>
      </div>
      <div className="mt-5 rounded-lg border bg-muted/35 p-3">
        <p className="mb-3 font-medium">Quick links</p>
        <div className="grid gap-2">
          <Button variant="outline" className="justify-start">
            <IconPlayerPlay />
            Start Session
          </Button>
          <Button variant="outline" className="justify-start">
            <IconFileText />
            Start note
          </Button>
          <Button variant="outline" className="justify-start">
            <IconMessageCircle />
            Message patient
          </Button>
          <Button variant="outline" className="justify-start">
            <IconShieldCheck />
            View billing
          </Button>
        </div>
      </div>
    </aside>
  );
}

function NewAppointmentDialog({
  open,
  onOpenChange,
  patient,
  provider,
  day,
  time,
  type,
  onPatientChange,
  onProviderChange,
  onDayChange,
  onTimeChange,
  onTypeChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: string;
  provider: string;
  day: string;
  time: string;
  type: string;
  onPatientChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  onDayChange: (value: string) => void;
  onTimeChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onCreate: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <IconCalendarPlus />
          New appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New appointment</DialogTitle>
          <DialogDescription>
            Add the appointment directly to the weekly calendar.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <SelectField label="Patient" value={patient} onChange={onPatientChange} items={patients} />
          <SelectField label="Provider" value={provider} onChange={onProviderChange} items={providers.filter((item) => item !== "All Providers")} />
          <SelectField label="Day" value={day} onChange={onDayChange} items={days.map((item) => item.label)} />
          <SelectField label="Time" value={time} onChange={onTimeChange} items={timeSlots} />
          <SelectField label="Type" value={type} onChange={onTypeChange} items={visitTypes} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate}>Create appointment</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SelectField({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: string[];
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

function PatientAvatar({ name }: { name: string }) {
  return (
    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
