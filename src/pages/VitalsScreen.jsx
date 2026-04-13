import { useMemo } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { submitKioskTriage } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import VitalsDisplay from "../components/VitalsDisplay";
import LargeButton from "../components/LargeButton";

export default function VitalsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const vitals = usePatientStore((state) => state.vitals);
  const setVitals = usePatientStore((state) => state.setVitals);
  const patient = usePatientStore((state) => state.patient);
  const symptoms = usePatientStore((state) => state.symptoms);
  const setTriage = usePatientStore((state) => state.setTriage);
  const setAssignedDoctor = usePatientStore((state) => state.setAssignedDoctor);
  const setConsultation = usePatientStore((state) => state.setConsultation);
  const setQueue = usePatientStore((state) => state.setQueue);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const manualFields = useMemo(
    () => [
      { key: "heartRate", label: t("hr"), placeholder: "72" },
      { key: "bloodPressure", label: t("bp"), placeholder: "120/80" },
      { key: "temperature", label: t("temp"), placeholder: "36.8" },
      { key: "spo2", label: t("spo2"), placeholder: "98" },
      { key: "glucoseLevel", label: "Glucose", placeholder: "140" },
      { key: "weight", label: t("weight"), placeholder: "62.5" },
      { key: "heightCm", label: "Height (cm)", placeholder: "168" },
      { key: "assistantName", label: "Assistant name", placeholder: "Health worker" }
    ],
    [t]
  );

  const handleChange = (key, value) => {
    setError("");
    setVitals({ [key]: value });
  };

  const fillDummyVitals = () => {
    setVitals({
      heartRate: "74",
      bloodPressure: "118/78",
      temperature: "36.9",
      spo2: "98",
      glucoseLevel: "126",
      weight: "61.4",
      heightCm: "165",
      assistantName: "Demo Assistant"
    });
  };

  const sendToDoctor = async () => {
    if (!symptoms.chiefComplaint) {
      navigate("/symptoms");
      return;
    }

    if (!patient?.patientId && !patient?.id) {
      setError("Patient intake is missing. Please start again from login.");
      navigate("/login");
      return;
    }

    const bmi =
      Number(vitals.weight) > 0 && Number(vitals.heightCm) > 0
        ? (Number(vitals.weight) / ((Number(vitals.heightCm) / 100) ** 2)).toFixed(1)
        : vitals.bmi;

    const payload = {
      patientId: patient?.patientId || patient?.id,
      symptoms,
      vitals: {
        ...vitals,
        bmi
      },
      kiosk: {
        kioskId: "KIOSK-001",
        placement: "rural"
      }
    };

    setSubmitting(true);
    setError("");

    try {
      const response = await submitKioskTriage(payload);
      const consultationId = response.data.consultation?.consultationId;
      if (!consultationId && !response.data.triage?.hospitalRedirect) {
        throw new Error("Consultation could not be created. Please retry triage.");
      }

      setVitals(response.data.consultation?.vitalsSnapshot || { ...vitals, bmi });
      setTriage(response.data.triage);
      setAssignedDoctor(response.data.assignedDoctor);
      setConsultation({
        active: !response.data.triage?.hospitalRedirect,
        consultationId,
        roomName: response.data.consultation?.roomName,
        twilioEnabled: false,
        status: response.data.consultation?.status || "pending"
      });
      setQueue(response.data.queue);
      navigate("/waiting");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to run triage right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="screen">
      <h1>{t("vitalsTitle")}</h1>
      <p className="subtitle">Manual entry mode for prototype. Enter readings directly on screen.</p>
      <div className="instruction-strip">
      <div className="instruction-step">1. Measure patient vitals manually</div>
      <div className="instruction-step">2. Type values in the fields below</div>
      <div className="instruction-step">3. Send vitals to doctor</div>
      </div>
      {error ? <div className="card form-alert">{error}</div> : null}

      <div className="manual-vitals-form">
        {manualFields.map((field) => (
          <label key={field.key} className="manual-field">
            <span>{field.label}</span>
            <input
              className="kiosk-input"
              value={vitals[field.key] === "--" ? "" : vitals[field.key]}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(field.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <LargeButton title="Fill Demo Vitals" subtitle="Prototype quick test" icon="DMY" className="action-history" onClick={fillDummyVitals} />
      <VitalsDisplay vitals={vitals} />
      <div className="summary-actions">
        <LargeButton title="Back to Symptoms" icon="BK" className="action-history" onClick={() => navigate("/symptoms")} />
        <LargeButton title={submitting ? "Running AI Triage..." : "Run AI Triage"} icon="UP" className="primary" onClick={sendToDoctor} disabled={submitting} />
      </div>
    </section>
  );
}
