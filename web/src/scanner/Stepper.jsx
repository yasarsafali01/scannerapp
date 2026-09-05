export default function Stepper({ label, value, onChange, min = -50, max = 50, step = 10 }) {
  return (
    <div className="stepper-row">
      <span className="stepper-label">{label}</span>
      <div className="stepper-controls">
        <button type="button" className="stepper-btn" onClick={() => onChange(Math.max(min, value - step))} disabled={value <= min}>
          −
        </button>
        <span className="stepper-value">{value}</span>
        <button type="button" className="stepper-btn" onClick={() => onChange(Math.min(max, value + step))} disabled={value >= max}>
          +
        </button>
      </div>
    </div>
  );
}
