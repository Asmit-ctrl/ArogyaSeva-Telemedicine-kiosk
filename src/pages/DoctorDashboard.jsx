import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { acceptDoctorConsultation, fetchDoctorProfile, fetchDoctorQueue } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import LargeButton from "../components/LargeButton";
import ChatAssistant from "../components/ChatAssistant";

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const doctorSession = usePatientStore((state) => state.doctorSession);
  const setDoctorSession = usePatientStore((state) => state.setDoctorSession);
  const clearDoctorSession = usePatientStore((state) => state.clearDoctorSession);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!doctorSession.token) {
        navigate("/doctor/login");
        return;
      }

      try {
        const [profileResponse, queueResponse] = await Promise.all([fetchDoctorProfile(), fetchDoctorQueue()]);
        setDoctorSession({
          profile: profileResponse.data,
          queue: queueResponse.data.consultations || []
        });
      } catch (loadError) {
        setError(loadError?.response?.data?.message || "Failed to load doctor queue");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [doctorSession.token, navigate, setDoctorSession]);

  const acceptAndJoin = async (consultationId) => {
    const response = await acceptDoctorConsultation(consultationId);
    setDoctorSession({
      activeConsultation: response.data.consultation
    });
    navigate(`/doctor/consultation/${response.data.consultation.consultationId}`);
  };

  return (
    <section className="screen">
      <h1>Doctor Dashboard</h1>
      <div className="card">
        <h2>{doctorSession.profile?.name || "Doctor"}</h2>
        <p>
          Specialty: {doctorSession.profile?.specialization || "--"} | Availability:{" "}
          {doctorSession.profile?.availability || "--"}
        </p>
        <p className="muted-copy">
          Languages: {(doctorSession.profile?.languages || []).join(", ") || "--"} | Fee: INR{" "}
          {doctorSession.profile?.consultationFee || 0}
        </p>
      </div>

      {loading ? <div className="card">Loading consultation queue...</div> : null}
      {error ? <div className="card alert-copy">{error}</div> : null}

      <div className="doctor-queue">
        {(doctorSession.queue || []).map((consultation) => (
          <div key={consultation.consultationId} className="card queue-consultation">
            <h3>{consultation.patientId?.name || "Patient"}</h3>
            <p>Complaint: {consultation.symptoms?.chiefComplaint || "Not captured"}</p>
            <p>Triage: {consultation.triage?.summary || "Pending summary"}</p>
            <p>
              Queue: {consultation.queueNumber} | Wait: {consultation.estimatedWaitMinutes} min | Status:{" "}
              {consultation.status}
            </p>
            <LargeButton
              title={consultation.status === "in_progress" ? "Rejoin Consultation" : "Accept Consultation"}
              icon="CAM"
              className="primary"
              onClick={() => acceptAndJoin(consultation.consultationId)}
            />
          </div>
        ))}
      </div>

      {!loading && !(doctorSession.queue || []).length ? (
        <div className="card">No assigned calls yet. New kiosk triage requests for your specialty will appear here.</div>
      ) : null}

      <div className="summary-actions">
        <LargeButton title="Refresh Queue" icon="RFS" className="action-vitals" onClick={() => window.location.reload()} />
        <LargeButton
          title="Logout"
          icon="OUT"
          className="control-end"
          onClick={() => {
            clearDoctorSession();
            navigate("/doctor/login");
          }}
        />
      </div>

      <ChatAssistant mode="doctor" />
    </section>
  );
}
