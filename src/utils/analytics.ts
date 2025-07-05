// src/utils/analytics.ts
import type { AnalyticsEvent, ExpenseFormData } from '../types'
import { STORAGE_KEYS } from '../constants'

function getSessionId(): string {
  if (typeof Storage === 'undefined') {
    return 'no-storage-' + Math.random().toString(36).slice(2)
  }
  let id = sessionStorage.getItem(STORAGE_KEYS.ANALYTICS_SESSION)
  if (!id) {
    id = Math.random().toString(36).slice(2) + '-' + Date.now()
    sessionStorage.setItem(STORAGE_KEYS.ANALYTICS_SESSION, id)
  }
  return id
}

interface HistoryEvent {
  step: number
  action: string
  timestamp: string
  fieldsFilled: number
  timeSpent: number
  isGroup: boolean
  recurring: boolean
}

interface DropoffPredictionParams {
  action: string
  fieldsFilled: number
  history: HistoryEvent[]
}

interface LogStepEventParams {
  step: number
  action: string
  form?: Partial<ExpenseFormData>
  maxStep?: number
}

function pushToHistory(event: HistoryEvent): HistoryEvent[] {
  if (typeof Storage === 'undefined') {
    return [event]
  }
  
  const stored = sessionStorage.getItem(STORAGE_KEYS.ANALYTICS_HISTORY)
  let history: HistoryEvent[] = []
  
  try {
    history = stored ? JSON.parse(stored) : []
  } catch (error) {
    console.warn('Failed to parse analytics history:', error)
    history = []
  }
  
  history.push(event)
  sessionStorage.setItem(STORAGE_KEYS.ANALYTICS_HISTORY, JSON.stringify(history))
  return history
}

function aiDropoffPredict({ action, fieldsFilled, history = [] }: DropoffPredictionParams): boolean {
  const backCount = history.filter((e) => e.action === 'back').length
  const failCount = history.filter((e) =>
    e.action?.startsWith('validation_failed'),
  ).length
  
  if (
    action === 'close' &&
    (fieldsFilled < 2 || backCount > 2 || failCount > 2)
  ) {
    return true
  }
  
  if (action === 'validation_failed' && fieldsFilled < 2) {
    return true
  }
  
  if (failCount >= 3) {
    return true
  }
  
  return false
}

export function logStepEvent({ 
  step, 
  action, 
  form = {}, 
  maxStep = 3 
}: LogStepEventParams): void {
  const sessionId = getSessionId()
  const timestamp = new Date().toISOString()
  const participants = (form.participants || '').split(',').filter(Boolean)
  const isGroup = participants.length > 0
  const fieldsFilled = Object.values(form).filter(
    (v) => v && typeof v === 'string' && v.trim().length > 0,
  ).length

  // Time spent tracking (per step)
  let timeSpent = 0
  if (typeof Storage !== 'undefined') {
    const lastTimeStr = sessionStorage.getItem(STORAGE_KEYS.ANALYTICS_LAST_TIME)
    const lastTime = lastTimeStr ? Number(lastTimeStr) : Date.now()
    const now = Date.now()
    timeSpent = now - lastTime
    sessionStorage.setItem(STORAGE_KEYS.ANALYTICS_LAST_TIME, now.toString())
  }

  // Pull full session event history
  const historyEvent: HistoryEvent = {
    step,
    action,
    timestamp,
    fieldsFilled,
    timeSpent,
    isGroup,
    recurring: !!form.recurring,
  }
  
  const history = pushToHistory(historyEvent)

  const event: AnalyticsEvent = {
    eventType: 'AddExpensePopupEvent',
    sessionId,
    step,
    maxStep,
    action,
    timestamp,
    isGroup,
    participants,
    recurring: !!form.recurring,
    attachment: !!form.attachment,
    fieldsFilled,
    timeSpent,
    historyLength: history.length,
    aiDropoffLikely: aiDropoffPredict({ action, fieldsFilled, history }),
  }

  if (event.aiDropoffLikely) {
    // Trigger the AI in-app help popup!
    const customEvent = new CustomEvent('finbuddy-ai-help', { detail: event })
    window.dispatchEvent(customEvent)
    console.warn('[AI-Analytics] 🚨 Possible Drop-off Detected:', event)
  } else {
    console.log('[Analytics]', event)
  }
  
  // TODO: Send to your server/API endpoint as needed
  if (import.meta.env.VITE_DEBUG_ANALYTICS === 'true') {
    console.log('[Analytics Debug]', event)
  }
}
