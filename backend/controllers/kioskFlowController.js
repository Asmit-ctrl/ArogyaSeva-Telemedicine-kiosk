const Patient = require("../models/Patient");
const Vitals = require("../models/Vitals");
const Consultation = require("../models/Consultation");
const Prescription = require("../models/Prescription");
const Doctor = require("../models/Doctor");
const { assessTriage, toNumber } = require("../services/triageService");
const { rankDoctors } = require("../services/triageService");
const { buildLookup, resolvePatient, resolveConsultation } = require("../utils/entityResolvers");
const { getClient } = require("../services/openaiService");

const normalizeGender = (value) => {
  const normalized = String(value || "other").toLowerCase();
  if (["male", "female", "other"].includes(normalized)) {
    return normalized;
  }

  return "other";
};

const toPatientPayload = (body) => ({
  name: String(body.name || "Walk-in Patient").trim(),
  age: toNumber(body.age) || 0,
  gender: normalizeGender(body.gender),
  mobileNumber: String(body.mobileNumber || body.mobile || "").trim(),
  aadhaarId: body.aadhaarId ? String(body.aadhaarId).trim() : undefined,
  village: String(body.village || "Walk-in").trim(),
  preferredLanguage: String(body.preferredLanguage || "en").trim(),
  chronicConditions: Array.isArray(body.chronicConditions) ? body.chronicConditions : [],
  emergencyContact: body.emergencyContact ? String(body.emergencyContact).trim() : undefined,
  lastVisitAt: new Date(),
});

const serializePatient = (patient) => ({
  id: patient.patientId,
  patientId: patient.patientId,
  mongoId: patient._id,
  name: patient.name,
  age: patient.age,
  gender: patient.gender,
  mobileNumber: patient.mobileNumber,
  village: patient.village,
  preferredLanguage: patient.preferredLanguage,
  chronicConditions: patient.chronicConditions || [],
  visitCount: patient.visitCount || 0,
});

const serializeDoctor = (doctor) =>
  doctor
    ? {
        id: doctor.doctorId,
        doctorId: doctor.doctorId,
        name: doctor.name,
        specialization: doctor.specialization,
        languages: doctor.languages || [],
        consultationFee: doctor.consultationFee,
        waitTimeMinutes: doctor.waitTimeMinutes,
        rating: doctor.rating,
      }
    : null;

const serializeConsultation = (consultation) => ({
  id: consultation.consultationId,
  consultationId: consultation.consultationId,
  status: consultation.status,
  queueNumber: consultation.queueNumber,
  estimatedWaitMinutes: consultation.estimatedWaitMinutes,
  roomName: consultation.roomName,
  triage: consultation.triage,
  symptoms: consultation.symptoms,
  vitalsSnapshot: consultation.vitalsSnapshot,
  pricing: consultation.pricing,
  paymentStatus: consultation.paymentStatus,
  pharmacyOptions: consultation.pharmacyOptions,
  followUpPlan: consultation.followUpPlan,
  createdAt: consultation.createdAt,
  patient: consultation.patientId?.patientId ? serializePatient(consultation.patientId) : undefined,
  doctor: consultation.doctorId?.doctorId ? serializeDoctor(consultation.doctorId) : undefined,
});

const isGreetingMessage = (message) =>
  /^(hi|hii|hiii|hello|hey|hlo|hola|namaste|good morning|good evening|good afternoon)$/i.test(
    String(message || "").trim()
  );

const isVeryShortMessage = (message) => String(message || "").trim().split(/\s+/).length <= 2;

const sanitizeConversationHistory = (history) =>
  (Array.isArray(history) ? history : [])
    .filter(
      (item) =>
        item &&
        ["user", "assistant"].includes(item.role) &&
        typeof item.text === "string" &&
        item.text.trim()
    )
    .slice(-8)
    .map((item) => ({
      role: item.role,
      text: item.text.trim().slice(0, 1000),
    }));

