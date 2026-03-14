import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { uploadVitals } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import VitalsDisplay from "../components/VitalsDisplay";
import LargeButton from "../components/LargeButton";

export default function VitalsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const vitals = usePatientStore((state) => state.vitals);
  const setVitals = usePatientStore((state) => state.setVitals);
  const patient = usePatientStore((state) => state.patient);

  const manualFields = useMemo(
    () => [
      { key: "heartRate", label: t("hr"), placeholder: "72" },
      { key: "bloodPressure", label: t("bp"), placeholder: "120/80" },
      { key: "temperature", label: t("temp"), placeholder: "36.8" },
      { key: "spo2", label: t("spo2"), placeholder: "98" },
      { key: "weight", label: t("weight"), placeholder: "62.5" }
    ],
    [t]
  );

  const handleChange = (key, value) => {
    setVitals({ [key]: value });
  };

  const fillDummyVitals = () => {
    setVitals({
      heartRate: "74",
      bloodPressure: "118/78",
      temperature: "36.9",
      spo2: "98",
      weight: "61.4"
    });
  };

  const sendToDoctor = async () => {
    await uploadVitals({ patientId: patient?.id, vitals });
    navigate("/waiting");
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

      <LargeButton title="Fill Dummy Vitals" subtitle="Prototype quick test" icon="DMY" className="action-history" onClick={fillDummyVitals} />
      <VitalsDisplay vitals={vitals} />
      <LargeButton title={t("sendVitals")} icon="UP" className="primary" onClick={sendToDoctor} />
    </section>
  );
}
