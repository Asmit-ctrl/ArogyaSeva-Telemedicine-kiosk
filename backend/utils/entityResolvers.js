const mongoose = require("mongoose");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const Consultation = require("../models/Consultation");

const buildLookup = (keyName, value) => {
  if (mongoose.Types.ObjectId.isValid(value)) {
    return { $or: [{ _id: value }, { [keyName]: value }] };
  }

  return { [keyName]: value };
};

const resolvePatient = async (patientKey) => {
  if (!patientKey) {
    return null;
  }

  return Patient.findOne(buildLookup("patientId", patientKey));
};

const resolveDoctor = async (doctorKey) => {
  if (!doctorKey) {
    return null;
  }

  return Doctor.findOne(buildLookup("doctorId", doctorKey));
};

const resolveConsultation = async (consultationKey) => {
  if (!consultationKey) {
    return null;
  }

  return Consultation.findOne(buildLookup("consultationId", consultationKey));
};

module.exports = {
  buildLookup,
  resolvePatient,
  resolveDoctor,
  resolveConsultation,
};
