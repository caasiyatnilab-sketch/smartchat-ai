# Deployment to Cyclic (FREE)

## Steps:

1. Go to [cyclic.sh](https://cyclic.sh)
2. Sign up with GitHub
3. Click "Link Your Own"
4. Select: `caasiyatnilab-sketch/smartchat-ai`
5. Add Environment Variable:
   ```
   HUGGINGFACE_API_KEY=hf_YOUR_TOKEN_HERE
   JWT_SECRET=anyrandomstring32characterslong
   NODE_ENV=production
   ```
6. Click Deploy!

---

## Railway (Easy, $5 credit/month)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub  
3. "New Project" → "Deploy from GitHub repo"
4. Select `caasiyatnilab-sketch/smartchat-ai`
5. Add PostgreSQL
6. Add vars:
   ```
   HUGGINGFACE_API_KEY=hf_YOUR_TOKEN_HERE
   JWT_SECRET=anyrandomstring32characterslong
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
7. Deploy!

---

Get your token at: [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
