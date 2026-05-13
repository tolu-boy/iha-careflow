"use client";

import { create } from "zustand";

export type PatientStatus =
  | "Active"
  | "Intake Pending"
  | "Care Review"
  | "Inactive";
export type RiskLevel = "Low" | "Medium" | "High";
export type InsuranceStatus = "Verified" | "Pending" | "Missing Info";

export type Patient = {
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

export type DoctorStatus =
  | "Available"
  | "In Session"
  | "Out Today"
  | "Credentialing";

export type Doctor = {
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

export type NewDoctorInput = {
  name: string;
  title: string;
  specialty: string;
  email: string;
  phone: string;
  license: string;
  npi: string;
  status: DoctorStatus;
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
    id: "jordan-rivera",
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

type CareFlowState = {
  patients: Patient[];
  doctors: Doctor[];
  activePatientId: string;
  activeDoctorId: string;
  setActivePatientId: (patientId: string) => void;
  setActiveDoctorId: (doctorId: string) => void;
  addDoctor: (doctorInput: NewDoctorInput) => void;
};

export const useCareFlowStore = create<CareFlowState>((set) => ({
  patients: initialPatients,
  doctors: initialDoctors,
  activePatientId: initialPatients[0]?.id ?? "",
  activeDoctorId: initialDoctors[0]?.id ?? "",
  setActivePatientId: (patientId) => set({ activePatientId: patientId }),
  setActiveDoctorId: (doctorId) => set({ activeDoctorId: doctorId }),
  addDoctor: (doctorInput) => {
    const doctor = createDoctorFromInput(doctorInput);

    set((state) => ({
      doctors: [doctor, ...state.doctors],
      activeDoctorId: doctor.id,
    }));
  },
}));

function createDoctorFromInput(doctorInput: NewDoctorInput): Doctor {
  return {
    id: `doctor-${Date.now()}`,
    name: doctorInput.name.trim(),
    title: doctorInput.title || "Provider",
    specialty: doctorInput.specialty,
    license: doctorInput.license || "Pending",
    npi: doctorInput.npi || "Pending",
    email: doctorInput.email || "Not entered",
    phone: doctorInput.phone || "Not entered",
    status: doctorInput.status,
    todayAppointments: 0,
    availableSlots: doctorInput.status === "Credentialing" ? 0 : 4,
    openNotes: 0,
    nextAvailable:
      doctorInput.status === "Credentialing"
        ? "Pending credentialing"
        : "Schedule template needed",
    panelCount: 0,
    highRiskPanel: 0,
    capacity: 0,
    location: "Pending assignment",
    networkStatus:
      doctorInput.status === "Credentialing"
        ? "Credentialing in progress"
        : "Network setup needed",
    upcoming: ["Schedule template needed", "Panel assignment pending"],
    focus: `${doctorInput.specialty} care.`,
  };
}
