// src/utils/ollamaClient.ts

export async function fetchOllamaAITip({
  context,
  question,
}: {
  context: string
  question: string
}): Promise<string> {
  const prompt = `
You are an AI financial assistant. Given the following context and user question, provide a short, helpful, self-healing suggestion or fix.
Context: ${context}
User question: ${question}
Response:`
  const ollamaUrl = import.meta.env.VITE_OLLAMA_API_URL || 'http://localhost:11434'
  const res = await fetch(`${ollamaUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: import.meta.env.VITE_OLLAMA_MODEL || 'llama3', // change to any model you've pulled with Ollama, e.g. 'phi3', 'mistral'
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful, self-healing AI for a finance dashboard.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 180,
      temperature: 0.4,
      stream: false,
    }),
  })
  if (!res.ok) throw new Error('Failed to fetch from Ollama')
  const json = await res.json()
  return json.choices[0].message.content.trim()
}
