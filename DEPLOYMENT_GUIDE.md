# Deploying Schedly to Render - Step by Step Guide

## Prerequisites
- GitHub account (you'll need to push your code there)
- Render account (free at render.com)
- Supabase project already set up

## Step 1: Push Your Code to GitHub

1. Initialize git (if not already done):
```bash
cd /Users/federicodonati/Desktop/amsterdam-bookings-hub
git init
```

2. Add all files:
```bash
git add .
```

3. Create initial commit:
```bash
git commit -m "Initial commit: Schedly booking system"
```

4. Create a new repository on GitHub.com

5. Add the remote and push:
```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/amsterdam-bookings-hub.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 2: Create a Build Configuration

Create a `render.yaml` file in your project root:

```yaml
services:
  - type: web
    name: schedly
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run preview
    envVars:
      - key: NODE_ENV
        value: production
      - key: VITE_SUPABASE_URL
        value: YOUR_SUPABASE_URL
      - key: VITE_SUPABASE_ANON_KEY
        value: YOUR_SUPABASE_ANON_KEY
```

## Step 3: Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Go to Settings > API
4. Copy:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon (public) key** → this is `VITE_SUPABASE_ANON_KEY`

## Step 4: Deploy to Render

1. Go to https://render.com and sign up/log in

2. Click "New +" button → "Web Service"

3. Connect your GitHub repository:
   - Click "Connect account" if needed
   - Select your `amsterdam-bookings-hub` repository

4. Configure the service:
   - **Name**: `schedly` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run preview`
   - **Plan**: Free tier works for testing

5. Add Environment Variables:
   - Click "Advanced" → "Add Environment Variable"
   - Add:
     ```
     VITE_SUPABASE_URL = YOUR_SUPABASE_URL
     VITE_SUPABASE_ANON_KEY = YOUR_SUPABASE_ANON_KEY
     NODE_ENV = production
     ```

6. Click "Create Web Service"

## Step 5: Wait for Deployment

- Render will automatically build and deploy your app
- You'll see a log showing the build progress
- Once complete, you'll get a URL like: `https://schedly-xxxx.onrender.com`

## Step 6: Test Your Deployment

1. Visit your new URL
2. Test logging in
3. Test the booking functionality
4. Verify admin panel works (use the test_admin flag if needed)

## Step 7: Update Your Supabase CORS Settings (Important!)

Your Supabase project needs to allow requests from your Render domain:

1. Go to Supabase Dashboard → Settings → API
2. Scroll to "CORS" section
3. Add your Render URL to the allowed list: `https://schedly-xxxx.onrender.com`

## Troubleshooting

**Build fails**: Check that all dependencies are in package.json
```bash
npm install
```

**Blank page**: Check browser console (F12) for CORS or other errors

**Environment variables not working**: Make sure they're set in Render dashboard and the build has been redeployed

**Database connection issues**: Verify Supabase credentials are correct and CORS is configured

## Optional: Custom Domain

If you have a custom domain:
1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domain"
3. Follow Render's instructions for DNS setup

---

Let me know which step you're on and I'll help!
