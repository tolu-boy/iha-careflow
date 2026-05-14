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
import {
  addDoc,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth, db } from "@/lib/firebase";

type AppointmentStatus = "Pending" | "Confirmed" | "Cancelled";
type ViewMode = "Day" | "Week" | "Month";
type DisplayMode = "Calendar" | "Table";
type RiskLevel = "Low" | "Medium" | "High";

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
  risk: RiskLevel;
  reason: string;
  billing: string;
  notes: string;
  message: string;
  reminderSentAt?: string;
};

type AppointmentForm = {
  patient: string;
  provider: string;
  date: string;
  time: string;
  type: string;
};

type SelectOption = {
  value: string;
  label: string;
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
const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const mayStartOffset = 5;
const monthDays = Array.from({ length: 31 }, (_, index) => {
  const date = index + 1;

  return {
    date,
    label: weekdayLabels[(mayStartOffset + index) % 7],
  };
});

const timeSlots = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:30 AM",
  "1:00 PM",
  "2:30 PM",
  "4:00 PM",
];

const providers = ["All Providers", "Dr Smith", "Dr Lee", "Dr Ross"];
const demoPatientNames = [
  "John Doe",
  "Sarah Kim",
  "Mike Johnson",
  "Avery Johnson",
  "Morgan Lee",
];
const visitTypes = ["Therapy", "Intake", "Lab review", "Follow-up"];

const dateOptions: SelectOption[] = monthDays.map((day) => ({
  value: String(day.date),
  label: `${day.label}, May ${day.date}`,
}));

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

const riskStyles: Record<RiskLevel, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-red-200 bg-red-50 text-red-700",
};

const initialForm: AppointmentForm = {
  patient: demoPatientNames[0],
  provider: "Dr Smith",
  date: "13",
  time: "2:30 PM",
  type: visitTypes[0],
};

