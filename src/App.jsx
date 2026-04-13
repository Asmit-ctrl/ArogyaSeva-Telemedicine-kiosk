import { lazy, Suspense, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { syncQueuedRequests } from "./services/api";
import "./utils/translations";
import "./styles.css";

const WelcomeScreen = lazy(() => import("./pages/WelcomeScreen"));
const LoginScreen = lazy(() => import("./pages/LoginScreen"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SymptomsScreen = lazy(() => import("./pages/SymptomsScreen"));
const VitalsScreen = lazy(() => import("./pages/VitalsScreen"));
const WaitingRoom = lazy(() => import("./pages/WaitingRoom"));
const ConsultationRoom = lazy(() => import("./pages/ConsultationRoom"));
const SummaryScreen = lazy(() => import("./pages/SummaryScreen"));
const DoctorPortal = lazy(() => import("./pages/DoctorPortal"));
const DoctorRegister = lazy(() => import("./pages/DoctorRegister"));
const DoctorLogin = lazy(() => import("./pages/DoctorLogin"));
const DoctorDashboard = lazy(() => import("./pages/DoctorDashboard"));
const DoctorConsultation = lazy(() => import("./pages/DoctorConsultation"));

function AudioHelpButton() {
  const { t } = useTranslation();
  const location = useLocation();

  const messageByRoute = {
    "/": t("selectLanguage"),
    "/login": t("loginTitle"),
    "/dashboard": t("dashboardTitle"),
    "/symptoms": "AI symptom triage",
    "/vitals": t("vitalsTitle"),
    "/waiting": t("waitingTitle"),
    "/consultation": t("consultationTitle"),
    "/summary": t("prescriptionTitle")
  };

  const speakHelp = () => {
    const utterance = new SpeechSynthesisUtterance(messageByRoute[location.pathname] || t("ready"));
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button className="audio-help" onClick={speakHelp}>
      {t("audioHelp")}
    </button>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true);
      setSyncing(true);
      await syncQueuedRequests();
      setSyncing(false);
    };

    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="app-shell">
      {!online ? <div className="network-banner offline">{t("noInternet")}</div> : null}
      {syncing ? <div className="network-banner syncing">{t("syncing")}</div> : null}

      <Suspense fallback={<div className="loading-screen">Loading kiosk...</div>}>
        <Routes>
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/symptoms" element={<SymptomsScreen />} />
          <Route path="/vitals" element={<VitalsScreen />} />
          <Route path="/waiting" element={<WaitingRoom />} />
          <Route path="/consultation" element={<ConsultationRoom />} />
          <Route path="/summary" element={<SummaryScreen />} />
          <Route path="/doctor" element={<DoctorPortal />} />
          <Route path="/doctor/register" element={<DoctorRegister />} />
          <Route path="/doctor/login" element={<DoctorLogin />} />
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/consultation/:consultationId" element={<DoctorConsultation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>

      <AudioHelpButton />
    </div>
  );
}
