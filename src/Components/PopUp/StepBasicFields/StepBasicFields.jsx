import { useState } from 'react'
import './StepBasicFields.css'

const categorySuggestions = [
  'Groceries',
  'Rent',
  'Netflix',
  'Dining Out',
  'Transport',
  'Travel',
  'Utilities',
  'Salary',
  'Gym',
  'Gift',
]
const descriptionSuggestions = [
  'Lunch with friends',
  'Monthly subscription',
  'Taxi fare',
  'Hotel booking',
  'Electricity bill',
]

function StepBasicFields({ form, errors, onChange }) {
  // --- AI and UX helpers ---
  const aiCategorySuggestion =
    form.category &&
    ['food', 'supermarket', 'grocery', 'eat', 'market'].some((kw) =>
      form.category.toLowerCase().includes(kw),
    ) &&
    !['groceries', 'dining out', 'restaurant'].includes(
      form.category.toLowerCase(),
    )

  const categoryAutoCompletes = categorySuggestions
    .filter(
      (s) =>
        form.category &&
        s.toLowerCase().startsWith(form.category.toLowerCase()) &&
        s.toLowerCase() !== form.category.toLowerCase(),
    )
    .slice(0, 3)

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  let dateHint = ''
  if (['today', 'now'].includes(form.date?.toLowerCase?.())) dateHint = today
  if (['yesterday'].includes(form.date?.toLowerCase?.())) dateHint = yesterday

  const descriptionAutoCompletes = descriptionSuggestions
    .filter(
      (s) =>
        form.description &&
        s.toLowerCase().startsWith(form.description.toLowerCase()),
    )
    .slice(0, 2)

  const aiCurrency = (form.amount + '').trim().startsWith('$')
    ? 'USD'
    : (form.amount + '').trim().startsWith('£')
    ? 'GBP'
    : undefined

  const recurringMatch = [
    'rent',
    'netflix',
    'salary',
    'subscription',
    'gym',
    'internet',
  ].some((kw) => form.category?.toLowerCase().includes(kw))

  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [showDescDropdown, setShowDescDropdown] = useState(false)

  return (
    <div className="step-basic-fields-container">
      {/* --- AI Category Suggestion Banner --- */}
      {aiCategorySuggestion && (
        <div className="ai-banner">
          <span>
            <strong>Smart Suggestion:</strong> Did you mean{' '}
            <button
              type="button"
              className="ai-quick-btn"
              onClick={() =>
                onChange({ target: { name: 'category', value: 'Groceries' } })
              }
            >
              Groceries
            </button>{' '}
            or{' '}
            <button
              type="button"
              className="ai-quick-btn"
              onClick={() =>
                onChange({ target: { name: 'category', value: 'Dining Out' } })
              }
            >
              Dining Out
            </button>
            ?
          </span>
        </div>
      )}

      {/* --- Recurring Pattern Banner --- */}
      {recurringMatch && (
        <div
          className="ai-banner"
          style={{ background: '#e9fbf7', borderLeft: '4px solid #43e7a2' }}
        >
          <span>
            <strong>Recurring?</strong> This looks like a recurring expense.{' '}
            <span style={{ opacity: 0.7 }}>
              Consider marking as monthly or weekly.
            </span>
          </span>
        </div>
      )}

      {/* --- Amount and Currency in a Row --- */}
      <div className="amount-currency-row">
        <span>Amount & Currency:</span>
        <div className="amount-currency-fields">
          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={(e) => {
              if (aiCurrency && form.currency !== aiCurrency) {
                onChange({ target: { name: 'currency', value: aiCurrency } })
              }
              onChange(e)
            }}
            min="0"
            step="0.01"
            required
            aria-invalid={!!errors.amount}
            placeholder="e.g. 15.99"
            className={errors.amount ? 'input-error' : ''}
            autoFocus
          />
          <select
            name="currency"
            value={form.currency}
            onChange={onChange}
            className="currency-select"
          >
            <option value="EUR">€ EUR</option>
            <option value="USD">$ USD</option>
            <option value="GBP">£ GBP</option>
          </select>
        </div>
        {errors.amount && <span className="error">{errors.amount}</span>}
        {aiCurrency && (
          <span className="label-helper">Auto-selected: {aiCurrency}</span>
        )}
      </div>

      {/* --- Category (with offline auto-complete) --- */}
      <label style={{ position: 'relative' }}>
        Category:
        <input
          type="text"
          name="category"
          value={form.category}
          onChange={onChange}
          required
          aria-invalid={!!errors.category}
          placeholder="e.g. Groceries, Rent, Netflix"
          autoComplete="off"
          onFocus={() => setShowCatDropdown(true)}
          onBlur={() => setTimeout(() => setShowCatDropdown(false), 120)}
          className={errors.category ? 'input-error' : ''}
        />
        {showCatDropdown && categoryAutoCompletes.length > 0 && (
          <div className="ai-dropdown">
            {categoryAutoCompletes.map((cat) => (
              <div
                key={cat}
                className="ai-dropdown-option"
                onMouseDown={() =>
                  onChange({ target: { name: 'category', value: cat } })
                }
              >
                {cat}
              </div>
            ))}
          </div>
        )}
        {errors.category && <span className="error">{errors.category}</span>}
      </label>

      {/* --- Date with smart date hints --- */}
      <label>
        Date:
        <input
          type="date"
          name="date"
          value={form.date}
          onChange={onChange}
          required
          aria-invalid={!!errors.date}
          className={errors.date ? 'input-error' : ''}
        />
        {dateHint && (
          <span className="label-helper">
            Smart: Set to <b>{dateHint}</b>?
            <button
              type="button"
              className="ai-quick-btn"
              onClick={() =>
                onChange({ target: { name: 'date', value: dateHint } })
              }
            >
              Use
            </button>
          </span>
        )}
        {errors.date && <span className="error">{errors.date}</span>}
      </label>

      {/* --- Description (with offline auto-complete) --- */}
      <label style={{ position: 'relative' }}>
        Description:
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          rows={2}
          maxLength={150}
          placeholder="Add notes (optional)"
          onFocus={() => setShowDescDropdown(true)}
          onBlur={() => setTimeout(() => setShowDescDropdown(false), 120)}
        />
        {showDescDropdown && descriptionAutoCompletes.length > 0 && (
          <div className="ai-dropdown">
            {descriptionAutoCompletes.map((desc) => (
              <div
                key={desc}
                className="ai-dropdown-option"
                onMouseDown={() =>
                  onChange({ target: { name: 'description', value: desc } })
                }
              >
                {desc}
              </div>
            ))}
          </div>
        )}
      </label>

      {/* --- Participants --- */}
      <label>
        Participants{' '}
       
        <input
          type="text"
          name="participants"
          value={form.participants}
          onChange={onChange}
          aria-invalid={!!errors.participants}
          placeholder="Ali, Sara, Bob (leave blank for personal)"
          autoComplete="off"
          className={errors.participants ? 'input-error' : ''}
        />
        {errors.participants && (
          <span className="error">{errors.participants}</span>
        )}
      </label>
    </div>
  )
}

export default StepBasicFields
