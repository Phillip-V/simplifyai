require('dotenv').config();

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

app.post('/explain', async (req, res) => {
  const { text, level } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  const levelInstructions = {
    simple: 'Explain this as if talking to a 12-year-old. Use very short sentences, everyday words, and a friendly tone. Avoid all jargon.',
    normal: 'Explain this clearly in plain English for an everyday adult. Be concise, friendly, and easy to understand.',
    detailed: 'Give a thorough explanation covering all key concepts and important details. Keep it clear and jargon-free.'
  };

  const prompt = `${levelInstructions[level] || levelInstructions.normal}

Text to explain:
"""
${text}
"""

Give a clear explanation in short paragraphs.`;

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({ explanation: message.content[0].text });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.listen(3000, () => {
  console.log('SimplifyAI running at http://localhost:3000');
});