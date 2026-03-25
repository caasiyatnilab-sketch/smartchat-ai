import 'dotenv/config';
import Database from 'better-sqlite3';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

let db;

if (isProduction) {
  // PostgreSQL for production
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  // Wrap pool in a simple interface similar to better-sqlite3
  db = {
    prepare: (sql) => {
      return {
        run: (...params) => pool.query(sql, params),
        get: (...params) => pool.query(sql, params).then(res => res.rows[0]),
        all: (...params) => pool.query(sql, params).then(res => res.rows),
      };
    },
    exec: (sql) => pool.query(sql),
  };
} else {
  // SQLite for development
  const dataDir = join(__dirname, '../../data');
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
  db = new Database(join(dataDir, 'smartchat.db'));
  db.pragma('foreign_keys = ON');
}

export function initDatabase() {
  if (isProduction) {
    // PostgreSQL schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chatbots (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
        fallback_message TEXT DEFAULT 'I sorry, I did not understand that. Can you rephrase?',
        knowledge_base TEXT DEFAULT '[]',
        settings TEXT DEFAULT '{}',
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        chatbot_id TEXT NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
        visitor_id TEXT,
        visitor_name TEXT,
        visitor_email TEXT,
        status TEXT DEFAULT 'active',
        satisfaction_score INTEGER,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY,
        chatbot_id TEXT NOT NULL REFERENCES chatbots(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_data TEXT DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } else {
    // SQLite schema
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS chatbots (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
        fallback_message TEXT DEFAULT 'I sorry, I did not understand that. Can you rephrase?',
        knowledge_base TEXT DEFAULT '[]',
        settings TEXT DEFAULT '{}',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        chatbot_id TEXT NOT NULL,
        visitor_id TEXT,
        visitor_name TEXT,
        visitor_email TEXT,
        status TEXT DEFAULT 'active',
        satisfaction_score INTEGER,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME,
        FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS analytics (
        id TEXT PRIMARY KEY,
        chatbot_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_data TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chatbot_id) REFERENCES chatbots(id) ON DELETE CASCADE
      );
    `);
  }

  console.log('✅ Database initialized');
}

export default db;