import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('SmartChat AI Backend', () => {
  describe('Database module', () => {
    it('should export db object with prepare method', async () => {
      const { default: db } = await import('../src/models/database.js');
      assert.ok(db, 'db should exist');
      assert.equal(typeof db.prepare, 'function', 'db.prepare should be a function');
    });

    it('should export initDatabase function', async () => {
      const mod = await import('../src/models/database.js');
      assert.equal(typeof mod.initDatabase, 'function', 'initDatabase should be a function');
    });
  });

  describe('Auth middleware', () => {
    it('should export authenticate function', async () => {
      const mod = await import('../src/middleware/auth.js');
      assert.equal(typeof mod.authenticate, 'function');
    });

    it('should export optionalAuth function', async () => {
      const mod = await import('../src/middleware/auth.js');
      assert.equal(typeof mod.optionalAuth, 'function');
    });

    it('should reject requests without auth header', async () => {
      const { authenticate } = await import('../src/middleware/auth.js');
      const req = { headers: {} };
      let statusCode;
      let body;
      const res = {
        status(code) { statusCode = code; return this; },
        json(data) { body = data; },
      };
      authenticate(req, res, () => {});
      assert.equal(statusCode, 401);
      assert.equal(body.error, 'No token provided');
    });
  });

  describe('Routes', () => {
    it('auth routes should be an express Router', async () => {
      const { default: router } = await import('../src/routes/auth.js');
      assert.ok(router, 'auth router should exist');
      assert.equal(typeof router.use, 'function');
    });

    it('chatbot routes should be an express Router', async () => {
      const { default: router } = await import('../src/routes/chatbots.js');
      assert.ok(router, 'chatbot router should exist');
    });

    it('conversation routes should be an express Router', async () => {
      const { default: router } = await import('../src/routes/conversations.js');
      assert.ok(router, 'conversation router should exist');
    });

    it('analytics routes should be an express Router', async () => {
      const { default: router } = await import('../src/routes/analytics.js');
      assert.ok(router, 'analytics router should exist');
    });

    it('subscription routes should be an express Router', async () => {
      const { default: router } = await import('../src/routes/subscription.js');
      assert.ok(router, 'subscription router should exist');
    });

    it('webhook routes should be an express Router', async () => {
      const { default: router } = await import('../src/routes/webhooks.js');
      assert.ok(router, 'webhook router should exist');
    });
  });
});
