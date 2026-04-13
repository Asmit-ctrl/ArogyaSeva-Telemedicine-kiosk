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
  const triage = usePatientStore((state) => state.triage);
  const assignedDoctor = usePatientStore((state) => state.assignedDoctor);
  const consultation = usePatientStore((state) => state.consultation);
  const consultationReady = Boolean(consultation?.consultationId);

  useEffect(() => {
    if (triage?.hospitalRedirect) {
      return undefined;
    }

    if (!consultationReady) {
      return undefined;
    }

    const timer = setTimeout(() => navigate("/consultation"), 6000);
    return () => clearTimeout(timer);
  }, [consultationReady, navigate, triage?.hospitalRedirect]);

  return (
    <section className="screen">
      <h1>{t("waitingTitle")}</h1>
      <QueueStatus queue={queue} />
      <div className="card">
        <h3>Triage Result</h3>
        <p>{triage?.summary || "Preparing consultation routing..."}</p>
        {assignedDoctor ? (
          <p>
            Assigned doctor: <strong>{assignedDoctor.name}</strong> ({assignedDoctor.specialization})
          </p>
        ) : null}
        {triage?.hospitalRedirect ? (
          <p className="alert-copy">
            Emergency case detected. Redirect the patient to the nearest hospital triage desk immediately.
          </p>
        ) : (
          <p className="muted-copy">
            Room: {consultation.roomName || "Creating secure consultation room..."}
            {!consultationReady ? " Please wait while the consultation is prepared." : ""}
          </p>
        )}
      </div>
      <div className="awareness-video">
        <h3>Health Awareness Video</h3>
        <div className="awareness-placeholder">Handwashing, nutrition, and regular checkup tips</div>
      </div>
      <LargeButton
        title={triage?.hospitalRedirect ? "Open Visit Summary" : "Join Consultation"}
        icon="CAM"
        className="primary"
        onClick={() => navigate(triage?.hospitalRedirect ? "/summary" : "/consultation")}
        disabled={!triage?.hospitalRedirect && !consultationReady}
      />
    </section>
  );
}
