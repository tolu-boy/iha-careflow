"use client";

import * as React from "react";
import {
  IconClipboardCheck,
  IconFileText,
  IconHeartbeat,
  IconShieldCheck,
  IconUserPlus,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";

const symptomOptions = [
  "Anxiety",
  "Depressed mood",
  "Sleep changes",
  "Panic attacks",
  "Focus issues",
  "Mood swings",
  "Trauma symptoms",
  "Medication side effects",
  "Appetite changes",
  "Low energy",
];

type IntakeForm = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;
  reasonForVisit: string;
  symptomDetails: string;
  medicalHistory: string;
  medications: string;
  allergies: string;
  insuranceProvider: string;
  memberId: string;
  billingPreference: string;
};

const initialForm: IntakeForm = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  email: "",
  emergencyContact: "",
  emergencyPhone: "",
  reasonForVisit: "",
  symptomDetails: "",
  medicalHistory: "",
  medications: "",
  allergies: "",
  insuranceProvider: "",
  memberId: "",
  billingPreference: "",
};

export default function PatientOnboardingPage() {
  const [form, setForm] = React.useState<IntakeForm>(initialForm);
  const [symptoms, setSymptoms] = React.useState<string[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");

  const completedSections = React.useMemo(() => {
    const sections = [
      Boolean(
        form.fullName &&
          form.dateOfBirth &&
          form.gender &&
          form.phone &&
          form.email,
      ),
      Boolean(form.emergencyContact && form.emergencyPhone),
      Boolean(form.reasonForVisit),
      symptoms.length > 0 || Boolean(form.symptomDetails),
      Boolean(form.medicalHistory || form.medications || form.allergies),
      Boolean(form.insuranceProvider || form.billingPreference),
    ];

    return sections.filter(Boolean).length;
  }, [form, symptoms]);

  function updateField(field: keyof IntakeForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleSymptom(symptom: string, checked: boolean) {
    setSymptoms((current) =>
      checked
        ? [...current, symptom]
        : current.filter((item) => item !== symptom),
    );
  }

  async function saveDraft() {
    setSaveError("");
    setIsSaving(true);

    try {
      await addDoc(collection(db, "patients"), {
        ...form,
        symptoms,
        status: "Intake Draft",
        source: "patient-onboarding",
        onboardingComplete: false,
        createdBy: auth.currentUser?.uid ?? null,
        createdByEmail: auth.currentUser?.email ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setForm(initialForm);
      setSymptoms([]);
      toast.success("Patient data saved", {
        description:
          "The patient profile has been  saved .",
      });
    } catch {
      const message =
        "Unable to save this patient data. Please check Firebase permissions and try again.";

      setSaveError(message);
      toast.error("Patient data was not saved", {
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      <section className="px-4 lg:px-6">
        <div className="rounded-lg border bg-card p-6 shadow-xs">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <Badge variant="outline" className="mb-3">
                New patient intake
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tight">
                Complete this short intake so our care team can understand your
                needs before your appointment.
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-6">
                Collect basic information, contact details, reason for visit,
                symptoms, medical history, and insurance or billing preferences
                before the patient is handed off to the provider.
              </p>
            </div>
            <div className="grid gap-2 rounded-lg border bg-background p-4 text-sm sm:min-w-56">
              <div className="flex items-center justify-between gap-4">
                <span className="text-muted-foreground">Sections complete</span>
                <span className="font-medium">{completedSections}/6</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(completedSections / 6) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 px-4 xl:grid-cols-[1fr_380px] lg:px-6">
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            void saveDraft();
          }}
        >
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconUserPlus className="size-5" />
                </div>
                <div>
                  <CardTitle>1. Basic information</CardTitle>
                  <CardDescription>
                    Patient demographics and best contact methods.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input
                  id="full-name"
                  value={form.fullName}
                  onChange={(event) =>
                    updateField("fullName", event.target.value)
                  }
                  placeholder="Patient legal name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date-of-birth">Date of birth</Label>
                <Input
                  id="date-of-birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) =>
                    updateField("dateOfBirth", event.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={form.gender}
                  onValueChange={(value) => updateField("gender", value)}
                >
                  <SelectTrigger id="gender" className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
  
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  placeholder="(555) 000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="patient@example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emergency-contact">Emergency contact</Label>
                <Input
                  id="emergency-contact"
                  value={form.emergencyContact}
                  onChange={(event) =>
                    updateField("emergencyContact", event.target.value)
                  }
                  placeholder="Name and relationship"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="emergency-phone">Emergency phone</Label>
                <Input
                  id="emergency-phone"
                  type="tel"
                  value={form.emergencyPhone}
                  onChange={(event) =>
                    updateField("emergencyPhone", event.target.value)
                  }
                  placeholder="Emergency contact phone"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconHeartbeat className="size-5" />
                </div>
                <div>
                  <CardTitle>2. Reason for visit</CardTitle>
                  <CardDescription>
                    What brought the patient in and what outcome they want.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Label htmlFor="reason-for-visit">Reason for visit</Label>
              <Textarea
                id="reason-for-visit"
                value={form.reasonForVisit}
                onChange={(event) =>
                  updateField("reasonForVisit", event.target.value)
                }
                placeholder="Briefly describe the main concern, goals for care, and appointment context."
                className="min-h-28"
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>3. Symptoms checklist</CardTitle>
              <CardDescription>
                Select all symptoms the patient wants the care team to review.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {symptomOptions.map((symptom) => (
                  <label
                    key={symptom}
                    className="flex items-center gap-3 rounded-lg border bg-background p-3 text-sm"
                  >
                    <Checkbox
                      checked={symptoms.includes(symptom)}
                      onCheckedChange={(checked) =>
                        toggleSymptom(symptom, checked === true)
                      }
                    />
                    {symptom}
                  </label>
                ))}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="symptom-details">Additional symptom notes</Label>
                <Textarea
                  id="symptom-details"
                  value={form.symptomDetails}
                  onChange={(event) =>
                    updateField("symptomDetails", event.target.value)
                  }
                  placeholder="Frequency, severity, triggers, or recent changes."
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconFileText className="size-5" />
                </div>
                <div>
                  <CardTitle>4. Medical history</CardTitle>
                  <CardDescription>
                    Prior diagnoses, care history, medications, and allergies.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="medical-history">Medical history</Label>
                <Textarea
                  id="medical-history"
                  value={form.medicalHistory}
                  onChange={(event) =>
                    updateField("medicalHistory", event.target.value)
                  }
                  placeholder="Past diagnoses, hospitalizations, relevant family history, prior therapy or psychiatry care."
                  className="min-h-24"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="medications">Current medications</Label>
                  <Textarea
                    id="medications"
                    value={form.medications}
                    onChange={(event) =>
                      updateField("medications", event.target.value)
                    }
                    placeholder="Medication name, dose, frequency."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={form.allergies}
                    onChange={(event) =>
                      updateField("allergies", event.target.value)
                    }
                    placeholder="Medication, food, or environmental allergies."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconShieldCheck className="size-5" />
                </div>
                <div>
                  <CardTitle>5. Insurance and billing</CardTitle>
                  <CardDescription>
                    Capture coverage details and billing preferences.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="insurance-provider">Insurance provider</Label>
                <Input
                  id="insurance-provider"
                  value={form.insuranceProvider}
                  onChange={(event) =>
                    updateField("insuranceProvider", event.target.value)
                  }
                  placeholder="Insurance company"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="member-id">Member ID</Label>
                <Input
                  id="member-id"
                  value={form.memberId}
                  onChange={(event) =>
                    updateField("memberId", event.target.value)
                  }
                  placeholder="Policy or member number"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="billing-preference">Billing preference</Label>
                <Select
                  value={form.billingPreference}
                  onValueChange={(value) =>
                    updateField("billingPreference", value)
                  }
                >
                  <SelectTrigger id="billing-preference" className="w-full">
                    <SelectValue placeholder="Select billing preference" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Use insurance">Use insurance</SelectItem>
                    <SelectItem value="Self-pay">Self-pay</SelectItem>
                    <SelectItem value="Superbill requested">
                      Superbill requested
                    </SelectItem>
                    <SelectItem value="Needs billing call">
                      Needs billing call
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {saveError ? (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 sm:mr-auto"
              >
                {saveError}
              </div>
            ) : null}
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving patient..." : "Save patient data"}
            </Button>
          </div>
        </form>

        <aside className="xl:sticky xl:top-20 xl:self-start">
          <Card className="rounded-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <IconClipboardCheck className="size-5" />
                </div>
                <div>
                  <CardTitle>6. Auto-summary</CardTitle>
                  <CardDescription>
                    Preview for the care team before appointment prep.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <SummaryRow label="Patient" value={form.fullName} />
              <SummaryRow label="Date of birth" value={form.dateOfBirth} />
              <SummaryRow label="Gender" value={form.gender} />
              <SummaryRow
                label="Contact"
                value={[form.phone, form.email].filter(Boolean).join(" · ")}
              />
              <SummaryRow
                label="Emergency"
                value={[form.emergencyContact, form.emergencyPhone]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <Separator />
              <SummaryRow label="Reason" value={form.reasonForVisit} />
              <div className="grid gap-2">
                <p className="text-muted-foreground">Symptoms</p>
                {symptoms.length ? (
                  <div className="flex flex-wrap gap-2">
                    {symptoms.map((symptom) => (
                      <Badge key={symptom} variant="outline">
                        {symptom}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No symptoms selected</p>
                )}
              </div>
              <SummaryRow label="History" value={form.medicalHistory} />
              <SummaryRow label="Medications" value={form.medications} />
              <SummaryRow label="Allergies" value={form.allergies} />
              <Separator />
              <SummaryRow
                label="Insurance"
                value={[form.insuranceProvider, form.memberId]
                  .filter(Boolean)
                  .join(" · ")}
              />
              <SummaryRow
                label="Billing preference"
                value={form.billingPreference}
              />
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1">
      <p className="text-muted-foreground">{label}</p>
      <p className="line-clamp-4 font-medium">
        {value || "Not provided yet"}
      </p>
    </div>
  );
}
