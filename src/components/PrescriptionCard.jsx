export default function PrescriptionCard({ patient, vitals, summary, records }) {
  const date = new Date().toLocaleString();
  const consultation = summary?.consultation;
  const prescription = summary?.prescription;
  const visitSummary = summary?.visitSummary;
  const latestHistory = records?.consultations?.[0];

  return (
    <div className="prescription-card">
      <h3>Digital Visit Summary</h3>
      <p>Date: {date}</p>
      <p>Patient: {patient?.name || latestHistory?.patient?.name || "Unknown"}</p>
      <p>Consultation ID: {consultation?.consultationId || latestHistory?.consultationId || "Not started"}</p>
      <p>
        Assigned doctor: {consultation?.doctor?.name || latestHistory?.doctor?.name || "Awaiting allocation"}{" "}
        {consultation?.doctor?.specialization || latestHistory?.doctor?.specialization
          ? `(${consultation?.doctor?.specialization || latestHistory?.doctor?.specialization})`
          : ""}
      </p>
      <p>
        Payment: {consultation?.paymentStatus || latestHistory?.paymentStatus || "pending"} | Estimated fee:{" "}
        {consultation?.pricing?.currency || latestHistory?.pricing?.currency || "INR"}{" "}
        {consultation?.pricing?.consultationFee || latestHistory?.pricing?.consultationFee || 0}
      </p>
      <p>Triage summary: {visitSummary?.triageSummary || consultation?.triage?.summary || latestHistory?.triage?.summary || "No summary yet."}</p>
      <p>
        Recorded vitals: HR {vitals.heartRate}, BP {vitals.bloodPressure}, Temp {vitals.temperature} deg C, SpO2 {vitals.spo2}
      </p>

      {prescription?.medicines?.length ? (
        <div className="detail-block">
          <h4>Doctor-issued eRx</h4>
          {prescription.medicines.map((medicine) => (
            <p key={`${medicine.name}-${medicine.dosage}`}>
              {medicine.name}: {medicine.dosage}, {medicine.frequency}, {medicine.duration}
            </p>
          ))}
        </div>
      ) : (
        <p className="muted-copy">Doctor eRx will appear here once the remote consultation is completed.</p>
      )}

      {(visitSummary?.riskAlerts || consultation?.triage?.riskAlerts || []).length ? (
        <div className="detail-block">
          <h4>Risk Alerts</h4>
          {(visitSummary?.riskAlerts || consultation?.triage?.riskAlerts || []).map((alert) => (
            <p key={alert}>{alert}</p>
          ))}
        </div>
      ) : null}

      {(visitSummary?.pharmacyOptions || consultation?.pharmacyOptions || []).length ? (
        <div className="detail-block">
          <h4>Pharmacy Fulfilment Options</h4>
          {(visitSummary?.pharmacyOptions || consultation?.pharmacyOptions || []).map((option) => (
            <p key={`${option.name}-${option.mode}`}>
              {option.name}: {option.mode} ({option.eta})
            </p>
          ))}
        </div>
      ) : null}

      {consultation?.followUpPlan ? (
        <div className="detail-block">
          <h4>Follow-up Plan</h4>
          <p>
            Reminder via {consultation.followUpPlan.reminderChannel} in {consultation.followUpPlan.dueInDays} day(s)
          </p>
          <p>Chronic care tracking: {consultation.followUpPlan.chronicCare ? "Enabled" : "Not required"}</p>
        </div>
      ) : null}
    </div>
  );
}
