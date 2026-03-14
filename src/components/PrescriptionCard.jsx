export default function PrescriptionCard({ patient, vitals }) {
  const date = new Date().toLocaleString();

  return (
    <div className="prescription-card">
      <h3>Digital Prescription</h3>
      <p>Date: {date}</p>
      <p>Patient: {patient?.name || "Unknown"}</p>
      <p>Advice: Hydration, balanced diet, and follow-up in 7 days.</p>
      <p>Medicine 1: Paracetamol 500mg - Twice daily after food</p>
      <p>Medicine 2: ORS - One sachet after each loose stool</p>
      <p>Recorded Vitals: HR {vitals.heartRate}, BP {vitals.bloodPressure}, Temp {vitals.temperature} deg C</p>
    </div>
  );
}
