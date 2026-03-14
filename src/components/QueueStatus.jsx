import { useTranslation } from "react-i18next";

export default function QueueStatus({ queue }) {
  const { t } = useTranslation();

  return (
    <div className="queue-card">
      <div className="queue-item">
        <span>{t("queueNumber")}</span>
        <strong>{queue.number}</strong>
      </div>
      <div className="queue-item">
        <span>{t("waitTime")}</span>
        <strong>{queue.waitMinutes} min</strong>
      </div>
    </div>
  );
}
