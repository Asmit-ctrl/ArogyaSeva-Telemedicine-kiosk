import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { usePatientStore } from "../store/patientStore";
import QueueStatus from "../components/QueueStatus";
import LargeButton from "../components/LargeButton";

export default function WaitingRoom() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queue = usePatientStore((state) => state.queue);

  useEffect(() => {
    const timer = setTimeout(() => navigate("/consultation"), 6000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <section className="screen">
      <h1>{t("waitingTitle")}</h1>
      <QueueStatus queue={queue} />
      <div className="awareness-video">
        <h3>Health Awareness Video</h3>
        <div className="awareness-placeholder">Handwashing, nutrition, and regular checkup tips</div>
      </div>
      <LargeButton title="Join Consultation" icon="CAM" className="primary" onClick={() => navigate("/consultation")} />
    </section>
  );
}
