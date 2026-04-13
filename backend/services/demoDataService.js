const bcrypt = require("bcryptjs");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Vitals = require("../models/Vitals");
const Consultation = require("../models/Consultation");
const Prescription = require("../models/Prescription");
const KioskDevice = require("../models/KioskDevice");

const DEMO_PASSWORD = "Doctor@123";

const DEMO_DOCTORS = [
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
  {
    name: "Dr. Neha Thomas",
    email: "neha.thomas@arogyaseva.demo",
    specialization: "pulmonology",
    licenseNumber: "AROGYA-PUL-1004",
    languages: ["en", "hi", "ml"],
    consultationFee: 600,
    waitTimeMinutes: 5,
    rating: 4.8,
    locationTags: ["hospital", "rural"],
  },
  {
    name: "Dr. Vikram Sen",
    email: "vikram.sen@arogyaseva.demo",
    specialization: "dermatology",
    licenseNumber: "AROGYA-DER-1005",
    languages: ["en", "hi", "bn"],
    consultationFee: 450,
    waitTimeMinutes: 3,
    rating: 4.6,
    locationTags: ["pharmacy", "corporate"],
  },
];

const DEMO_KIOSKS = [
  { kioskId: "KIOSK-RURAL-001", name: "ArogyaSeva Rural Hub", location: "Village Primary Center", status: "online" },
  { kioskId: "KIOSK-PHARM-001", name: "Pharmacy Partner Kiosk", location: "City Pharmacy Branch", status: "online" },
  { kioskId: "KIOSK-CORP-001", name: "Corporate Wellness Kiosk", location: "Tech Park Tower 1", status: "online" },
  { kioskId: "KIOSK-HOSP-001", name: "Hospital Triage Kiosk", location: "District Hospital Entrance", status: "online" },
];

const DEMO_PATIENTS = [
  {
    patientId: "PAT-DEMO-001",
    name: "Ramesh Kumar",
    age: 42,
    gender: "male",
    mobileNumber: "9000000001",
    village: "Sundarpur",
    preferredLanguage: "hi",
    chronicConditions: ["hypertension"],
    visitCount: 3,
  },
  {
    patientId: "PAT-DEMO-002",
    name: "Asha Devi",
    age: 33,
    gender: "female",
    mobileNumber: "9000000002",
    village: "Lakshmipur",
    preferredLanguage: "en",
    chronicConditions: ["diabetes"],
    visitCount: 2,
  },
  {
    patientId: "PAT-DEMO-003",
    name: "Karim Ali",
    age: 55,
    gender: "male",
    mobileNumber: "9000000003",
    village: "New Colony",
    preferredLanguage: "en",
    chronicConditions: [],
    visitCount: 1,
  },
];

const isSmokeTestDoctor = (doctor) =>
  /^(smoke doctor|queue doctor)$/i.test(String(doctor.name || "")) ||
  /^(doctor|queuecheck)\d+@example\.com$/i.test(String(doctor.email || ""));

const cleanupSmokeTestData = async () => {
  const smokeDoctors = await Doctor.find({
    $or: [
      { name: { $in: ["Smoke Doctor", "Queue Doctor"] } },
      { email: { $regex: "^(doctor|queuecheck)[0-9]+@example\\.com$", $options: "i" } },
    ],
  });

  if (!smokeDoctors.length) {
    return;
  }

  const smokeDoctorIds = smokeDoctors.map((doctor) => doctor._id);
  await Consultation.deleteMany({ doctorId: { $in: smokeDoctorIds } });
  await User.deleteMany({ profileId: { $in: smokeDoctorIds } });
  await Doctor.deleteMany({ _id: { $in: smokeDoctorIds } });
};

