import { useEffect, useState, useRef } from 'react'

/**
 * useAIDropoffHelp (Pro)
 * AI-powered help hook for drop-off prevention with learning and analytics.
 *
 * Returns:
 * - showHelp (bool): Should you show the help UI?
 * - dropoffEvent (object): Analytics event that triggered help.
 * - dismissHelp (function): Hide the help.
 * - helpStats (object): Stats about help frequency and timing.
 */
export function useAIDropoffHelp({ autoTimeout = 12000 } = {}) {
  const [showHelp, setShowHelp] = useState(false)
  const [dropoffEvent, setDropoffEvent] = useState(null)
  const [helpStats, setHelpStats] = useState(() => ({
    shown: 0,
    lastStep: null,
    totalMs: 0,
  }))
  const helpTimer = useRef()
  const helpStart = useRef(null)
  const learnedSteps = useRef(new Set()) // Steps where help was dismissed

  // Listen for AI dropoff event
  useEffect(() => {
    function onHelpEvent(e) {
      const event = e.detail
      // If already dismissed for this step, do NOT show again unless step/action changes
      const key = `${event.step}:${event.action}`
      if (learnedSteps.current.has(key)) return
      setDropoffEvent(event)
      setShowHelp(true)
      setHelpStats((prev) => ({
        ...prev,
        shown: prev.shown + 1,
        lastStep: event.step,
      }))
      helpStart.current = Date.now()
      if (autoTimeout) {
        clearTimeout(helpTimer.current)
        helpTimer.current = setTimeout(dismissHelp, autoTimeout)
      }
    }
    window.addEventListener('finbuddy-ai-help', onHelpEvent)
    return () => {
      window.removeEventListener('finbuddy-ai-help', onHelpEvent)
      clearTimeout(helpTimer.current)
    }
    // eslint-disable-next-line
  }, [autoTimeout])

  // Dismiss and learn from user action
  function dismissHelp() {
    setShowHelp(false)
    if (dropoffEvent) {
      // Learn: don't show again for this step/action unless new drop-off detected
      learnedSteps.current.add(`${dropoffEvent.step}:${dropoffEvent.action}`)
    }
    // Timing
    if (helpStart.current) {
      setHelpStats((prev) => ({
        ...prev,
        totalMs: prev.totalMs + (Date.now() - helpStart.current),
      }))
    }
    setDropoffEvent(null)
    helpStart.current = null
    clearTimeout(helpTimer.current)
  }

  return { showHelp, dropoffEvent, dismissHelp, helpStats }
}
