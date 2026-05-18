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
  dateKey: string;
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

type CalendarDay = {
  dateKey: string;
  label: string;
  dayNumber: number;
  monthLabel: string;
  isCurrentMonth: boolean;
  isPast: boolean;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const todayKey = getDateKey(new Date());
const tomorrowKey = addDays(todayKey, 1);

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
  date: todayKey,
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
  const [selectedDateKey, setSelectedDateKey] = React.useState(todayKey);
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
            const dateDelta = first.dateKey.localeCompare(second.dateKey);
            return dateDelta || getTimeIndex(first.time) - getTimeIndex(second.time);
          });

        setAppointments(nextAppointments);
        setIsLoading(false);

        const activeExists = nextAppointments.some(
          (appointment) => appointment.id === activeAppointmentIdRef.current,
        );

        if (!activeAppointmentIdRef.current || !activeExists) {
          const nextUpcomingAppointment =
            nextAppointments.find(
              (appointment) => appointment.dateKey >= todayKey,
            ) ?? null;

          activeAppointmentIdRef.current = nextUpcomingAppointment?.id ?? "";
          setActiveAppointmentId(nextUpcomingAppointment?.id ?? "");
          setSelectedDateKey(nextUpcomingAppointment?.dateKey ?? todayKey);
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
    null;
  const activeDateKey = selectedDateKey;
  const visibleMonth = parseDateKey(activeDateKey);
  const calendarDays =
    viewMode === "Day" ? [getCalendarDay(activeDateKey)] : getWeekDays(activeDateKey);
  const monthCalendarDays = getMonthCalendarDays(activeDateKey);
  const activeMonthKey = activeDateKey.slice(0, 7);
  const weekDateKeys = new Set(calendarDays.map((day) => day.dateKey));
  const rangeAppointments = visibleAppointments.filter((appointment) => {
    if (viewMode === "Day") {
      return appointment.dateKey === activeDateKey;
    }

    if (viewMode === "Week") {
      return weekDateKeys.has(appointment.dateKey);
    }

    return appointment.dateKey.startsWith(activeMonthKey);
  });
  const pendingReminders = appointments.filter(
    (appointment) =>
      appointment.status === "Pending" &&
      appointment.dateKey === tomorrowKey &&
      !appointment.reminderSentAt,
  );

  function updateNewForm(field: keyof AppointmentForm, value: string) {
    setNewForm((current) => ({ ...current, [field]: value }));
  }

  function moveVisibleDate(direction: -1 | 1) {
    const nextDateKey =
      viewMode === "Day"
        ? addDays(activeDateKey, direction)
        : viewMode === "Week"
          ? addDays(activeDateKey, direction * 7)
          : addMonths(activeDateKey, direction);

    setSelectedDateKey(nextDateKey);
  }

  function jumpToDate(dateKey: string) {
    if (!isDateKey(dateKey)) return;

    setSelectedDateKey(dateKey);
  }

  async function createAppointment() {
    if (isBeforeTodayKey(newForm.date)) {
      toast.error("Past dates cannot be booked", {
        description: "Choose today or a future date for this appointment.",
      });
      return;
    }

    const day = getCalendarDay(newForm.date);

    if (hasConflict(appointments, newForm.provider, day.dateKey, newForm.time)) {
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
        date: day.dayNumber,
        dateKey: day.dateKey,
        month: parseDateKey(day.dateKey).getMonth() + 1,
        year: parseDateKey(day.dateKey).getFullYear(),
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
      setSelectedDateKey(day.dateKey);
      setNewDialogOpen(false);
      toast.success("Appointment scheduled", {
        description: `${newForm.patient} was added to ${formatFullDate(day.dateKey)}.`,
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

    if (isBeforeTodayKey(form.date)) {
      toast.error("Past dates cannot be booked", {
        description: "Choose today or a future date for this appointment.",
      });
      return;
    }

    const day = getCalendarDay(form.date);

    if (
      hasConflict(
        appointments,
        form.provider,
        day.dateKey,
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
        date: day.dayNumber,
        dateKey: day.dateKey,
        month: parseDateKey(day.dateKey).getMonth() + 1,
        year: parseDateKey(day.dateKey).getFullYear(),
        time: form.time,
        type: form.type,
        status: "Pending",
        message: "Appointment rescheduled. Confirmation needed.",
        updatedAt: serverTimestamp(),
      });

      toast.success("Appointment rescheduled", {
        description: `${activeAppointment.patient} moved to ${formatFullDate(day.dateKey)} at ${form.time}.`,
      });
      setSelectedDateKey(day.dateKey);
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
          <Button variant="outline" onClick={() => setSelectedDateKey(todayKey)}>
            Today
          </Button>
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
                }}
              >
                {mode}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="icon" onClick={() => moveVisibleDate(-1)}>
            <IconChevronLeft />
          </Button>
          <Button variant="outline" size="icon" onClick={() => moveVisibleDate(1)}>
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
            <h3 className="font-semibold">{formatMonthYear(visibleMonth)}</h3>
            <p className="text-muted-foreground text-sm">Calendar navigator</p>
          </div>
          <MiniCalendar
            selectedDateKey={activeDateKey}
            monthDate={visibleMonth}
            appointmentDateKeys={appointments.map((appointment) => appointment.dateKey)}
            onPreviousMonth={() => setSelectedDateKey(addMonths(activeDateKey, -1))}
            onNextMonth={() => setSelectedDateKey(addMonths(activeDateKey, 1))}
            onToday={() => setSelectedDateKey(todayKey)}
            onSelectDate={(dateKey) => {
              setSelectedDateKey(dateKey);
              setViewMode("Day");
              const appointment = appointments.find((item) => item.dateKey === dateKey);
              if (appointment) setActiveAppointmentId(appointment.id);
            }}
          />
        </aside>

        {displayMode === "Calendar" && viewMode === "Month" ? (
          <MonthCalendar
            days={monthCalendarDays}
            appointments={visibleAppointments}
            activeAppointmentId={activeAppointment?.id ?? ""}
            selectedDateKey={activeDateKey}
            onPrevious={() => moveVisibleDate(-1)}
            onNext={() => moveVisibleDate(1)}
            onToday={() => setSelectedDateKey(todayKey)}
            onJumpToDate={jumpToDate}
            onSelectDate={setSelectedDateKey}
            onSelectAppointment={(appointment) => {
              setActiveAppointmentId(appointment.id);
              setSelectedDateKey(appointment.dateKey);
            }}
          />
        ) : displayMode === "Calendar" ? (
          <CalendarGrid
            activeAppointmentId={activeAppointment?.id ?? ""}
            days={calendarDays}
            appointments={visibleAppointments}
            selectedDateKey={activeDateKey}
            viewMode={viewMode}
            onPrevious={() => moveVisibleDate(-1)}
            onNext={() => moveVisibleDate(1)}
            onToday={() => setSelectedDateKey(todayKey)}
            onJumpToDate={jumpToDate}
            onSelectDate={setSelectedDateKey}
            onSelectAppointment={(appointment) => {
              setActiveAppointmentId(appointment.id);
              setSelectedDateKey(appointment.dateKey);
            }}
          />
        ) : (
          <AppointmentTable
            appointments={rangeAppointments}
            activeAppointmentId={activeAppointment?.id ?? ""}
            isLoading={isLoading}
            viewMode={viewMode}
            selectedDateKey={activeDateKey}
            onSelectAppointment={(appointment) => {
              setActiveAppointmentId(appointment.id);
              setSelectedDateKey(appointment.dateKey);
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
  selectedDateKey,
  viewMode,
  onPrevious,
  onNext,
  onToday,
  onJumpToDate,
  onSelectDate,
  onSelectAppointment,
}: {
  days: CalendarDay[];
  appointments: Appointment[];
  activeAppointmentId: string;
  selectedDateKey: string;
  viewMode: ViewMode;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onJumpToDate: (dateKey: string) => void;
  onSelectDate: (dateKey: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
}) {
  const gridTemplateColumns = `56px repeat(${visibleDays.length}, minmax(0, 1fr))`;

  return (
    <main className="min-h-0 min-w-0 overflow-hidden rounded-lg border bg-card">
      <CalendarNavigationHeader
        title={getViewTitle(viewMode, selectedDateKey)}
        viewMode={viewMode}
        selectedDateKey={selectedDateKey}
        onPrevious={onPrevious}
        onNext={onNext}
        onToday={onToday}
        onJumpToDate={onJumpToDate}
      />
      <div
        className="grid border-b bg-muted/60"
        style={{ gridTemplateColumns }}
      >
        <div className="border-r p-2 text-xs font-medium">Time</div>
        {visibleDays.map((day) => (
          <button
            key={day.dateKey}
            type="button"
            onClick={() => onSelectDate(day.dateKey)}
            className={`border-r p-2 text-left text-xs last:border-r-0 ${
              day.dateKey === selectedDateKey ? "bg-primary/10" : ""
            }`}
          >
            <p className="font-medium">{day.label}</p>
            <p className="text-muted-foreground">
              {day.monthLabel} {day.dayNumber}
            </p>
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
                  appointment.dateKey === day.dateKey &&
                  appointment.time === time,
              );

              return (
                <div
                  key={`${day.dateKey}-${time}`}
                  onClick={() => onSelectDate(day.dateKey)}
                  className="min-w-0 border-r p-1.5 last:border-r-0"
                >
                  {slotAppointments.map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onSelectAppointment(appointment);
                      }}
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
  selectedDateKey,
  onSelectAppointment,
}: {
  appointments: Appointment[];
  activeAppointmentId: string;
  isLoading: boolean;
  viewMode: ViewMode;
  selectedDateKey: string;
  onSelectAppointment: (appointment: Appointment) => void;
}) {
  const weekDays = getWeekDays(selectedDateKey);
  const title =
    viewMode === "Day"
      ? formatFullDate(selectedDateKey)
      : viewMode === "Week"
        ? `${formatShortMonthDay(weekDays[0].dateKey)} - ${formatShortMonthDay(
            weekDays[6].dateKey,
          )}`
        : formatMonthYear(parseDateKey(selectedDateKey));

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
                <TableCell>{formatFullDate(appointment.dateKey)}</TableCell>
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

function CalendarNavigationHeader({
  title,
  viewMode,
  selectedDateKey,
  onPrevious,
  onNext,
  onToday,
  onJumpToDate,
}: {
  title: string;
  viewMode: ViewMode;
  selectedDateKey: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onJumpToDate: (dateKey: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-b p-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="outline">{viewMode}</Badge>
        </div>
        <p className="text-muted-foreground text-xs">
          Use the arrows or pick a date to jump the schedule.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={onPrevious}>
          <IconChevronLeft />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={onNext}>
          <IconChevronRight />
        </Button>
        <Input
          type="date"
          value={selectedDateKey}
          onChange={(event) => onJumpToDate(event.target.value)}
          className="h-9 w-[150px]"
          aria-label="Jump to date"
        />
      </div>
    </div>
  );
}

function MonthCalendar({
  days,
  appointments,
  activeAppointmentId,
  selectedDateKey,
  onPrevious,
  onNext,
  onToday,
  onJumpToDate,
  onSelectDate,
  onSelectAppointment,
}: {
  days: CalendarDay[];
  appointments: Appointment[];
  activeAppointmentId: string;
  selectedDateKey: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onJumpToDate: (dateKey: string) => void;
  onSelectDate: (dateKey: string) => void;
  onSelectAppointment: (appointment: Appointment) => void;
}) {
  const appointmentsByDate = appointments.reduce<Record<string, Appointment[]>>(
    (groups, appointment) => {
      groups[appointment.dateKey] = [
        ...(groups[appointment.dateKey] ?? []),
        appointment,
      ];
      return groups;
    },
    {},
  );

  return (
    <main className="min-h-0 min-w-0 overflow-hidden rounded-lg border bg-card">
      <CalendarNavigationHeader
        title={getViewTitle("Month", selectedDateKey)}
        viewMode="Month"
        selectedDateKey={selectedDateKey}
        onPrevious={onPrevious}
        onNext={onNext}
        onToday={onToday}
        onJumpToDate={onJumpToDate}
      />
      <div className="grid grid-cols-7 border-b bg-muted/60">
        {weekdayLabels.map((day) => (
          <div key={day} className="border-r p-2 text-xs font-medium last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      <div className="grid h-full grid-cols-7 overflow-auto">
        {days.map((day) => {
          const dayAppointments = appointmentsByDate[day.dateKey] ?? [];

          return (
            <div
              key={day.dateKey}
              className={`min-h-24 border-b border-r p-2 text-left align-top last:border-r-0 ${
                day.dateKey === selectedDateKey
                  ? "bg-primary/10"
                  : day.isCurrentMonth
                    ? "bg-card hover:bg-muted/50"
                    : "bg-muted/25 text-muted-foreground"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onSelectDate(day.dateKey)}
                  className="rounded px-1 text-xs font-medium hover:bg-background"
                >
                  {day.dayNumber}
                </button>
                {day.dateKey === todayKey ? (
                  <Badge variant="outline" className="text-[10px]">
                    Today
                  </Badge>
                ) : null}
              </div>
              <div className="space-y-1">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <button
                    key={appointment.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectAppointment(appointment);
                    }}
                    className={`block w-full rounded border border-l-4 px-2 py-1 text-left text-[11px] ${
                      blockStyles[appointment.status]
                    } ${
                      appointment.id === activeAppointmentId
                        ? "ring-2 ring-primary/40"
                        : ""
                    }`}
                  >
                    <span className="block truncate font-medium">
                      {appointment.time} · {appointment.patient}
                    </span>
                    <span className="block truncate text-muted-foreground">
                      {appointment.provider}
                    </span>
                  </button>
                ))}
                {dayAppointments.length > 3 ? (
                  <span className="text-muted-foreground text-[11px]">
                    +{dayAppointments.length - 3} more
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function MiniCalendar({
  selectedDateKey,
  monthDate,
  appointmentDateKeys,
  onPreviousMonth,
  onNextMonth,
  onToday,
  onSelectDate,
}: {
  selectedDateKey: string;
  monthDate: Date;
  appointmentDateKeys: string[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onSelectDate: (dateKey: string) => void;
}) {
  const cells = getMonthCalendarDays(getDateKey(monthDate));
  const appointmentDateSet = new Set(appointmentDateKeys);

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" onClick={onPreviousMonth}>
          <IconChevronLeft />
        </Button>
        <Button variant="outline" size="sm" onClick={onToday}>
          Today
        </Button>
        <Button variant="outline" size="icon" onClick={onNextMonth}>
          <IconChevronRight />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <div
            key={`${day}-${index}`}
            className="text-muted-foreground py-2 text-xs"
          >
            {day}
          </div>
        ))}
        {cells.map((day) => (
          <button
            key={day.dateKey}
            type="button"
            onClick={() => onSelectDate(day.dateKey)}
            className={`relative rounded-md py-2 text-sm ${
              selectedDateKey === day.dateKey
                ? "bg-primary text-primary-foreground"
                : day.dateKey === todayKey
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : day.isCurrentMonth
                    ? "hover:bg-muted"
                    : "text-muted-foreground/45 hover:bg-muted/60"
            }`}
          >
            {day.dayNumber}
            {appointmentDateSet.has(day.dateKey) ? (
              <span className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-current" />
            ) : null}
          </button>
        ))}
      </div>
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
          value={formatFullDate(appointment.dateKey)}
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
    date: appointment.dateKey,
    time: appointment.time,
    type: appointment.type,
  });

  function resetForm() {
    setForm({
      patient: appointment.patient,
      provider: appointment.provider,
      date: appointment.dateKey,
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
      <div className="grid gap-2">
        <Label htmlFor="appointment-date">Date</Label>
        <Input
          id="appointment-date"
          type="date"
          min={todayKey}
          value={form.date}
          onChange={(event) => onChange("date", event.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          Past dates are locked for new bookings.
        </p>
      </div>
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
  const dateKey = getAppointmentDateKey(data);
  const calendarDay = getCalendarDay(dateKey);
  const day = getString(data.day, calendarDay.label);

  return {
    id,
    patient: getString(data.patient, "Unnamed patient"),
    provider: getString(data.provider, "Unassigned"),
    day,
    date: calendarDay.dayNumber,
    dateKey,
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
  dateKey: string,
  time: string,
  ignoredId?: string,
) {
  return appointments.some(
    (appointment) =>
      appointment.id !== ignoredId &&
      appointment.status !== "Cancelled" &&
      appointment.provider === provider &&
      appointment.dateKey === dateKey &&
      appointment.time === time,
  );
}

function getAppointmentDateKey(data: Record<string, unknown>) {
  const storedDateKey = getString(data.dateKey);

  if (isDateKey(storedDateKey)) {
    return storedDateKey;
  }

  const year = getNumber(data.year, 2026);
  const month = getNumber(data.month, 5);
  const date = getNumber(data.date, 13);

  return `${year}-${padDatePart(month)}-${padDatePart(date)}`;
}

function getCalendarDay(dateKey: string): CalendarDay {
  const date = parseDateKey(dateKey);
  const monthDate = new Date(date.getFullYear(), date.getMonth(), 1);

  return {
    dateKey: getDateKey(date),
    label: weekdayLabels[date.getDay()],
    dayNumber: date.getDate(),
    monthLabel: monthLabels[date.getMonth()].slice(0, 3),
    isCurrentMonth: date.getMonth() === monthDate.getMonth(),
    isPast: isBeforeTodayKey(getDateKey(date)),
  };
}

function getWeekDays(dateKey: string) {
  const selectedDate = parseDateKey(dateKey);
  const mondayOffset = selectedDate.getDay() === 0 ? -6 : 1 - selectedDate.getDay();
  const monday = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate() + mondayOffset,
  );

  return Array.from({ length: 7 }, (_, index) =>
    getCalendarDay(getDateKey(addDaysToDate(monday, index))),
  );
}

function getMonthCalendarDays(dateKey: string) {
  const selectedDate = parseDateKey(dateKey);
  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const gridStart = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth(),
    1 - monthStart.getDay(),
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = addDaysToDate(gridStart, index);

    return {
      ...getCalendarDay(getDateKey(date)),
      isCurrentMonth: date.getMonth() === selectedDate.getMonth(),
    };
  });
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  if (!year || !month || !day) {
    return parseDateKey(todayKey);
  }

  return new Date(year, month - 1, day);
}

function getDateKey(date: Date) {
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(
    date.getDate(),
  )}`;
}

function addDays(dateKey: string, amount: number) {
  return getDateKey(addDaysToDate(parseDateKey(dateKey), amount));
}

function addMonths(dateKey: string, amount: number) {
  const date = parseDateKey(dateKey);
  return getDateKey(new Date(date.getFullYear(), date.getMonth() + amount, 1));
}

function addDaysToDate(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

function isBeforeTodayKey(dateKey: string) {
  return dateKey < todayKey;
}

function isDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatMonthYear(date: Date) {
  return `${monthLabels[date.getMonth()]} ${date.getFullYear()}`;
}

function formatShortMonthDay(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${monthLabels[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
}

function formatFullDate(dateKey: string) {
  const date = parseDateKey(dateKey);
  return `${weekdayLabels[date.getDay()]}, ${monthLabels[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getViewTitle(viewMode: ViewMode, dateKey: string) {
  if (viewMode === "Day") {
    return formatFullDate(dateKey);
  }

  if (viewMode === "Week") {
    const weekDays = getWeekDays(dateKey);
    return `${formatShortMonthDay(weekDays[0].dateKey)} - ${formatShortMonthDay(
      weekDays[6].dateKey,
    )}, ${parseDateKey(weekDays[6].dateKey).getFullYear()}`;
  }

  return formatMonthYear(parseDateKey(dateKey));
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
