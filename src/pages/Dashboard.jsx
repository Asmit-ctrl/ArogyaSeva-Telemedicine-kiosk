import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePatientStore } from "../store/patientStore";
import LargeButton from "../components/LargeButton";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = usePatientStore((state) => state.patient);
  const records = usePatientStore((state) => state.records);

  return (
    <section className="screen">
      <h1>{t("dashboardTitle")}</h1>
      <div className="card patient-highlight">
        <h2>{patient?.name || "Walk-in Patient"}</h2>
        <p>
          Mobile: {patient?.mobileNumber || "Not provided"} | Village: {patient?.village || "Walk-in"}
        </p>
        <p className="muted-copy">
          Previous consultations: {records.consultations?.length || 0} | Stored vitals: {records.vitals?.length || 0}
        </p>
      </div>
      <div className="action-grid">
        <LargeButton
          title="Start AI Triage"
          subtitle="Capture symptoms and route the case"
          icon="DOC"
          className="action-consult"
          onClick={() => navigate("/symptoms")}
        />
        <LargeButton
          title={t("checkVitals")}
          subtitle="Record vitals manually at the kiosk"
          icon="VTL"
          className="action-vitals"
          onClick={() => navigate("/vitals")}
        />
        <LargeButton
          title={t("oldPrescription")}
          subtitle="View visit history and summaries"
          icon="RX"
          className="action-history"
          onClick={() => navigate("/summary")}
        />
      </div>
    </section>
  );
}
