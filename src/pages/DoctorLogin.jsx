import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doctorLogin } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import LargeButton from "../components/LargeButton";

export default function DoctorLogin() {
  const navigate = useNavigate();
  const setDoctorSession = usePatientStore((state) => state.setDoctorSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async () => {
    try {
      const response = await doctorLogin({ email, password });
      localStorage.setItem("doctor-token", response.data.token);
      setDoctorSession({
        token: response.data.token,
        profile: response.data.doctor
      });
      navigate("/doctor/dashboard");
    } catch (submitError) {
      setError(submitError?.response?.data?.message || "Doctor login failed");
    }
  };

  return (
    <section className="screen">
      <h1>Doctor Login</h1>
      <div className="card form-stack">
        <input className="kiosk-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          className="kiosk-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <p className="alert-copy">{error}</p> : null}
      </div>
      <div className="summary-actions">
        <LargeButton title="Back" icon="BK" className="action-history" onClick={() => navigate("/doctor")} />
        <LargeButton title="Open Queue" icon="GO" className="primary" onClick={submit} />
      </div>
    </section>
  );
}
