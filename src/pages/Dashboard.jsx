import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LargeButton from "../components/LargeButton";

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section className="screen">
      <h1>{t("dashboardTitle")}</h1>
      <div className="action-grid">
        <LargeButton
          title={t("consultDoctor")}
          subtitle="Start online consultation"
          icon="DOC"
          className="action-consult"
          onClick={() => navigate("/waiting")}
        />
        <LargeButton
          title={t("checkVitals")}
          subtitle="Connect devices and record"
          icon="VTL"
          className="action-vitals"
          onClick={() => navigate("/vitals")}
        />
        <LargeButton
          title={t("oldPrescription")}
          subtitle="Last 3 records"
          icon="RX"
          className="action-history"
          onClick={() => navigate("/summary")}
        />
      </div>
    </section>
  );
}
