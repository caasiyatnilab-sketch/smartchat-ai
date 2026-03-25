# SmartChat AI - Deployment Guide

## Quick Deploy Options

### Option 1: Render.com (Recommended)

1. **Create Render Account**
   - Go to [render.com](https://render.com) → Sign Up with GitHub
   - Authorize access to your repos

2. **Deploy Database**
   - In Render dashboard: New → PostgreSQL
   - Name: `smartchat-db`
   - Plan: Free
   - Copy the "Internal Database URL" after creation

3. **Deploy Backend**
   - New → Web Service
   - Connect: `caasiyatnilab-sketch/smartchat-ai`
   - Branch: `master`
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
   - Environment Variables:
     ```
     NODE_ENV=production
     DATABASE_URL=<paste-from-step-2>
     JWT_SECRET=<generate-random-string>
     OPENAI_API_KEY=<your-openai-key>
     FRONTEND_URL=<your-frontend-url>
     ```

4. **Deploy Frontend**
   - New → Web Service
   - Connect: `caasiyatnilab-sketch/smartchat-ai`
   - Branch: `master`
   - Build Command: `cd frontend && npm install && npm run build`
   - Start Command: `npx serve dist -l 80`
   - Environment Variables:
     ```
     VITE_API_URL=<your-backend-url>
     ```

---

### Option 2: Docker (Local)

```bash
# Clone and deploy
git clone https://github.com/caasiyatnilab-sketch/smartchat-ai.git
cd smartchat-ai

# Edit environment
cp backend/.env.example backend/.env
nano backend.env  # Add your values

# Run with Docker Compose
docker-compose up -d
```

---

### Option 3: Railway

1. Go to [railway.app](https://railway.app) → Start New Project
2. Connect GitHub repo
3. Add PostgreSQL plugin
4. Set environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
   JWT_SECRET=<random-string>
   OPENAI_API_KEY=<your-key>
   ```
5. Deploy both backend and frontend services

---

## Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up / Login
3. API Keys → Create new secret key
4. Add billing (requires credit card for API usage)
5. Copy key and add to your deployment

**Note:** Pay-as-you-go pricing - you only pay for what you use. GPT-3.5 is cheap (~$0.002/1k tokens).

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | production/development | `production` |
| `DATABASE_URL` | PostgreSQL connection | `postgres://user:pass@host:5432/db` |
| `JWT_SECRET` | Random 32+ char string | `xyz123...` |
| `OPENAI_API_KEY` | Your OpenAI key | `sk-...` |
| `FRONTEND_URL` | Your frontend URL | `https://smartchat.onrender.com` |
| `VITE_API_URL` | Backend API URL | `https://smartchat-api.onrender.com` |

---

## After Deploy

1. Visit your frontend URL
2. Register a new account
3. Create your first chatbot
4. Add Q&A to knowledge base
5. Embed widget on your website!

---

## Troubleshooting

**CORS errors:** Ensure `FRONTEND_URL` matches exactly

**Database connection:** Verify `DATABASE_URL` is correct

**Build fails:** Check Node version (18+ required)

**OpenAI errors:** Verify API key is valid and has credits
