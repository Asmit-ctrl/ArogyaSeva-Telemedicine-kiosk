import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { sendPrescription } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import PrescriptionCard from "../components/PrescriptionCard";
import LargeButton from "../components/LargeButton";

export default function SummaryScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = usePatientStore((state) => state.patient);
  const vitals = usePatientStore((state) => state.vitals);
  const clearPatient = usePatientStore((state) => state.clearPatient);
  const resetVitals = usePatientStore((state) => state.resetVitals);

  const sendSms = async () => {
    await sendPrescription({ patientId: patient?.id, mode: "sms" });
    alert("Prescription SMS queued/sent.");
  };

  const finish = () => {
    clearPatient();
    resetVitals();
    navigate("/");
  };

  return (
    <section className="screen">
      <h1>{t("prescriptionTitle")}</h1>
      <PrescriptionCard patient={patient} vitals={vitals} />
      <div className="summary-actions">
        <LargeButton title={t("printPrescription")} icon="PRN" className="action-vitals" onClick={() => window.print()} />
        <LargeButton title={t("sendSMS")} icon="SMS" className="action-history" onClick={sendSms} />
        <LargeButton title={t("finishSession")} icon="END" className="control-end" onClick={finish} />
      </div>
    </section>
  );
}
