import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
import LargeButton from "../components/LargeButton";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    const utterance = new SpeechSynthesisUtterance(t("selectLanguage"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [t]);

  return (
    <section className="screen welcome-screen">
      <h1>{t("welcomeTitle")}</h1>
      <p className="subtitle">{t("selectLanguage")}</p>
      <LanguageSelector />
      <div className="illustration-card">
        <div className="illustration doctor" />
        <div className="illustration patient" />
      </div>
      <div className="summary-actions">
        <LargeButton title={t("continue")} icon="GO" className="primary" onClick={() => navigate("/login")} />
        <LargeButton title="Doctor Portal" icon="DOC" className="action-consult" onClick={() => navigate("/doctor")} />
      </div>
    </section>
  );
}
