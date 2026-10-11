import React, { useState, useEffect } from 'react'
import { FaTimes, FaReceipt, FaMagic } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { Expense } from '../../types'
import './AddExpensePopup.css'

interface AddExpensePopupProps {
  onClose: () => void
  onAdd: (expense: Expense) => void
}

function AddExpensePopup({ onClose, onAdd }: AddExpensePopupProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  // Simulate AI category suggestion
  useEffect(() => {
    if (description.toLowerCase().includes('uber') || description.toLowerCase().includes('train')) {
      setAiSuggestion('Transport')
    } else if (description.toLowerCase().includes('lunch') || description.toLowerCase().includes('coffee')) {
      setAiSuggestion('Food & Drink')
    } else {
      setAiSuggestion(null)
    }
  }, [description])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    // Simulate API delay
    setTimeout(() => {
      const newExpense: Expense = {
        id: Math.random().toString(36).substr(2, 9),
        amount: parseFloat(amount),
        currency: 'EUR',
        category: aiSuggestion || category,
        description,
        date: new Date().toISOString(),
        paidBy: 'You',
        participants: ['You'],
        splitMethod: 'equal',
        recurring: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      onAdd(newExpense)
      setIsProcessing(false)
    }, 800)
  }

  return (
    <div className="popup-overlay">
      <motion.div
        className="popup-container"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <button className="close-btn" onClick={onClose}><FaTimes /></button>

        <div className="popup-header">
          <div className="header-icon">
            <FaReceipt />
          </div>
          <h2>Add Expense</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group amount-group">
            <label>Amount</label>
            <div className="amount-input-wrapper">
              <span className="currency-symbol">€</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What was this for?"
              required
            />
          </div>

          <div className="form-group">
            <label className="label-with-action">
              Category
              {aiSuggestion && (
                <button
                  type="button"
                  className="ai-suggestion-badge"
                  onClick={() => setCategory(aiSuggestion)}
                >
                  <FaMagic /> AI Suggests: {aiSuggestion}
                </button>
              )}
            </label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="General">General</option>
              <option value="Food & Drink">Food & Drink</option>
              <option value="Transport">Transport</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Utilities">Utilities</option>
            </select>
          </div>

          <button type="submit" className="submit-btn" disabled={isProcessing}>
            {isProcessing ? 'Adding...' : 'Add Expense'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}

export default AddExpensePopup
