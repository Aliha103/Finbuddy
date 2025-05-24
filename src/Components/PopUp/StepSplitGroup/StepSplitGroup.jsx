import { useRef, useEffect } from 'react'
import { FaMagic } from 'react-icons/fa'
import './StepSplitGroup.css'

function StepSplitGroup({
  form,
  errors,
  onChange,
  onSplitChange,
  participantNames,
}) {
  // Live sum of custom splits
  const totalCustomSplit = participantNames
    .map((name) => parseFloat(form.customSplits[name]) || 0)
    .reduce((a, b) => a + b, 0)

  // AI suggestion
  const aiCustomSuggestion =
    form.splitMethod === 'custom' &&
    participantNames.length > 2 &&
    form.paidBy !== 'You' &&
    !Object.values(form.customSplits).some((v) => v && parseFloat(v) > 0)

  // Quick split equally
  function splitEqually() {
    const perPerson =
      form.amount && participantNames.length
        ? (parseFloat(form.amount) / participantNames.length).toFixed(2)
        : ''
    participantNames.forEach((name) => onSplitChange(name, perPerson))
  }

  // ---- SHAKE LOGIC ----
  const errorRef = useRef(null)
  const shouldShake =
    form.splitMethod === 'custom' &&
    Math.abs(totalCustomSplit - parseFloat(form.amount || 0)) > 0.01

  useEffect(() => {
    if (shouldShake && errorRef.current) {
      errorRef.current.classList.remove('shake')
      // Force reflow to restart animation
      void errorRef.current.offsetWidth
      errorRef.current.classList.add('shake')
    }
  }, [shouldShake, totalCustomSplit, form.amount])

  return (
    <div className="step-split-group-container">
      <label>
        Paid By:
        <select name="paidBy" value={form.paidBy} onChange={onChange}>
          {participantNames.map((name) => (
            <option key={name} value={name}>
              {name === 'You' ? 'You (Me)' : name}
            </option>
          ))}
        </select>
        {errors.paidBy && <span className="error">{errors.paidBy}</span>}
      </label>
      <label>
        Split Method:
        <select name="splitMethod" value={form.splitMethod} onChange={onChange}>
          <option value="equal">Equal</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      {form.splitMethod === 'custom' && (
        <div className="split-custom-panel fade-in">
          <div className="split-custom-header">
            <span>Enter each participant’s share below</span>
            <button
              type="button"
              className="ai-quick-btn"
              onClick={splitEqually}
              tabIndex={0}
            >
              Split Equally
            </button>
          </div>
          <div className="split-custom-fields">
            {participantNames.map((name) => (
              <label
                key={name}
                className={name === 'You' ? 'split-me-label' : ''}
              >
                {name === 'You' ? <b>You (Me):</b> : `${name}:`}
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.customSplits[name] || ''}
                  onChange={(e) => onSplitChange(name, e.target.value)}
                  placeholder="0.00"
                  className="split-input"
                />
              </label>
            ))}
          </div>
          <div className="split-custom-total">
            <span>
              Total: <b>{Number(totalCustomSplit).toFixed(2)}</b> /{' '}
              <b>{form.amount || '0.00'}</b>
            </span>
            {shouldShake && (
              <span ref={errorRef} className="error">
                (Does not match amount)
              </span>
            )}
          </div>
          {aiCustomSuggestion && (
            <div className="ai-banner">
              <FaMagic size={16} style={{ marginRight: 7 }} />
              <span>
                <strong>Tip:</strong> Use “Split Equally” to autofill, or let AI
                suggest based on spending patterns soon!
              </span>
            </div>
          )}
          {errors.customSplits && (
            <span className="error">{errors.customSplits}</span>
          )}
        </div>
      )}
    </div>
  )
}
export default StepSplitGroup