const ensureDemoDoctors = async () => {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const demoDoctor of DEMO_DOCTORS) {
    let doctor = await Doctor.findOne({
      $or: [{ email: demoDoctor.email }, { licenseNumber: demoDoctor.licenseNumber }],
    });

    if (doctor) {
      Object.assign(doctor, demoDoctor);
      await doctor.save();
    } else {
      doctor = await Doctor.create(demoDoctor);
    }

    await User.findOneAndUpdate(
      { email: demoDoctor.email },
      {
        $set: {
          name: demoDoctor.name,
          role: "doctor",
          profileId: doctor._id,
        },
        $setOnInsert: {
          password: hashedPassword,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }
};

const ensureDemoKiosks = async () => {
  for (const kiosk of DEMO_KIOSKS) {
    await KioskDevice.findOneAndUpdate(
      { kioskId: kiosk.kioskId },
      { $set: { ...kiosk, lastSeen: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }
};

const ensureDemoPatients = async () => {
  const patients = [];

  for (const demoPatient of DEMO_PATIENTS) {
    const patient = await Patient.findOneAndUpdate(
      { mobileNumber: demoPatient.mobileNumber },
      {
        $set: {
          ...demoPatient,
          lastVisitAt: new Date(),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    patients.push(patient);
  }

  return patients;
};

const ensureVitals = async (patient, payload) => {
  const existing = await Vitals.findOne({ patientId: patient._id, assistantName: payload.assistantName });
  if (!existing) {
    await Vitals.create({
      patientId: patient._id,
      ...payload,
    });
  }
};

const ensureDemoConsultations = async (patientsById, doctorsByEmail) => {
  const meera = doctorsByEmail.get("meera.sharma@arogyaseva.demo");
  const arjun = doctorsByEmail.get("arjun.rao@arogyaseva.demo");
  const asha = patientsById.get("PAT-DEMO-002");
  const ramesh = patientsById.get("PAT-DEMO-001");

  await ensureVitals(asha, {
    heartRate: 84,
    bloodPressure: "126/82",
    temperature: 99.1,
    oxygenLevel: 98,
    glucoseLevel: 168,
    weight: 63,
    heightCm: 160,
    bmi: 24.6,
    assistantName: "Demo Assistant A",
  });

  await ensureVitals(ramesh, {
    heartRate: 96,
    bloodPressure: "142/90",
    temperature: 98.4,
    oxygenLevel: 95,
    glucoseLevel: 112,
    weight: 74,
    heightCm: 171,
    bmi: 25.3,
    assistantName: "Demo Assistant B",
  });

  const pendingConsultation = await Consultation.findOneAndUpdate(
    { consultationId: "CON-DEMO-001" },
    {
      $set: {
        patientId: asha._id,
        doctorId: meera?._id,
        kioskId: "KIOSK-RURAL-001",
        status: "pending",
        roomName: "telemed-demo-001",
        queueNumber: "Q-201",
        estimatedWaitMinutes: 5,
        notes: "Recurring diabetes follow-up and mild fever.",
        symptoms: {
          chiefComplaint: "fever, weakness and blood sugar review",
          durationDays: 2,
          severity: "moderate",
          history: "Known diabetes, on oral medication",
          preferredLanguage: "en",
        },
        triage: {
          urgency: "routine",
          specialty: "general_medicine",
          summary: "Follow-up consultation for mild symptoms and diabetes monitoring.",
          riskAlerts: ["Monitor glucose trend during consultation."],
          recommendedActions: ["Review medications", "Advise hydration and diet control"],
          hospitalRedirect: false,
          followUpDays: 5,
          confidence: 0.84,
        },
        vitalsSnapshot: {
          heartRate: 84,
          bloodPressure: "126/82",
          temperature: 99.1,
          oxygenLevel: 98,
          glucoseLevel: 168,
          weight: 63,
          heightCm: 160,
          bmi: 24.6,
          assistantName: "Demo Assistant A",
        },
        pricing: {
          consultationFee: 200,
          subsidyApplied: true,
          currency: "INR",
        },
        paymentStatus: "pending",
        pharmacyOptions: [
          { name: "Sundarpur Pharmacy Pickup", mode: "pickup", eta: "30 min" },
          { name: "Partner Home Delivery", mode: "delivery", eta: "2 hours" },
        ],
        followUpPlan: {
          reminderChannel: "sms",
          dueInDays: 5,
          chronicCare: true,
        },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const completedConsultation = await Consultation.findOneAndUpdate(
    { consultationId: "CON-DEMO-002" },
    {
      $set: {
        patientId: ramesh._id,
        doctorId: arjun?._id,
        kioskId: "KIOSK-HOSP-001",
        status: "completed",
        roomName: "telemed-demo-002",
        queueNumber: "Q-145",
        estimatedWaitMinutes: 0,
        notes: "Reviewed chest discomfort history; non-emergency case completed.",
        symptoms: {
          chiefComplaint: "chest discomfort on exertion",
          durationDays: 5,
          severity: "moderate",
          history: "Hypertension and family cardiac history",
          preferredLanguage: "hi",
        },
        triage: {
          urgency: "priority",
          specialty: "cardiology",
          summary: "Cardiology review completed for exertional chest discomfort.",
          riskAlerts: ["Monitor blood pressure", "Schedule ECG follow-up if symptoms recur"],
          recommendedActions: ["Medication review", "Advise follow-up within 7 days"],
          hospitalRedirect: false,
          followUpDays: 7,
          confidence: 0.9,
        },
        vitalsSnapshot: {
          heartRate: 96,
          bloodPressure: "142/90",
          temperature: 98.4,
          oxygenLevel: 95,
          glucoseLevel: 112,
          weight: 74,
          heightCm: 171,
          bmi: 25.3,
          assistantName: "Demo Assistant B",
        },
        pricing: {
          consultationFee: 625,
          subsidyApplied: false,
          currency: "INR",
        },
        paymentStatus: "paid",
        pharmacyOptions: [
          { name: "District Pharmacy Pickup", mode: "pickup", eta: "20 min" },
          { name: "Cardiac Partner Delivery", mode: "delivery", eta: "90 min" },
        ],
        followUpPlan: {
          reminderChannel: "sms",
          dueInDays: 7,
          chronicCare: true,
        },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await Prescription.findOneAndUpdate(
    { consultationId: completedConsultation._id },
    {
      $set: {
        doctorNotes: "Continue BP control and avoid exertion until follow-up review.",
        medicines: [
          {
            name: "Aspirin",
            dosage: "75 mg",
            frequency: "Once daily",
            duration: "7 days",
            instructions: "After breakfast",
          },
          {
            name: "Amlodipine",
            dosage: "5 mg",
            frequency: "Once daily",
            duration: "14 days",
            instructions: "At night",
          },
        ],
        pharmacyFulfilment: {
          provider: "District Pharmacy Pickup",
          mode: "pickup",
          eta: "20 min",
        },
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return pendingConsultation;
};

const seedDemoData = async () => {
  await cleanupSmokeTestData();
  await ensureDemoDoctors();
  await ensureDemoKiosks();
  const patients = await ensureDemoPatients();

  const doctors = await Doctor.find({
    email: {
      $in: DEMO_DOCTORS.map((doctor) => doctor.email),
    },
  });

  const doctorsByEmail = new Map(doctors.map((doctor) => [doctor.email, doctor]));
  const patientsById = new Map(patients.map((patient) => [patient.patientId, patient]));

  await ensureDemoConsultations(patientsById, doctorsByEmail);
  console.log("Demo backend data ready");
};

module.exports = {
  seedDemoData,
  DEMO_PASSWORD,
};
