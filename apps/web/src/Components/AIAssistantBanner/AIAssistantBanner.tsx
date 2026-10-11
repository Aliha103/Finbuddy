// src/Components/AIAssistantBanner/AIAssistantBanner.tsx
import React from 'react'
import { useRecoilValue } from 'recoil'
import { aiTipState, aiErrorState, aiLoadingState } from '../../state/ai'
import { motion, AnimatePresence } from 'framer-motion'

export default function AIAssistantBanner() {
  const tip = useRecoilValue(aiTipState)
  const error = useRecoilValue(aiErrorState)
  const loading = useRecoilValue(aiLoadingState)
  return (
    <div className="dashboard-system-status-banner" aria-live="polite" tabIndex={0}>
      <AnimatePresence>
        {loading && (
          <motion.div key="ai-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <span role="img" aria-label="Thinking" style={{ marginRight: 8 }}>
              🤖
            </span>
            AI is analyzing your data…
          </motion.div>
        )}
        {tip && !loading && (
          <motion.div
            key="ai-tip"
            className="dashboard-ai-tip-banner"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, type: 'spring' }}
            tabIndex={0}
            aria-live="polite"
            role="status"
          >
            <span role="img" aria-label="AI Lightbulb" style={{ marginRight: 8 }}>
              💡
            </span>
            {tip}
          </motion.div>
        )}
        {error && !loading && (
          <motion.div
            key="ai-error"
            className="dashboard-ai-tip-error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            role="alert"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
