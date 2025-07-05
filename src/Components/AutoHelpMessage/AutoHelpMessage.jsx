// src/Components/AutoHelpMessage/AutoHelpMessage.jsx
import React from 'react'

function AutoHelpMessage({ message }) {
  return (
    <div className="auto-help-message">
      <h4>Need a hand?</h4>
      <p>{message}</p>
      <small>Tip: Double-check everyone’s share matches the total.</small>
    </div>
  )
}

export default AutoHelpMessage
