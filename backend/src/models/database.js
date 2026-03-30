import 'dotenv/config';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

let db;
let sqliteDb = null;
let dbPath = null;

// ─── Wrapper to make sql.js look like better-sqlite3 ─────
function createSqliteWrapper(sqlDb, path) {
  return {
    prepare(sql) {
      return {
        run(...params) {
          sqlDb.run(sql, params);
          if (path) {
            const data = sqlDb.export();
            writeFileSync(path, Buffer.from(data));
          }
          return { changes: sqlDb.getRowsModified() };
        },
        get(...params) {
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row;
          }
          stmt.free();
          return undefined;
        },
        all(...params) {
          const stmt = sqlDb.prepare(sql);
          stmt.bind(params);
          const rows = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
          stmt.free();
          return rows;
        },
      };
    },
    exec(sql) {
      sqlDb.run(sql);
      if (path) {
        const data = sqlDb.export();
        writeFileSync(path, Buffer.from(data));
      }
    },
    pragma(key) {
      sqlDb.run(`PRAGMA ${key}`);
    },
  };
}

// ─── Initialize ──────────────────────────────────────────
async function initSqlite() {
  const SQL = await initSqlJs();

  if (isTest) {
    // In-memory database for tests
    sqliteDb = new SQL.Database();
  } else {
    const dataDir = join(__dirname, '../../data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    dbPath = join(dataDir, 'smartchat.db');

    // Load existing DB or create new
    if (existsSync(dbPath)) {
      const buffer = readFileSync(dbPath);
      sqliteDb = new SQL.Database(buffer);
    } else {
      sqliteDb = new SQL.Database();
    }
  }

  db = createSqliteWrapper(sqliteDb, isTest ? null : dbPath);
  db.pragma('foreign_keys = ON');
}

function initPostgres() {
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  db = {
    prepare(sql) {
      return {
        async run(...params) {
          return pool.query(sql, params);
        },
        async get(...params) {
          const res = await pool.query(sql, params);
          return res.rows[0];
        },
        async all(...params) {
          const res = await pool.query(sql, params);
          return res.rows;
        },
      };
    },
    exec(sql) {
      return pool.query(sql);
    },
  };
}

// ─── Schema (shared between SQLite and Postgres) ─────────
const SQLITE_SCHEMA = `
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
    fallback_message TEXT DEFAULT 'I''m sorry, I did not understand that. Can you rephrase?',
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
`;

const PG_SCHEMA = `
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
    fallback_message TEXT DEFAULT 'I''m sorry, I did not understand that. Can you rephrase?',
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
`;

// ─── Public API ──────────────────────────────────────────
export async function initDatabase() {
  if (isProduction) {
    initPostgres();
    await db.exec(PG_SCHEMA);
  } else {
    await initSqlite();
    db.exec(SQLITE_SCHEMA);
  }
  console.log('✅ Database initialized');
}

// Auto-init on import (test mode uses in-memory SQLite)
await initDatabase();

export default db;
