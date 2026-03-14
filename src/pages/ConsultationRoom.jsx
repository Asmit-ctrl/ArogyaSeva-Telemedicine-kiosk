import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { startConsultation } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import VideoCall from "../components/VideoCall";

export default function ConsultationRoom() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const patient = usePatientStore((state) => state.patient);
  const vitals = usePatientStore((state) => state.vitals);

  const endConsultation = async () => {
    await startConsultation({ patientId: patient?.id, ended: true });
    navigate("/summary");
  };

  return (
    <section className="screen consultation-screen">
      <h1>{t("consultationTitle")}</h1>
      <VideoCall onEnd={endConsultation} vitals={vitals} />
    </section>
  );
}
