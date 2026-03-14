import { useTranslation } from "react-i18next";

export default function VitalsDisplay({ vitals }) {
  const { t } = useTranslation();

  const tiles = [
    { key: "heartRate", label: t("hr"), unit: "bpm", color: "vital-red" },
    { key: "bloodPressure", label: t("bp"), unit: "mmHg", color: "vital-blue" },
    { key: "temperature", label: t("temp"), unit: "deg C", color: "vital-orange" },
    { key: "spo2", label: t("spo2"), unit: "%", color: "vital-green" },
    { key: "weight", label: t("weight"), unit: "kg", color: "vital-purple" }
  ];

  return (
    <div className="vitals-grid">
      {tiles.map((tile) => (
        <div key={tile.key} className={`vital-card ${tile.color}`}>
          <h3>{tile.label}</h3>
          <p>
            {vitals[tile.key]} <span>{tile.unit}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
