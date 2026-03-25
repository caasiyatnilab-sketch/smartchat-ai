# SmartChat AI - AI Customer Support Chatbot for Small Businesses

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](package.json)
[![React](https://img.shields.io/badge/react-%5E18-blue)](frontend/package.json)

**AI-powered chatbot platform that helps small businesses automate customer support 24/7**

</div>

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## ✨ Features

### Core Features
- 🤖 **AI Chatbot Builder** - Create custom chatbots without coding
- 💬 **Multi-channel Support** - Web, API, widget integration
- 📊 **Conversation Analytics** - Track engagement, satisfaction scores
- 🔄 **Human Handoff** - Seamlessly transfer to live agents
- 📝 **Knowledge Base** - Upload documents, FAQs, PDFs
- 🔌 **Integrations** - Slack, Discord, WhatsApp, CRM connectors

### Admin Dashboard
- 👥 **User Management** - Role-based access control
- 📈 **Analytics Dashboard** - Real-time metrics and reports
- 🎯 **Lead Capture** - Collect visitor info automatically
- ⚙️ **Bot Configuration** - Training, responses, fallback logic

---

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Auth:** JWT + bcrypt
- **AI:** OpenAI GPT API (pluggable)

### Frontend
- **Framework:** React 18 + Vite
- **UI:** Tailwind CSS
- **State:** React Context + Hooks
- **Charts:** Recharts

### DevOps
- **CI/CD:** GitHub Actions
- **Testing:** Jest + React Testing Library

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- OpenAI API key (optional for AI features)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd smartchat-ai

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Create environment file
cp ../backend/.env.example ../backend/.env
```

### Running Locally

```bash
# Terminal 1 - Start backend
cd backend
npm run dev

# Terminal 2 - Start frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173` for the app.

---

## 📁 Project Structure

```
smartchat-ai/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/        # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/        # Page views
│   │   ├── context/      # State management
│   │   ├── services/     # API calls
│   │   ├── hooks/        # Custom hooks
│   │   └── App.jsx       # Root component
│   ├── index.html
│   ├── package.json
│   └── tailwind.config.js
├── .github/
│   └── workflows/
│       └── ci.yml
├── README.md
├── LICENSE
└── .gitignore
```

---

## ⚙️ Configuration

### Backend Environment Variables

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=file:./data/smartchat.db

# Auth
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# AI (Optional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Environment Variables for Production

```env
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://user:pass@host:5432/smartchat
JWT_SECRET=<generate-secure-random-string>
OPENAI_API_KEY=<your-key>
FRONTEND_URL=https://your-domain.com
```

---

## 📚 API Documentation

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login user |
| `/api/auth/me` | GET | Get current user |

### Chatbots

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chatbots` | GET | List user's chatbots |
| `/api/chatbots` | POST | Create new chatbot |
| `/api/chatbots/:id` | GET | Get chatbot details |
| `/api/chatbots/:id` | PUT | Update chatbot |
| `/api/chatbots/:id` | DELETE | Delete chatbot |

### Conversations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chatbots/:id/chat` | POST | Send message to bot |
| `/api/conversations` | GET | List conversations |
| `/api/conversations/:id` | GET | Get conversation details |

### Analytics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/overview` | GET | Dashboard stats |
| `/api/analytics/conversations` | GET | Conversation metrics |

---

## 🚢 Deployment

### Render / Heroku

1. Set environment variables in dashboard
2. Build command: `cd backend && npm install && npm run build`
3. Start command: `cd backend && npm start`

### Vercel (Frontend)

```bash
cd frontend
vercel deploy
```

### Docker

```bash
# Build and run
docker-compose up --build
```

See `DEPLOYMENT.md` for detailed instructions.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🔗 Related

- [OpenAI API Docs](https://platform.openai.com/docs)
- [Express.js](https://expressjs.com)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)