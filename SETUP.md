# SmartChat AI - Complete Setup Guide

## 🎯 What's Ready

| Component | Status |
|-----------|--------|
| Full SaaS Code | ✅ Ready |
| GitHub Repo | ✅ `caasiyatnilab-sketch/smartchat-ai` |
| Docker | ✅ Ready |
| Multi-AI Support | ✅ OpenAI/HuggingFace/Cohere |
| Deployment Scripts | ✅ Ready |

---

## 🚀 Quick Start (Choose One)

### Option 1: Render.com (Best Free Option)

**Step 1:** Go to [render.com](https://render.com) → Sign Up with GitHub

**Step 2:** Create PostgreSQL
```
Dashboard → New → PostgreSQL
Name: smartchat-db
Plan: Free
Copy Internal Database URL
```

**Step 3:** Deploy Backend
```
Dashboard → New → Web Service
GitHub: caasiyatnilab-sketch/smartchat-ai
Branch: master
Build: cd backend && npm install
Start: cd backend && npm start
```

**Step 4:** Add Environment Variables
```
NODE_ENV=production
DATABASE_URL=<paste-from-step-2>
JWT_SECRET=<any-random-32-chars>
OPENAI_API_KEY=<your-key>  # Optional
HUGGINGFACE_API_KEY=<your-key>  # Free option
```

**Step 5:** Deploy Frontend (same steps, or use Vercel)

---

### Option 2: Railway (Easiest)

1. Go to [railway.app](https://railway.app)
2. Start New Project → Connect GitHub Repo
3. Add PostgreSQL (click + → Database → PostgreSQL)
4. Add Variables:
   ```
   NODE_ENV=production
   DATABASE_URL=${{PostgreSQL.DATABASE_URL}}
   JWT_SECRET=<random-string>
   ```
5. Deploy!

---

### Option 3: Docker (Local/VPS)

```bash
# Quick start
git clone https://github.com/caasiyatnilab-sketch/smartchat-ai.git
cd smartchat-ai
cp backend/.env.example backend/.env
# Edit .env with your keys
docker-compose up -d
```

---

## 🔑 Get FREE AI API Keys

### Hugging Face (FREE)
1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create new token (read permissions)
3. Copy and add to `.env`:
   ```
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxx
   ```

### Cohere (FREE)
1. Go to [dashboard.cohere.com](https://dashboard.cohere.com)
2. Create API Key
3. Add to `.env`:
   ```
   COHERE_API_KEY=xxxxxxxxxxxx
   ```

### OpenAI (Paid, Best Quality)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up, add billing
3. Create API Key
4. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-xxxxxxxxxxxx
   ```

---

## 📋 Complete .env Example

```env
NODE_ENV=production
DATABASE_URL=postgres://...
JWT_SECRET=your-random-32-char-string
OPENAI_API_KEY=sk-...       # Optional - best quality
HUGGINGFACE_API_KEY=hf_...   # Free alternative
COHERE_API_KEY=...          # Free alternative
FRONTEND_URL=https://...
```

---

## 🔧 Troubleshooting

**"CORS error"** → Check FRONTEND_URL matches exactly

**"Database connection failed"** → Verify DATABASE_URL is correct

**"AI not responding"** → Add at least one API key (HuggingFace is free!)

**"Port already in use"** → Change PORT in .env

---

## 💰 Cost Estimate

| Platform | Free Tier | Notes |
|----------|-----------|-------|
| Render | ✅ | PostgreSQL + Web Service free |
| Railway | ✅ | $5 credit/month |
| HuggingFace | ✅ | Free inference API |
| Cohere | ✅ | Free tier available |
| OpenAI | 💰 | ~$0.002/1k tokens |

---

**Repo:** https://github.com/caasiyatnilab-sketch/smartchat-ai

Need help? Just ask! 🚀