import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public: Chat with bot (no auth required)
router.post('/:chatbotId/chat', optionalAuth, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { message, visitor_id, visitor_name, visitor_email } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get chatbot
    const chatbot = db.prepare('SELECT * FROM chatbots WHERE id = ? AND is_active = 1').get(chatbotId);
    
    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot not found or inactive' });
    }

    // Get or create conversation
    let conversation;
    const visitorId = visitor_id || uuidv4();
    
    const existingConv = db.prepare(`
      SELECT * FROM conversations 
      WHERE chatbot_id = ? AND visitor_id = ? AND status = 'active'
      ORDER BY started_at DESC
      LIMIT 1
    `).get(chatbotId, visitorId);

    if (existingConv) {
      conversation = existingConv;
    } else {
      const convId = uuidv4();
      db.prepare(`
        INSERT INTO conversations (id, chatbot_id, visitor_id, visitor_name, visitor_email)
        VALUES (?, ?, ?, ?, ?)
      `).run(convId, chatbotId, visitorId, visitor_name || null, visitor_email || null);
      conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
    }

    // Save user message
    const userMsgId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, 'user', ?)
    `).run(userMsgId, conversation.id, message);

    // Generate AI response - try multiple providers
    const response = await generateAIResponse(message, chatbot);

    // Save bot response
    const botMsgId = uuidv4();
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content)
      VALUES (?, ?, 'assistant', ?)
    `).run(botMsgId, conversation.id, response);

    // Track analytics
    const analyticsId = uuidv4();
    db.prepare(`
      INSERT INTO analytics (id, chatbot_id, event_type, event_data)
      VALUES (?, ?, 'message', ?)
    `).run(analyticsId, chatbotId, JSON.stringify({ conversation_id: conversation.id }));

    res.json({
      response,
      conversation_id: conversation.id,
      visitor_id: visitorId
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// AI Response generation - tries multiple providers
async function generateAIResponse(message, chatbot) {
  const knowledgeBase = JSON.parse(chatbot.knowledge_base || '[]');
  
  // 1. Try rule-based first (always works)
  const ruleResponse = generateRuleBasedResponse(message, chatbot);
  if (ruleResponse !== chatbot.fallback_message) {
    return ruleResponse;
  }

  // 2. Try Hugging Face (free)
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const hfResponse = await generateWithHuggingFace(message, chatbot);
      if (hfResponse) return hfResponse;
    } catch (e) {
      console.error('HuggingFace error:', e.message);
    }
  }

  // 3. Try OpenAI (if key provided)
  if (process.env.OPENAI_API_KEY) {
    try {
      const openaiResponse = await generateWithOpenAI(message, chatbot);
      if (openaiResponse) return openaiResponse;
    } catch (e) {
      console.error('OpenAI error:', e.message);
    }
  }

  // 4. Try Cohere (free tier)
  if (process.env.COHERE_API_KEY) {
    try {
      const cohereResponse = await generateWithCohere(message, chatbot);
      if (cohereResponse) return cohereResponse;
    } catch (e) {
      console.error('Cohere error:', e.message);
    }
  }

  // Fallback
  return chatbot.fallback_message;
}

// Hugging Face Inference API (FREE)
async function generateWithHuggingFace(message, chatbot) {
  const knowledgeBase = JSON.parse(chatbot.knowledge_base || '[]');
  
  const prompt = `You are a helpful customer support assistant for "${chatbot.name}". 
${chatbot.description ? `Description: ${chatbot.description}` : ''}

Knowledge Base:
${knowledgeBase.map(kb => `Q: ${kb.question}\nA: ${kb.answer}`).join('\n\n')}

If you cannot find the answer, say: ${chatbot.fallback_message}

User: ${message}
Assistant:`;

  const response = await fetch(
    'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
    {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_length: 200 }
      })
    }
  );

  if (!response.ok) return null;
  
  const data = await response.json();
  if (Array.isArray(data) && data[0]?.generated_text) {
    const result = data[0].generated_text.split('Assistant:').pop().trim();
    return result.slice(-500); // Limit length
  }
  
  return null;
}

// OpenAI (paid but cheap)
async function generateWithOpenAI(message, chatbot) {
  const knowledgeBase = JSON.parse(chatbot.knowledge_base || '[]');
  
  const systemPrompt = `You are a helpful customer support chatbot named "${chatbot.name}". 
${chatbot.description ? `Description: ${chatbot.description}` : ''}

Knowledge Base:
${knowledgeBase.map(kb => `Q: ${kb.question}\nA: ${kb.answer}`).join('\n\n')}

If you cannot find the answer, say: ${chatbot.fallback_message}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) return null;
  
  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

// Cohere (free tier available)
async function generateWithCohere(message, chatbot) {
  const knowledgeBase = JSON.parse(chatbot.knowledge_base || '[]');
  
  const prompt = `You are a helpful customer support assistant for "${chatbot.name}".
${chatbot.description ? `Description: ${chatbot.description}\n` : ''}
Knowledge Base:
${knowledgeBase.map(kb => `Q: ${kb.question}\nA: ${kb.answer}`).join('\n\n')}

User question: ${message}
Helpful answer:`;

  const response = await fetch('https://api.cohere.ai/v1/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.COHERE_API_KEY}`
    },
    body: JSON.stringify({
      model: 'command-nightly',
      prompt,
      max_tokens: 200
    })
  });

  if (!response.ok) return null;
  
  const data = await response.json();
  return data.generations?.[0]?.text?.trim() || null;
}

// Rule-based fallback (always works)
function generateRuleBasedResponse(message, chatbot) {
  const knowledgeBase = JSON.parse(chatbot.knowledge_base || '[]');
  const lowerMessage = message.toLowerCase();

  // Simple keyword matching
  for (const kb of knowledgeBase) {
    const keywords = kb.question.toLowerCase().split(' ');
    if (keywords.some(keyword => keyword.length > 3 && lowerMessage.includes(keyword))) {
      return kb.answer;
    }
  }

  return chatbot.fallback_message;
}

export default router;