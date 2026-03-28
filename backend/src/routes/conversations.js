import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/:chatbotId/chat', optionalAuth, async (req, res) => {
  try {
    const { chatbotId } = req.params;
    const { message, visitor_id, visitor_name, visitor_email } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const chatbot = db.prepare('SELECT * FROM chatbots WHERE id = ? AND is_active = 1').get(chatbotId);
    if (!chatbot) return res.status(404).json({ error: 'Chatbot not found' });

    const visitorId = visitor_id || uuidv4();
    let conversation = db.prepare('SELECT * FROM conversations WHERE chatbot_id = ? AND visitor_id = ? AND status = "active" ORDER BY started_at DESC LIMIT 1').get(chatbotId, visitorId);
    if (!conversation) {
      const convId = uuidv4();
      db.prepare('INSERT INTO conversations (id, chatbot_id, visitor_id, visitor_name, visitor_email) VALUES (?, ?, ?, ?, ?)').run(convId, chatbotId, visitorId, visitor_name || null, visitor_email || null);
      conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId);
    }

    db.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, "user", ?)').run(uuidv4(), conversation.id, message);

    const response = await generateAIResponse(message, chatbot);

    db.prepare('INSERT INTO messages (id, conversation_id, role, content) VALUES (?, ?, "assistant", ?)').run(uuidv4(), conversation.id, response);
    db.prepare('INSERT INTO analytics (id, chatbot_id, event_type, event_data) VALUES (?, ?, "message", ?)').run(uuidv4(), chatbotId, JSON.stringify({ conversation_id: conversation.id }));

    res.json({ response });
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function generateAIResponse(message, chatbot) {
  const kb = JSON.parse(chatbot.knowledge_base || '[]');
  const rule = generateRuleBasedResponse(message, chatbot);
  if (rule !== chatbot.fallback_message) return rule;
  if (process.env.GROQ_API_KEY) { try { const r = await generateWithGroq(message, chatbot); if (r) return r; } catch(e) {} }
  if (process.env.OPENROUTER_API_KEY) { try { const r = await generateWithOpenRouter(message, chatbot); if (r) return r; } catch(e) {} }
  if (process.env.HF_TOKEN) { try { const r = await generateWithHuggingFace(message, chatbot); if (r) return r; } catch(e) {} }
  return chatbot.fallback_message;
}

async function generateWithGroq(message, chatbot) {
  const kb = JSON.parse(chatbot.knowledge_base || '[]');
  const system = `You are "${chatbot.name}", a helpful assistant.${chatbot.description ? ' '+chatbot.description : ''}\nKnowledge:\n${kb.map(k=>`Q: ${k.question}\nA: ${k.answer}`).join('\n')}\nIf unsure say: ${chatbot.fallback_message}`;
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.GROQ_API_KEY}`}, body:JSON.stringify({model:'llama-3.1-8b-instant',messages:[{role:'system',content:system},{role:'user',content:message}],max_tokens:500,temperature:0.7}) });
  if (!res.ok) return null; const d = await res.json(); return d.choices?.[0]?.message?.content || null;
}

async function generateWithOpenRouter(message, chatbot) {
  const kb = JSON.parse(chatbot.knowledge_base || '[]');
  const system = `You are "${chatbot.name}", a helpful assistant.${chatbot.description ? ' '+chatbot.description : ''}\nKnowledge:\n${kb.map(k=>`Q: ${k.question}\nA: ${k.answer}`).join('\n')}\nIf unsure say: ${chatbot.fallback_message}`;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENROUTER_API_KEY}`}, body:JSON.stringify({model:'nvidia/nemotron-3-super-120b-a12b:free',messages:[{role:'system',content:system},{role:'user',content:message}],max_tokens:500}) });
  if (!res.ok) return null; 
  const d = await res.json();
  // Handle OpenRouter's response format - some models put answer in reasoning, some in message.content
  if (d.choices?.[0]?.message?.content) {
    return d.choices[0].message.content;
  } else if (d.choices?.[0]?.reasoning) {
    // Extract the actual answer from reasoning if needed
    return d.choices[0].reasoning;
  }
  return null;
}

async function generateWithHuggingFace(message, chatbot) {
  const kb = JSON.parse(chatbot.knowledge_base || '[]');
  const system = `You are "${chatbot.name}", a helpful assistant.${chatbot.description ? ' '+chatbot.description : ''}\nKnowledge:\n${kb.map(k=>`Q: ${k.question}\nA: ${k.answer}`).join('\n')}\nIf unsure say: ${chatbot.fallback_message}`;
  const res = await fetch('https://router.huggingface.co/v1/chat/completions', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.HF_TOKEN}`}, body:JSON.stringify({model:'meta-llama/Llama-3.1-8B-Instruct',messages:[{role:'system',content:system},{role:'user',content:message}],max_tokens:500}) });
  if (!res.ok) return null; 
  const d = await res.json();
  return d.choices?.[0]?.message?.content || null;
}

function generateRuleBasedResponse(message, chatbot) {
  const kb = JSON.parse(chatbot.knowledge_base || '[]');
  const lower = message.toLowerCase();
  for (const item of kb) {
    const kws = item.question.toLowerCase().split(' ').filter(w => w.length > 3);
    if (kws.some(kw => lower.includes(kw))) return item.answer;
  }
  return chatbot.fallback_message;
}

export default router;
