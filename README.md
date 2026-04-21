# SmartChat AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Tests](https://img.shields.io/badge/Tests-11%20passing-22c55e?style=flat-square)]()
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)]()

AI-powered chatbot platform with multi-provider support, 35+ models, and a full-featured React dashboard.

## What It Does

SmartChat AI is a customer support chatbot platform that connects to multiple AI providers. You get a React-based dashboard to manage chatbots, view conversations, track analytics, and configure webhooks -- all backed by a Node.js/Express API with authentication and SQLite storage.

## AI Providers

| Provider | Models | Free Tier |
|----------|--------|-----------|
| **Groq** | Llama 3, Mixtral, Gemma | Yes -- [console.groq.com](https://console.groq.com) |
| **OpenRouter** | 100+ models with fallback chain | Yes -- [openrouter.ai/keys](https://openrouter.ai/keys) |
| **HuggingFace** | Mistral, Zephyr, StarChat | Yes -- [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) |
| **Ollama Cloud** | 35+ self-hosted models | Free (self-hosted) |
| **Together AI** | Llama, Code Llama, Mistral | Yes -- [together.ai](https://together.ai) |
| **Mistral** | Mistral-7B, Mixtral-8x7B | Yes -- [mistral.ai](https://mistral.ai) |

## Quick Start

```bash
# Clone
git clone https://github.com/caasiyatnilab-sketch/smartchat-ai.git
cd smartchat-ai

# Backend
cd backend
cp .env.example .env    # Add your API keys
npm install
npm start

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Environment Variables

Create `backend/.env` from the example:

```env
PORT=3001
JWT_SECRET=your-secret-here
GROQ_API_KEY=gsk_...
OPENROUTER_API_KEY=sk-or-...
HUGGINGFACE_API_KEY=hf_...
```

All API keys are optional -- the app works with any single provider.

## Architecture

```
smartchat-ai/
  backend/
    src/
      index.js              # Express server entry point
      middleware/auth.js     # JWT authentication
      models/database.js    # SQLite with auto-init
      routes/
        auth.js             # Register, login, token refresh
        chatbots.js         # CRUD for chatbot configs
        conversations.js    # Chat message history
        analytics.js        # Usage stats and metrics
        subscription.js     # Plan management
        webhooks.js         # External integrations
    tests/
      api.test.js           # 11 integration tests
  frontend/
    src/
      App.jsx               # React router setup
      pages/                # Dashboard, Chatbots, Analytics, etc.
      components/           # Shared layout components
      context/              # Auth context provider
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Get JWT token |
| GET | `/api/chatbots` | Yes | List chatbots |
| POST | `/api/chatbots` | Yes | Create chatbot |
| GET | `/api/chatbots/:id` | Yes | Get chatbot details |
| PUT | `/api/chatbots/:id` | Yes | Update chatbot |
| DELETE | `/api/chatbots/:id` | Yes | Delete chatbot |
| GET | `/api/conversations` | Yes | List conversations |
| POST | `/api/conversations/:id/messages` | Yes | Send message |
| GET | `/api/analytics` | Yes | Usage analytics |
| GET | `/api/subscription` | Yes | Current plan |

## Testing

```bash
cd backend
npm test
```

All 11 tests pass -- covering auth, chatbot CRUD, conversations, and database initialization.

## Deployment

| Platform | Command |
|----------|---------|
| **Docker** | `docker-compose up` |
| **Railway** | Connect repo at [railway.app](https://railway.app) |
| **Render** | Connect repo at [render.com](https://render.com) |
| **Vercel** | `vercel --prod` (frontend only) |

The `docker-compose.yml` spins up both frontend and backend in one command.

## License

MIT -- see [LICENSE](LICENSE) for details.
