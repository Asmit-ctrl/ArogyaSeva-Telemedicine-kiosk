import { create } from "zustand";

const INITIAL_VITALS = {
  heartRate: "--",
  bloodPressure: "--/--",
  temperature: "--",
  spo2: "--",
  weight: "--"
};

export const usePatientStore = create((set, get) => ({
  patient: null,
  vitals: INITIAL_VITALS,
  consultation: {
    active: false,
    muted: false,
    roomId: null
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

  setVitals: (vitals) => set({ vitals: { ...get().vitals, ...vitals } }),
  resetVitals: () => set({ vitals: INITIAL_VITALS }),

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
  }
}));
