import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { completeConsultation, fetchConsultation } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import VideoCall from "../components/VideoCall";
import LargeButton from "../components/LargeButton";
import ChatAssistant from "../components/ChatAssistant";

const DEFAULT_MEDICINES = [
  {
    name: "Paracetamol 500mg",
    dosage: "1 tablet",
    frequency: "Twice daily",
    duration: "3 days",
    instructions: "After food"
  }
];

export default function DoctorConsultation() {
  const navigate = useNavigate();
  const { consultationId } = useParams();
  const doctorSession = usePatientStore((state) => state.doctorSession);
  const setDoctorSession = usePatientStore((state) => state.setDoctorSession);
  const [consultation, setConsultation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState("Reviewed patient through telemedicine. Continue medications and monitor recovery.");
  const [medicines, setMedicines] = useState(DEFAULT_MEDICINES);

  useEffect(() => {
    const loadConsultation = async () => {
      if (!consultationId) {
        setError("Missing consultation reference.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetchConsultation(consultationId);
        if (!response.data.consultation) {
          setError("Consultation not found.");
        } else {
          setConsultation(response.data.consultation);
          setError("");
        }
      } catch (requestError) {
        setError(requestError?.response?.data?.message || requestError?.message || "Unable to load consultation details.");
      } finally {
        setLoading(false);
      }
    };

    loadConsultation();
  }, [consultationId]);

  const updateMedicine = (index, field, value) => {
    setMedicines((current) =>
      current.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      )
    );
  };

  const finishConsultation = async () => {
    if (!consultationId || !consultation) {
      setError("Consultation is not ready to complete yet.");
      return null;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await completeConsultation(consultationId, {
        notes: "Completed by remote doctor",
        doctorNotes,
        medicines: medicines.filter((medicine) => medicine.name.trim()),
        pharmacyFulfilment: {
          provider: consultation?.pharmacyOptions?.[0]?.name || "Nearby Pharmacy Pickup",
          mode: consultation?.pharmacyOptions?.[0]?.mode || "pickup",
          eta: consultation?.pharmacyOptions?.[0]?.eta || "30-45 min"
        }
      });
      setDoctorSession({
        activeConsultation: null
      });
      navigate("/doctor/dashboard");
      return response;
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to complete this consultation right now.");
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="screen consultation-screen">
      <h1>Doctor Consultation Room</h1>
      {error ? <div className="card form-alert">{error}</div> : null}
      {loading ? <div className="card">Loading consultation details...</div> : null}
      <div className="card">
        <h2>{consultation?.patient?.name || consultation?.patientId?.name || "Patient"}</h2>
        <p>Chief complaint: {consultation?.symptoms?.chiefComplaint || "--"}</p>
        <p>Triage: {consultation?.triage?.summary || "--"}</p>
        <p>
          Vitals: HR {consultation?.vitalsSnapshot?.heartRate || "--"}, BP{" "}
          {consultation?.vitalsSnapshot?.bloodPressure || "--"}, SpO2{" "}
          {consultation?.vitalsSnapshot?.oxygenLevel || "--"}
        </p>
      </div>

      <div className="card form-stack">
        <label className="manual-field">
          <span>Doctor notes</span>
          <textarea className="kiosk-input kiosk-textarea" value={doctorNotes} onChange={(e) => setDoctorNotes(e.target.value)} />
        </label>
        <div className="medicine-grid">
          {medicines.map((medicine, index) => (
            <div key={`${medicine.name}-${index}`} className="medicine-card">
              <input className="kiosk-input" value={medicine.name} onChange={(e) => updateMedicine(index, "name", e.target.value)} />
              <input className="kiosk-input" value={medicine.dosage} onChange={(e) => updateMedicine(index, "dosage", e.target.value)} />
              <input className="kiosk-input" value={medicine.frequency} onChange={(e) => updateMedicine(index, "frequency", e.target.value)} />
              <input className="kiosk-input" value={medicine.duration} onChange={(e) => updateMedicine(index, "duration", e.target.value)} />
              <input className="kiosk-input" value={medicine.instructions} onChange={(e) => updateMedicine(index, "instructions", e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <VideoCall
        consultationId={consultationId}
        participantName={doctorSession.profile?.name || "Doctor"}
        onEnd={finishConsultation}
        vitals={{
          heartRate: consultation?.vitalsSnapshot?.heartRate || "--",
          bloodPressure: consultation?.vitalsSnapshot?.bloodPressure || "--",
          temperature: consultation?.vitalsSnapshot?.temperature || "--",
          spo2: consultation?.vitalsSnapshot?.oxygenLevel || "--"
        }}
        endDisabled={loading || submitting || !consultation}
      />

      <div className="summary-actions">
        <LargeButton title="Back to Queue" icon="BK" className="action-history" onClick={() => navigate("/doctor/dashboard")} />
      </div>

      <ChatAssistant mode="doctor" context={{ consultation }} />
    </section>
  );
}
