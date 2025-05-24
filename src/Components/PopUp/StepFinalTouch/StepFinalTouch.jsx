import React from 'react'
import { FaRobot, FaPaperclip, FaCalendarAlt } from 'react-icons/fa'

function StepFinalTouch({ form, errors, onChange }) {
  // Show attachment preview if any
  const attachmentName = form.attachment?.name || ''

  // "AI" example: Next-level suggestion based on common user patterns
  const aiRecurringSuggestion =
    form.category?.toLowerCase() === 'groceries' && !form.recurring

  return (
    <div className="step-final-touch-container">
      {/* AI smart banner */}
      {aiRecurringSuggestion && (
        <div className="ai-banner">
          <FaRobot size={18} style={{ marginRight: 8 }} />
          <span>
            <strong>AI Suggestion:</strong> You often make <b>Groceries</b>{' '}
            recurring. Want to automate this?
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
              Yes, automate
            </button>
          </span>
        </div>
      )}

      <label>
        Location:
        <input
          type="text"
          name="location"
          value={form.location}
          onChange={onChange}
          autoComplete="address-line1"
          placeholder="e.g. Amsterdam, Lidl Supermarkt"
        />
        {errors.location && <span className="error">{errors.location}</span>}
      </label>

      {/* Recurring as a real feature */}
      <div style={{ margin: '16px 0' }}>
        <label style={{ display: 'block' }}>
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
          <div className="recurring-panel">
            <label>
              Recurrence pattern:
              <select
                name="recurringType"
                value={form.recurringType || 'monthly'}
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
            {/* You can add an End Date or "repeat N times" field here */}
            <span style={{ fontSize: 12, color: '#888' }}>
              Recurring expenses are auto-added by FinBuddy AI.{' '}
              <span role="img" aria-label="magic">
                ✨
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Attachment with preview */}
      <label>
        Attachment:
        <div className="attachment-input-wrapper">
          <input
            type="file"
            name="attachment"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={onChange}
          />
          <FaPaperclip style={{ marginLeft: 7, color: '#2253f0' }} />
        </div>
        {attachmentName && (
          <span className="attachment-preview">
            <FaPaperclip /> {attachmentName}
          </span>
        )}
        {errors.attachment && (
          <span className="error">{errors.attachment}</span>
        )}
      </label>
    </div>
  )
}

export default StepFinalTouch
