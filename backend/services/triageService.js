const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { getAITriageAssessment } = require("./openaiService");

const DEFAULT_DOCTORS = [
  {
    name: "Dr. Meera Sharma",
    email: "meera.sharma@arogyaseva.demo",
    specialization: "general_medicine",
    licenseNumber: "AROGYA-GP-1001",
    languages: ["en", "hi"],
    consultationFee: 250,
    waitTimeMinutes: 4,
    rating: 4.8,
    locationTags: ["rural", "pharmacy", "hospital"],
  },
  {
    name: "Dr. Arjun Rao",
    email: "arjun.rao@arogyaseva.demo",
    specialization: "cardiology",
    licenseNumber: "AROGYA-CARD-1002",
    languages: ["en", "hi", "te"],
    consultationFee: 650,
    waitTimeMinutes: 7,
    rating: 4.9,
    locationTags: ["hospital", "corporate"],
  },
  {
    name: "Dr. Farah Khan",
    email: "farah.khan@arogyaseva.demo",
    specialization: "endocrinology",
    licenseNumber: "AROGYA-ENDO-1003",
    languages: ["en", "hi", "bn"],
    consultationFee: 550,
    waitTimeMinutes: 6,
    rating: 4.7,
    locationTags: ["pharmacy", "rural"],
  },
];

const toNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeSpecialty = (specialty) =>
  String(specialty || "general_medicine")
    .toLowerCase()
    .replace(/\s+/g, "_");

