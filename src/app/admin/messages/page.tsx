"use client";

import * as React from "react";
import {
  IconCalendar,
  IconCheck,
  IconDatabaseImport,
  IconMailForward,
  IconMessageCircle,
  IconPhone,
  IconSearch,
  IconSend,
  IconUser,
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

type MessageStatus = "Unread" | "Open" | "Resolved";
type RiskLevel = "Low" | "Medium" | "High";

type Message = {
  id: string;
  conversationId: string;
  sender: "patient" | "provider";
  body: string;
  time: string;
  sequence: number;
};

type Conversation = {
  id: string;
  patient: string;
  patientId: string;
  lastMessage: string;
  time: string;
  status: MessageStatus;
  appointment: string;
  provider: string;
  risk: RiskLevel;
  phone: string;
  lastMessageAt: string;
};

type PatientOption = {
  id: string;
  name: string;
  phone: string;
  risk: RiskLevel;
  appointment: string;
  provider: string;
};

type ConversationSeed = Omit<Conversation, "id"> & {
  seedKey: string;
  messages: Array<Omit<Message, "id" | "conversationId">>;
};

const conversationSeeds: ConversationSeed[] = [
  {
    seedKey: "john-doe-message-seed",
    patientId: "john-doe",
    patient: "John Doe",
    lastMessage: "Thank you. I'll track it and bring notes tomorrow.",
    time: "9:53 AM",
    status: "Unread",
    appointment: "May 14, 10:00 AM",
    provider: "Dr Smith",
    risk: "Medium",
    phone: "(555) 010-4821",
    lastMessageAt: "2026-05-14T09:53:00.000Z",
    messages: [
      {
        sender: "patient",
        body: "I've been having trouble sleeping.",
        time: "9:42 AM",
        sequence: 1,
      },
      {
        sender: "provider",
        body: "Please continue your medication and monitor symptoms. If sleep worsens tonight, send an update before your appointment.",
        time: "9:49 AM",
        sequence: 2,
      },
      {
        sender: "patient",
        body: "Thank you. I'll track it and bring notes tomorrow.",
        time: "9:53 AM",
        sequence: 3,
      },
    ],
  },
  {
    seedKey: "sarah-kim-message-seed",
    patientId: "sarah-kim",
    patient: "Sarah Kim",
    lastMessage: "We can check availability and send options today.",
    time: "Yesterday",
    status: "Open",
    appointment: "May 16, 11:30 AM",
    provider: "Dr Chen",
    risk: "Low",
    phone: "(555) 010-1120",
    lastMessageAt: "2026-05-13T15:20:00.000Z",
    messages: [
      {
        sender: "patient",
        body: "Can I move my follow-up earlier? I have a work conflict.",
        time: "Yesterday",
        sequence: 1,
      },
      {
        sender: "provider",
        body: "We can check availability and send options today.",
        time: "Yesterday",
        sequence: 2,
      },
    ],
  },
  {
    seedKey: "mike-johnson-message-seed",
    patientId: "mike-johnson",
    patient: "Mike Johnson",
    lastMessage: "Received. We will review them before your next visit.",
    time: "Mon",
    status: "Resolved",
    appointment: "May 17, 1:00 PM",
    provider: "Dr Ross",
    risk: "High",
    phone: "(555) 010-7744",
    lastMessageAt: "2026-05-11T13:10:00.000Z",
    messages: [
      {
        sender: "patient",
        body: "My lab results uploaded this morning.",
        time: "Mon",
        sequence: 1,
      },
      {
        sender: "provider",
        body: "Received. We will review them before your next visit.",
        time: "Mon",
        sequence: 2,
      },
    ],
  },
  {
    seedKey: "avery-johnson-message-seed",
    patientId: "avery-johnson",
    patient: "Avery Johnson",
    lastMessage: "Thank you. Your care team will review them before the appointment.",
    time: "Fri",
    status: "Resolved",
    appointment: "May 20, 3:00 PM",
    provider: "Dr Smith",
    risk: "Low",
    phone: "(555) 010-6732",
    lastMessageAt: "2026-05-08T10:40:00.000Z",
    messages: [
      {
        sender: "patient",
        body: "I finished the intake forms.",
        time: "Fri",
        sequence: 1,
      },
      {
        sender: "provider",
        body: "Thank you. Your care team will review them before the appointment.",
        time: "Fri",
        sequence: 2,
      },
    ],
  },
];

const statusStyles: Record<MessageStatus, string> = {
  Unread: "border-blue-200 bg-blue-50 text-blue-700",
  Open: "border-amber-200 bg-amber-50 text-amber-700",
  Resolved: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const riskStyles: Record<RiskLevel, string> = {
  Low: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  High: "border-red-200 bg-red-50 text-red-700",
};

const demoPatientOptions: PatientOption[] = conversationSeeds.map((seed) => ({
  id: seed.patientId,
  name: seed.patient,
  phone: seed.phone,
  risk: seed.risk,
  appointment: seed.appointment,
  provider: seed.provider,
}));

export default function PatientMessagesPage() {
  const [conversationList, setConversationList] = React.useState<
    Conversation[]
  >([]);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [patients, setPatients] =
    React.useState<PatientOption[]>(demoPatientOptions);
  const [activeConversationId, setActiveConversationId] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [messageText, setMessageText] = React.useState("");
  const [newMessageOpen, setNewMessageOpen] = React.useState(false);
  const [newMessagePatientId, setNewMessagePatientId] = React.useState("");
  const [newMessageBody, setNewMessageBody] = React.useState("");
  const [isWriting, setIsWriting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "conversations"),
      (snapshot) => {
        const nextConversations = snapshot.docs
          .map((item) => toConversation(item.id, item.data()))
          .sort(
            (first, second) =>
              Date.parse(second.lastMessageAt || "") -
              Date.parse(first.lastMessageAt || ""),
          );

        setConversationList(nextConversations);
        setActiveConversationId((current) => {
          if (nextConversations.some((item) => item.id === current)) {
            return current;
          }

          return nextConversations[0]?.id ?? "";
        });
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        toast.error("Unable to load conversations", {
          description: error.message,
        });
      },
    );

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "messages"),
      (snapshot) => {
        setMessages(
          snapshot.docs
            .map((item) => toMessage(item.id, item.data()))
            .sort((first, second) => first.sequence - second.sequence),
        );
      },
      (error) => {
        toast.error("Unable to load messages", {
          description: error.message,
        });
      },
    );

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "patients"), (snapshot) => {
      const firestorePatients = snapshot.docs.map((item) =>
        toPatientOption(item.id, item.data()),
      );

      setPatients(
        mergePatientOptions([...firestorePatients, ...demoPatientOptions]),
      );
    });

    return unsubscribe;
  }, []);

  const activeConversation =
    conversationList.find((item) => item.id === activeConversationId) ??
    conversationList[0] ??
    null;

  const activeMessages = activeConversation
    ? messages.filter((message) => message.conversationId === activeConversation.id)
    : [];

  const filteredConversations = conversationList.filter((conversation) => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return true;

    return `${conversation.patient} ${conversation.lastMessage} ${conversation.provider}`
      .toLowerCase()
      .includes(normalizedSearch);
  });

  async function sendMessage() {
    if (!activeConversation) return;

    await sendProviderMessage(activeConversation, messageText);
    setMessageText("");
  }

  async function sendProviderMessage(
    conversation: Conversation,
    rawBody: string,
    successMessage = "Message sent",
  ) {
    const body = rawBody.trim();

    if (!body) return;

    setIsWriting(true);
    try {
      const now = new Date();

      await addDoc(collection(db, "messages"), {
        conversationId: conversation.id,
        sender: "provider",
        senderType: "provider",
        senderId: auth.currentUser?.uid ?? "demo-provider",
        body,
        time: "Now",
        sequence: now.getTime(),
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "conversations", conversation.id), {
        lastMessage: body,
        lastMessageAt: now.toISOString(),
        time: "Now",
        status: "Open",
        updatedAt: serverTimestamp(),
      });

      toast.success(successMessage);
    } catch (error) {
      toast.error("Message was not saved", {
        description:
          error instanceof Error ? error.message : "Please check Firestore access.",
      });
    } finally {
      setIsWriting(false);
    }
  }

  async function resolveConversation() {
    if (!activeConversation) return;

    setIsWriting(true);
    try {
      await updateDoc(doc(db, "conversations", activeConversation.id), {
        status: "Resolved",
        updatedAt: serverTimestamp(),
      });
      toast.success("Conversation resolved");
    } catch (error) {
      toast.error("Unable to resolve conversation", {
        description:
          error instanceof Error ? error.message : "Please check Firestore access.",
      });
    } finally {
      setIsWriting(false);
    }
  }

  async function seedDemoConversations() {
    if (conversationList.length > 0) {
      toast.info("Conversations already exist in Firebase");
      return;
    }

    setIsWriting(true);
    try {
      for (const seed of conversationSeeds) {
        const { messages: seedMessages, seedKey, ...conversation } = seed;
        const conversationRef = await addDoc(collection(db, "conversations"), {
          ...conversation,
          seedKey,
          createdBy: auth.currentUser?.uid ?? null,
          createdByEmail: auth.currentUser?.email ?? null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        for (const message of seedMessages) {
          await addDoc(collection(db, "messages"), {
            ...message,
            conversationId: conversationRef.id,
            senderId:
              message.sender === "provider"
                ? auth.currentUser?.uid ?? "demo-provider"
                : conversation.patientId,
            senderType: message.sender,
            readAt: message.sender === "patient" ? null : serverTimestamp(),
            createdAt: serverTimestamp(),
          });
        }
      }

      toast.success("Demo conversations added");
    } catch (error) {
      toast.error("Unable to seed conversations", {
        description:
          error instanceof Error ? error.message : "Please check Firestore rules.",
      });
    } finally {
      setIsWriting(false);
    }
  }

  async function createNewConversation() {
    const selectedPatient = patients.find(
      (patient) => patient.id === newMessagePatientId,
    );
    const body = newMessageBody.trim();

    if (!selectedPatient || !body) {
      toast.error("Select a patient and enter a message");
      return;
    }

    setIsWriting(true);
    try {
      const now = new Date();
      const conversationRef = await addDoc(collection(db, "conversations"), {
        patientId: selectedPatient.id,
        patient: selectedPatient.name,
        phone: selectedPatient.phone,
        appointment: selectedPatient.appointment,
        provider: selectedPatient.provider,
        risk: selectedPatient.risk,
        status: "Open",
        lastMessage: body,
        lastMessageAt: now.toISOString(),
        time: "Now",
        createdBy: auth.currentUser?.uid ?? null,
        createdByEmail: auth.currentUser?.email ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "messages"), {
        conversationId: conversationRef.id,
        sender: "provider",
        senderType: "provider",
        senderId: auth.currentUser?.uid ?? "demo-provider",
        body,
        time: "Now",
        sequence: now.getTime(),
        createdAt: serverTimestamp(),
      });

      setActiveConversationId(conversationRef.id);
      setNewMessagePatientId("");
      setNewMessageBody("");
      setNewMessageOpen(false);
      toast.success("New conversation started");
    } catch (error) {
      toast.error("Conversation was not created", {
        description:
          error instanceof Error ? error.message : "Please check Firestore access.",
      });
    } finally {
      setIsWriting(false);
    }
  }

  return (
    <div className="flex h-[calc(100svh-var(--header-height)-2rem)] min-h-[680px] flex-col gap-4 md:h-[calc(100svh-var(--header-height)-3rem)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Patient Messages
          </h2>
          <p className="text-muted-foreground text-sm">
            Triage patient conversations, review context, and respond from one
            care communication workspace.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={seedDemoConversations}
            disabled={isWriting || conversationList.length > 0}
          >
            <IconDatabaseImport />
            Seed demo
          </Button>
          <Button onClick={() => setNewMessageOpen(true)}>
            <IconMailForward />
            New Message
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
          <div className="border-b p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Messages</h3>
                <p className="text-muted-foreground text-sm">
                  Live Firebase conversations
                </p>
              </div>
              <Badge variant="outline">{conversationList.length}</Badge>
            </div>
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute left-3 top-2.5 size-4" />
              <Input
                className="pl-9"
                placeholder="Search patients"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="text-muted-foreground p-4 text-sm">
                Loading conversations...
              </div>
            ) : null}

            {!isLoading && filteredConversations.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm">
                <p className="font-medium">No conversations found</p>
                <p className="text-muted-foreground mt-1">
                  Start a new message or seed demo conversations.
                </p>
              </div>
            ) : null}

            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveConversationId(conversation.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  conversation.id === activeConversation?.id
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:bg-muted"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {conversation.patient}
                    </p>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {conversation.lastMessage}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-muted-foreground mb-2 text-xs">
                      {conversation.time}
                    </p>
                    <Badge
                      variant="outline"
                      className={statusStyles[conversation.status]}
                    >
                      {conversation.status}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
          {activeConversation ? (
            <>
              <div className="border-b bg-muted/35 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <PatientAvatar name={activeConversation.patient} />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-semibold">
                          {activeConversation.patient}
                        </h3>
                        <Badge
                          variant="outline"
                          className={riskStyles[activeConversation.risk]}
                        >
                          Risk: {activeConversation.risk}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={statusStyles[activeConversation.status]}
                        >
                          {activeConversation.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Upcoming Appointment: {activeConversation.appointment} ·
                        Provider: {activeConversation.provider}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      variant="outline"
                      onClick={() =>
                        toast.info("Scheduling connection ready", {
                          description:
                            "This action will open the scheduling workflow when cross-page linking is added.",
                        })
                      }
                    >
                      <IconCalendar />
                      Schedule
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        toast.info(`Call ${activeConversation.phone}`)
                      }
                    >
                      <IconPhone />
                      Call
                    </Button>
                    <Button onClick={resolveConversation} disabled={isWriting}>
                      <IconCheck />
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1fr_280px]">
                <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-background">
                  <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                      <IconMessageCircle className="text-primary size-5" />
                      <h4 className="font-medium">Message history</h4>
                    </div>
                    <Badge variant="outline">{activeMessages.length}</Badge>
                  </div>
                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                    {activeMessages.length > 0 ? (
                      activeMessages.map((message) => (
                        <MessageBubble key={message.id} message={message} />
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed p-4 text-sm">
                        <p className="font-medium">No messages yet</p>
                        <p className="text-muted-foreground mt-1">
                          Send the first message to begin this patient thread.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="border-t p-3">
                    <div className="flex gap-2">
                      <Textarea
                        value={messageText}
                        onChange={(event) => setMessageText(event.target.value)}
                        placeholder="Type message..."
                        className="min-h-12 resize-none"
                      />
                      <Button
                        className="self-end"
                        onClick={sendMessage}
                        disabled={isWriting || !messageText.trim()}
                      >
                        <IconSend />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>

                <aside className="hidden self-start rounded-lg border bg-background p-4 lg:block">
                  <div className="mb-5 flex items-center gap-3">
                    <PatientAvatar name={activeConversation.patient} />
                    <div>
                      <h4 className="font-medium">
                        {activeConversation.patient}
                      </h4>
                      <p className="text-muted-foreground text-xs">
                        Patient summary
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 text-sm">
                    <SummaryRow
                      label="Upcoming Appointment"
                      value={activeConversation.appointment}
                    />
                    <SummaryRow
                      label="Provider"
                      value={activeConversation.provider}
                    />
                    <SummaryRow
                      label="Risk Level"
                      value={activeConversation.risk}
                    />
                    <SummaryRow label="Phone" value={activeConversation.phone} />
                    <div className="rounded-lg border bg-muted/35 p-3">
                      <p className="mb-2 font-medium">Quick Actions</p>
                      <div className="grid gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            sendProviderMessage(
                              activeConversation,
                              "Please complete your intake forms before your appointment so the care team can review them.",
                              "Intake reminder sent",
                            )
                          }
                          disabled={isWriting}
                        >
                          Send intake reminder
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            sendProviderMessage(
                              activeConversation,
                              "Please send a quick symptom update before your next appointment.",
                              "Symptom update requested",
                            )
                          }
                          disabled={isWriting}
                        >
                          Request symptom update
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            sendProviderMessage(
                              activeConversation,
                              "Your message has been escalated to your provider for review.",
                              "Conversation escalated",
                            )
                          }
                          disabled={isWriting}
                        >
                          Escalate to provider
                        </Button>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center p-6">
              <div className="max-w-sm rounded-lg border border-dashed p-6 text-center">
                <IconMessageCircle className="text-muted-foreground mx-auto mb-3 size-8" />
                <h3 className="font-semibold">No active conversation</h3>
                <p className="text-muted-foreground mt-2 text-sm">
                  Start a new message or seed demo conversations to open the
                  patient communication workspace.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New patient message</DialogTitle>
            <DialogDescription>
              Start a Firebase conversation connected to a patient profile.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Patient</Label>
              <Select
                value={newMessagePatientId}
                onValueChange={setNewMessagePatientId}
              >
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
              <Label>Message</Label>
              <Textarea
                value={newMessageBody}
                onChange={(event) => setNewMessageBody(event.target.value)}
                placeholder="Type the first message..."
                className="min-h-28 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNewMessageOpen(false)}
              disabled={isWriting}
            >
              Cancel
            </Button>
            <Button onClick={createNewConversation} disabled={isWriting}>
              <IconSend />
              Start conversation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isProvider = message.sender === "provider";

  return (
    <div className={`flex ${isProvider ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-lg border px-4 py-3 ${
          isProvider
            ? "bg-primary text-primary-foreground"
            : "bg-card text-card-foreground"
        }`}
      >
        <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
          <IconUser className="size-3.5" />
          {isProvider ? "Provider" : "Patient"} · {message.time}
        </div>
        <p className="text-sm leading-6">{message.body}</p>
      </div>
    </div>
  );
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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function toConversation(id: string, data: Record<string, unknown>): Conversation {
  return {
    id,
    patient: getString(data.patient, "Unknown Patient"),
    patientId: getString(data.patientId, id),
    lastMessage: getString(data.lastMessage, "No message yet"),
    time: getString(data.time, "Now"),
    status: getMessageStatus(data.status),
    appointment: getString(data.appointment, "Not scheduled"),
    provider: getString(data.provider, "Care Team"),
    risk: getRiskLevel(data.risk ?? data.riskLevel),
    phone: getString(data.phone, "Not provided"),
    lastMessageAt: getString(data.lastMessageAt, new Date(0).toISOString()),
  };
}

function toMessage(id: string, data: Record<string, unknown>): Message {
  return {
    id,
    conversationId: getString(data.conversationId, ""),
    sender: data.sender === "patient" ? "patient" : "provider",
    body: getString(data.body, ""),
    time: getString(data.time, "Now"),
    sequence:
      typeof data.sequence === "number"
        ? data.sequence
        : Number.parseInt(getString(data.sequence, "0"), 10) || 0,
  };
}

function toPatientOption(id: string, data: Record<string, unknown>): PatientOption {
  const firstName = getString(data.firstName, "");
  const lastName = getString(data.lastName, "");
  const composedName = `${firstName} ${lastName}`.trim();

  return {
    id,
    name:
      getString(data.fullName, "") ||
      getString(data.patientName, "") ||
      composedName ||
      "Unnamed Patient",
    phone: getString(data.phone, "Not provided"),
    risk: getRiskLevel(data.risk ?? data.riskLevel),
    appointment: getString(data.nextAppointment, "Not scheduled"),
    provider: getString(data.provider, "Care Team"),
  };
}

function mergePatientOptions(options: PatientOption[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    const key = option.id || option.name;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getMessageStatus(value: unknown): MessageStatus {
  if (value === "Unread" || value === "Open" || value === "Resolved") {
    return value;
  }

  return "Open";
}

function getRiskLevel(value: unknown): RiskLevel {
  if (value === "Low" || value === "Medium" || value === "High") {
    return value;
  }

  return "Medium";
}
