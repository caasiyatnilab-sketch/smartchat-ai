# Deployment Guide

## Quick Deploy Options

### Option 1: Render (Backend + PostgreSQL)

1. **Create Render Account**
   - Go to [render.com](https://render.com) and sign up
   - Connect your GitHub repository

2. **Deploy Backend**
   - Create a new Web Service
   - Connect your GitHub repo
   - Settings:
     - Build Command: `cd backend && npm install`
     - Start Command: `cd backend && npm start`
     - Environment Variables:
       - `PORT`: 3000
       - `NODE_ENV`: production
       - `DATABASE_URL`: (your PostgreSQL connection string)
       - `JWT_SECRET`: (generate a secure random string)
       - `OPENAI_API_KEY`: (your OpenAI key, optional)
       - `FRONTEND_URL`: (your frontend URL)

3. **Create PostgreSQL Database**
   - In Render dashboard, create a new PostgreSQL
   - Copy the connection string to DATABASE_URL

### Option 2: Railway

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Add PostgreSQL plugin
4. Set environment variables
5. Deploy

### Option 3: Fly.io

1. Install flyctl: `curl -L https://fly.io/install.sh | sh`
2. `fly launch` in the backend directory
3. `fly deploy`
4. Add PostgreSQL: `fly postgres create`

---

## Frontend Deployment

### Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variables:
     - `VITE_API_URL`: (your backend URL)

### Netlify

1. Connect repo to Netlify
2. Build settings:
   - Build Command: `npm run build`
   - Publish: `dist`
3. Add environment variable for API URL

---

## Environment Variables Reference

### Backend (.env)

```env
# Required
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://user:pass@host:5432/dbname
JWT_SECRET=<generate-random-string>

# Optional
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-3.5-turbo
FRONTEND_URL=https://your-domain.com
```

### Frontend (.env)

```env
VITE_API_URL=https://your-backend-api.onrender.com
```

---

## Production Checklist

- [ ] Set secure JWT_SECRET (32+ random characters)
- [ ] Configure CORS for your frontend domain
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure monitoring/logging
- [ ] Set up error handling

---

## Troubleshooting

### CORS Errors
- Make sure FRONTEND_URL matches your frontend domain exactly

### Database Connection
- Verify DATABASE_URL is correct
- Check that database is accessible from your hosting region

### Build Failures
- Ensure Node.js version matches (18+)
- Check that all dependencies are in package.json

---

## Support

For issues, check the main README.md or open an issue on GitHub.