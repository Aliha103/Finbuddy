// src/hooks/useAIAssistant.ts
import { useRecoilState } from 'recoil'
import { aiTipState, aiErrorState, aiLoadingState } from '../state/ai'
import { fetchOllamaAITip } from '../utils/ollamaClient'

export function useAIAssistant() {
  const [aiTip, setAiTip] = useRecoilState(aiTipState)
  const [aiError, setAiError] = useRecoilState(aiErrorState)
  const [loading, setLoading] = useRecoilState(aiLoadingState)

  const getTip = async (context: string, question: string) => {
    setLoading(true)
    setAiError(null)
    try {
      const tip = await fetchOllamaAITip({ context, question })
      setAiTip(tip)
    } catch (err) {
      setAiError('AI failed to fetch suggestion. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return { aiTip, aiError, loading, getTip }
}
