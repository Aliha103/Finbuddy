import React, { useState, useRef, useEffect } from 'react'
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion'
import { FaUserPlus, FaUsers, FaLightbulb } from 'react-icons/fa'
import './CreateGroup.css'

// Mock: AI tip fetcher (replace with your backend or analytics logic)
async function fetchGroupAITip({ isPersonal, members, purpose }) {
  return new Promise((res) =>
    setTimeout(() => {
      if (!isPersonal && members.length > 3)
        res('AI: Bigger groups benefit from clear roles or budgets!')
      else if (!purpose)
        res('AI: Setting a clear group purpose helps avoid confusion later.')
      else res('AI: Smart choice! Group expenses simplify shared spending.')
    }, 450),
  )
}

function useAutoLearn(state) {
  // Placeholder for analytics, logging, or AI continuous improvement logic.
  useEffect(() => {
    // Example: send user interaction to backend for AI
    // fetch('/api/ai-learn', {method: 'POST', body: JSON.stringify(state)});
    // Could add more sophisticated learning here (e.g., usage heatmaps, tips adjustments, A/B).
  }, [state])
}

function AITip({ message }) {
  return (
    <motion.div
      className="ai-tip-banner"
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.38, type: 'spring' }}
      tabIndex={0}
      aria-live="polite"
    >
      <FaLightbulb style={{ marginRight: 8, color: '#ffdb5e' }} />
      {message}
    </motion.div>
  )
}

const defaultState = {
  isPersonal: true,
  groupName: '',
  members: [],
  memberInput: '',
  purpose: '',
}

