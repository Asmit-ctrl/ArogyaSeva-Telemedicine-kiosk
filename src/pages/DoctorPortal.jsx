import { useNavigate } from "react-router-dom";
import LargeButton from "../components/LargeButton";

export default function DoctorPortal() {
  const navigate = useNavigate();

  return (
    <section className="screen">
      <h1>Doctor Portal</h1>
      <p className="subtitle">Register as a telemedicine doctor or sign in to receive queued consultations.</p>
      <div className="action-grid">
        <LargeButton
          title="Doctor Register"
          subtitle="Create doctor account and receive calls"
          icon="REG"
          className="action-vitals"
          onClick={() => navigate("/doctor/register")}
        />
        <LargeButton
          title="Doctor Login"
          subtitle="Open your consultation queue"
          icon="LOG"
          className="action-consult"
          onClick={() => navigate("/doctor/login")}
        />
        <LargeButton
          title="Back to Kiosk"
          subtitle="Return to patient flow"
          icon="KSK"
          className="action-history"
          onClick={() => navigate("/")}
        />
      </div>
    </section>
  );
}