const uniqueDoctors = (rankedDoctors) => {
  const seen = new Set();

  return rankedDoctors.filter(({ doctor }) => {
    const key = doctor.email || doctor.licenseNumber || `${doctor.name}-${doctor.specialization}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const inferSpecialtyFromSymptoms = (text = "") => {
  const symptoms = text.toLowerCase();

  if (/(chest pain|palpitation|breathlessness|heart)/.test(symptoms)) {
    return "cardiology";
  }

  if (/(sugar|diabetes|glucose|thyroid)/.test(symptoms)) {
    return "endocrinology";
  }

  return "general_medicine";
};

const buildRuleBasedAssessment = ({ symptoms, vitals }) => {
  const oxygenLevel = toNumber(vitals.oxygenLevel);
  const temperature = toNumber(vitals.temperature);
  const glucoseLevel = toNumber(vitals.glucoseLevel);
  const durationDays = toNumber(symptoms.durationDays) || 0;
  const complaint = String(symptoms.chiefComplaint || "").toLowerCase();
  const severity = String(symptoms.severity || "moderate").toLowerCase();

  const riskAlerts = [];
  const recommendedActions = [];
  let urgency = "routine";
  let hospitalRedirect = false;
  let specialty = inferSpecialtyFromSymptoms(complaint);
  let followUpDays = 7;

  if ((oxygenLevel && oxygenLevel < 90) || (severity === "critical" && complaint.includes("chest"))) {
    urgency = "emergency";
    hospitalRedirect = true;
    specialty = "emergency_medicine";
    riskAlerts.push("Critical oxygen or severe chest pain pattern detected.");
    recommendedActions.push("Transfer the patient to the nearest hospital immediately.");
    followUpDays = 1;
  } else if (temperature && temperature > 102 && durationDays > 3) {
    urgency = "priority";
    specialty = "general_medicine";
    riskAlerts.push("High fever persisting beyond three days.");
    recommendedActions.push("Escalate to a physician within the same session.");
    followUpDays = 2;
  } else if (glucoseLevel && glucoseLevel > 250) {
    urgency = "priority";
    specialty = "endocrinology";
    riskAlerts.push("Elevated glucose level needs physician review.");
    recommendedActions.push("Review diabetes medication history and food intake.");
    followUpDays = 2;
  } else {
    recommendedActions.push("Proceed with general teleconsultation.");
  }

  return {
    urgency,
    specialty,
    summary:
      urgency === "emergency"
        ? "Immediate escalation advised based on symptom severity and vitals."
        : `Route to ${specialty.replace(/_/g, " ")} for teleconsultation.`,
    riskAlerts,
    recommendedActions,
    hospitalRedirect,
    followUpDays,
    confidence: urgency === "routine" ? 0.72 : 0.9,
  };
};

const mergeAssessments = (ruleBased, aiAssessment) => {
  if (!aiAssessment) {
    return ruleBased;
  }

  if (ruleBased.hospitalRedirect) {
    return {
      ...aiAssessment,
      urgency: "emergency",
      specialty: "emergency_medicine",
      hospitalRedirect: true,
      riskAlerts: Array.from(new Set([...ruleBased.riskAlerts, ...(aiAssessment.riskAlerts || [])])),
      recommendedActions: Array.from(
        new Set([...ruleBased.recommendedActions, ...(aiAssessment.recommendedActions || [])])
      ),
      summary: ruleBased.summary,
    };
  }

  return {
    ...ruleBased,
    ...aiAssessment,
    specialty: normalizeSpecialty(aiAssessment.specialty || ruleBased.specialty),
    riskAlerts: Array.from(new Set([...(ruleBased.riskAlerts || []), ...(aiAssessment.riskAlerts || [])])),
    recommendedActions: Array.from(
      new Set([...(ruleBased.recommendedActions || []), ...(aiAssessment.recommendedActions || [])])
    ),
  };
};

const ensureDoctorPool = async () => {
  const existingCount = await Doctor.countDocuments();
  if (existingCount > 0) {
    return;
  }

  await Doctor.insertMany(DEFAULT_DOCTORS);
};

const rankDoctors = async ({ specialty, preferredLanguage, locationTag }) => {
  await ensureDoctorPool();
  const normalizedSpecialty = normalizeSpecialty(specialty);
  const doctors = await Doctor.find({ availability: { $ne: "offline" } }).lean();
  const linkedProfileIds = new Set(
    (await User.find({ role: "doctor" }).distinct("profileId")).map((id) => String(id))
  );

  return uniqueDoctors(
    doctors
    .map((doctor) => {
      let score = 0;

      if (normalizeSpecialty(doctor.specialization) === normalizedSpecialty) {
        score += 100;
      }

      if (preferredLanguage && (doctor.languages || []).includes(preferredLanguage)) {
        score += 20;
      }

      if (locationTag && (doctor.locationTags || []).includes(locationTag)) {
        score += 10;
      }

      if (doctor.availability === "available") {
        score += 15;
      }

      if (linkedProfileIds.has(String(doctor._id))) {
        score += 35;
      }

      score += Math.max(0, 10 - (doctor.waitTimeMinutes || 0));
      score += doctor.rating || 0;

      return { doctor, score };
    })
    .sort((left, right) => right.score - left.score)
  );
};

const allocateDoctor = async ({ specialty, preferredLanguage, locationTag }) => {
  const rankedDoctors = await rankDoctors({ specialty, preferredLanguage, locationTag });
  return rankedDoctors[0]?.doctor || null;
};

const calculatePricing = ({ specialty, locationTag }) => {
  const specialist = normalizeSpecialty(specialty) !== "general_medicine";
  const hour = new Date().getHours();
  const isPeakHour = hour >= 18 && hour <= 22;
  const ruralSubsidy = locationTag === "rural";

  const basePrice = specialist ? 550 : 200;
  const peakAdjustment = isPeakHour ? 75 : 0;
  const subsidyAdjustment = ruralSubsidy ? -50 : 0;
  const consultationFee = Math.max(100, basePrice + peakAdjustment + subsidyAdjustment);

  return {
    consultationFee,
    subsidyApplied: ruralSubsidy,
    currency: "INR",
  };
};

const buildPharmacyOptions = ({ village }) => [
  {
    name: `${village || "Nearby"} Pharmacy Pickup`,
    mode: "pickup",
    eta: "30-45 min",
  },
  {
    name: "Partner Home Delivery",
    mode: "delivery",
    eta: "2-4 hours",
  },
];

const assessTriage = async ({ patient, symptoms, vitals, kiosk }) => {
  const ruleBased = buildRuleBasedAssessment({ symptoms, vitals });

  let aiAssessment = null;
  try {
    aiAssessment = await getAITriageAssessment({
      patient: {
        age: patient.age,
        gender: patient.gender,
        village: patient.village,
        chronicConditions: patient.chronicConditions,
      },
      symptoms,
      vitals,
      kiosk,
    });
  } catch (error) {
    aiAssessment = null;
  }

  const triage = mergeAssessments(ruleBased, aiAssessment);
  const assignedDoctor = triage.hospitalRedirect
    ? null
    : await allocateDoctor({
        specialty: triage.specialty,
        preferredLanguage: symptoms.preferredLanguage || patient.preferredLanguage,
        locationTag: kiosk?.placement,
      });

  const pricing = calculatePricing({
    specialty: triage.specialty,
    locationTag: kiosk?.placement,
  });

  const queueNumber = `Q-${Math.floor(100 + Math.random() * 900)}`;
  const estimatedWaitMinutes = triage.hospitalRedirect ? 0 : Math.max(2, assignedDoctor?.waitTimeMinutes || 5);

  return {
    triage,
    assignedDoctor,
    pricing,
    queueNumber,
    estimatedWaitMinutes,
    pharmacyOptions: buildPharmacyOptions({ village: patient.village }),
  };
};

module.exports = {
  assessTriage,
  calculatePricing,
  ensureDoctorPool,
  toNumber,
  rankDoctors,
};
