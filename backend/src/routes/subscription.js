import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../models/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get subscription plans
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: ['1 Chatbot', '50 conversations/month', 'Basic analytics', 'Email support'],
      limits: { chatbots: 1, conversations: 50 }
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 19,
      features: ['3 Chatbots', '500 conversations/month', 'Advanced analytics', 'Email support', 'Custom branding'],
      limits: { chatbots: 3, conversations: 500 }
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 49,
      features: ['10 Chatbots', '2000 conversations/month', 'Advanced analytics', 'Priority support', 'Custom branding', 'API access'],
      limits: { chatbots: 10, conversations: 2000 }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 199,
      features: ['Unlimited Chatbots', 'Unlimited conversations', 'White-label', 'Dedicated support', 'SLA', 'Custom integrations'],
      limits: { chatbots: -1, conversations: -1 }
    }
  ];
  res.json(plans);
});

// Get current subscription
router.get('/subscription', (req, res) => {
  try {
    let user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    
    // Default to free plan
    const subscription = user?.subscription || {
      plan: 'free',
      status: 'active',
      conversations_used: 0,
      chatbots_used: 0,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    res.json(subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription' });
  }
});

// Update subscription (simulated - in real app would integrate with Stripe/PayPal)
router.post('/subscribe', (req, res) => {
  try {
    const { plan_id } = req.body;
    
    const validPlans = ['free', 'starter', 'pro', 'enterprise'];
    if (!validPlans.includes(plan_id)) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // In a real app, this would:
    // 1. Create Stripe checkout session
    // 2. Process payment
    // 3. Update subscription in database
    
    // For demo, we just return success
    res.json({
      success: true,
      message: `Subscribed to ${plan_id} plan`,
      plan: plan_id,
      status: 'active'
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Cancel subscription
router.post('/cancel', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Subscription cancelled',
      status: 'cancelled'
    });
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Get usage stats
router.get('/usage', (req, res) => {
  try {
    const chatbotCount = db.prepare(
      'SELECT COUNT(*) as count FROM chatbots WHERE user_id = ?'
    ).get(req.user.id).count;

    const conversationCount = db.prepare(`
      SELECT COUNT(*) as count FROM conversations c
      JOIN chatbots ch ON c.chatbot_id = ch.id
      WHERE ch.user_id = ?
      AND DATE(c.started_at) >= DATE('now', 'start of month')
    `).get(req.user.id).count;

    const plans = {
      free: { chatbots: 1, conversations: 50 },
      starter: { chatbots: 3, conversations: 500 },
      pro: { chatbots: 10, conversations: 2000 },
      enterprise: { chatbots: -1, conversations: -1 }
    };

    const plan = 'free'; // Would come from user subscription
    const limits = plans[plan];

    res.json({
      plan,
      chatbots: {
        used: chatbotCount,
        limit: limits.chatbots,
        remaining: limits.chatbots === -1 ? -1 : Math.max(0, limits.chatbots - chatbotCount)
      },
      conversations: {
        used: conversationCount,
        limit: limits.conversations,
        remaining: limits.conversations === -1 ? -1 : Math.max(0, limits.conversations - conversationCount)
      }
    });
  } catch (error) {
    console.error('Usage error:', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

export default router;