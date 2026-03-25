import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// List all chatbots
router.get('/', (req, res) => {
  try {
    const chatbots = db.prepare(`
      SELECT id, name, description, welcome_message, fallback_message, 
             is_active, created_at, updated_at
      FROM chatbots 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json(chatbots);
  } catch (error) {
    console.error('List chatbots error:', error);
    res.status(500).json({ error: 'Failed to list chatbots' });
  }
});

// Create chatbot
router.post('/', (req, res) => {
  try {
    const { name, description, welcome_message, fallback_message, knowledge_base, settings } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO chatbots (id, user_id, name, description, welcome_message, fallback_message, knowledge_base, settings)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user.id,
      name,
      description || null,
      welcome_message || 'Hello! How can I help you today?',
      fallback_message || 'I\'m sorry, I didn\'t understand that. Can you rephrase?',
      knowledge_base || '[]',
      settings || '{}'
    );

    const chatbot = db.prepare('SELECT * FROM chatbots WHERE id = ?').get(id);
    res.status(201).json(chatbot);
  } catch (error) {
    console.error('Create chatbot error:', error);
    res.status(500).json({ error: 'Failed to create chatbot' });
  }
});

// Get single chatbot
router.get('/:id', (req, res) => {
  try {
    const chatbot = db.prepare(`
      SELECT * FROM chatbots WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }

    res.json(chatbot);
  } catch (error) {
    console.error('Get chatbot error:', error);
    res.status(500).json({ error: 'Failed to get chatbot' });
  }
});

// Update chatbot
router.put('/:id', (req, res) => {
  try {
    const { name, description, welcome_message, fallback_message, knowledge_base, settings, is_active } = req.body;

    // Check ownership
    const existing = db.prepare('SELECT id FROM chatbots WHERE id = ? AND user_id = ?').get(
      req.params.id,
      req.user.id
    );

    if (!existing) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }

    db.prepare(`
      UPDATE chatbots 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          welcome_message = COALESCE(?, welcome_message),
          fallback_message = COALESCE(?, fallback_message),
          knowledge_base = COALESCE(?, knowledge_base),
          settings = COALESCE(?, settings),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      description,
      welcome_message,
      fallback_message,
      knowledge_base,
      settings,
      is_active,
      req.params.id
    );

    const chatbot = db.prepare('SELECT * FROM chatbots WHERE id = ?').get(req.params.id);
    res.json(chatbot);
  } catch (error) {
    console.error('Update chatbot error:', error);
    res.status(500).json({ error: 'Failed to update chatbot' });
  }
});

// Delete chatbot
router.delete('/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM chatbots WHERE id = ? AND user_id = ?').run(
      req.params.id,
      req.user.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }

    res.json({ message: 'Chatbot deleted successfully' });
  } catch (error) {
    console.error('Delete chatbot error:', error);
    res.status(500).json({ error: 'Failed to delete chatbot' });
  }
});

// Get chatbot embed code
router.get('/:id/embed', (req, res) => {
  try {
    const chatbot = db.prepare('SELECT id, name FROM chatbots WHERE id = ? AND user_id = ?').get(
      req.params.id,
      req.user.id
    );

    if (!chatbot) {
      return res.status(404).json({ error: 'Chatbot not found' });
    }

    const embedCode = `<script>
  (function() {
    window.smartChatConfig = {
      chatbotId: "${chatbot.id}",
      apiUrl: "${process.env.FRONTEND_URL?.replace('/api', '') || 'http://localhost:3000'}"
    };
    var s = document.createElement('script');
    s.src = window.smartChatConfig.apiUrl + '/widget.js';
    s.async = true;
    document.head.appendChild(s);
  })();
</script>`;

    res.json({ embedCode });
  } catch (error) {
    console.error('Get embed code error:', error);
    res.status(500).json({ error: 'Failed to get embed code' });
  }
});

export default router;