import { useNavigate } from "react-router-dom";
import { usePatientStore } from "../store/patientStore";
import LargeButton from "../components/LargeButton";
import ChatAssistant from "../components/ChatAssistant";

export default function SymptomsScreen() {
  const navigate = useNavigate();
  const symptoms = usePatientStore((state) => state.symptoms);
  const setSymptoms = usePatientStore((state) => state.setSymptoms);
  const patient = usePatientStore((state) => state.patient);

  const updateField = (key, value) => {
    setSymptoms({ [key]: value });
  };

  return (
    <section className="screen">
      <h1>AI Symptom Triage</h1>
      <p className="subtitle">
        Capture the patient complaint before vitals so the kiosk can route the case to the right doctor.
      </p>

      <div className="intake-banner">
        <strong>Patient:</strong> {patient?.name || "Walk-in Patient"}{" "}
        <span className="muted-copy">Preferred language: {patient?.preferredLanguage || "en"}</span>
      </div>

      <div className="card form-stack">
        <label className="manual-field">
          <span>What are you feeling today?</span>
          <textarea
            className="kiosk-input kiosk-textarea"
            placeholder="e.g. Fever, chest pain, cough, dizziness, stomach pain"
            value={symptoms.chiefComplaint}
            onChange={(event) => updateField("chiefComplaint", event.target.value)}
          />
        </label>

        <div className="manual-vitals-form">
          <label className="manual-field">
            <span>Duration in days</span>
            <input
              className="kiosk-input"
              value={symptoms.durationDays}
              placeholder="3"
              onChange={(event) => updateField("durationDays", event.target.value)}
            />
          </label>

          <label className="manual-field">
            <span>Severity</span>
            <select
              className="kiosk-input"
              value={symptoms.severity}
              onChange={(event) => updateField("severity", event.target.value)}
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>

          <label className="manual-field">
            <span>Consultation language</span>
            <select
              className="kiosk-input"
              value={symptoms.preferredLanguage}
              onChange={(event) => updateField("preferredLanguage", event.target.value)}
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
              <option value="bn">Bengali</option>
            </select>
          </label>
        </div>

        <label className="manual-field">
          <span>History or chronic conditions</span>
          <textarea
            className="kiosk-input kiosk-textarea"
            placeholder="Past history, current medicines, allergies, diabetes, hypertension"
            value={symptoms.history}
            onChange={(event) => updateField("history", event.target.value)}
          />
        </label>
      </div>

      <div className="summary-actions">
        <LargeButton title="Back to Dashboard" icon="BK" className="action-history" onClick={() => navigate("/dashboard")} />
        <LargeButton title="Continue to Vitals" icon="NX" className="primary" onClick={() => navigate("/vitals")} />
      </div>

      <ChatAssistant mode="kiosk" />
    </section>
  );
}
