import { create } from "zustand";

const INITIAL_VITALS = {
  heartRate: "--",
  bloodPressure: "--/--",
  temperature: "--",
  spo2: "--",
  glucoseLevel: "--",
  weight: "--",
  heightCm: "--",
  bmi: "--",
  assistantName: ""
};

const INITIAL_SYMPTOMS = {
  chiefComplaint: "",
  durationDays: "",
  severity: "moderate",
  history: "",
  preferredLanguage: localStorage.getItem("kiosk-language") || "en"
};

const INITIAL_RECORDS = {
  vitals: [],
  consultations: [],
  prescriptions: []
};

const INITIAL_DOCTOR_SESSION = {
  token: localStorage.getItem("doctor-token") || "",
  profile: null,
  queue: [],
  activeConsultation: null
};

export const usePatientStore = create((set, get) => ({
  patient: null,
  vitals: INITIAL_VITALS,
  symptoms: INITIAL_SYMPTOMS,
  records: INITIAL_RECORDS,
  triage: null,
  assignedDoctor: null,
  summary: null,
  doctorSession: INITIAL_DOCTOR_SESSION,
  consultation: {
    active: false,
    muted: false,
    roomId: null,
    consultationId: null,
    roomName: null,
    twilioEnabled: false,
    status: "idle"
  },
  queue: {
    number: "A-12",
    waitMinutes: 8,
    status: "waiting"
  },
  language: localStorage.getItem("kiosk-language") || "en",
  offlineQueue: JSON.parse(localStorage.getItem("offline-queue") || "[]"),

  setLanguage: (language) => {
    localStorage.setItem("kiosk-language", language);
    set({ language });
  },

  setPatient: (patient) => set({ patient }),
  clearPatient: () => set({ patient: null }),
  setRecords: (records) => set({ records: { ...get().records, ...records } }),

  setVitals: (vitals) => set({ vitals: { ...get().vitals, ...vitals } }),
  resetVitals: () => set({ vitals: INITIAL_VITALS }),
  setSymptoms: (symptoms) => set({ symptoms: { ...get().symptoms, ...symptoms } }),
  resetSymptoms: () => set({ symptoms: INITIAL_SYMPTOMS }),
  setTriage: (triage) => set({ triage }),
  setAssignedDoctor: (assignedDoctor) => set({ assignedDoctor }),
  setSummary: (summary) => set({ summary }),
  setDoctorSession: (doctorSession) =>
    set({ doctorSession: { ...get().doctorSession, ...doctorSession } }),
  clearDoctorSession: () => {
    localStorage.removeItem("doctor-token");
    set({ doctorSession: INITIAL_DOCTOR_SESSION });
  },

  setConsultation: (consultation) =>
    set({ consultation: { ...get().consultation, ...consultation } }),

  setQueue: (queue) => set({ queue: { ...get().queue, ...queue } }),

  enqueueOfflineAction: (action) => {
    const updated = [...get().offlineQueue, { ...action, createdAt: Date.now() }];
    localStorage.setItem("offline-queue", JSON.stringify(updated));
    set({ offlineQueue: updated });
  },

  clearOfflineQueue: () => {
    localStorage.removeItem("offline-queue");
    set({ offlineQueue: [] });
  },

  resetSession: () =>
    set({
      vitals: INITIAL_VITALS,
      symptoms: INITIAL_SYMPTOMS,
      triage: null,
      assignedDoctor: null,
      summary: null,
      doctorSession: get().doctorSession,
      consultation: {
        active: false,
        muted: false,
        roomId: null,
        consultationId: null,
        roomName: null,
        twilioEnabled: false,
        status: "idle"
      },
      queue: {
        number: "A-12",
        waitMinutes: 8,
        status: "waiting"
      }
    })
}));