const sanitizeAssistantVitals = (vitals) => {
  const source = vitals || {};
  const sanitized = {};

  const numericFields = [
    { key: "heartRate", min: 30, max: 220 },
    { key: "temperature", min: 34, max: 43 },
    { key: "oxygenLevel", aliases: ["spo2"], min: 70, max: 100 },
    { key: "glucoseLevel", min: 40, max: 600 },
    { key: "weight", min: 2, max: 300 },
    { key: "heightCm", min: 40, max: 250 },
    { key: "bmi", min: 10, max: 80 },
  ];

  numericFields.forEach(({ key, aliases = [], min, max }) => {
    const rawValue = [source[key], ...aliases.map((alias) => source[alias])].find(
      (value) => value !== undefined && value !== null && value !== ""
    );
    const numericValue = toNumber(rawValue);
    if (numericValue !== undefined && numericValue >= min && numericValue <= max) {
      sanitized[key] = numericValue;
    }
  });

  const bloodPressure = String(source.bloodPressure || "").trim();
  if (/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)) {
    sanitized.bloodPressure = bloodPressure;
  }

  return sanitized;
};

const findInvalidVitalFields = (vitals) => {
  const source = vitals || {};
  const invalidFields = [];
  const validators = [
    { label: "heart rate", value: source.heartRate, min: 30, max: 220 },
    { label: "temperature", value: source.temperature, min: 34, max: 43 },
    { label: "SpO2", value: source.spo2 ?? source.oxygenLevel, min: 70, max: 100 },
    { label: "glucose", value: source.glucoseLevel, min: 40, max: 600 },
    { label: "weight", value: source.weight, min: 2, max: 300 },
    { label: "height", value: source.heightCm, min: 40, max: 250 },
    { label: "BMI", value: source.bmi, min: 10, max: 80 },
  ];

  validators.forEach(({ label, value, min, max }) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    const numericValue = toNumber(value);
    if (numericValue === undefined || numericValue < min || numericValue > max) {
      invalidFields.push(label);
    }
  });

  const bloodPressure = String(source.bloodPressure || "").trim();
  if (bloodPressure && !/^\d{2,3}\/\d{2,3}$/.test(bloodPressure)) {
    invalidFields.push("blood pressure");
  }

  return Array.from(new Set(invalidFields));
};

const sanitizeSymptomsForAssistant = (symptoms) => ({
  chiefComplaint: String(symptoms?.chiefComplaint || "").trim(),
  durationDays: toNumber(symptoms?.durationDays) || undefined,
  severity: String(symptoms?.severity || "").trim() || undefined,
  history: String(symptoms?.history || "").trim(),
  preferredLanguage: String(symptoms?.preferredLanguage || "").trim() || undefined,
});

const toPlainChatText = (value) =>
  String(value || "")
    .replace(/\r/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const limitAssistantReply = (value) => {
  const plainText = toPlainChatText(value);
  if (!plainText) {
    return plainText;
  }

  const paragraphs = plainText
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 4);

  const compact = paragraphs.join("\n\n");
  if (compact.length <= 650) {
    return compact;
  }

  const truncated = compact.slice(0, 650);
  const lastSentence = truncated.lastIndexOf(".");
  return `${truncated.slice(0, lastSentence > 120 ? lastSentence + 1 : 650).trim()}`;
};

const hasClinicalContext = ({ patient, symptoms, vitals }) =>
  Boolean(
    String(symptoms?.chiefComplaint || "").trim() ||
      String(symptoms?.history || "").trim() ||
      Object.keys(vitals || {}).length ||
      (patient?.chronicConditions || []).length
  );

const shouldRecommendDoctors = ({ message, mode, symptoms, vitals, patient }) => {
  if (mode === "doctor") {
    return /(specialist|doctor|route|routing|refer|consult)/i.test(String(message || ""));
  }

  if (isGreetingMessage(message)) {
    return false;
  }

  const text = String(message || "");
  if (/(doctor|specialist|consult|who should|which doctor|recommend)/i.test(text)) {
    return true;
  }

  return hasClinicalContext({ patient, symptoms, vitals });
};

const formatRecommendedDoctors = (rankedDoctors, limit = 3) =>
  rankedDoctors.slice(0, limit).map((item) => ({
    doctorId: item.doctor.doctorId,
    name: item.doctor.name,
    specialization: item.doctor.specialization,
    languages: item.doctor.languages,
    waitTimeMinutes: item.doctor.waitTimeMinutes,
    rating: item.doctor.rating,
  }));

const normalizeText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/dr\.\s*/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const findDoctorMention = (text, rankedDoctors) => {
  const normalizedText = normalizeText(text);
  if (!normalizedText) {
    return null;
  }

  return rankedDoctors.find(({ doctor }) => {
    const normalizedName = normalizeText(doctor.name);
    if (!normalizedName) {
      return false;
    }

    if (normalizedText.includes(normalizedName)) {
      return true;
    }

    const nameParts = normalizedName.split(" ").filter(Boolean);
    return nameParts.length >= 2 && normalizedText.includes(nameParts.slice(-2).join(" "));
  })?.doctor || null;
};

