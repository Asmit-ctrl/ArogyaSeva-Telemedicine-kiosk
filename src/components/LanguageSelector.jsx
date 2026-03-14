import { useTranslation } from "react-i18next";
import { usePatientStore } from "../store/patientStore";

const LANGUAGE_OPTIONS = [
  { key: "en", label: "English" },
  { key: "hi", label: "Hindi" },
  { key: "mr", label: "Marathi" },
  { key: "bn", label: "Bangla" }
];

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const setLanguage = usePatientStore((state) => state.setLanguage);

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
  };

  return (
    <div className="language-grid" role="group" aria-label="Language Selection">
      {LANGUAGE_OPTIONS.map((lang) => (
        <button key={lang.key} className="language-btn" onClick={() => handleLanguageChange(lang.key)}>
          {lang.label}
        </button>
      ))}
    </div>
  );
}
