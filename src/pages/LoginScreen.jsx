import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { registerPatient } from "../services/api";
import { usePatientStore } from "../store/patientStore";
import LargeButton from "../components/LargeButton";

export default function LoginScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setPatient = usePatientStore((state) => state.setPatient);

  const [mobile, setMobile] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Male");

  const appendDigit = (digit) => {
    if (mobile.length < 10) {
      setMobile((m) => `${m}${digit}`);
    }
  };

  const submit = async () => {
    const payload = {
      id: mobile || `NEW-${Date.now()}`,
      mobile,
      name: name || "Guest Patient",
      age,
      gender
    };

    await registerPatient(payload);
    setPatient(payload);
    navigate("/dashboard");
  };

  return (
    <section className="screen">
      <h1>{t("loginTitle")}</h1>

      <div className="card">
        <h2>{t("loginWithMobile")}</h2>
        <input className="kiosk-input" value={mobile} readOnly placeholder={t("mobilePlaceholder")} />
        <div className="keypad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "<"].map((key) => (
            <button
              key={key}
              className="keypad-key"
              onClick={() => {
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
        <input className="kiosk-input" placeholder={t("name")} value={name} onChange={(e) => setName(e.target.value)} />
        <input className="kiosk-input" placeholder={t("age")} value={age} onChange={(e) => setAge(e.target.value)} />
        <select className="kiosk-input" value={gender} onChange={(e) => setGender(e.target.value)}>
          <option>{t("male")}</option>
          <option>{t("female")}</option>
          <option>{t("other")}</option>
        </select>
      </div>

      <LargeButton title={t("continue")} icon="OK" className="primary" onClick={submit} />
    </section>
  );
}