function CreateGroup({ onCreate, onCancel, existingGroups = [] }) {
  const [step, setStep] = useState(1)
  const [state, setState] = useState(defaultState)
  const [aiTip, setAiTip] = useState('')
  const [errors, setErrors] = useState({})
  const memberInputRef = useRef(null)
  const purposeInputRef = useRef(null)

  useAutoLearn(state) // <-- Place for auto-learning AI logic

  // Fetch AI tip on state changes
  useEffect(() => {
    let cancelled = false
    fetchGroupAITip(state).then((tip) => !cancelled && setAiTip(tip))
    return () => {
      cancelled = true
    }
  }, [step, state])

  function isGroupNameTaken(name) {
    return existingGroups
      .map((g) => g.toLowerCase().trim())
      .includes(name.toLowerCase().trim())
  }

  function handleTypeChange(isPersonal) {
    setState((s) => ({
      ...s,
      isPersonal,
      members: isPersonal ? [] : s.members,
    }))
    setErrors({})
  }

  function handleGroupNameChange(e) {
    setState((s) => ({ ...s, groupName: e.target.value }))
    setErrors((err) => ({ ...err, groupName: undefined }))
  }

  function handleAddMember() {
    const value = state.memberInput.trim()
    if (!value) return
    if (state.members.includes(value)) {
      setErrors((err) => ({ ...err, memberInput: 'Member already added.' }))
      return
    }
    setState((s) => ({
      ...s,
      members: [...s.members, value],
      memberInput: '',
    }))
    setErrors((err) => ({ ...err, memberInput: undefined }))
    setTimeout(() => memberInputRef.current?.focus(), 1)
  }

  function handleMemberInputChange(e) {
    setState((s) => ({ ...s, memberInput: e.target.value }))
    setErrors((err) => ({ ...err, memberInput: undefined }))
  }

  function handleRemoveMember(name) {
    setState((s) => ({
      ...s,
      members: s.members.filter((m) => m !== name),
    }))
  }

  function handleCreate() {
    let errs = {}
    if (!state.groupName.trim()) errs.groupName = 'Group name required'
    else if (isGroupNameTaken(state.groupName))
      errs.groupName = 'You already joined/created a group with this name'
    if (!state.isPersonal && state.members.length < 1)
      errs.members = 'Add at least one member'
    if (!state.purpose.trim()) errs.purpose = 'Purpose is required'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onCreate && onCreate({ ...state })
  }

  function handleNextFromStep1() {
    let errs = {}
    if (!state.groupName.trim()) errs.groupName = 'Group name required'
    else if (isGroupNameTaken(state.groupName))
      errs.groupName = 'You already joined/created a group with this name'
    setErrors(errs)
    if (Object.keys(errs).length) return
    setStep(2)
    setTimeout(() => {
      if (!state.isPersonal) memberInputRef.current?.focus()
      else purposeInputRef.current?.focus()
    }, 10)
  }

  function handleMemberInputKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddMember()
    }
  }

  function handlePurposeChange(e) {
    setState((s) => ({ ...s, purpose: e.target.value }))
    setErrors((err) => ({ ...err, purpose: undefined }))
  }

  function handleBackStep() {
    setStep(step === 2 && state.isPersonal ? 1 : step - 1)
    setErrors({})
    setTimeout(() => {
      if (step === 2 && state.isPersonal) return
      if (step === 2) memberInputRef.current?.focus()
      if (step === 3) purposeInputRef.current?.focus()
    }, 10)
  }

  // Animated step wrapper
  function StepWrap({ children, stepKey }) {
    return (
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={stepKey}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
          className="group-step"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="create-group-popup" role="dialog" aria-modal="true">
      <div className="popup-content">
        <button className="close-btn" onClick={onCancel} tabIndex={0}>
          ✕
        </button>
        <h2>
          <FaUsers /> Create New {state.isPersonal ? 'Personal' : 'Group'}{' '}
          Expense
        </h2>
        <AnimatePresence>
          {aiTip && <AITip key={aiTip} message={aiTip} />}
        </AnimatePresence>
        {/* Step 1: Type & Name */}
        {step === 1 && (
          <StepWrap stepKey="step1">
            <div className="type-selector">
              <button
                className={state.isPersonal ? 'selected' : ''}
                onClick={() => handleTypeChange(true)}
                tabIndex={0}
                type="button"
              >
                Personal
              </button>
              <button
                className={!state.isPersonal ? 'selected' : ''}
                onClick={() => handleTypeChange(false)}
                tabIndex={0}
                type="button"
              >
                Group
              </button>
            </div>
            <label>
              Group Name
              <input
                type="text"
                value={state.groupName}
                onChange={handleGroupNameChange}
                placeholder="e.g. Venice Trip, Flatmates"
                autoFocus
                className={errors.groupName ? 'input-error' : ''}
              />
              {errors.groupName && (
                <span className="error">{errors.groupName}</span>
              )}
            </label>
            <div className="group-actions">
              <button onClick={handleNextFromStep1} tabIndex={0} type="button">
                Next
              </button>
            </div>
          </StepWrap>
        )}
        {/* Step 2: Add Members (for group) */}
        {!state.isPersonal && step === 2 && (
          <StepWrap stepKey="step2">
            <label>
              Add Group Members (name, nickname, etc):
              <div className="member-input-wrap">
                <input
                  className={`group-member-input${
                    errors.memberInput ? ' input-error' : ''
                  }`}
                  ref={memberInputRef}
                  value={state.memberInput}
                  onChange={handleMemberInputChange}
                  onKeyDown={handleMemberInputKeyDown}
                  placeholder="Type name and press Enter"
                  autoFocus
                />
                <button onClick={handleAddMember} tabIndex={0} type="button" className='add-member-btn'>
                  <FaUserPlus /> Add
                </button>
              </div>
              {errors.memberInput && (
                <span className="error">{errors.memberInput}</span>
              )}
            </label>
            <div className="members-list">
              {state.members.map((name) => (
                <div key={name} className="member-chip">
                  {name}
                  <button
                    onClick={() => handleRemoveMember(name)}
                    aria-label="Remove"
                    type="button"
                  >
                    ×
                  </button>
                </div>
              ))}
              {errors.members && (
                <span className="error">{errors.members}</span>
              )}
            </div>
            <div className="group-actions">
              <button onClick={handleBackStep} tabIndex={0} type="button">
                Back
              </button>
              <button onClick={() => setStep(3)} tabIndex={0} type="button">
                Next
              </button>
            </div>
          </StepWrap>
        )}
        {/* Step 2 or 3: Purpose */}
        {(state.isPersonal && step === 2) ||
        (!state.isPersonal && step === 3) ? (
          <StepWrap stepKey="step3">
            <label>
              Group Purpose
              <input
                ref={purposeInputRef}
                type="text"
                value={state.purpose}
                onChange={handlePurposeChange}
                placeholder="e.g. Flat Expenses, Trip Budget, Office Lunch"
                className={errors.purpose ? 'input-error' : ''}
                autoFocus
              />
              {errors.purpose && (
                <span className="error">{errors.purpose}</span>
              )}
            </label>
            <div className="group-actions">
              <button onClick={handleBackStep} tabIndex={0} type="button">
                Back
              </button>
              <button onClick={handleCreate} tabIndex={0} type="button">
                Create Group
              </button>
            </div>
          </StepWrap>
        ) : null}
      </div>
    </div>
  )
}

export default CreateGroup
