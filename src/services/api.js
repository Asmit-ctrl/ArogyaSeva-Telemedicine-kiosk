import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const doctorToken = localStorage.getItem("doctor-token");
  if (doctorToken) {
    config.headers.Authorization = `Bearer ${doctorToken}`;
  }

  return config;
});

const OFFLINE_KEY = "offline-request-queue";
const DUMMY_DB_KEY = "kiosk-dummy-db";
const USE_DUMMY = (import.meta.env.VITE_USE_DUMMY_API || "false") === "true";

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getDummyDb() {
  const initial = {
    patients: {},
    consultations: {},
    vitalsByPatient: {},
    prescriptionsByConsultation: {}
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

  if (method === "post" && url === "/kiosk-flow/intake") {
    const patientId = data.mobileNumber || `PAT-${Date.now()}`;
    const patient = {
      id: patientId,
      patientId,
      name: data.name || "Walk-in Patient",
      age: Number(data.age) || 0,
      gender: String(data.gender || "other").toLowerCase(),
      mobileNumber: data.mobileNumber,
      village: data.village || "Walk-in",
      preferredLanguage: data.preferredLanguage || "en",
      visitCount: (db.patients[patientId]?.visitCount || 0) + 1
    };

    db.patients[patientId] = patient;
    if (!db.vitalsByPatient[patientId]) {
      db.vitalsByPatient[patientId] = [];
    }

    saveDummyDb(db);
    return {
      data: {
        patient,
        records: {
          vitals: db.vitalsByPatient[patientId] || [],
          consultations: Object.values(db.consultations).filter((item) => item.patient?.patientId === patientId),
          prescriptions: []
        },
        dummy: true
      }
    };
  }

  if (method === "post" && url === "/kiosk-flow/triage") {
    const patient = db.patients[data.patientId];
    const consultationId = `CON-${Date.now()}`;
    const urgency =
      Number(data.vitals?.spo2) < 90 || String(data.symptoms?.severity || "").toLowerCase() === "critical"
        ? "emergency"
        : "routine";

    const assignedDoctor =
      urgency === "emergency"
        ? null
        : {
            id: "DOC-1001",
            doctorId: "DOC-1001",
            name: "Dr. Meera Sharma",
            specialization: "general_medicine",
            languages: ["en", "hi"],
            consultationFee: 250,
            waitTimeMinutes: 4,
            rating: 4.8
          };

    const consultation = {
      id: consultationId,
      consultationId,
      status: urgency === "emergency" ? "redirected" : "pending",
      queueNumber: "Q-214",
      estimatedWaitMinutes: urgency === "emergency" ? 0 : 4,
      roomName: `telemed-${consultationId.toLowerCase()}`,
      triage: {
        urgency,
        specialty: assignedDoctor?.specialization || "emergency_medicine",
        summary:
          urgency === "emergency"
            ? "Emergency red flag detected. Redirect patient to hospital triage."
            : "Vitals are stable. Proceed with general teleconsultation.",
        riskAlerts: urgency === "emergency" ? ["Low SpO2 or severe symptoms detected."] : [],
        recommendedActions:
          urgency === "emergency"
            ? ["Transfer immediately to the nearest hospital."]
            : ["Start teleconsultation with the assigned physician."],
        hospitalRedirect: urgency === "emergency",
        followUpDays: urgency === "emergency" ? 1 : 7,
        confidence: 0.8
      },
      vitalsSnapshot: {
        ...data.vitals,
        oxygenLevel: Number(data.vitals?.spo2)
      },
      pricing: {
        consultationFee: assignedDoctor?.consultationFee || 0,
        subsidyApplied: true,
        currency: "INR"
      },
      paymentStatus: urgency === "emergency" ? "waived" : "pending",
      pharmacyOptions: [
        { name: "Nearby Pharmacy Pickup", mode: "pickup", eta: "30-45 min" },
        { name: "Partner Home Delivery", mode: "delivery", eta: "2-4 hours" }
      ],
      followUpPlan: {
        reminderChannel: "sms",
        dueInDays: urgency === "emergency" ? 1 : 7,
        chronicCare: false
      },
      patient,
      doctor: assignedDoctor
    };

    db.consultations[consultationId] = consultation;
    if (!db.vitalsByPatient[data.patientId]) {
      db.vitalsByPatient[data.patientId] = [];
    }
    db.vitalsByPatient[data.patientId].push({
      ...data.vitals,
      recordedAt: new Date().toISOString()
    });

    saveDummyDb(db);
    return {
      data: {
        consultation,
        triage: consultation.triage,
        assignedDoctor,
        queue: {
          number: consultation.queueNumber,
          waitMinutes: consultation.estimatedWaitMinutes,
          status: urgency === "emergency" ? "redirected" : "queued"
        },
        dummy: true
      }
    };
  }

  if (method === "post" && url === "/video/start") {
    const consultation = db.consultations[data.consultationId];
    return {
      data: {
        consultationId: consultation?.consultationId,
        roomName: consultation?.roomName,
        identity: `kiosk-${consultation?.consultationId || "demo"}`,
        twilioEnabled: false,
        token: null,
        assignedDoctor: consultation?.doctor || null,
        status: consultation?.status || "pending",
        dummy: true
      }
    };
  }

  if (method === "post" && url === "/kiosk-flow/assistant/chat") {
    const recommendedDoctors = [
      {
        doctorId: "DOC-1001",
        name: "Dr. Meera Sharma",
        specialization: "general_medicine",
        languages: ["en", "hi"],
        waitTimeMinutes: 4,
        rating: 4.8
      },
      {
        doctorId: "DOC-1002",
        name: "Dr. Arjun Rao",
        specialization: "cardiology",
        languages: ["en", "hi", "te"],
        waitTimeMinutes: 7,
        rating: 4.9
      }
    ];
    return {
      data: {
        reply:
          data.mode === "doctor"
            ? "Suggested doctor workflow: review symptoms, confirm vitals, then continue with consultation and eRx."
            : "Suggested next step: complete vitals capture and continue to the recommended doctor queue.",
        recommendedSpecialty: data.symptoms?.chiefComplaint?.toLowerCase().includes("chest")
          ? "cardiology"
          : "general_medicine",
        recommendedDoctors
      }
    };
  }

  if (method === "post" && /\/kiosk-flow\/consultations\/.+\/complete$/.test(url)) {
    const consultationId = url.split("/")[3];
    const consultation = db.consultations[consultationId];
    if (consultation) {
      consultation.status = consultation.triage?.hospitalRedirect ? "redirected" : "completed";
      consultation.paymentStatus = consultation.triage?.hospitalRedirect ? "waived" : "paid";
      db.consultations[consultationId] = consultation;
      saveDummyDb(db);
    }

    return {
      data: {
        consultation,
        prescription: null,
        visitSummary: {
          triageSummary: consultation?.triage?.summary,
          riskAlerts: consultation?.triage?.riskAlerts || [],
          recommendedActions: consultation?.triage?.recommendedActions || [],
          pharmacyOptions: consultation?.pharmacyOptions || []
        },
        dummy: true
      }
    };
  }

  if (method === "post" && url === "/doctors/self-register") {
    const doctorId = `DOC-${Date.now()}`;
    const doctor = {
      _id: doctorId,
      doctorId,
      name: data.name,
      email: data.email,
      specialization: data.specialization,
      licenseNumber: data.licenseNumber,
      languages: data.languages || ["en", "hi"],
      consultationFee: Number(data.consultationFee || 300),
      availability: "available"
    };
    db.doctorProfile = doctor;
    saveDummyDb(db);
    return {
      data: {
        token: "dummy-doctor-token",
        doctor,
        dummy: true
      }
    };
  }

  if (method === "post" && url === "/doctors/login") {
    return {
      data: {
        token: "dummy-doctor-token",
        doctor: db.doctorProfile || {
          doctorId: "DOC-1001",
          name: "Dr. Meera Sharma",
          specialization: "general_medicine",
          languages: ["en", "hi"],
          consultationFee: 250,
          availability: "available"
        },
        dummy: true
      }
    };
  }

  if (method === "get" && url === "/doctors/me") {
    return {
      data: db.doctorProfile || {
        doctorId: "DOC-1001",
        name: "Dr. Meera Sharma",
        specialization: "general_medicine",
        languages: ["en", "hi"],
        consultationFee: 250,
        availability: "available"
      }
    };
  }

  if (method === "get" && url === "/doctors/me/queue") {
    return {
      data: {
        doctor: db.doctorProfile || null,
        consultations: Object.values(db.consultations || {}).filter((consultation) => consultation.doctor)
      }
    };
  }

  if (method === "post" && /\/doctors\/consultations\/.+\/accept$/.test(url)) {
    const consultationId = url.split("/")[3];
    const consultation = db.consultations[consultationId];
    if (consultation) {
      consultation.status = "in_progress";
      db.consultations[consultationId] = consultation;
      saveDummyDb(db);
    }
    return {
      data: {
        consultation
      }
    };
  }

  if (method === "get" && /^\/kiosk-flow\/patients\/.+\/records$/.test(url)) {
    const patientId = url.split("/")[3];
    return {
      data: {
        patient: db.patients[patientId] || null,
        vitals: db.vitalsByPatient[patientId] || [],
        consultations: Object.values(db.consultations).filter((item) => item.patient?.patientId === patientId),
        prescriptions: [],
        dummy: true
      }
    };
  }

  if (method === "get" && /^\/kiosk-flow\/consultations\/.+$/.test(url)) {
    const consultationId = url.split("/")[3];
    return {
      data: {
        consultation: db.consultations[consultationId] || null,
        prescription: null,
        dummy: true
      }
    };
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
  } catch (error) {
    if (!navigator.onLine) {
      queueRequest(requestConfig);
      return dummyRequest(requestConfig);
    }

    throw error;
  }
}

export async function syncQueuedRequests() {
  if (!navigator.onLine || USE_DUMMY) {
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
  safeRequest({ method: "post", url: "/kiosk-flow/intake", data: payload });

export const fetchPatientRecords = (patientId) =>
  safeRequest({ method: "get", url: `/kiosk-flow/patients/${patientId}/records` });

export const submitKioskTriage = (payload) =>
  safeRequest({ method: "post", url: "/kiosk-flow/triage", data: payload });

export const fetchConsultation = (consultationId) =>
  safeRequest({ method: "get", url: `/kiosk-flow/consultations/${consultationId}` });

export const completeConsultation = (consultationId, payload) => {
  if (!consultationId) {
    return Promise.reject(new Error("consultationId is required"));
  }

  return safeRequest({ method: "post", url: `/kiosk-flow/consultations/${consultationId}/complete`, data: payload });
};

export const createVideoSession = (payload) =>
  safeRequest({ method: "post", url: "/video/start", data: payload });

export const doctorSelfRegister = (payload) =>
  safeRequest({ method: "post", url: "/doctors/self-register", data: payload });

export const doctorLogin = (payload) =>
  safeRequest({ method: "post", url: "/doctors/login", data: payload });

export const fetchDoctorProfile = () =>
  safeRequest({ method: "get", url: "/doctors/me" });

export const fetchDoctorQueue = () =>
  safeRequest({ method: "get", url: "/doctors/me/queue" });

export const acceptDoctorConsultation = (consultationId) =>
  safeRequest({ method: "post", url: `/doctors/consultations/${consultationId}/accept` });

export const sendAssistantMessage = (payload) =>
  safeRequest({ method: "post", url: "/kiosk-flow/assistant/chat", data: payload });

export default api;
