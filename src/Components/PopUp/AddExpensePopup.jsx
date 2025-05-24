import React, { useState, useEffect, useRef } from 'react'
import { FaTimes, FaPlus, FaUsers, FaRegSave } from 'react-icons/fa'
import StepBasicFields from './StepBasicFields/StepBasicFields'
import StepSplitGroup from './StepSplitGroup/StepSplitGroup'
import StepFinalTouch from './StepFinalTouch/StepFinalTouch'
import ScrollableFieldsWithIndicator from '../../Components/ScrollableFieldsWithIndicator/ScrollableFieldsWithIndicator'
import './AddExpensePopup.css'

// --- Validators ---
const isValidAmount = (amount) =>
  amount && !isNaN(amount) && parseFloat(amount) > 0
const isValidDate = (date) => !isNaN(Date.parse(date))
const isValidCategory = (cat) => cat && cat.trim().length > 0
const isNonEmptyString = (str) => typeof str === 'string' && str.trim() !== ''
const isValidAttachment = (file) =>
  !file ||
  (['image/jpeg', 'image/png', 'application/pdf'].includes(file.type) &&
    file.size <= 5 * 1024 * 1024)

const defaultForm = {
  amount: '',
  currency: 'EUR',
  category: '',
  date: '',
  description: '',
  participants: '',
  splitMethod: 'equal',
  customSplits: {},
  paidBy: 'You',
  recurring: false,
  location: '',
  attachment: null,
}

const parseParticipants = (raw) =>
  raw
    .split(',')
    .map((n) => n.trim())
    .filter(
      (n, i, arr) => n && n.toLowerCase() !== 'you' && arr.indexOf(n) === i,
    )

// -- Step Indicator (simple, inline) --
const StepIndicator = ({ step, maxStep }) => (
  <div className="step-indicator">
    {Array.from({ length: maxStep }, (_, idx) => (
      <span
        key={idx}
        className={`step-dot${idx + 1 === step ? ' active' : ''}`}
        aria-label={idx + 1 === step ? 'Current step' : undefined}
      />
    ))}
  </div>
)

function AddExpensePopup({ onClose, onAdd }) {
  const [form, setForm] = useState(() => {
    try {
      const draft = localStorage.getItem('expenseDraft')
      return draft ? JSON.parse(draft) : defaultForm
    } catch {
      localStorage.removeItem('expenseDraft')
      return defaultForm
    }
  })
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1)
  const popupRef = useRef(null)

  // Derived state
  const parsedParticipants = parseParticipants(form.participants)
  const isGroup = parsedParticipants.length > 0
  const participantNames = ['You', ...parsedParticipants]
  const maxStep = isGroup ? 3 : 2

  // Step clamp
  useEffect(() => {
    if (step > maxStep) setStep(maxStep)
    if (step < 1) setStep(1)
  }, [maxStep, step])

  // Escape close
  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // --- Manual Validation ---
  function validateStep(currentStep = step) {
    const errs = {}
    if (currentStep === 1) {
      if (!isValidAmount(form.amount)) errs.amount = 'Enter a valid amount'
      if (!isValidCategory(form.category)) errs.category = 'Category required'
      if (!isValidDate(form.date)) errs.date = 'Enter a valid date'
      if (isGroup && !isNonEmptyString(form.participants))
        errs.participants = 'At least one participant required'
    }
    if (currentStep === 2 && isGroup) {
      if (!participantNames.includes(form.paidBy)) errs.paidBy = 'Who paid?'
      if (form.splitMethod === 'custom') {
        let splitTotal = 0,
          allPositive = true
        for (const name of participantNames) {
          const v = parseFloat(form.customSplits[name])
          if (isNaN(v) || v < 0) {
            allPositive = false
            break
          }
          splitTotal += v
        }
        if (!allPositive)
          errs.customSplits = 'All custom splits must be positive'
        if (Math.abs(splitTotal - parseFloat(form.amount)) > 0.01)
          errs.customSplits = 'Custom splits must add up to total amount'
      }
    }
    if (currentStep === maxStep) {
      if (!isNonEmptyString(form.location)) {
        errs.location = 'Location is required'
      }
      if (!isValidAttachment(form.attachment)) {
        errs.attachment = 'Only JPG, PNG, or PDF files under 5MB allowed'
      }
    }
    return errs
  }

  // Navigation
  const handleNext = () => {
    const validationErrors = validateStep(step)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      popupRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
      return
    }
    setErrors({})
    setStep((prev) => Math.min(prev + 1, maxStep))
    popupRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
  }
  const handleBack = () => setStep((prev) => Math.max(1, prev - 1))

  const handleSaveDraft = () => {
    localStorage.setItem('expenseDraft', JSON.stringify(form))
    alert('Draft saved!')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validateStep(maxStep)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      popupRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
      return
    }
    const participants = participantNames.filter((n) => n !== form.paidBy)
    const data = {
      ...form,
      amount: parseFloat(form.amount),
      participants,
      customSplits: { ...form.customSplits },
      attachment: form.attachment || null,
    }
    localStorage.removeItem('expenseDraft')
    onAdd(data)
    onClose()
    setForm(defaultForm)
    setStep(1)
  }

  // Handlers
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    let val
    if (type === 'checkbox') val = checked
    else if (type === 'file') val = files[0]
    else val = value
    if (name === 'participants') {
      setForm((prev) => ({
        ...prev,
        [name]: val,
        splitMethod: 'equal',
        customSplits: {},
        paidBy: 'You',
      }))
      setStep(1)
      return
    }
    if (name === 'amount' && form.splitMethod === 'custom') {
      setForm((prev) => ({ ...prev, [name]: val, customSplits: {} }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: val }))
  }
  const handleSplitChange = (name, value) => {
    setForm((prev) => ({
      ...prev,
      customSplits: { ...prev.customSplits, [name]: value },
    }))
  }

  return (
    <div className="expense-overlay" role="dialog" aria-modal="true">
      <div className="expense-popup" ref={popupRef}>
        <div className="expense-header">
          <h3>
            <FaUsers /> Add Expense
          </h3>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        <StepIndicator step={step} maxStep={maxStep} />

        <form
          className="expense-form"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          {step === 1 && (
            <ScrollableFieldsWithIndicator style={{ maxHeight: '52vh' }}>
              <StepBasicFields
                form={form}
                errors={errors}
                onChange={handleChange}
              />
            </ScrollableFieldsWithIndicator>
          )}
          {step === 2 && isGroup && (
            <StepSplitGroup
              form={form}
              errors={errors}
              onChange={handleChange}
              onSplitChange={handleSplitChange}
              participantNames={participantNames}
            />
          )}
          {((step === 2 && !isGroup) || (step === 3 && isGroup)) && (
            <StepFinalTouch
              form={form}
              errors={errors}
              onChange={handleChange}
            />
          )}

          {/* --- ACTION BUTTONS --- */}
          <div className="actions">
            {step > 1 && (
              <button type="button" className="cancel-btn" onClick={handleBack}>
                Back
              </button>
            )}
            {step < maxStep ? (
              <button type="button" className="save-btn" onClick={handleNext}>
                Next
              </button>
            ) : (
              <button type="submit" className="save-btn">
                <FaPlus /> Add
              </button>
            )}
            <button
              type="button"
              className="cancel-btn"
              onClick={handleSaveDraft}
            >
              <FaRegSave /> Save Draft
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddExpensePopup
