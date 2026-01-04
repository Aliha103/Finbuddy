import { useEffect, useState, useRef } from 'react'

export interface DropoffEvent {
  step: number
  action: string
  [key: string]: any
}

interface HelpStats {
  shown: number
  lastStep: number | null
  totalMs: number
}

interface UseAIDropoffHelpOptions {
  autoTimeout?: number
}

/**
 * useAIDropoffHelp (Pro)
 * AI-powered help hook for drop-off prevention with learning and analytics.
 */
export function useAIDropoffHelp({ autoTimeout = 12000 }: UseAIDropoffHelpOptions = {}) {
  const [showHelp, setShowHelp] = useState(false)
  const [dropoffEvent, setDropoffEvent] = useState<DropoffEvent | null>(null)
  const [helpStats, setHelpStats] = useState<HelpStats>(() => ({
    shown: 0,
    lastStep: null,
    totalMs: 0,
  }))
  const helpTimer = useRef<NodeJS.Timeout | undefined>(undefined)
  const helpStart = useRef<number | null>(null)
  const learnedSteps = useRef(new Set<string>())

  // Listen for AI dropoff event
  useEffect(() => {
    function onHelpEvent(e: Event) {
      const customEvent = e as CustomEvent<DropoffEvent>
      const event = customEvent.detail

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
