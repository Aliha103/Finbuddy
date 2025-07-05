import React, { useState, useEffect, useRef } from 'react'
import { FaTimes, FaPlus, FaUsers, FaRegSave } from 'react-icons/fa'
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion'
import { logStepEvent } from '../../utils/analytics'
import StepBasicFields from './StepBasicFields/StepBasicFields'
import StepSplitGroup from './StepSplitGroup/StepSplitGroup'
import StepFinalTouch from './StepFinalTouch/StepFinalTouch'
import ScrollableFieldsWithIndicator from '../../Components/ScrollableFieldsWithIndicator/ScrollableFieldsWithIndicator'
import AutoHelpMessage from '../../Components/AutoHelpMessage/AutoHelpMessage'
import './AddExpensePopup.css'

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
      if (typeof Storage !== 'undefined') {
        const draft = localStorage.getItem('expenseDraft')
        return draft ? JSON.parse(draft) : defaultForm
      }
      return defaultForm
    } catch {
      if (typeof Storage !== 'undefined') {
        localStorage.removeItem('expenseDraft')
      }
      return defaultForm
    }
  })
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [validationFailCount, setValidationFailCount] = useState(0)
  const [aiConfig, setAiConfig] = useState(null)
  const popupRef = useRef(null)

  // Fetch AI config from backend per step (e.g., `/api/ai-suggestions?step=2`)
  useEffect(() => {
    fetch(`/api/ai-suggestions?step=${step}`)
      .then((r) => r.json())
      .then(setAiConfig)
      .catch(() => setAiConfig(null))
  }, [step])

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

  // Always clear errors when changing step
  useEffect(() => {
    setErrors({})
  }, [step])

  // Escape close (accessibility)
  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && handleClose()
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
    // eslint-disable-next-line
  }, [])

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
      if (!isNonEmptyString(form.location))
        errs.location = 'Location is required'
      if (!isValidAttachment(form.attachment))
        errs.attachment = 'Only JPG, PNG, or PDF files under 5MB allowed'
    }
    return errs
  }

  // Navigation
  const handleNext = () => {
    const validationErrors = validateStep(step)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      setValidationFailCount((c) => c + 1)
      logStepEvent({ step, action: 'validation_failed', form, maxStep })
      popupRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
      return
    }
    logStepEvent({ step, action: 'next', form, maxStep })
    setValidationFailCount(0)
    setDirection(1)
    setStep((prev) => Math.min(prev + 1, maxStep))
    popupRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
  }
  const handleBack = () => {
    logStepEvent({ step, action: 'back', form, maxStep })
    setDirection(-1)
    setStep((prev) => Math.max(1, prev - 1))
    popupRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  const handleClose = () => {
    logStepEvent({ step, action: 'close', form, maxStep })
    onClose()
  }

  const handleSaveDraft = () => {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('expenseDraft', JSON.stringify(form))
      logStepEvent({ step, action: 'save_draft', form, maxStep })
      alert('Draft saved!')
    } else {
      alert('Storage not available - cannot save draft')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const validationErrors = validateStep(maxStep)
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      setValidationFailCount((c) => c + 1)
      logStepEvent({
        step: maxStep,
        action: 'validation_failed_submit',
        form,
        maxStep,
      })
      popupRef.current?.scrollTo?.({ top: 0, behavior: 'smooth' })
      return
    }
    logStepEvent({ step: maxStep, action: 'submit', form, maxStep })
    const participants = participantNames.filter((n) => n !== form.paidBy)
    const data = {
      ...form,
      amount: parseFloat(form.amount),
      participants,
      customSplits: { ...form.customSplits },
      attachment: form.attachment || null,
    }
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem('expenseDraft')
    }
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

  // --- Auto-help: Show special help if user struggles with splits ---
  if (errors.customSplits && validationFailCount > 2) {
    return (
      <div className="expense-popup" ref={popupRef}>
        <AutoHelpMessage message="Having trouble? Here's how to split expenses: Enter each participant's share and make sure the total matches the amount." />
        <button onClick={() => setValidationFailCount(0)} className="save-btn">
          Dismiss
        </button>
      </div>
    )
  }

  return (
    <div
      className="expense-overlay"
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="expense-popup" ref={popupRef}>
        <div className="expense-header">
          <h3>
            <FaUsers /> Add Expense
          </h3>
          <button
            className="close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        <StepIndicator step={step} maxStep={maxStep} />

        <form
          className="expense-form"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ x: direction > 0 ? 60 : -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -60 : 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 370, damping: 30 }}
                tabIndex={0}
              >
                <ScrollableFieldsWithIndicator style={{ maxHeight: '52vh' }}>
                  <StepBasicFields
                    form={form}
                    errors={errors}
                    onChange={handleChange}
                    aiConfig={aiConfig?.step1}
                  />
                </ScrollableFieldsWithIndicator>
              </motion.div>
            )}
            {step === 2 && isGroup && (
              <motion.div
                key="step-2"
                initial={{ x: direction > 0 ? 60 : -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -60 : 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 370, damping: 30 }}
                tabIndex={0}
              >
                <StepSplitGroup
                  form={form}
                  errors={errors}
                  onChange={handleChange}
                  onSplitChange={handleSplitChange}
                  participantNames={participantNames}
                  aiConfig={aiConfig?.step2}
                />
              </motion.div>
            )}
            {((step === 2 && !isGroup) || (step === 3 && isGroup)) && (
              <motion.div
                key="step-3"
                initial={{ x: direction > 0 ? 60 : -60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction > 0 ? -60 : 60, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 370, damping: 30 }}
                tabIndex={0}
              >
                <StepFinalTouch
                  form={form}
                  errors={errors}
                  onChange={handleChange}
                  aiConfig={aiConfig?.step3}
                />
              </motion.div>
            )}
          </AnimatePresence>

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
