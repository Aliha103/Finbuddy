
import './StepIndicator.css'

function StepIndicator({ step, maxStep }) {
  return (
    <div className="step-indicator-vision">
      {[...Array(maxStep)].map((_, i) => (
        <span
          key={i}
          className={`step-dot-vision ${step === i + 1 ? 'active' : ''}`}
          aria-current={step === i + 1 ? 'step' : undefined}
        >
          <span className="dot-number">{i + 1}</span>
          {i + 1 === maxStep }
        </span>
      ))}
    </div>
  )
}
export default StepIndicator
