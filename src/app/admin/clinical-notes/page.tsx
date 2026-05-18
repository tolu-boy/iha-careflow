"use client";

import * as React from "react";
import {
  IconDeviceFloppy,
  IconFilter,
  IconId,
  IconPlus,
  IconSearch,
  IconSignature,
} from "@tabler/icons-react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
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
import { Textarea } from "@/components/ui/textarea";
import { auth, db } from "@/lib/firebase";

type NoteType = "SOAP" | "Progress Note" | "Intake Note" | "Follow-up";
type NoteStatus = "Draft" | "Ready" | "Signed";
type RiskLevel = "Low" | "Medium" | "High";

type Patient = {
  id: string;
  name: string;
  age: number;
  reason: string;
  risk: RiskLevel;
  insurance: string;
  memberId: string;
  appointments: {
    id: string;
    label: string;
    time: string;
    provider: string;
    date: string;
    dateKey: string;
  }[];
};

type ClinicalNote = {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientReason: string;
  patientRisk: RiskLevel;
  patientInsurance: string;
  patientMemberId: string;
  noteType: NoteType;
  appointmentId: string;
  appointmentLabel: string;
  appointmentTime: string;
  provider: string;
  date: string;
  status: NoteStatus;
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

type ScheduledAppointment = {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  dateKey: string;
  time: string;
  type: string;
  status: string;
};

type SoapDraft = Pick<
  ClinicalNote,
  "subjective" | "objective" | "assessment" | "plan"
>;

const noteTypes: Array<NoteType | "All"> = [
  "All",
  "SOAP",
  "Progress Note",
  "Intake Note",
  "Follow-up",
];

const riskStyles: Record<RiskLevel, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-red-200 bg-red-50 text-red-700",
};

