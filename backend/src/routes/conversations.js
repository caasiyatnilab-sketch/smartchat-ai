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

    // Generate AI response
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

// Authenticated: List conversations
router.get('/', authenticate, (req, res) => {
  try {
    const conversations = db.prepare(`
      SELECT c.*, ch.name as chatbot_name
      FROM conversations c
      JOIN chatbots ch ON c.chatbot_id = ch.id
      WHERE ch.user_id = ?
      ORDER BY c.started_at DESC
      LIMIT 50
    `).all(req.user.id);

    res.json(conversations);
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

// Authenticated: Get conversation details
router.get('/:id', authenticate, (req, res) => {
  try {
    const conversation = db.prepare(`
      SELECT c.*, ch.name as chatbot_name
      FROM conversations c
      JOIN chatbots ch ON c.chatbot_id = ch.id
      WHERE c.id = ? AND ch.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = db.prepare(`
      SELECT * FROM messages 
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `).all(req.params.id);

    res.json({ ...conversation, messages });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// Authenticated: Update conversation (e.g., set satisfaction, end conversation)
router.patch('/:id', authenticate, (req, res) => {
  try {
    const { status, satisfaction_score } = req.body;

    const conversation = db.prepare(`
      SELECT c.* FROM conversations c
      JOIN chatbots ch ON c.chatbot_id = ch.id
      WHERE c.id = ? AND ch.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    db.prepare(`
      UPDATE conversations 
      SET status = COALESCE(?, status),
          satisfaction_score = COALESCE(?, satisfaction_score),
          ended_at = CASE WHEN ? = 'ended' THEN CURRENT_TIMESTAMP ELSE ended_at END
      WHERE id = ?
    `).run(status, satisfaction_score, status, req.params.id);

    const updated = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ error: 'Failed to update conversation' });
  }
});

// AI Response generation
async function generateAIResponse(message, chatbot) {
  // Check if OpenAI API key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Fallback to rule-based responses
    return generateRuleBasedResponse(message, chatbot);
  }

  try {
    const knowledgeBase = JSON.parse(chatbot.knowledge_base || '[]');
    
    const systemPrompt = `You are a helpful customer support chatbot named "${chatbot.name}". 
${chatbot.description ? `Description: ${chatbot.description}` : ''}
Your knowledge base:
${knowledgeBase.map(kb => `Q: ${kb.question}\nA: ${kb.answer}`).join('\n\n')}

If you cannot find the answer in the knowledge base, respond with: ${chatbot.fallback_message}

Be friendly, concise, and helpful.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
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

    const data = await response.json();
    return data.choices?.[0]?.message?.content || chatbot.fallback_message;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return generateRuleBasedResponse(message, chatbot);
  }
}

// Rule-based fallback
function generateRuleBasedResponse(message, chatbot) {
  const knowledgeBase = JSON.parse(chatbot.knowledge_base || '[]');
  const lowerMessage = message.toLowerCase();

  // Simple keyword matching
  for (const kb of knowledgeBase) {
    const keywords = kb.question.toLowerCase().split(' ');
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return kb.answer;
    }
  }

  return chatbot.fallback_message;
}

export default router;