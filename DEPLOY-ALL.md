# SmartChat AI - Quick Deploy Options

## 🚀 Option 1: Railway (Wait & Retry)

Railway limits reset in **2-4 hours**. When ready:
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select `caasiyatnilab-sketch/smartchat-ai`
4. Add PostgreSQL
5. Variables:
   ```
   HUGGINGFACE_API_KEY=hf_YOUR_TOKEN
   JWT_SECRET=any32charactersrandomstring
   ```

---

## 🚀 Option 2: Fly.io (Free)

1. Go to [fly.io](https://fly.io) → Sign up
2. Install app: "fly" 
3. Run: `fly launch`
4. Add secrets: `fly secrets set HUGGINGFACE_API_KEY=hf_YOUR_TOKEN`

---

## 🚀 Option 3: Glitch (Easiest!)

1. Go to [glitch.com](https://glitch.com)
2. Sign up with GitHub
3. "New Project" → "Import from GitHub"
4. Paste: `https://github.com/caasiyatnilab-sketch/smartchat-ai`
5. Add env vars in `.env` file

---

## 🚀 Option 4: Replit

1. Go to [replit.com](https://replit.com)
2. Sign up → "Create Repl"
3. "Import from GitHub"
4. Add your HuggingFace key

---

## 🔑 Get Token

Get your free token at: https://huggingface.co/settings/tokens

**GitHub Repo:** https://github.com/caasiyatnilab-sketch/smartchat-ai
