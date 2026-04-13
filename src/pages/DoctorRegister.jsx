import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doctorSelfRegister } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import LargeButton from "../components/LargeButton";

export default function DoctorRegister() {
  const navigate = useNavigate();
  const setDoctorSession = usePatientStore((state) => state.setDoctorSession);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    specialization: "general_medicine",
    licenseNumber: "",
    languages: "en,hi",
    consultationFee: "300"
  });
  const [error, setError] = useState("");

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    try {
      const response = await doctorSelfRegister({
        ...form,
        languages: form.languages.split(",").map((item) => item.trim()).filter(Boolean)
      });
      localStorage.setItem("doctor-token", response.data.token);
      setDoctorSession({
        token: response.data.token,
        profile: response.data.doctor
      });
      navigate("/doctor/dashboard");
    } catch (submitError) {
      setError(submitError?.response?.data?.message || "Doctor registration failed");
    }
  };

  return (
    <section className="screen">
      <h1>Doctor Self Registration</h1>
      <div className="card form-stack">
        <input className="kiosk-input" placeholder="Full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
        <input className="kiosk-input" placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <input
          className="kiosk-input"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => update("password", e.target.value)}
        />
        <select className="kiosk-input" value={form.specialization} onChange={(e) => update("specialization", e.target.value)}>
          <option value="general_medicine">General Medicine</option>
          <option value="cardiology">Cardiology</option>
          <option value="endocrinology">Endocrinology</option>
          <option value="pulmonology">Pulmonology</option>
        </select>
        <input
          className="kiosk-input"
          placeholder="Medical license number"
          value={form.licenseNumber}
          onChange={(e) => update("licenseNumber", e.target.value)}
        />
        <input
          className="kiosk-input"
          placeholder="Languages comma separated"
          value={form.languages}
          onChange={(e) => update("languages", e.target.value)}
        />
        <input
          className="kiosk-input"
          placeholder="Consultation fee"
          value={form.consultationFee}
          onChange={(e) => update("consultationFee", e.target.value)}
        />
        {error ? <p className="alert-copy">{error}</p> : null}
      </div>
      <div className="summary-actions">
        <LargeButton title="Back" icon="BK" className="action-history" onClick={() => navigate("/doctor")} />
        <LargeButton title="Create Doctor Account" icon="OK" className="primary" onClick={submit} />
      </div>
    </section>
  );
}
