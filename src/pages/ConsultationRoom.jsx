import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { completeConsultation } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import VideoCall from "../components/VideoCall";
import LargeButton from "../components/LargeButton";

export default function ConsultationRoom() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = usePatientStore((state) => state.patient);
  const vitals = usePatientStore((state) => state.vitals);
  const consultation = usePatientStore((state) => state.consultation);
  const setConsultation = usePatientStore((state) => state.setConsultation);
  const setSummary = usePatientStore((state) => state.setSummary);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState("Patient reviewed over video. Continue supportive care and monitor vitals.");
  const [medicines, setMedicines] = useState([
    {
      name: "Paracetamol 500mg",
      dosage: "1 tablet",
      frequency: "Twice daily",
      duration: "3 days",
      instructions: "After food"
    },
    {
      name: "ORS",
      dosage: "1 sachet",
      frequency: "As advised",
      duration: "2 days",
      instructions: "After each loose stool or dehydration episode"
    }
  ]);
  const consultationId = consultation?.consultationId;
  const consultationReady = Boolean(consultationId);

  useEffect(() => {
    if (!consultationReady) {
      setError("Consultation room is still being prepared. Please return to the waiting screen.");
    } else {
      setError("");
    }
  }, [consultationReady]);

  const updateMedicine = (index, field, value) => {
    setMedicines((current) =>
      current.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [field]: value } : medicine
      )
    );
  };

  const endConsultation = async () => {
    if (!consultationReady) {
      setError("No active consultation was found. Please complete triage again.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const response = await completeConsultation(consultationId, {
        notes: "Consultation completed from kiosk",
        doctorNotes,
        medicines: medicines.filter((medicine) => medicine.name.trim()),
        pharmacyFulfilment: {
          provider: "Nearby Pharmacy Pickup",
          mode: "pickup",
          eta: "30-45 min"
        }
      });
      setSummary(response.data);
      setConsultation({
        active: false,
        status: response.data.consultation?.status || "completed"
      });
      navigate("/summary");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to complete consultation right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="screen consultation-screen">
      <h1>{t("consultationTitle")}</h1>
      {error ? <div className="card form-alert">{error}</div> : null}
      {!consultationReady ? (
        <div className="summary-actions">
          <LargeButton title="Back to Waiting Room" icon="BK" className="action-history" onClick={() => navigate("/waiting")} />
        </div>
      ) : null}
      <div className="card form-stack">
        <h3>Doctor Wrap-up</h3>
        <p className="muted-copy">
          This prototype panel lets the consultation end with a real visit summary, pharmacy option, and digital prescription payload.
        </p>
        <label className="manual-field">
          <span>Doctor notes</span>
          <textarea
            className="kiosk-input kiosk-textarea"
            value={doctorNotes}
            onChange={(event) => setDoctorNotes(event.target.value)}
          />
        </label>

        <div className="medicine-grid">
          {medicines.map((medicine, index) => (
            <div key={`${medicine.name}-${index}`} className="medicine-card">
              <input
                className="kiosk-input"
                value={medicine.name}
                placeholder="Medicine"
                onChange={(event) => updateMedicine(index, "name", event.target.value)}
              />
              <input
                className="kiosk-input"
                value={medicine.dosage}
                placeholder="Dosage"
                onChange={(event) => updateMedicine(index, "dosage", event.target.value)}
              />
              <input
                className="kiosk-input"
                value={medicine.frequency}
                placeholder="Frequency"
                onChange={(event) => updateMedicine(index, "frequency", event.target.value)}
              />
              <input
                className="kiosk-input"
                value={medicine.duration}
                placeholder="Duration"
                onChange={(event) => updateMedicine(index, "duration", event.target.value)}
              />
              <input
                className="kiosk-input"
                value={medicine.instructions}
                placeholder="Instructions"
                onChange={(event) => updateMedicine(index, "instructions", event.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      <VideoCall
        consultationId={consultationId}
        participantName={patient?.name}
        onEnd={endConsultation}
        vitals={vitals}
        endDisabled={!consultationReady || submitting}
      />
    </section>
  );
}
