// proxy.js
import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import fetch from 'node-fetch'

const app = express()
app.use(cors())
app.use(bodyParser.json())

app.post('/ollama/chat', async (req, res) => {
  const ollamaRes = await fetch('http://localhost:11434/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  })
  const data = await ollamaRes.json()
  res.json(data)
})

app.listen(5174, () => {
  console.log('Proxy running on http://localhost:5174')
})
