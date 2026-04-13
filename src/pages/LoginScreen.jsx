import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { registerPatient } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import LargeButton from "../components/LargeButton";

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const resetSession = usePatientStore((state) => state.resetSession);
  const setPatient = usePatientStore((state) => state.setPatient);
  const setRecords = usePatientStore((state) => state.setRecords);

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");
  const [village, setVillage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const appendDigit = (digit) => {
    if (mobile.length < 10) {
      setMobile((m) => `${m}${digit}`);
    }
  };

  const submit = async () => {
    const normalizedMobile = mobile.replace(/\D/g, "");
    if (normalizedMobile.length !== 10) {
      setError("Enter a valid 10-digit mobile number to continue.");
      return;
    }

    setSubmitting(true);
    setError("");
    const payload = {
      mobileNumber: normalizedMobile,
      name: name || "Guest Patient",
      age,
      gender,
      village: village || "Walk-in",
      preferredLanguage: localStorage.getItem("kiosk-language") || "en"
    };

    try {
      const response = await registerPatient(payload);
      resetSession();
      setPatient(response.data.patient);
      setRecords(response.data.records || {});
      navigate("/dashboard");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to start intake right now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="screen">
      <h1>{t("loginTitle")}</h1>

      <div className="card">
        <h2>{t("loginWithMobile")}</h2>
        <input className="kiosk-input" value={mobile} readOnly placeholder={t("mobilePlaceholder")} />
        {error ? <p className="form-error">{error}</p> : null}
        <div className="keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "<"].map((key) => (
            <button
              key={key}
              className="keypad-key"
              onClick={() => {
                setError("");
                if (key === "C") setMobile("");
                else if (key === "<") setMobile((m) => m.slice(0, -1));
                else appendDigit(key);
              }}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>{t("registerNew")}</h2>
        <input
          className="kiosk-input"
          placeholder={t("name")}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
        />
        <input
          className="kiosk-input"
          placeholder={t("age")}
          value={age}
          onChange={(e) => {
            setAge(e.target.value);
            setError("");
          }}
        />
        <select className="kiosk-input" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option>{t("male")}</option>
          <option>{t("female")}</option>
          <option>{t("other")}</option>
        </select>
        <input
          className="kiosk-input"
          placeholder="Village / Area"
          value={village}
          onChange={(e) => {
            setVillage(e.target.value);
            setError("");
          }}
        />
      </div>

      <LargeButton
        title={submitting ? "Starting intake..." : t("continue")}
        icon="OK"
        className="primary"
        onClick={submit}
        disabled={submitting}
      />
    </section>
  );
}
