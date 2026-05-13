"use client";

import * as React from "react";
import {
  IconCalendar,
  IconCheck,
  IconMailForward,
  IconMessageCircle,
  IconPhone,
  IconSearch,
  IconSend,
  IconUser,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type MessageStatus = "Unread" | "Open" | "Resolved";
type RiskLevel = "Low" | "Medium" | "High";

type Message = {
  id: string;
  sender: "patient" | "provider";
  body: string;
  time: string;
};

type Conversation = {
  id: string;
  patient: string;
  lastMessage: string;
  time: string;
  status: MessageStatus;
  appointment: string;
  provider: string;
  risk: RiskLevel;
  phone: string;
  messages: Message[];
};

const conversations: Conversation[] = [
  {
    id: "john-doe",
    patient: "John Doe",
    lastMessage: "I've been having trouble sleeping.",
    time: "9:42 AM",
    status: "Unread",
    appointment: "May 14, 10:00 AM",
    provider: "Dr Smith",
    risk: "Medium",
    phone: "(555) 010-4821",
    messages: [
      {
        id: "john-1",
        sender: "patient",
        body: "I've been having trouble sleeping.",
        time: "9:42 AM",
      },
      {
        id: "john-2",
        sender: "provider",
        body: "Please continue your medication and monitor symptoms. If sleep worsens tonight, send an update before your appointment.",
        time: "9:49 AM",
      },
      {
        id: "john-3",
        sender: "patient",
        body: "Thank you. I'll track it and bring notes tomorrow.",
        time: "9:53 AM",
      },
    ],
  },
  {
    id: "sarah-kim",
    patient: "Sarah Kim",
    lastMessage: "Can I move my follow-up earlier?",
    time: "Yesterday",
    status: "Open",
    appointment: "May 16, 11:30 AM",
    provider: "Dr Chen",
    risk: "Low",
    phone: "(555) 010-1120",
    messages: [
      {
        id: "sarah-1",
        sender: "patient",
        body: "Can I move my follow-up earlier? I have a work conflict.",
        time: "Yesterday",
      },
      {
        id: "sarah-2",
        sender: "provider",
        body: "We can check availability and send options today.",
        time: "Yesterday",
      },
    ],
  },
  {
    id: "mike-johnson",
    patient: "Mike Johnson",
    lastMessage: "My lab results uploaded this morning.",
    time: "Mon",
    status: "Resolved",
    appointment: "May 17, 1:00 PM",
    provider: "Dr Ross",
    risk: "High",
    phone: "(555) 010-7744",
    messages: [
      {
        id: "mike-1",
        sender: "patient",
        body: "My lab results uploaded this morning.",
        time: "Mon",
      },
      {
        id: "mike-2",
        sender: "provider",
        body: "Received. We will review them before your next visit.",
        time: "Mon",
      },
    ],
  },
  {
    id: "avery-johnson",
    patient: "Avery Johnson",
    lastMessage: "I finished the intake forms.",
    time: "Fri",
    status: "Resolved",
    appointment: "May 20, 3:00 PM",
    provider: "Dr Smith",
    risk: "Low",
    phone: "(555) 010-6732",
    messages: [
      {
        id: "avery-1",
        sender: "patient",
        body: "I finished the intake forms.",
        time: "Fri",
      },
      {
        id: "avery-2",
        sender: "provider",
        body: "Thank you. Your care team will review them before the appointment.",
        time: "Fri",
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

export default function PatientMessagesPage() {
  const [conversationList, setConversationList] =
    React.useState(conversations);
  const [activeConversationId, setActiveConversationId] = React.useState(
    conversations[0].id,
  );
  const [search, setSearch] = React.useState("");
  const [messageText, setMessageText] = React.useState("");

  const activeConversation =
    conversationList.find((item) => item.id === activeConversationId) ??
    conversationList[0];

  const filteredConversations = conversationList.filter((conversation) =>
    conversation.patient.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function sendMessage() {
    const body = messageText.trim();

    if (!body) return;

    setConversationList((current) =>
      current.map((conversation) =>
        conversation.id === activeConversation.id
          ? {
              ...conversation,
              lastMessage: body,
              time: "Now",
              status: "Open",
              messages: [
                ...conversation.messages,
                {
                  id: `${conversation.id}-${Date.now()}`,
                  sender: "provider",
                  body,
                  time: "Now",
                },
              ],
            }
          : conversation,
      ),
    );
    setMessageText("");
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
        <Button>
          <IconMailForward />
          New Message
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <aside className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card">
          <div className="border-b p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Messages</h3>
                <p className="text-muted-foreground text-sm">
                  Conversations sidebar
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
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setActiveConversationId(conversation.id)}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  conversation.id === activeConversation.id
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
                <Button variant="outline">
                  <IconCalendar />
                  Schedule
                </Button>
                <Button variant="outline">
                  <IconPhone />
                  Call
                </Button>
                <Button>
                  <IconCheck />
                  Resolve
                </Button>
              </div>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-4 overflow-hidden p-4 lg:grid-cols-[1fr_280px]">
            <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-background">
              <div className="flex items-center gap-2 border-b px-4 py-3">
                <IconMessageCircle className="text-primary size-5" />
                <h4 className="font-medium">Message history</h4>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                {activeConversation.messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
              </div>
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Textarea
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    placeholder="Type message..."
                    className="min-h-12 resize-none"
                  />
                  <Button className="self-end" onClick={sendMessage}>
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
                  <h4 className="font-medium">{activeConversation.patient}</h4>
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
                <SummaryRow label="Provider" value={activeConversation.provider} />
                <SummaryRow label="Risk Level" value={activeConversation.risk} />
                <SummaryRow label="Phone" value={activeConversation.phone} />
                <div className="rounded-lg border bg-muted/35 p-3">
                  <p className="mb-2 font-medium">Quick Actions</p>
                  <div className="grid gap-2">
                    <Button variant="outline" size="sm">
                      Send intake reminder
                    </Button>
                    <Button variant="outline" size="sm">
                      Request symptom update
                    </Button>
                    <Button variant="outline" size="sm">
                      Escalate to provider
                    </Button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
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
