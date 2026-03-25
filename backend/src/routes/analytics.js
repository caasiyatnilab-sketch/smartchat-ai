import express from 'express';
import db from '../models/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get analytics overview
router.get('/overview', (req, res) => {
  try {
    // Get user's chatbots
    const chatbots = db.prepare(`
      SELECT id FROM chatbots WHERE user_id = ?
    `).all(req.user.id);

    const chatbotIds = chatbots.map(c => c.id);

    if (chatbotIds.length === 0) {
      return res.json({
        total_chatbots: 0,
        total_conversations: 0,
        total_messages: 0,
        active_visitors: 0,
        avg_satisfaction: null,
        messages_today: 0,
        conversations_today: 0
      });
    }

    const placeholders = chatbotIds.map(() => '?').join(',');

    // Total conversations
    const totalConversations = db.prepare(`
      SELECT COUNT(*) as count FROM conversations WHERE chatbot_id IN (${placeholders})
    `).get(...chatbotIds).count;

    // Total messages
    const totalMessages = db.prepare(`
      SELECT COUNT(*) as count FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.chatbot_id IN (${placeholders})
    `).get(...chatbotIds).count;

    // Active conversations
    const activeVisitors = db.prepare(`
      SELECT COUNT(*) as count FROM conversations 
      WHERE chatbot_id IN (${placeholders}) AND status = 'active'
    `).get(...chatbotIds).count;

    // Average satisfaction
    const satisfaction = db.prepare(`
      SELECT AVG(satisfaction_score) as avg FROM conversations 
      WHERE chatbot_id IN (${placeholders}) AND satisfaction_score IS NOT NULL
    `).get(...chatbotIds).avg;

    // Today's stats
    const today = new Date().toISOString().split('T')[0];
    
    const messagesToday = db.prepare(`
      SELECT COUNT(*) as count FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.chatbot_id IN (${placeholders}) 
      AND DATE(m.created_at) = ?
    `).get(...chatbotIds, today).count;

    const conversationsToday = db.prepare(`
      SELECT COUNT(*) as count FROM conversations 
      WHERE chatbot_id IN (${placeholders}) 
      AND DATE(started_at) = ?
    `).get(...chatbotIds, today).count;

    res.json({
      total_chatbots: chatbotIds.length,
      total_conversations: totalConversations,
      total_messages: totalMessages,
      active_visitors: activeVisitors,
      avg_satisfaction: satisfaction ? Math.round(satisfaction * 10) / 10 : null,
      messages_today: messagesToday,
      conversations_today: conversationsToday
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// Get conversation metrics
router.get('/conversations', (req, res) => {
  try {
    const { days = 7 } = req.query;

    const chatbots = db.prepare(`
      SELECT id FROM chatbots WHERE user_id = ?
    `).all(req.user.id);

    const chatbotIds = chatbots.map(c => c.id);

    if (chatbotIds.length === 0) {
      return res.json([]);
    }

    const placeholders = chatbotIds.map(() => '?').join(',');

    const metrics = db.prepare(`
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as conversations,
        SUM(CASE WHEN status = 'ended' THEN 1 ELSE 0 END) as ended,
        AVG(satisfaction_score) as avg_satisfaction
      FROM conversations 
      WHERE chatbot_id IN (${placeholders})
        AND started_at >= DATE('now', '-${days} days')
      GROUP BY DATE(started_at)
      ORDER BY date ASC
    `).all(...chatbotIds);

    res.json(metrics);
  } catch (error) {
    console.error('Conversation metrics error:', error);
    res.status(500).json({ error: 'Failed to get conversation metrics' });
  }
});

// Get message volume
router.get('/messages', (req, res) => {
  try {
    const { hours = 24 } = req.query;

    const chatbots = db.prepare(`
      SELECT id FROM chatbots WHERE user_id = ?
    `).all(req.user.id);

    const chatbotIds = chatbots.map(c => c.id);

    if (chatbotIds.length === 0) {
      return res.json([]);
    }

    const placeholders = chatbotIds.map(() => '?').join(',');

    const messages = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00', m.created_at) as hour,
        COUNT(*) as count,
        SUM(CASE WHEN m.role = 'user' THEN 1 ELSE 0 END) as user_messages,
        SUM(CASE WHEN m.role = 'assistant' THEN 1 ELSE 0 END) as bot_messages
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE c.chatbot_id IN (${placeholders})
        AND m.created_at >= DATETIME('now', '-${hours} hours')
      GROUP BY hour
      ORDER BY hour ASC
    `).all(...chatbotIds);

    res.json(messages);
  } catch (error) {
    console.error('Message volume error:', error);
    res.status(500).json({ error: 'Failed to get message volume' });
  }
});

// Get top chatbots by activity
router.get('/chatbots', (req, res) => {
  try {
    const chatbots = db.prepare(`
      SELECT 
        ch.id,
        ch.name,
        COUNT(c.id) as total_conversations,
        SUM(CASE WHEN c.status = 'active' THEN 1 ELSE 0 END) as active,
        AVG(c.satisfaction_score) as avg_satisfaction
      FROM chatbots ch
      LEFT JOIN conversations c ON ch.id = c.chatbot_id
      WHERE ch.user_id = ?
      GROUP BY ch.id
      ORDER BY total_conversations DESC
      LIMIT 10
    `).all(req.user.id);

    res.json(chatbots);
  } catch (error) {
    console.error('Chatbot stats error:', error);
    res.status(500).json({ error: 'Failed to get chatbot stats' });
  }
});

export default router;