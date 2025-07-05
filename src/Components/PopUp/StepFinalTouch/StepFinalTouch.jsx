import React, { useRef } from 'react'
import { FaRobot, FaPaperclip, FaMagic } from 'react-icons/fa'
import './StepFinalTouch.css'

const AI_PATTERNS = {
  groceries: 'monthly',
  rent: 'monthly',
  gym: 'monthly',
  netflix: 'monthly',
  salary: 'monthly',
  transport: 'weekly',
}

function getAISuggestedPattern(category) {
  if (!category) return null
  const key = category.toLowerCase()
  return AI_PATTERNS[key] || null
}

function getAILocationHint(category) {
  if (!category) return ''
  if (category.toLowerCase().includes('lidl')) return 'Lidl Supermarkt'
  if (category.toLowerCase().includes('rent')) return 'Home'
  if (category.toLowerCase().includes('gym')) return 'Your Gym'
  if (category.toLowerCase().includes('restaurant'))
    return 'Your Favourite Restaurant'
  return ''
}

function StepFinalTouch({ form, errors, onChange }) {
  const aiRecurringPattern = getAISuggestedPattern(form.category)
  const aiLocationHint = getAILocationHint(form.category)
  const showAIRecurring =
    !form.recurring && !!aiRecurringPattern && !form.attachment
  const showAILocation =
    !form.location && !!aiLocationHint && !form.attachment && !showAIRecurring

  const fileInputRef = useRef(null)
  const attachmentName = form.attachment?.name || ''

  // File preview for images/PDFs
  const renderAttachmentPreview = () => {
    if (!form.attachment) return null
    const type = form.attachment.type
    const url = URL.createObjectURL(form.attachment)
    if (type.startsWith('image/')) {
      return (
        <div className="file-preview">
          <img src={url} alt="attachment" />
        </div>
      )
    }
    if (type === 'application/pdf') {
      return (
        <div className="file-preview">
          <embed src={url} type="application/pdf" width="100%" height="110px" />
        </div>
      )
    }
    return (
      <span className="attachment-preview">
        <FaPaperclip /> {attachmentName}
      </span>
    )
  }

  return (
    <div className="step-final-touch-container">
      {/* --- AI Banners (Tips) --- */}
      {showAIRecurring && (
        <div className="ai-banner animate-pop">
          <FaRobot size={18} style={{ marginRight: 8 }} />
          <span>
            <strong>Tip:</strong> Most users set <b>{form.category}</b> as{' '}
            <b>{aiRecurringPattern}</b> recurring.
            <button
              className="ai-quick-btn"
              type="button"
              onClick={() =>
                onChange({
                  target: {
                    name: 'recurring',
                    type: 'checkbox',
                    checked: true,
                  },
                })
              }
            >
              Make Recurring
            </button>
          </span>
        </div>
      )}

      {showAILocation && (
        <div className="ai-banner animate-glow">
          <FaMagic style={{ marginRight: 7, color: '#bb21ff' }} />
          <span>
            <strong>Tip:</strong> Try <b>{aiLocationHint}</b> as a location.
            <button
              className="ai-quick-btn"
              type="button"
              onClick={() =>
                onChange({
                  target: {
                    name: 'location',
                    value: aiLocationHint,
                  },
                })
              }
            >
              Use
            </button>
          </span>
        </div>
      )}

      {/* --- Location Field --- */}
      <label>
        Location:
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={onChange}
          autoComplete="address-line1"
          placeholder={aiLocationHint || 'e.g. Amsterdam, Lidl Supermarkt'}
        />
        {errors.location && <span className="error">{errors.location}</span>}
      </label>

      {/* --- Recurring --- */}
      <div style={{ margin: '16px 0 10px 0' }}>
        <label style={{ display: 'block', alignItems: 'center' }}>
          <input
            type="checkbox"
            name="recurring"
            checked={form.recurring}
            onChange={onChange}
          />
          <strong style={{ marginLeft: 8 }}>
            Make this a recurring expense
          </strong>
        </label>
        {form.recurring && (
          <div className="recurring-panel ai-slidein">
            <label>
              Pattern:
              <select
                name="recurringType"
                value={form.recurringType || aiRecurringPattern || 'monthly'}
                onChange={onChange}
                style={{ marginLeft: 8 }}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every 2 Weeks</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label style={{ display: 'block', marginTop: 8 }}>
              Start Date:
              <input
                type="date"
                name="recurringStart"
                value={form.recurringStart || form.date || ''}
                onChange={onChange}
                style={{ marginLeft: 8 }}
              />
            </label>
            <span className="ai-tip" style={{ fontSize: 13, marginTop: 5 }}>
              <FaRobot style={{ marginRight: 2 }} />
              Recurring expenses are auto-added by <b>FinBuddy AI</b>.
            </span>
          </div>
        )}
      </div>

      {/* --- Attachment Upload with Custom Button --- */}
      <label>
        Attachment:
        <label className="custom-file-label" htmlFor="fileUpload">
          <FaPaperclip style={{ color: '#2253f0' }} />
          {attachmentName ? 'Change file' : 'Choose file'}
        </label>
        <input
          type="file"
          id="fileUpload"
          name="attachment"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={onChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        {renderAttachmentPreview()}
        {errors.attachment && (
          <span className="error">{errors.attachment}</span>
        )}
      </label>
    </div>
  )
}

export default StepFinalTouch