const resolveSelectedDoctor = ({ selectedDoctor, message, conversationHistory, rankedDoctors }) => {
  if (selectedDoctor?.doctorId) {
    return rankedDoctors.find(({ doctor }) => doctor.doctorId === selectedDoctor.doctorId)?.doctor || null;
  }

  const fromMessage = findDoctorMention(message, rankedDoctors);
  if (fromMessage) {
    return fromMessage;
  }

  const reversedHistory = [...conversationHistory].reverse();
  for (const item of reversedHistory) {
    const matchedDoctor = findDoctorMention(item.text, rankedDoctors);
    if (matchedDoctor) {
      return matchedDoctor;
    }
  }

  return null;
};

const formatSpecialtyLabel = (specialization) => String(specialization || "").replace(/_/g, " ").trim();

const buildSelectedDoctorReply = ({ doctor, mode, hasConsultationReady }) => {
  if (!doctor) {
    return "";
  }

  const specialty = formatSpecialtyLabel(doctor.specialization);
  if (mode === "doctor") {
    return `${doctor.name} is available in ${specialty} with about ${doctor.waitTimeMinutes || "--"} minutes wait time.`;
  }

  if (hasConsultationReady) {
    return `${doctor.name} is the selected ${specialty} doctor. You can continue to the consultation room when ready.`;
  }

  return `${doctor.name} is a good ${specialty} option with about ${doctor.waitTimeMinutes || "--"} minutes wait. To connect with this doctor, complete vitals and AI triage first.`;
};