const statusStyles: Record<NoteStatus, string> = {
  Draft: "border-slate-200 bg-slate-100 text-slate-700",
  Ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Signed: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const soapStyles: Record<string, string> = {
  S: "border-l-sky-500 bg-sky-50/45",
  O: "border-l-teal-500 bg-teal-50/45",
  A: "border-l-amber-500 bg-amber-50/45",
  P: "border-l-emerald-500 bg-emerald-50/45",
};

const soapFields: Array<{
  field: keyof SoapDraft;
  letter: string;
  title: string;
}> = [
  { field: "subjective", letter: "S", title: "Subjective" },
  { field: "objective", letter: "O", title: "Objective" },
  { field: "assessment", letter: "A", title: "Assessment" },
  { field: "plan", letter: "P", title: "Plan" },
];

export default function ClinicalNotesPage() {
  const activeNoteIdRef = React.useRef("");
  const queryAppointmentHandledRef = React.useRef(false);
  const [notes, setNotes] = React.useState<ClinicalNote[]>([]);
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [appointments, setAppointments] = React.useState<ScheduledAppointment[]>(
    [],
  );
  const [activeNoteId, setActiveNoteId] = React.useState("");
  const [drafts, setDrafts] = React.useState<Record<string, Partial<SoapDraft>>>(
    {},
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<(typeof noteTypes)[number]>("All");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [patientSearch, setPatientSearch] = React.useState("");
  const [newPatientId, setNewPatientId] = React.useState("");
  const [newAppointmentId, setNewAppointmentId] = React.useState("");
  const [newNoteType, setNewNoteType] = React.useState<NoteType>("SOAP");

  React.useEffect(() => {
    activeNoteIdRef.current = activeNoteId;
  }, [activeNoteId]);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "clinicalNotes"),
      (snapshot) => {
        const nextNotes = snapshot.docs
          .map((snapshotDoc) => toClinicalNote(snapshotDoc.id, snapshotDoc.data()))
          .sort((first, second) => first.patientName.localeCompare(second.patientName));

        setNotes(nextNotes);
        setIsLoading(false);

        const activeExists = nextNotes.some(
          (note) => note.id === activeNoteIdRef.current,
        );

        if ((!activeNoteIdRef.current || !activeExists) && nextNotes[0]) {
          activeNoteIdRef.current = nextNotes[0].id;
          setActiveNoteId(nextNotes[0].id);
        }
      },
      () => {
        setIsLoading(false);
        toast.error("Unable to load clinical notes", {
          description: "Check clinical note permissions and try again.",
        });
      },
    );

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "patients"),
      (snapshot) => {
        const firebasePatients = snapshot.docs.map((snapshotDoc) =>
          toPatient(snapshotDoc.id, snapshotDoc.data()),
        );

        setPatients(firebasePatients);
        setNewPatientId((current) =>
          firebasePatients.some((patient) => patient.id === current)
            ? current
            : firebasePatients[0]?.id ?? "",
        );
      },
    );

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "appointments"), (snapshot) => {
      const nextAppointments = snapshot.docs
        .map((snapshotDoc) =>
          toScheduledAppointment(snapshotDoc.id, snapshotDoc.data()),
        )
        .sort((first, second) => {
          const dateDelta = first.dateKey.localeCompare(second.dateKey);
          return dateDelta || first.time.localeCompare(second.time);
        });

      setAppointments(nextAppointments);
    });

    return unsubscribe;
  }, []);

  const activeNote =
    notes.find((note) => note.id === activeNoteId) ?? notes[0] ?? null;
  const patientsWithAppointments = React.useMemo(
    () =>
      patients.map((patient) => ({
        ...patient,
        appointments: getPatientAppointments(patient, appointments),
      })),
    [appointments, patients],
  );
  const activePatient = activeNote
    ? patientFromNote(activeNote)
    : patientsWithAppointments[0];
  const activeDraft = activeNote ? drafts[activeNote.id] ?? {} : {};
  const newPatient =
    patientsWithAppointments.find((patient) => patient.id === newPatientId) ??
    patientsWithAppointments[0];
  const filteredPatients = patientsWithAppointments.filter((patient) =>
    patient.name.toLowerCase().includes(patientSearch.trim().toLowerCase()),
  );
  const appointmentReady = Boolean(newPatient?.appointments.length);
  const selectedAppointmentId = newPatient?.appointments.some(
    (appointment) => appointment.id === newAppointmentId,
  )
    ? newAppointmentId
    : newPatient?.appointments[0]?.id ?? "";

  React.useEffect(() => {
    if (queryAppointmentHandledRef.current || typeof window === "undefined") {
      return;
    }

    const appointmentId = new URLSearchParams(window.location.search).get(
      "appointmentId",
    );

    if (!appointmentId || appointments.length === 0) {
      return;
    }

    const existingNote = notes.find(
      (note) => note.appointmentId === appointmentId,
    );

    if (existingNote) {
      window.setTimeout(() => setActiveNoteId(existingNote.id), 0);
      queryAppointmentHandledRef.current = true;
      return;
    }

    const appointment = appointments.find((item) => item.id === appointmentId);
    const patient = patientsWithAppointments.find(
      (item) =>
        item.id === appointment?.patientId ||
        item.appointments.some((patientAppointment) => patientAppointment.id === appointmentId),
    );

    if (!appointment || !patient) {
      return;
    }

    window.setTimeout(() => {
      setNewPatientId(patient.id);
      setNewAppointmentId(appointment.id);
      setModalOpen(true);
    }, 0);
    queryAppointmentHandledRef.current = true;
  }, [appointments, notes, patientsWithAppointments]);

  const filteredNotes = notes.filter((note) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      note.patientName.toLowerCase().includes(query) ||
      note.provider.toLowerCase().includes(query);
    const matchesFilter = filter === "All" || note.noteType === filter;

    return matchesSearch && matchesFilter;
  });

  function updateActiveDraft(field: keyof SoapDraft, value: string) {
    if (!activeNote) {
      return;
    }

    setDrafts((current) => ({
      ...current,
      [activeNote.id]: {
        ...current[activeNote.id],
        [field]: value,
      },
    }));
  }

  function getNoteValue(field: keyof SoapDraft) {
    if (!activeNote) {
      return "";
    }

    return activeDraft[field] ?? activeNote[field];
  }

  function handleNewPatientChange(patientId: string) {
    const patient =
      patientsWithAppointments.find((item) => item.id === patientId) ??
      patientsWithAppointments[0];

    if (!patient) {
      setNewPatientId("");
      setNewAppointmentId("");
      return;
    }

    setNewPatientId(patient.id);
    setNewAppointmentId(patient.appointments[0]?.id ?? "");
  }

  async function createNote() {
    const patient =
      patientsWithAppointments.find((item) => item.id === newPatientId) ??
      patientsWithAppointments[0];

    if (!patient) {
      toast.error("Select a patient", {
        description: "Create or select a patient before opening a clinical note.",
      });
      return;
    }

    const appointment =
      patient.appointments.find((item) => item.id === selectedAppointmentId) ??
      patient.appointments[0];

    if (!appointment) {
      toast.error("Select a scheduled appointment", {
        description:
          "Create an appointment in Scheduling before opening a clinical note.",
      });
      return;
    }

    try {
      const noteRef = doc(collection(db, "clinicalNotes"));
      const batch = writeBatch(db);

      batch.set(noteRef, {
        patientId: patient.id,
        patientName: patient.name,
        patientAge: patient.age,
        patientReason: patient.reason,
        patientRisk: patient.risk,
        patientInsurance: patient.insurance,
        patientMemberId: patient.memberId,
        noteType: newNoteType,
        appointmentId: appointment.id,
        appointmentLabel: appointment.label,
        appointmentTime: appointment.time,
        provider: appointment.provider,
        date: appointment.date,
        status: "Draft",
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        createdBy: auth.currentUser?.uid ?? null,
        createdByEmail: auth.currentUser?.email ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.update(doc(db, "appointments", appointment.id), {
        noteId: noteRef.id,
        noteStatus: "Draft",
        notes: "Draft note started",
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      setActiveNoteId(noteRef.id);
      setModalOpen(false);
      toast.success("Clinical note created", {
        description: `${patient.name}'s ${newNoteType} is ready to edit.`,
      });
    } catch {
      toast.error("Clinical note was not created", {
        description: "The new note could not be saved.",
      });
    }
  }

  async function saveActiveNote(nextStatus?: NoteStatus) {
    if (!activeNote) {
      return;
    }

    setIsSaving(true);

    try {
      const batch = writeBatch(db);

      batch.update(doc(db, "clinicalNotes", activeNote.id), {
        subjective: getNoteValue("subjective"),
        objective: getNoteValue("objective"),
        assessment: getNoteValue("assessment"),
        plan: getNoteValue("plan"),
        status: nextStatus ?? activeNote.status,
        signedAt: nextStatus === "Signed" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });

      if (activeNote.appointmentId) {
        batch.update(doc(db, "appointments", activeNote.appointmentId), {
          noteId: activeNote.id,
          noteStatus: nextStatus ?? activeNote.status,
          notes:
            nextStatus === "Signed"
              ? "Clinical note signed"
              : "Clinical note updated",
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();

      setDrafts((current) => {
        const next = { ...current };
        delete next[activeNote.id];
        return next;
      });

      toast.success(nextStatus === "Signed" ? "Clinical note signed" : "Clinical note saved", {
        description: `${activeNote.patientName}'s note was updated.`,
      });
    } catch {
      toast.error("Clinical note was not saved", {
        description: "This note could not be updated.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-[calc(100svh-var(--header-height)-2rem)] min-h-[680px] flex-col gap-4 md:h-[calc(100svh-var(--header-height)-3rem)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Clinical Notes
          </h2>
          <p className="text-muted-foreground text-sm">
            Open a note, document the visit, save, and sign without leaving this
            workspace.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <NewNoteDialog
            open={modalOpen}
            onOpenChange={setModalOpen}
            patientSearch={patientSearch}
            onPatientSearchChange={setPatientSearch}
            patients={filteredPatients}
            selectedPatient={newPatient}
            selectedPatientId={newPatientId}
            selectedAppointmentId={selectedAppointmentId}
            selectedNoteType={newNoteType}
            appointmentReady={appointmentReady}
            onPatientChange={handleNewPatientChange}
            onAppointmentChange={setNewAppointmentId}
            onNoteTypeChange={setNewNoteType}
            onCreate={createNote}
          />
          <div className="relative sm:w-64">
            <IconSearch className="text-muted-foreground absolute left-3 top-2.5 size-4" />
            <Input
              className="pl-9"
              placeholder="Search notes"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as typeof filter)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <IconFilter className="size-4" />
              <SelectValue placeholder="Filter notes" />
            </SelectTrigger>
            <SelectContent>
              {noteTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeNote ? (
        <>
          <div className="flex flex-col gap-3 rounded-lg border bg-card px-4 py-3 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <PatientAvatar name={activePatient.name} />
              <div>
                <p className="font-semibold">{activePatient.name}</p>
                <p className="text-muted-foreground text-sm">
                  {activeNote.noteType} · {activeNote.appointmentTime} ·{" "}
                  {activeNote.provider}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Reason: {activePatient.reason}</Badge>
              <Badge variant="outline" className={riskStyles[activePatient.risk]}>
                Risk: {activePatient.risk}
              </Badge>
              <Badge variant="outline" className={statusStyles[activeNote.status]}>
                {activeNote.status}
              </Badge>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[340px_1fr]">
            <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
              <div className="border-b p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Notes list</h3>
                    <p className="text-muted-foreground text-sm">
                      {filteredNotes.length} visible notes
                    </p>
                  </div>
                  <Badge variant="outline">{notes.length}</Badge>
                </div>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                {filteredNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setActiveNoteId(note.id)}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      note.id === activeNote.id
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{note.patientName}</p>
                        <p className="text-muted-foreground text-sm">
                          {note.noteType}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={statusStyles[note.status]}
                      >
                        {note.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground mt-3 grid gap-1 text-xs">
                      <p>{note.date}</p>
                      <p>{note.provider}</p>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
              <div className="border-b bg-muted/35 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <PatientAvatar name={activeNote.patientName} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold">
                          {activeNote.patientName}
                        </h3>
                        <Badge variant="outline">{activeNote.noteType}</Badge>
                        <Badge
                          variant="outline"
                          className={riskStyles[activePatient.risk]}
                        >
                          Risk: {activePatient.risk}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Appointment: {activeNote.appointmentTime} ·{" "}
                        {activeNote.appointmentLabel} · {activeNote.provider}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() => saveActiveNote("Ready")}
                      disabled={isSaving}
                    >
                      <IconDeviceFloppy />
                      Save
                    </Button>
                    <Button
                      onClick={() => saveActiveNote("Signed")}
                      disabled={isSaving}
                    >
                      <IconSignature />
                      Sign note
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="grid gap-4">
                  {soapFields.map((field) => (
                    <SoapField
                      key={field.field}
                      letter={field.letter}
                      title={field.title}
                      value={getNoteValue(field.field)}
                      onChange={(value) => updateActiveDraft(field.field, value)}
                    />
                  ))}
                </div>

                <div className="hidden self-start rounded-lg border bg-background p-4 lg:sticky lg:top-0 lg:block">
                  <div className="mb-5 flex items-center gap-3">
                    <PatientAvatar name={activePatient.name} />
                    <div>
                      <h4 className="font-medium">{activePatient.name}</h4>
                      <p className="text-muted-foreground text-xs">
                        Patient context
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 text-sm">
                    <ContextRow label="Age" value={`${activePatient.age}`} />
                    <ContextRow label="Reason" value={activePatient.reason} />
                    <ContextRow label="Risk" value={activePatient.risk} />
                    <div className="rounded-lg border bg-muted/35 p-3">
                      <div className="mb-2 flex items-center gap-2 font-medium">
                        <IconId className="text-primary size-4" />
                        Insurance
                      </div>
                      <ContextRow label="Plan" value={activePatient.insurance} />
                      <div className="mt-3">
                        <ContextRow
                          label="Member ID"
                          value={activePatient.memberId}
                        />
                      </div>
                    </div>
                    <ContextRow label="Status" value={activeNote.status} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      ) : (
        <div className="grid flex-1 place-items-center rounded-lg border bg-card p-8 text-center">
          <div className="max-w-md">
            <h3 className="text-lg font-semibold">
              {isLoading ? "Loading clinical notes..." : "No clinical notes yet"}
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              {isLoading
                ? "Loading note records."
                : "Create a new note to start documenting care."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function NewNoteDialog({
  open,
  onOpenChange,
  patientSearch,
  onPatientSearchChange,
  patients,
  selectedPatient,
  selectedPatientId,
  selectedAppointmentId,
  selectedNoteType,
  appointmentReady,
  onPatientChange,
  onAppointmentChange,
  onNoteTypeChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientSearch: string;
  onPatientSearchChange: (value: string) => void;
  patients: Patient[];
  selectedPatient: Patient | undefined;
  selectedPatientId: string;
  selectedAppointmentId: string;
  selectedNoteType: NoteType;
  appointmentReady: boolean;
  onPatientChange: (value: string) => void;
  onAppointmentChange: (value: string) => void;
  onNoteTypeChange: (value: NoteType) => void;
  onCreate: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus />
          New Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create new clinical note</DialogTitle>
          <DialogDescription>
            Select the patient, appointment, and note type. The note opens in
            this workspace after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="patient-search">Patient</Label>
            <Input
              id="patient-search"
              placeholder="Search patient"
              value={patientSearch}
              onChange={(event) => onPatientSearchChange(event.target.value)}
            />
            <Select value={selectedPatientId} onValueChange={onPatientChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.length > 0 ? (
                  patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-patients" disabled>
                    No patients found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Appointment</Label>
            <Select
              value={selectedAppointmentId}
              onValueChange={onAppointmentChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select appointment" />
              </SelectTrigger>
              <SelectContent>
                {selectedPatient?.appointments.length ? (
                  selectedPatient.appointments.map((appointment) => (
                    <SelectItem key={appointment.id} value={appointment.id}>
                      {appointment.label}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-appointments" disabled>
                    No scheduled appointments
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {!appointmentReady ? (
              <p className="text-muted-foreground text-xs">
                Schedule an appointment first, then create the note from here.
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label>Note type</Label>
            <Select
              value={selectedNoteType}
              onValueChange={(value) => onNoteTypeChange(value as NoteType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select note type" />
              </SelectTrigger>
              <SelectContent>
                {noteTypes
                  .filter((type): type is NoteType => type !== "All")
                  .map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onCreate} disabled={!appointmentReady}>
            Create note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SoapField({
  letter,
  title,
  value,
  onChange,
}: {
  letter: string;
  title: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className={`grid min-h-[270px] grid-rows-[auto_1fr] gap-3 rounded-lg border-l-4 p-4 ${soapStyles[letter]}`}
    >
      <Label className="gap-3">
        <span className="flex size-9 items-center justify-center rounded-md bg-background text-base font-bold text-primary shadow-xs">
          {letter}
        </span>
        <span className="text-sm font-semibold">{title}</span>
      </Label>
      <Textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[190px] resize-y bg-background/90 text-base leading-7"
      />
    </div>
  );
}

function toClinicalNote(
  id: string,
  data: Record<string, unknown>,
): ClinicalNote {
  return {
    id,
    patientId: getString(data.patientId, "unknown-patient"),
    patientName: getString(data.patientName, "Unnamed patient"),
    patientAge: getNumber(data.patientAge),
    patientReason: getString(data.patientReason, "Not provided"),
    patientRisk: getRisk(data.patientRisk),
    patientInsurance: getString(data.patientInsurance, "Not provided"),
    patientMemberId: getString(data.patientMemberId, "Missing"),
    noteType: getNoteType(data.noteType),
    appointmentId: getString(data.appointmentId, "appointment"),
    appointmentLabel: getString(data.appointmentLabel, "Appointment"),
    appointmentTime: getString(data.appointmentTime, "Not scheduled"),
    provider: getString(data.provider, "Provider"),
    date: getString(data.date, "Today"),
    status: getNoteStatus(data.status),
    subjective: getString(data.subjective),
    objective: getString(data.objective),
    assessment: getString(data.assessment),
    plan: getString(data.plan),
  };
}

function toPatient(id: string, data: Record<string, unknown>): Patient {
  const name =
    getString(data.fullName, "") ||
    getString(data.name, "") ||
    getString(data.patientName, "Unnamed patient");
  const reason =
    getString(data.reasonForVisit, "") ||
    getString(data.reason, "New patient intake");

  return {
    id,
    name,
    age: getAge(getString(data.dateOfBirth)),
    reason,
    risk: getRisk(data.risk ?? data.riskLevel),
    insurance:
      getString(data.insuranceProvider, "") ||
      getString(data.insurancePlan, "Not provided"),
    memberId: getString(data.memberId, "Missing"),
    appointments: [],
  };
}

function toScheduledAppointment(
  id: string,
  data: Record<string, unknown>,
): ScheduledAppointment {
  const dateKey = getAppointmentDateKey(data);
  const patientName =
    getString(data.patientName, "") ||
    getString(data.patient, "Unnamed patient");
  const doctorName =
    getString(data.doctorName, "") || getString(data.provider, "Unassigned");

  return {
    id,
    patientId: getString(data.patientId, ""),
    patientName,
    doctorId: getString(data.doctorId, ""),
    doctorName,
    dateKey,
    time: getString(data.time, "Not scheduled"),
    type: getString(data.type, "Appointment"),
    status: getString(data.status, "Pending"),
  };
}

function getPatientAppointments(
  patient: Patient,
  appointments: ScheduledAppointment[],
) {
  return appointments
    .filter(
      (appointment) =>
        appointment.patientId === patient.id ||
        (!appointment.patientId && appointment.patientName === patient.name),
    )
    .map((appointment) => ({
      id: appointment.id,
      label: `${formatShortDate(appointment.dateKey)} - ${appointment.type} - ${appointment.doctorName}`,
      time: appointment.time,
      provider: appointment.doctorName,
      date: formatShortDate(appointment.dateKey),
      dateKey: appointment.dateKey,
    }));
}

function patientFromNote(note: ClinicalNote): Patient {
  return {
    id: note.patientId,
    name: note.patientName,
    age: note.patientAge,
    reason: note.patientReason,
    risk: note.patientRisk,
    insurance: note.patientInsurance,
    memberId: note.patientMemberId,
    appointments: [
      {
        id: note.appointmentId,
        label: note.appointmentLabel,
        time: note.appointmentTime,
        provider: note.provider,
        date: note.date,
        dateKey: "",
      },
    ],
  };
}

function getAppointmentDateKey(data: Record<string, unknown>) {
  const storedDateKey = getString(data.dateKey);

  if (/^\d{4}-\d{2}-\d{2}$/.test(storedDateKey)) {
    return storedDateKey;
  }

  const year = getNumberWithFallback(data.year, 2026);
  const month = getNumberWithFallback(data.month, 5);
  const date = getNumberWithFallback(data.date, 13);

  return `${year}-${padDatePart(month)}-${padDatePart(date)}`;
}

function padDatePart(value: number) {
  return String(value).padStart(2, "0");
}

function formatShortDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-");

  if (!year || !month || !day) {
    return "Scheduled visit";
  }

  return `${month}/${day}/${year}`;
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function getNumberWithFallback(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getAge(dateOfBirth: string) {
  if (!dateOfBirth) {
    return 0;
  }

  const birthDate = new Date(dateOfBirth);

  if (Number.isNaN(birthDate.getTime())) {
    return 0;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (
    monthDelta < 0 ||
    (monthDelta === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function getRisk(value: unknown): RiskLevel {
  if (value === "Low" || value === "Medium" || value === "High") {
    return value;
  }

  return "Medium";
}

function getNoteType(value: unknown): NoteType {
  if (
    value === "SOAP" ||
    value === "Progress Note" ||
    value === "Intake Note" ||
    value === "Follow-up"
  ) {
    return value;
  }

  return "SOAP";
}

function getNoteStatus(value: unknown): NoteStatus {
  if (value === "Draft" || value === "Ready" || value === "Signed") {
    return value;
  }

  return "Draft";
}

function PatientAvatar({ name }: { name: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
      {name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)}
    </div>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
