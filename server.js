require('dotenv').config();

const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(express.json());
app.use(express.static('public'));

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// CHECK AND UPDATE USAGE
async function checkUsage(userId) {
  const today = new Date().toISOString().split('T')[0];

  // Get user usage record
  const { data, error } = await supabase
    .from('usage')
    .select('*')
    .eq('user_id', userId)
    .single();

  // No record yet — create one
  if (!data) {
    await supabase.from('usage').insert({
      user_id: userId,
      explanation_count: 1,
      last_reset: today
    });
    return { allowed: true, remaining: 9 };
  }

  // Reset count if it is a new day
  if (data.last_reset !== today) {
    await supabase.from('usage').update({
      explanation_count: 1,
      last_reset: today
    }).eq('user_id', userId);
    return { allowed: true, remaining: 9 };
  }

  // Check if limit reached
  if (data.explanation_count >= 10) {
    return { allowed: false, remaining: 0 };
  }

  // Increment count
  await supabase.from('usage').update({
    explanation_count: data.explanation_count + 1
  }).eq('user_id', userId);

  return {
    allowed: true,
    remaining: 10 - (data.explanation_count + 1)
  };
}

// EXPLAIN ROUTE
app.post('/explain', async (req, res) => {
  const { text, level, userId } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  if (!userId) {
    return res.status(401).json({ error: 'Please log in to use SimplifyAI.' });
  }

  // Check usage limit
  const usage = await checkUsage(userId);

  if (!usage.allowed) {
    return res.status(429).json({
      error: 'You have used all 10 free explanations for today. Come back tomorrow for more free explanations.'
    });
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
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    res.json({
      explanation: message.content[0].text,
      remaining: usage.remaining
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.listen(3000, () => {
  console.log('SimplifyAI running at http://localhost:3000');
});