export default function SchedulingPage() {
  const activeAppointmentIdRef = React.useRef("");
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [patientNames, setPatientNames] = React.useState(demoPatientNames);
  const [activeAppointmentId, setActiveAppointmentId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState<ViewMode>("Week");
  const [displayMode, setDisplayMode] = React.useState<DisplayMode>("Calendar");
  const [selectedDate, setSelectedDate] = React.useState(13);
  const [providerFilter, setProviderFilter] = React.useState("All Providers");
  const [newDialogOpen, setNewDialogOpen] = React.useState(false);
  const [newForm, setNewForm] = React.useState<AppointmentForm>(initialForm);

  React.useEffect(() => {
    activeAppointmentIdRef.current = activeAppointmentId;
  }, [activeAppointmentId]);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "appointments"),
      (snapshot) => {
        const nextAppointments = snapshot.docs
          .map((snapshotDoc) =>
            toAppointment(snapshotDoc.id, snapshotDoc.data()),
          )
          .sort((first, second) => {
            const dateDelta = first.date - second.date;
            return dateDelta || getTimeIndex(first.time) - getTimeIndex(second.time);
          });

        setAppointments(nextAppointments);
        setIsLoading(false);

        const activeExists = nextAppointments.some(
          (appointment) => appointment.id === activeAppointmentIdRef.current,
        );

        if (
          (!activeAppointmentIdRef.current || !activeExists) &&
          nextAppointments[0]
        ) {
          activeAppointmentIdRef.current = nextAppointments[0].id;
          setActiveAppointmentId(nextAppointments[0].id);
          setSelectedDate(nextAppointments[0].date);
        }
      },
      () => {
        setIsLoading(false);
        toast.error("Unable to load appointments", {
          description: "Check appointment permissions and try again.",
        });
      },
    );

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "patients"), (snapshot) => {
      const firebaseNames = snapshot.docs
        .map((snapshotDoc) => getString(snapshotDoc.data().fullName))
        .filter(Boolean);
      const nextNames = Array.from(new Set([...firebaseNames, ...demoPatientNames]));

      setPatientNames(nextNames);
      setNewForm((current) =>
        nextNames.includes(current.patient)
          ? current
          : { ...current, patient: nextNames[0] ?? demoPatientNames[0] },
      );
    });

    return unsubscribe;
  }, []);

  const visibleAppointments = appointments.filter(
    (appointment) =>
      providerFilter === "All Providers" ||
      appointment.provider === providerFilter,
  );
  const activeAppointment =
    appointments.find((appointment) => appointment.id === activeAppointmentId) ??
    appointments[0] ??
    null;
  const activeDate = selectedDate;
  const calendarDays =
    viewMode === "Day" ? [getDayFromDate(String(activeDate))] : days;
  const rangeAppointments = visibleAppointments.filter((appointment) => {
    if (viewMode === "Day") {
      return appointment.date === activeDate;
    }

    if (viewMode === "Week") {
      return days.some((day) => day.date === appointment.date);
    }

    return appointment.date >= 1 && appointment.date <= 31;
  });
  const pendingReminders = appointments.filter(
    (appointment) =>
      appointment.status === "Pending" &&
      appointment.date === 14 &&
      !appointment.reminderSentAt,
  );

  function updateNewForm(field: keyof AppointmentForm, value: string) {
    setNewForm((current) => ({ ...current, [field]: value }));
  }

  async function createAppointment() {
    const day = getDayFromDate(newForm.date);

    if (hasConflict(appointments, newForm.provider, day.date, newForm.time)) {
      toast.error("Scheduling conflict", {
        description: `${newForm.provider} already has an appointment at ${newForm.time} on ${day.label}.`,
      });
      return;
    }

    try {
      const createdAppointment = await addDoc(collection(db, "appointments"), {
        patient: newForm.patient,
        provider: newForm.provider,
        day: day.label,
        date: day.date,
        time: newForm.time,
        duration: "50 min",
        type: newForm.type,
        status: "Pending",
        risk: newForm.patient === "Mike Johnson" ? "High" : "Medium",
        reason: "New appointment request",
        billing:
          newForm.patient === "Sarah Kim"
            ? "Insurance verification incomplete"
            : "Insurance verified",
        notes: "Not started",
        message: "New appointment created.",
        createdBy: auth.currentUser?.uid ?? null,
        createdByEmail: auth.currentUser?.email ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setActiveAppointmentId(createdAppointment.id);
      setSelectedDate(day.date);
      setNewDialogOpen(false);
      toast.success("Appointment scheduled", {
        description: `${newForm.patient} was added to ${day.label}, May ${day.date}.`,
      });
    } catch {
      toast.error("Appointment was not created", {
        description: "This appointment could not be saved.",
      });
    }
  }

  async function updateStatus(status: AppointmentStatus) {
    if (!activeAppointment) {
      return;
    }

    try {
      await updateDoc(doc(db, "appointments", activeAppointment.id), {
        status,
        updatedAt: serverTimestamp(),
      });

      toast.success(`Appointment ${status.toLowerCase()}`, {
        description: `${activeAppointment.patient}'s appointment was updated.`,
      });
    } catch {
      toast.error("Appointment was not updated", {
        description: "This appointment could not be updated.",
      });
    }
  }

  async function sendReminder(appointment: Appointment) {
    try {
      await updateDoc(doc(db, "appointments", appointment.id), {
        reminderSentAt: new Date().toISOString(),
        message: "Appointment reminder sent.",
        updatedAt: serverTimestamp(),
      });

      toast.success("Reminder sent", {
        description: `${appointment.patient} was sent an appointment reminder.`,
      });
    } catch {
      toast.error("Reminder was not sent", {
        description: "This appointment could not be updated.",
      });
    }
  }

  async function sendAllReminders() {
    if (pendingReminders.length === 0) {
      return;
    }

    await Promise.all(
      pendingReminders.map((appointment) => sendReminder(appointment)),
    );
  }

  async function rescheduleAppointment(form: AppointmentForm) {
    if (!activeAppointment) {
      return;
    }

    const day = getDayFromDate(form.date);

    if (
      hasConflict(
        appointments,
        form.provider,
        day.date,
        form.time,
        activeAppointment.id,
      )
    ) {
      toast.error("Scheduling conflict", {
        description: `${form.provider} already has an appointment at ${form.time} on ${day.label}.`,
      });
      return;
    }

    try {
      await updateDoc(doc(db, "appointments", activeAppointment.id), {
        provider: form.provider,
        day: day.label,
        date: day.date,
        time: form.time,
        type: form.type,
        status: "Pending",
        message: "Appointment rescheduled. Confirmation needed.",
        updatedAt: serverTimestamp(),
      });

      toast.success("Appointment rescheduled", {
        description: `${activeAppointment.patient} moved to ${day.label}, May ${day.date} at ${form.time}.`,
      });
      setSelectedDate(day.date);
    } catch {
      toast.error("Appointment was not rescheduled", {
        description: "This appointment could not be updated.",
      });
    }
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
            open={newDialogOpen}
            onOpenChange={setNewDialogOpen}
            form={newForm}
            patientNames={patientNames}
            onChange={updateNewForm}
            onCreate={createAppointment}
          />
          <div className="flex rounded-md border bg-background p-1">
            {(["Calendar", "Table"] as DisplayMode[]).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={displayMode === mode ? "default" : "ghost"}
                onClick={() => setDisplayMode(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
          <div className="flex rounded-md border bg-background p-1">
            {(["Day", "Week", "Month"] as ViewMode[]).map((mode) => (
              <Button
                key={mode}
                size="sm"
                variant={viewMode === mode ? "default" : "ghost"}
                onClick={() => {
                  setViewMode(mode);
                  if (mode === "Month") setDisplayMode("Table");
                }}
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
            {pendingReminders.length} patients have appointments tomorrow with
            no confirmation. Send reminders?
          </p>
        </div>
        <Button
          size="sm"
          onClick={sendAllReminders}
          disabled={pendingReminders.length === 0}
        >
          {pendingReminders.length === 0 ? "Reminders Sent" : "Send All"}
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 xl:grid-cols-[220px_minmax(0,1fr)_280px]">
        <aside className="hidden min-h-0 overflow-hidden rounded-lg border bg-card xl:flex xl:flex-col">
          <div className="border-b p-4">
            <h3 className="font-semibold">May 2026</h3>
            <p className="text-muted-foreground text-sm">Mini calendar</p>
          </div>
          <MiniCalendar
            selectedDate={activeDate}
            appointmentDates={appointments.map((appointment) => appointment.date)}
            onSelectDate={(date) => {
              setSelectedDate(date);
              setViewMode("Day");
              const appointment = appointments.find((item) => item.date === date);
              if (appointment) setActiveAppointmentId(appointment.id);
            }}
          />
        </aside>

        {displayMode === "Calendar" ? (
          <CalendarGrid
            activeAppointmentId={activeAppointment?.id ?? ""}
            days={calendarDays}
            appointments={visibleAppointments}
            selectedDate={activeDate}
            onSelectAppointment={(appointment) => {
              setActiveAppointmentId(appointment.id);
              setSelectedDate(appointment.date);
            }}
          />
        ) : (
          <AppointmentTable
            appointments={rangeAppointments}
            activeAppointmentId={activeAppointment?.id ?? ""}
            isLoading={isLoading}
            viewMode={viewMode}
            selectedDate={activeDate}
            onSelectAppointment={(appointment) => {
              setActiveAppointmentId(appointment.id);
              setSelectedDate(appointment.date);
            }}
          />
        )}

        {activeAppointment ? (
          <AppointmentDetailPanel
            appointment={activeAppointment}
            patientNames={patientNames}
            onConfirm={() => updateStatus("Confirmed")}
            onCancel={() => updateStatus("Cancelled")}
            onReminder={() => sendReminder(activeAppointment)}
            onReschedule={rescheduleAppointment}
          />
        ) : (
          <aside className="hidden min-h-0 rounded-lg border bg-card p-4 xl:block">
            <h3 className="font-semibold">
              {isLoading ? "Loading appointments..." : "No appointments yet"}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {isLoading
                ? "Loading schedule records."
                : "Create an appointment to start."}
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}

function CalendarGrid({
  days: visibleDays,
  appointments,
  activeAppointmentId,
  selectedDate,
  onSelectAppointment,
}: {
  days: typeof days;
  appointments: Appointment[];
  activeAppointmentId: string;
  selectedDate: number;
  onSelectAppointment: (appointment: Appointment) => void;
}) {
  const gridTemplateColumns = `56px repeat(${visibleDays.length}, minmax(0, 1fr))`;

  return (
    <main className="min-h-0 min-w-0 overflow-hidden rounded-lg border bg-card">
      <div
        className="grid border-b bg-muted/60"
        style={{ gridTemplateColumns }}
      >
        <div className="border-r p-2 text-xs font-medium">Time</div>
        {visibleDays.map((day) => (
          <button
            key={`${day.label}-${day.date}`}
            type="button"
            className={`border-r p-2 text-left text-xs last:border-r-0 ${
              day.date === selectedDate ? "bg-primary/10" : ""
            }`}
          >
            <p className="font-medium">{day.label}</p>
            <p className="text-muted-foreground">May {day.date}</p>
          </button>
        ))}
      </div>
      <div className="max-h-full overflow-auto">
        {timeSlots.map((time) => (
          <div
            key={time}
            className="grid min-h-24 border-b last:border-b-0"
            style={{ gridTemplateColumns }}
          >
            <div className="border-r p-2 text-[11px] leading-tight text-muted-foreground">
              {time}
            </div>
            {visibleDays.map((day) => {
              const slotAppointments = appointments.filter(
                (appointment) =>
                  appointment.date === day.date && appointment.time === time,
              );

              return (
                <div
                  key={`${day.label}-${day.date}-${time}`}
                  className="min-w-0 border-r p-1.5 last:border-r-0"
                >
                  {slotAppointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => onSelectAppointment(appointment)}
                      className={`mb-2 w-full rounded-md border border-l-4 p-2 text-left text-[11px] transition-colors ${
                        blockStyles[appointment.status]
                      } ${
                        appointment.id === activeAppointmentId
                          ? "ring-2 ring-primary/40"
                          : ""
                      }`}
                    >
                      <p className="truncate font-semibold">
                        {appointment.patient}
                      </p>
                      <p className="truncate">{appointment.type}</p>
                      <p className="truncate text-muted-foreground">
                        {appointment.provider}
                      </p>
                      <Badge
                        variant="outline"
                        className={`mt-2 max-w-full truncate ${statusStyles[appointment.status]}`}
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
  );
}

function AppointmentTable({
  appointments,
  activeAppointmentId,
  isLoading,
  viewMode,
  selectedDate,
  onSelectAppointment,
}: {
  appointments: Appointment[];
  activeAppointmentId: string;
  isLoading: boolean;
  viewMode: ViewMode;
  selectedDate: number;
  onSelectAppointment: (appointment: Appointment) => void;
}) {
  const title =
    viewMode === "Day"
      ? `${getDayFromDate(String(selectedDate)).label}, May ${selectedDate}`
      : viewMode === "Week"
        ? "May 11-17"
        : "May 2026";

  return (
    <main className="min-h-0 min-w-0 overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between border-b p-4">
        <div>
          <h3 className="font-semibold">Appointment table</h3>
          <p className="text-muted-foreground text-sm">
            {title} · {appointments.length} appointments
          </p>
        </div>
        <Badge variant="outline">{viewMode}</Badge>
      </div>
      <div className="max-h-full overflow-auto">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.map((appointment) => (
              <TableRow
                key={appointment.id}
                className={`cursor-pointer ${
                  appointment.id === activeAppointmentId ? "bg-primary/5" : ""
                }`}
                onClick={() => onSelectAppointment(appointment)}
              >
                <TableCell>
                  <div className="font-medium">{appointment.patient}</div>
                  <div className="text-muted-foreground text-xs">
                    {appointment.reason}
                  </div>
                </TableCell>
                <TableCell>
                  {appointment.day}, May {appointment.date}
                </TableCell>
                <TableCell>{appointment.time}</TableCell>
                <TableCell>{appointment.provider}</TableCell>
                <TableCell>{appointment.type}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={statusStyles[appointment.status]}
                  >
                    {appointment.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
            {appointments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground h-24 text-center"
                >
                  {isLoading
                    ? "Loading appointments..."
                    : "No appointments match this view."}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </main>
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
  const firstDayOffset = 5;
  const cells = Array.from({ length: 42 }, (_, index) => {
    const date = index - firstDayOffset + 1;
    return date >= 1 && date <= 31 ? date : null;
  });

  return (
    <div className="grid grid-cols-7 gap-1 p-4 text-center text-sm">
      {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
        <div key={`${day}-${index}`} className="text-muted-foreground py-2 text-xs">
          {day}
        </div>
      ))}
      {cells.map((date, index) =>
        date ? (
          <button
            key={date}
            type="button"
            onClick={() => onSelectDate(date)}
            className={`relative rounded-md py-2 text-sm ${
              selectedDate === date
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {date}
            {appointmentDates.includes(date) ? (
              <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current" />
            ) : null}
          </button>
        ) : (
          <div key={`blank-${index}`} aria-hidden="true" />
        ),
      )}
    </div>
  );
}

function AppointmentDetailPanel({
  appointment,
  patientNames,
  onConfirm,
  onCancel,
  onReminder,
  onReschedule,
}: {
  appointment: Appointment;
  patientNames: string[];
  onConfirm: () => void;
  onCancel: () => void;
  onReminder: () => void;
  onReschedule: (form: AppointmentForm) => void;
}) {
  return (
    <aside className="hidden min-h-0 overflow-y-auto rounded-lg border bg-card p-3 xl:block">
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
        <DetailRow
          label="Date"
          value={`${appointment.day}, May ${appointment.date}, 2026`}
        />
        <DetailRow label="Time" value={appointment.time} />
        <DetailRow label="Duration" value={appointment.duration} />
        <DetailRow label="Appointment type" value={appointment.type} />
        <DetailRow label="Provider" value={appointment.provider} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button onClick={onConfirm}>Confirm</Button>
        <RescheduleDialog
          appointment={appointment}
          patientNames={patientNames}
          onReschedule={onReschedule}
        />
        <Button variant="outline" onClick={onCancel}>
          <IconCalendarCancel />
          Cancel
        </Button>
        <Button variant="outline" onClick={onReminder}>
          <IconBellRinging />
          {appointment.reminderSentAt ? "Sent" : "Reminder"}
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
  form,
  patientNames,
  onChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: AppointmentForm;
  patientNames: string[];
  onChange: (field: keyof AppointmentForm, value: string) => void;
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
            Pick an exact calendar date and add the appointment to the week view.
          </DialogDescription>
        </DialogHeader>
        <AppointmentFields
          form={form}
          patientNames={patientNames}
          onChange={onChange}
        />
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

function RescheduleDialog({
  appointment,
  patientNames,
  onReschedule,
}: {
  appointment: Appointment;
  patientNames: string[];
  onReschedule: (form: AppointmentForm) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<AppointmentForm>({
    patient: appointment.patient,
    provider: appointment.provider,
    date: String(appointment.date),
    time: appointment.time,
    type: appointment.type,
  });

  function resetForm() {
    setForm({
      patient: appointment.patient,
      provider: appointment.provider,
      date: String(appointment.date),
      time: appointment.time,
      type: appointment.type,
    });
  }

  function updateField(field: keyof AppointmentForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <IconRefresh />
          Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>
            Move {appointment.patient} to a new date, provider, time, or visit
            type.
          </DialogDescription>
        </DialogHeader>
        <AppointmentFields
          form={form}
          patientNames={patientNames}
          onChange={updateField}
          patientDisabled
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onReschedule(form);
              setOpen(false);
            }}
          >
            Save reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AppointmentFields({
  form,
  patientNames,
  onChange,
  patientDisabled = false,
}: {
  form: AppointmentForm;
  patientNames: string[];
  onChange: (field: keyof AppointmentForm, value: string) => void;
  patientDisabled?: boolean;
}) {
  return (
    <div className="grid gap-4">
      <SelectField
        label="Patient"
        value={form.patient}
        onChange={(value) => onChange("patient", value)}
        items={patientNames.map((name) => ({ value: name, label: name }))}
        disabled={patientDisabled}
      />
      <SelectField
        label="Provider"
        value={form.provider}
        onChange={(value) => onChange("provider", value)}
        items={providers
          .filter((item) => item !== "All Providers")
          .map((provider) => ({ value: provider, label: provider }))}
      />
      <SelectField
        label="Date"
        value={form.date}
        onChange={(value) => onChange("date", value)}
        items={dateOptions}
      />
      <SelectField
        label="Time"
        value={form.time}
        onChange={(value) => onChange("time", value)}
        items={timeSlots.map((time) => ({ value: time, label: time }))}
      />
      <SelectField
        label="Type"
        value={form.type}
        onChange={(value) => onChange("type", value)}
        items={visitTypes.map((type) => ({ value: type, label: type }))}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  items,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: SelectOption[];
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function toAppointment(id: string, data: Record<string, unknown>): Appointment {
  const date = getNumber(data.date, 13);
  const day = getString(data.day, getDayFromDate(String(date)).label);

  return {
    id,
    patient: getString(data.patient, "Unnamed patient"),
    provider: getString(data.provider, "Unassigned"),
    day,
    date,
    time: getString(data.time, "10:00 AM"),
    duration: getString(data.duration, "50 min"),
    type: getString(data.type, "Therapy"),
    status: getStatus(data.status),
    risk: getRisk(data.risk),
    reason: getString(data.reason, "Appointment"),
    billing: getString(data.billing, "Billing not checked"),
    notes: getString(data.notes, "Not started"),
    message: getString(data.message, "No messages."),
    reminderSentAt: getString(data.reminderSentAt),
  };
}

function hasConflict(
  appointments: Appointment[],
  provider: string,
  date: number,
  time: string,
  ignoredId?: string,
) {
  return appointments.some(
    (appointment) =>
      appointment.id !== ignoredId &&
      appointment.status !== "Cancelled" &&
      appointment.provider === provider &&
      appointment.date === date &&
      appointment.time === time,
  );
}

function getDayFromDate(value: string) {
  const date = Number(value);
  return days.find((day) => day.date === date) ?? days[2];
}

function getTimeIndex(time: string) {
  const index = timeSlots.indexOf(time);
  return index === -1 ? 999 : index;
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getStatus(value: unknown): AppointmentStatus {
  if (value === "Pending" || value === "Confirmed" || value === "Cancelled") {
    return value;
  }

  return "Pending";
}

function getRisk(value: unknown): RiskLevel {
  if (value === "Low" || value === "Medium" || value === "High") {
    return value;
  }

  return "Medium";
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
