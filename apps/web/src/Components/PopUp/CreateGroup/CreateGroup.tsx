import React, { useState } from 'react'
import { FaUsers, FaUser, FaCheck, FaTimes, FaArrowRight, FaArrowLeft } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { Group } from '../../../types'
import './CreateGroup.css'

interface CreateGroupProps {
  onCancel: () => void
  onCreate: (group: Partial<Group>) => void
}

function CreateGroup({ onCancel, onCreate }: CreateGroupProps) {
  const [step, setStep] = useState(1)
  const [type, setType] = useState<'personal' | 'group'>('group')
  const [name, setName] = useState('')
  const [members, setMembers] = useState<string[]>([])
  const [memberInput, setMemberInput] = useState('')

  const handleAddMember = () => {
    if (memberInput.trim()) {
      setMembers([...members, memberInput.trim()])
      setMemberInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddMember()
    }
  }

  const handleSubmit = () => {
    // Construct new group object
    const newGroup: Partial<Group> = {
      name,
      isPersonal: type === 'personal',
      members: type === 'personal' ? [] : members,
      purpose: type === 'personal' ? 'Personal Finance' : 'Shared Expenses',
      createdAt: new Date().toISOString()
    }
    onCreate(newGroup)
  }

  return (
    <div className="popup-overlay">
      <motion.div
        className="create-group-container"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <button className="close-btn" onClick={onCancel}><FaTimes /></button>

        <div className="steps-indicator">
          <div className={`step-dot ${step >= 1 ? 'active' : ''}`}></div>
          <div className="step-line"></div>
          <div className={`step-dot ${step >= 2 ? 'active' : ''}`}></div>
          <div className="step-line"></div>
          <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              className="step-content"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <h2>What type of space?</h2>
              <div className="type-selection">
                <button
                  className={`type-card ${type === 'personal' ? 'selected' : ''}`}
                  onClick={() => setType('personal')}
                >
                  <div className="icon-circle"><FaUser /></div>
                  <h3>Personal</h3>
                  <p>Track your own spending and budget.</p>
                </button>
                <button
                  className={`type-card ${type === 'group' ? 'selected' : ''}`}
                  onClick={() => setType('group')}
                >
                  <div className="icon-circle"><FaUsers /></div>
                  <h3>Group</h3>
                  <p>Split bills with friends or family.</p>
                </button>
              </div>
              <div className="step-actions">
                <button className="next-btn" onClick={() => setStep(2)}>
                  Next <FaArrowRight />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              className="step-content"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <h2>Name your {type} space</h2>
              <div className="input-group">
                <label>Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'group' ? "e.g. Summer Trip 2024" : "e.g. My Wallet"}
                  autoFocus
                />
              </div>
              <div className="step-actions">
                <button className="back-btn" onClick={() => setStep(1)}>
                  <FaArrowLeft /> Back
                </button>
                <button
                  className="next-btn"
                  onClick={() => setStep(type === 'group' ? 3 : 3)} // Skip members for personal? Actually let's just go to review or finish
                  disabled={!name.trim()}
                >
                  {type === 'personal' ? 'Create' : 'Next'} <FaArrowRight />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && type === 'group' && (
            <motion.div
              key="step3"
              className="step-content"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
            >
              <h2>Add Members</h2>
              <div className="input-group">
                <label>Invite by name or email</label>
                <div className="add-member-row">
                  <input
                    type="text"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Name"
                  />
                  <button className="add-btn" onClick={handleAddMember}><FaPlus /></button>
                </div>
              </div>

              <div className="members-list">
                {members.map((m, i) => (
                  <span key={i} className="member-tag">
                    {m} <button onClick={() => setMembers(members.filter((_, idx) => idx !== i))}>&times;</button>
                  </span>
                ))}
                {members.length === 0 && <p className="empty-hint">No members added yet.</p>}
              </div>

              <div className="step-actions">
                 <button className="back-btn" onClick={() => setStep(2)}>
                  <FaArrowLeft /> Back
                </button>
                <button className="next-btn primary" onClick={handleSubmit}>
                  Create Group <FaCheck />
                </button>
              </div>
            </motion.div>
          )}

           {/* Handle Personal Finish on Step 3 (Logic fix: Step 2 'Create' should trigger submit, but if we want consistent steps...) */}
           {step === 3 && type === 'personal' && (
              // If we arrived here, just submit or show a confirmation.
              // For simplicity, let's assume Step 2's "Create" button for personal calls handleSubmit directly or we redirect logic.
              // To keep it clean, let's just auto-submit or show a success state.
              <motion.div
                key="step3-personal"
                className="step-content centered"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="success-icon"><FaCheck /></div>
                <h2>Ready to go!</h2>
                <button className="next-btn primary" onClick={handleSubmit}>
                  Enter Dashboard
                </button>
              </motion.div>
           )}

        </AnimatePresence>
      </motion.div>
    </div>
  )
}

function FaPlus() {
    return <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z"></path></svg>;
}

export default CreateGroup
