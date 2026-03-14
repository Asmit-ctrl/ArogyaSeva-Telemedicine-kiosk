export default function LargeButton({ title, subtitle, icon, onClick, className = "", disabled = false }) {
  return (
    <button className={`large-button ${className}`} onClick={onClick} disabled={disabled}>
      <div className="large-button-icon" aria-hidden="true">{icon}</div>
      <div className="large-button-text">
        <div className="large-button-title">{title}</div>
        {subtitle ? <div className="large-button-subtitle">{subtitle}</div> : null}
      </div>
    </button>
  );
}
