import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePatientStore } from "../store/patientStore";
import PrescriptionCard from "../components/PrescriptionCard";
import LargeButton from "../components/LargeButton";

export default function SummaryScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = usePatientStore((state) => state.patient);
  const vitals = usePatientStore((state) => state.vitals);
  const records = usePatientStore((state) => state.records);
  const summary = usePatientStore((state) => state.summary);
  const clearPatient = usePatientStore((state) => state.clearPatient);
  const resetSession = usePatientStore((state) => state.resetSession);

  const finish = () => {
    clearPatient();
    resetSession();
    navigate("/");
  };

  return (
    <section className="screen">
      <h1>{t("prescriptionTitle")}</h1>
      <PrescriptionCard patient={patient} vitals={vitals} summary={summary} records={records} />
      <div className="summary-actions">
        <LargeButton title={t("printPrescription")} icon="PRN" className="action-vitals" onClick={() => window.print()} />
        <LargeButton title="Back to Dashboard" icon="DAS" className="action-history" onClick={() => navigate("/dashboard")} />
        <LargeButton title={t("finishSession")} icon="END" className="control-end" onClick={finish} />
      </div>
    </section>
  );
}
