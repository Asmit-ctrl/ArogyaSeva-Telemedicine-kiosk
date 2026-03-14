import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://api.example.com",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

const OFFLINE_KEY = "offline-request-queue";
const DUMMY_DB_KEY = "kiosk-dummy-db";
const USE_DUMMY = (import.meta.env.VITE_USE_DUMMY_API || "true") === "true";

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDummyDb() {
  const initial = {
    patients: {},
    vitalsByPatient: {},
    prescriptionsByPatient: {}
  };
  try {
    return JSON.parse(localStorage.getItem(DUMMY_DB_KEY) || JSON.stringify(initial));
  } catch {
    return initial;
  }
}

function saveDummyDb(db) {
  localStorage.setItem(DUMMY_DB_KEY, JSON.stringify(db));
}

async function dummyRequest(requestConfig) {
  await delay();
  const method = (requestConfig.method || "get").toLowerCase();
  const url = requestConfig.url || "";
  const data = requestConfig.data || {};
  const db = getDummyDb();

  if (method === "post" && url === "/patients/register") {
    const id = data.id || `PAT-${Date.now()}`;
    db.patients[id] = { ...data, id, updatedAt: Date.now() };
    if (!db.vitalsByPatient[id]) {
      db.vitalsByPatient[id] = [];
    }
    saveDummyDb(db);
    return { data: { success: true, patient: db.patients[id], dummy: true } };
  }

  if (method === "get" && /^\/patients\/.+\/records$/.test(url)) {
    const patientId = url.split("/")[2];
    return {
      data: {
        success: true,
        records: {
          patient: db.patients[patientId] || null,
          vitals: db.vitalsByPatient[patientId] || [],
          prescriptions: db.prescriptionsByPatient[patientId] || []
        },
        dummy: true
      }
    };
  }

  if (method === "post" && url === "/vitals/upload") {
    const patientId = data.patientId || "UNKNOWN";
    if (!db.vitalsByPatient[patientId]) {
      db.vitalsByPatient[patientId] = [];
    }
    db.vitalsByPatient[patientId].push({ ...data.vitals, createdAt: Date.now() });
    saveDummyDb(db);
    return { data: { success: true, queued: false, dummy: true } };
  }

  if (method === "post" && url === "/consultation/start") {
    return {
      data: {
        success: true,
        roomId: `ROOM-${Date.now()}`,
        status: data.ended ? "ended" : "started",
        dummy: true
      }
    };
  }

  if (method === "post" && url === "/prescription/send") {
    const patientId = data.patientId || "UNKNOWN";
    if (!db.prescriptionsByPatient[patientId]) {
      db.prescriptionsByPatient[patientId] = [];
    }
    db.prescriptionsByPatient[patientId].push({
      mode: data.mode || "sms",
      sentAt: Date.now(),
      summary: "Dummy prescription sent"
    });
    saveDummyDb(db);
    return { data: { success: true, dummy: true } };
  }

  return { data: { success: true, dummy: true } };
}

function getQueue() {
  return JSON.parse(localStorage.getItem(OFFLINE_KEY) || "[]");
}

function saveQueue(queue) {
  localStorage.setItem(OFFLINE_KEY, JSON.stringify(queue));
}

function queueRequest(request) {
  const queue = getQueue();
  queue.push({ ...request, createdAt: Date.now() });
  saveQueue(queue);
}

async function safeRequest(requestConfig) {
  if (USE_DUMMY) {
    return dummyRequest(requestConfig);
  }

  try {
    return await api(requestConfig);
  } catch {
    queueRequest(requestConfig);
    return dummyRequest(requestConfig);
  }
}

export async function syncQueuedRequests() {
  if (!navigator.onLine) {
    return;
  }
  const queue = getQueue();
  const remaining = [];

  for (const req of queue) {
    try {
      await api(req);
    } catch {
      remaining.push(req);
    }
  }

  saveQueue(remaining);
}

export const registerPatient = (payload) =>
  safeRequest({ method: "post", url: "/patients/register", data: payload });

export const fetchPatientRecords = (patientId) =>
  safeRequest({ method: "get", url: `/patients/${patientId}/records` });

export const uploadVitals = (payload) =>
  safeRequest({ method: "post", url: "/vitals/upload", data: payload });

export const startConsultation = (payload) =>
  safeRequest({ method: "post", url: "/consultation/start", data: payload });

export const sendPrescription = (payload) =>
  safeRequest({ method: "post", url: "/prescription/send", data: payload });

export default api;
