"use client";

import * as React from "react";
import {
  IconDatabaseImport,
  IconDeviceFloppy,
  IconFilter,
  IconId,
  IconPlus,
  IconSearch,
  IconSignature,
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

type SoapDraft = Pick<
  ClinicalNote,
  "subjective" | "objective" | "assessment" | "plan"
>;

const demoPatients: Patient[] = [
  {
    id: "john-doe",
    name: "John Doe",
    age: 34,
    reason: "Anxiety",
    risk: "Medium",
    insurance: "Aetna",
    memberId: "AET-47291",
    appointments: [
      {
        id: "john-may-13",
        label: "May 13 - Therapy Session",
        time: "10:00 AM",
        provider: "Dr Smith",
      },
      {
        id: "john-may-10",
        label: "May 10 - Follow-up",
        time: "2:30 PM",
        provider: "Dr Smith",
      },
    ],
  },
  {
    id: "sarah-kim",
    name: "Sarah Kim",
    age: 29,
    reason: "Medication follow-up",
    risk: "Low",
    insurance: "BlueCross BlueShield",
    memberId: "BCBS-88421",
    appointments: [
      {
        id: "sarah-may-13",
        label: "May 13 - Medication Review",
        time: "11:30 AM",
        provider: "Dr Chen",
      },
      {
        id: "sarah-may-07",
        label: "May 7 - Follow-up",
        time: "9:15 AM",
        provider: "Dr Chen",
      },
    ],
  },
  {
    id: "mike-johnson",
    name: "Mike Johnson",
    age: 42,
    reason: "Sleep disturbance",
    risk: "High",
    insurance: "Cigna",
    memberId: "CIG-11820",
    appointments: [
      {
        id: "mike-may-14",
        label: "May 14 - Intake Note",
        time: "1:00 PM",
        provider: "Dr Ross",
      },
      {
        id: "mike-may-11",
        label: "May 11 - Lab Review",
        time: "4:00 PM",
        provider: "Dr Ross",
      },
    ],
  },
];

const demoNotes: Omit<ClinicalNote, "id">[] = [
  {
    patientId: "john-doe",
    patientName: "John Doe",
    patientAge: 34,
    patientReason: "Anxiety",
    patientRisk: "Medium",
    patientInsurance: "Aetna",
    patientMemberId: "AET-47291",
    noteType: "SOAP",
    appointmentId: "john-may-13",
    appointmentLabel: "May 13 - Therapy Session",
    appointmentTime: "10:00 AM",
    provider: "Dr Smith",
    date: "May 13",
    status: "Draft",
    subjective:
      "Patient reports increased anxiety in the evenings, racing thoughts, and difficulty initiating sleep.",
    objective:
      "Patient is alert and oriented. Speech is clear. Affect anxious but congruent. No acute distress observed.",
    assessment:
      "Generalized anxiety symptoms remain active. Patient is engaged and using breathing exercises inconsistently.",
    plan:
      "Continue current treatment plan. Practice evening wind-down routine. Follow up in two weeks.",
  },
  {
    patientId: "sarah-kim",
    patientName: "Sarah Kim",
    patientAge: 29,
    patientReason: "Medication follow-up",
    patientRisk: "Low",
    patientInsurance: "BlueCross BlueShield",
    patientMemberId: "BCBS-88421",
    noteType: "Progress Note",
    appointmentId: "sarah-may-13",
    appointmentLabel: "May 13 - Medication Review",
    appointmentTime: "11:30 AM",
    provider: "Dr Chen",
    date: "May 13",
    status: "Ready",
    subjective:
      "Patient reports improved mood stability and mild morning nausea after medication adjustment.",
    objective:
      "Patient appears well groomed, cooperative, and engaged. No psychomotor agitation noted.",
    assessment:
      "Medication response is positive with tolerable side effects. Continue monitoring nausea.",
    plan:
      "Maintain current dose. Take medication with food. Reassess side effects at next visit.",
  },
  {
    patientId: "mike-johnson",
    patientName: "Mike Johnson",
    patientAge: 42,
    patientReason: "Sleep disturbance",
    patientRisk: "High",
    patientInsurance: "Cigna",
    patientMemberId: "CIG-11820",
    noteType: "Intake Note",
    appointmentId: "mike-may-14",
    appointmentLabel: "May 14 - Intake Note",
    appointmentTime: "1:00 PM",
    provider: "Dr Ross",
    date: "May 14",
    status: "Draft",
    subjective:
      "Patient describes fragmented sleep, daytime fatigue, and increased irritability over the last month.",
    objective:
      "Patient appears tired but attentive. Thought process linear. Denies acute safety concerns.",
    assessment:
      "Sleep disturbance may be contributing to mood and concentration concerns. Further evaluation needed.",
    plan:
      "Review sleep diary, order labs, and discuss sleep hygiene. Schedule follow-up after results.",
  },
];

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
  const [notes, setNotes] = React.useState<ClinicalNote[]>([]);
  const [patients, setPatients] = React.useState<Patient[]>(demoPatients);
  const [activeNoteId, setActiveNoteId] = React.useState("");
  const [drafts, setDrafts] = React.useState<Record<string, Partial<SoapDraft>>>(
    {},
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSeeding, setIsSeeding] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<(typeof noteTypes)[number]>("All");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [patientSearch, setPatientSearch] = React.useState("");
  const [newPatientId, setNewPatientId] = React.useState(demoPatients[0].id);
  const [newAppointmentId, setNewAppointmentId] = React.useState(
    demoPatients[0].appointments[0].id,
  );
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
          description: "Check Firebase permissions for clinicalNotes.",
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

        if (firebasePatients.length > 0) {
          const nextPatients = [...firebasePatients, ...demoPatients];
          setPatients(nextPatients);

          if (!nextPatients.some((patient) => patient.id === newPatientId)) {
            setNewPatientId(nextPatients[0].id);
            setNewAppointmentId(nextPatients[0].appointments[0].id);
          }
        }
      },
    );

    return unsubscribe;
  }, [newPatientId]);

  const activeNote =
    notes.find((note) => note.id === activeNoteId) ?? notes[0] ?? null;
  const activePatient = activeNote ? patientFromNote(activeNote) : patients[0];
  const activeDraft = activeNote ? drafts[activeNote.id] ?? {} : {};
  const newPatient =
    patients.find((patient) => patient.id === newPatientId) ?? patients[0];
  const filteredPatients = patients.filter((patient) =>
    patient.name.toLowerCase().includes(patientSearch.trim().toLowerCase()),
  );

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
    const patient = patients.find((item) => item.id === patientId) ?? patients[0];
    setNewPatientId(patient.id);
    setNewAppointmentId(patient.appointments[0].id);
  }

  async function seedDemoNotes() {
    setIsSeeding(true);

    try {
      await Promise.all(
        demoNotes.map((note) =>
          addDoc(collection(db, "clinicalNotes"), {
            ...note,
            createdBy: auth.currentUser?.uid ?? null,
            createdByEmail: auth.currentUser?.email ?? null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }),
        ),
      );

      toast.success("Demo clinical notes added", {
        description: "The notes workspace is now using Firestore data.",
      });
    } catch {
      toast.error("Unable to add demo notes", {
        description: "Check Firebase permissions for clinicalNotes.",
      });
    } finally {
      setIsSeeding(false);
    }
  }

  async function createNote() {
    const patient =
      patients.find((item) => item.id === newPatientId) ?? patients[0];
    const appointment =
      patient.appointments.find((item) => item.id === newAppointmentId) ??
      patient.appointments[0];

    try {
      const createdNote = await addDoc(collection(db, "clinicalNotes"), {
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
        date: appointment.label.split(" - ")[0],
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

      setActiveNoteId(createdNote.id);
      setModalOpen(false);
      toast.success("Clinical note created", {
        description: `${patient.name}'s ${newNoteType} is ready to edit.`,
      });
    } catch {
      toast.error("Clinical note was not created", {
        description: "Firebase could not save the new note.",
      });
    }
  }

  async function saveActiveNote(nextStatus?: NoteStatus) {
    if (!activeNote) {
      return;
    }

    setIsSaving(true);

    try {
      await updateDoc(doc(db, "clinicalNotes", activeNote.id), {
        subjective: getNoteValue("subjective"),
        objective: getNoteValue("objective"),
        assessment: getNoteValue("assessment"),
        plan: getNoteValue("plan"),
        status: nextStatus ?? activeNote.status,
        signedAt: nextStatus === "Signed" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });

      setDrafts((current) => {
        const next = { ...current };
        delete next[activeNote.id];
        return next;
      });

      toast.success(nextStatus === "Signed" ? "Clinical note signed" : "Clinical note saved", {
        description: `${activeNote.patientName}'s note was updated in Firebase.`,
      });
    } catch {
      toast.error("Clinical note was not saved", {
        description: "Firebase could not update this note.",
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
          <Button
            variant="outline"
            onClick={seedDemoNotes}
            disabled={isSeeding || notes.length > 0}
          >
            <IconDatabaseImport />
            {notes.length > 0
              ? "Firebase connected"
              : isSeeding
                ? "Adding..."
                : "Seed demo notes"}
          </Button>
          <NewNoteDialog
            open={modalOpen}
            onOpenChange={setModalOpen}
            patientSearch={patientSearch}
            onPatientSearchChange={setPatientSearch}
            patients={filteredPatients}
            selectedPatient={newPatient}
            selectedPatientId={newPatientId}
            selectedAppointmentId={newAppointmentId}
            selectedNoteType={newNoteType}
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
                ? "Fetching note records from Firebase."
                : "Create a new note or seed demo notes to start documenting care."}
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
  selectedPatient: Patient;
  selectedPatientId: string;
  selectedAppointmentId: string;
  selectedNoteType: NoteType;
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
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.name}
                  </SelectItem>
                ))}
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
                {selectedPatient.appointments.map((appointment) => (
                  <SelectItem key={appointment.id} value={appointment.id}>
                    {appointment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <Button onClick={onCreate}>Create note</Button>
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
  const name = getString(data.fullName, getString(data.patientName, "Unnamed patient"));
  const reason = getString(data.reasonForVisit, "New patient intake");
  const appointmentId = `${id}-intake`;

  return {
    id,
    name,
    age: getAge(getString(data.dateOfBirth)),
    reason,
    risk: getRisk(data.riskLevel),
    insurance: getString(data.insuranceProvider, "Not provided"),
    memberId: getString(data.memberId, "Missing"),
    appointments: [
      {
        id: appointmentId,
        label: "New intake appointment",
        time: "Not scheduled",
        provider: "Unassigned",
      },
    ],
  };
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
      },
    ],
  };
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
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