const buildAssistantFallbackReply = ({
  mode,
  message,
  inferredSpecialty,
  rankedDoctors,
  invalidVitalFields = [],
  hasContext = false,
}) => {
  const topDoctor = rankedDoctors[0]?.doctor;
  const normalizedMessage = String(message || "").toLowerCase();
  const specialtyLabel = inferredSpecialty.replace(/_/g, " ");
  const invalidVitalsLine = invalidVitalFields.length
    ? `Some entered vitals look invalid and should be rechecked, especially ${invalidVitalFields.join(", ")}.`
    : "";

  if (isGreetingMessage(message)) {
    return mode === "doctor"
      ? "Hello doctor. I can help with triage support, next steps, and specialist routing. Tell me the case or ask one clinical question."
      : "Hello. I can help with symptoms, next steps, and choosing the right doctor. Tell me what the patient is feeling.";
  }

  if (!hasContext && isVeryShortMessage(message) && !/(fever|pain|cough|cold|sugar|bp|heart|chest|breath|skin|rash|vomit)/i.test(normalizedMessage)) {
    return mode === "doctor"
      ? "Please ask a more specific question, for example specialist advice, follow-up planning, or red-flag review."
      : "Please tell me the symptom or concern, for example fever for 3 days, cough, chest pain, or stomach pain.";
  }

  if (mode === "doctor") {
    return [
      invalidVitalsLine,
      `Review the history, confirm red flags, and continue with ${specialtyLabel} guidance.`,
      topDoctor ? `Best available specialist right now is ${topDoctor.name}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (normalizedMessage.includes("chest") || normalizedMessage.includes("breath")) {
    return [
      invalidVitalsLine,
      `This needs urgent ${specialtyLabel} review.`,
      "Recheck oxygen level if available and route the patient quickly.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (normalizedMessage.includes("fever") || normalizedMessage.includes("cold") || normalizedMessage.includes("cough")) {
    return [
      invalidVitalsLine,
      `This looks suitable for ${specialtyLabel} review.`,
      "Complete vitals capture, especially temperature and oxygen level, then continue to consultation.",
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    invalidVitalsLine,
    `Recommended next step: complete kiosk triage and route this case to ${specialtyLabel}.`,
    topDoctor ? `${topDoctor.name} is a strong available match.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const createOrUpdatePatient = async (payload) => {
  let patient = await Patient.findOne({ mobileNumber: payload.mobileNumber });

  if (patient) {
    Object.assign(patient, payload);
    patient.visitCount = (patient.visitCount || 0) + 1;
    await patient.save();
    return patient;
  }

  return Patient.create({
    ...payload,
    visitCount: 1,
  });
};

const upsertPatient = async (req, res) => {
  try {
    const payload = toPatientPayload(req.body);
    if (!payload.mobileNumber) {
      return res.status(400).json({ message: "mobileNumber is required" });
    }

    let patient;
    try {
      patient = await createOrUpdatePatient(payload);
    } catch (error) {
      if (error?.code === 11000 && String(error.message).includes("userId_1")) {
        await Patient.collection.dropIndex("userId_1").catch(() => null);
        patient = await createOrUpdatePatient(payload);
      } else {
        throw error;
      }
    }

    const [vitals, prescriptions, consultations] = await Promise.all([
      Vitals.find({ patientId: patient._id }).sort({ recordedAt: -1 }).limit(5),
      Prescription.find()
        .populate({
          path: "consultationId",
          match: { patientId: patient._id },
          populate: { path: "doctorId", select: "doctorId name specialization" },
        })
        .sort({ createdAt: -1 })
        .limit(5),
      Consultation.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .populate("doctorId", "doctorId name specialization languages waitTimeMinutes rating"),
    ]);

    return res.status(200).json({
      patient: serializePatient(patient),
      records: {
        vitals,
        prescriptions: prescriptions.filter((item) => item.consultationId),
        consultations: consultations.map(serializeConsultation),
      },
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to create patient intake", error: error.message });
  }
};

const runKioskTriage = async (req, res) => {
  try {
    const patient = await resolvePatient(req.body.patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const symptoms = {
      chiefComplaint: String(req.body.symptoms?.chiefComplaint || "").trim(),
      durationDays: toNumber(req.body.symptoms?.durationDays) || 0,
      severity: String(req.body.symptoms?.severity || "moderate").toLowerCase(),
      history: String(req.body.symptoms?.history || "").trim(),
      preferredLanguage: String(
        req.body.symptoms?.preferredLanguage || patient.preferredLanguage || "en"
      ).trim(),
    };

    const vitalsPayload = {
      patientId: patient._id,
      heartRate: toNumber(req.body.vitals?.heartRate),
      bloodPressure: String(req.body.vitals?.bloodPressure || "").trim(),
      temperature: toNumber(req.body.vitals?.temperature),
      oxygenLevel: toNumber(req.body.vitals?.spo2 ?? req.body.vitals?.oxygenLevel),
      glucoseLevel: toNumber(req.body.vitals?.glucoseLevel),
      weight: toNumber(req.body.vitals?.weight),
      heightCm: toNumber(req.body.vitals?.heightCm),
      bmi: toNumber(req.body.vitals?.bmi),
      ecgSummary: req.body.vitals?.ecgSummary ? String(req.body.vitals.ecgSummary).trim() : undefined,
      assistantName: req.body.vitals?.assistantName
        ? String(req.body.vitals.assistantName).trim()
        : undefined,
    };

    const vitals = await Vitals.create(vitalsPayload);
    const kiosk = {
      placement: String(req.body.kiosk?.placement || "rural").trim(),
      kioskId: String(req.body.kiosk?.kioskId || "KIOSK-001").trim(),
    };

    const triageBundle = await assessTriage({
      patient,
      symptoms,
      vitals: vitalsPayload,
      kiosk,
    });

    const consultation = await Consultation.create({
      patientId: patient._id,
      doctorId: triageBundle.assignedDoctor?._id,
      kioskId: kiosk.kioskId,
      status: triageBundle.triage.hospitalRedirect ? "redirected" : "pending",
      symptoms,
      triage: triageBundle.triage,
      vitalsSnapshot: vitalsPayload,
      queueNumber: triageBundle.queueNumber,
      estimatedWaitMinutes: triageBundle.estimatedWaitMinutes,
      roomName: `telemed-${patient.patientId.toLowerCase()}-${Date.now()}`,
      pricing: triageBundle.pricing,
      paymentStatus: triageBundle.triage.hospitalRedirect ? "waived" : "pending",
      pharmacyOptions: triageBundle.pharmacyOptions,
      followUpPlan: {
        reminderChannel: "sms",
        dueInDays: triageBundle.triage.followUpDays,
        chronicCare: (patient.chronicConditions || []).length > 0,
      },
      notes: symptoms.history,
    });

    const populatedConsultation = await Consultation.findOne(buildLookup("consultationId", consultation.consultationId))
      .populate("patientId")
      .populate("doctorId");

    return res.status(201).json({
      consultation: serializeConsultation(populatedConsultation),
      vitals,
      triage: triageBundle.triage,
      assignedDoctor: serializeDoctor(triageBundle.assignedDoctor),
      queue: {
        number: triageBundle.queueNumber,
        waitMinutes: triageBundle.estimatedWaitMinutes,
        status: triageBundle.triage.hospitalRedirect ? "redirected" : "queued",
      },
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to run kiosk triage", error: error.message });
  }
};

const getPatientRecords = async (req, res) => {
  try {
    const patient = await resolvePatient(req.params.patientId);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const [vitals, consultations, prescriptions] = await Promise.all([
      Vitals.find({ patientId: patient._id }).sort({ recordedAt: -1 }),
      Consultation.find({ patientId: patient._id })
        .sort({ createdAt: -1 })
        .populate("doctorId", "doctorId name specialization languages waitTimeMinutes rating"),
      Prescription.find()
        .populate({
          path: "consultationId",
          match: { patientId: patient._id },
          populate: { path: "doctorId", select: "doctorId name specialization" },
        })
        .sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({
      patient: serializePatient(patient),
      vitals,
      consultations: consultations.map(serializeConsultation),
      prescriptions: prescriptions.filter((item) => item.consultationId),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch patient records", error: error.message });
  }
};

const getConsultation = async (req, res) => {
  try {
    const consultation = await resolveConsultation(req.params.consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    const populatedConsultation = await Consultation.findById(consultation._id)
      .populate("patientId")
      .populate("doctorId");
    const prescription = await Prescription.findOne({ consultationId: consultation._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      consultation: serializeConsultation(populatedConsultation),
      prescription,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch consultation", error: error.message });
  }
};

const completeConsultation = async (req, res) => {
  try {
    const consultation = await resolveConsultation(req.params.consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    consultation.status = consultation.triage?.hospitalRedirect ? "redirected" : "completed";
    consultation.paymentStatus = consultation.triage?.hospitalRedirect ? "waived" : "paid";
    consultation.notes = req.body.notes ? String(req.body.notes).trim() : consultation.notes;
    await consultation.save();

    if (consultation.doctorId) {
      await Doctor.findByIdAndUpdate(consultation.doctorId, { availability: "available" });
    }

    let prescription = await Prescription.findOne({ consultationId: consultation._id });
    if (!prescription && Array.isArray(req.body.medicines) && req.body.medicines.length > 0) {
      prescription = await Prescription.create({
        consultationId: consultation._id,
        doctorNotes: req.body.doctorNotes,
        medicines: req.body.medicines,
        pharmacyFulfilment:
          req.body.pharmacyFulfilment || {
            provider: consultation.pharmacyOptions?.[0]?.name,
            mode: consultation.pharmacyOptions?.[0]?.mode,
            eta: consultation.pharmacyOptions?.[0]?.eta,
          },
      });
    }

    const populatedConsultation = await Consultation.findById(consultation._id)
      .populate("patientId")
      .populate("doctorId");

    return res.status(200).json({
      consultation: serializeConsultation(populatedConsultation),
      prescription,
      visitSummary: {
        triageSummary: consultation.triage?.summary,
        riskAlerts: consultation.triage?.riskAlerts || [],
        recommendedActions: consultation.triage?.recommendedActions || [],
        pharmacyOptions: consultation.pharmacyOptions || [],
      },
    });
  } catch (error) {
    return res.status(400).json({ message: "Failed to complete consultation", error: error.message });
  }
};

const assistantChat = async (req, res) => {
  try {
    const { message, patient, mode } = req.body;
    if (!message) {
      return res.status(400).json({ message: "message is required" });
    }

    const sanitizedSymptoms = sanitizeSymptomsForAssistant(req.body.symptoms);
    const sanitizedVitals = sanitizeAssistantVitals(req.body.vitals);
    const invalidVitalFields = findInvalidVitalFields(req.body.vitals);
    const conversationHistory = sanitizeConversationHistory(req.body.history);
    const hasContext = hasClinicalContext({
      patient: patient || {},
      symptoms: sanitizedSymptoms,
      vitals: sanitizedVitals,
    });
    const hasConsultationReady = Boolean(req.body.consultation?.consultationId);

    const inferredSpecialty =
      mode === "doctor"
        ? "general_medicine"
        : sanitizedSymptoms?.chiefComplaint?.toLowerCase().includes("chest")
          ? "cardiology"
          : sanitizedSymptoms?.chiefComplaint?.toLowerCase().includes("sugar")
            ? "endocrinology"
            : "general_medicine";

    const rankedDoctors = await rankDoctors({
      specialty: inferredSpecialty,
      preferredLanguage: sanitizedSymptoms?.preferredLanguage || patient?.preferredLanguage || "en",
      locationTag: req.body.kiosk?.placement || "rural",
    });

    let reply = "";
    const client = getClient();
    const selectedDoctor = resolveSelectedDoctor({
      selectedDoctor: req.body.selectedDoctor,
      message,
      conversationHistory,
      rankedDoctors,
    });
    const recommendedDoctors = selectedDoctor
      ? [serializeDoctor(selectedDoctor)]
      : shouldRecommendDoctors({
      message,
      mode,
      symptoms: sanitizedSymptoms,
      vitals: sanitizedVitals,
      patient,
    })
        ? formatRecommendedDoctors(rankedDoctors)
        : [];

    if (selectedDoctor && !/(video|chat|consult|call)/i.test(String(message || ""))) {
      return res.status(200).json({
        reply: buildSelectedDoctorReply({
          doctor: selectedDoctor,
          mode,
          hasConsultationReady,
        }),
        recommendedSpecialty: inferredSpecialty,
        recommendedDoctors,
      });
    }

    if (isGreetingMessage(message) && !hasContext) {
      return res.status(200).json({
        reply: buildAssistantFallbackReply({
          mode,
          message,
          inferredSpecialty,
          rankedDoctors,
          invalidVitalFields,
          hasContext,
        }),
        recommendedSpecialty: inferredSpecialty,
        recommendedDoctors: [],
      });
    }

    if (client) {
      try {
        const response = await client.responses.create({
          model: process.env.OPENAI_MODEL || "gpt-5.2",
          reasoning: {
            effort: "low",
          },
          instructions:
            mode === "doctor"
              ? "You assist doctors in a telemedicine portal. Reply in plain text only with no markdown, headings, bullet points, or asterisks. Keep replies concise, practical, and grounded in the provided case context. Use conversation history to resolve references like yes, no, this, or that. If data is missing, say that briefly. Do not present yourself as the diagnosing doctor."
              : "You are a helpful telemedicine kiosk assistant. Reply in plain text only with no markdown, headings, bullet points, or asterisks. Keep replies concise and practical, ideally no more than 4 short paragraphs. Use conversation history to understand short follow-ups like yes or no. Do not mention impossible or clearly invalid vitals as facts. If entered vitals look wrong, simply ask for recheck. Ask at most one clarifying question. Do not list doctors in the body because recommendation cards are shown separately. Never claim you can start or book a consultation now unless consultationReady is true in the provided context.",
          input: [
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: JSON.stringify({
                    message,
                    conversationHistory,
                    patient: patient
                      ? {
                          name: patient.name,
                          age: patient.age,
                          gender: patient.gender,
                          chronicConditions: patient.chronicConditions,
                          preferredLanguage: patient.preferredLanguage,
                        }
                      : null,
                    symptoms: sanitizedSymptoms,
                    vitals: sanitizedVitals,
                    invalidVitalFields,
                    consultationReady: hasConsultationReady,
                    selectedDoctor: selectedDoctor
                      ? {
                          name: selectedDoctor.name,
                          specialization: selectedDoctor.specialization,
                          waitTimeMinutes: selectedDoctor.waitTimeMinutes,
                        }
                      : null,
                    recommendedSpecialty: inferredSpecialty,
                    recommendedDoctors,
                  }),
                },
              ],
            },
          ],
        });

        reply = limitAssistantReply(response.output_text);
      } catch (openaiError) {
        reply = buildAssistantFallbackReply({
          mode,
          message,
          inferredSpecialty,
          rankedDoctors,
          invalidVitalFields,
          hasContext,
        });
      }
    } else {
      reply = buildAssistantFallbackReply({
        mode,
        message,
        inferredSpecialty,
        rankedDoctors,
        invalidVitalFields,
        hasContext,
      });
    }

    return res.status(200).json({
      reply:
        reply ||
        buildAssistantFallbackReply({
          mode,
          message,
          inferredSpecialty,
          rankedDoctors,
          invalidVitalFields,
          hasContext,
        }),
      recommendedSpecialty: inferredSpecialty,
      recommendedDoctors,
    });
  } catch (error) {
    return res.status(400).json({ message: "Assistant chat failed", error: error.message });
  }
};

module.exports = {
  upsertPatient,
  runKioskTriage,
  getPatientRecords,
  getConsultation,
  completeConsultation,
  assistantChat,
};
