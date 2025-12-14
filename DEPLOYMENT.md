# VY-Service Deployment Guide for Vercel

## Project Overview
- **Frontend**: Expo React Native app (with web support)
- **Backend**: Node.js/Express API server
- **Database**: MongoDB Atlas

---

## Vercel Deployment Configuration

### 1. **Framework Preset**
- Select: **"Other"** or **"Expo"** (if available)
- If "Expo" is not available, use **"Other"**

### 2. **Root Directory**
- Set to: `./` (root of the project)

### 3. **Build and Output Settings**

#### For Frontend (Expo Web) Deployment:

**Build Command:**
```bash
npm install && npx expo export:web
```

**Output Directory:**
```
web-build
```

**Install Command:**
```bash
npm install
```

**Node.js Version:**
```
18.x
```

#### Alternative Build Settings (if above doesn't work):
- **Build Command:** `npm run build` (if you add a build script)
- **Output Directory:** `dist` or `build`

### 4. **Environment Variables**

Add these in Vercel's Environment Variables section:

#### Required Variables:
```
NODE_ENV=production
EXPO_PUBLIC_API_URL=https://your-backend-url.vercel.app/api
```

#### Optional (if using Expo web features):
```
EXPO_PUBLIC_APP_NAME=VY Service
```

### 5. **Backend Deployment (Separate)**

Your backend needs to be deployed separately. Options:

#### Option A: Deploy Backend to Vercel (Serverless Functions)
1. Create a separate Vercel project for the backend
2. Root Directory: `./backend`
3. Framework Preset: **"Other"**
4. Build Command: (leave empty or `npm install`)
5. Output Directory: (leave empty)
6. Install Command: `npm install`

**Backend Environment Variables:**
```
MONGODB_URI=mongodb+srv://abhiramsanka6:Abhiram%401905@cluster0.yuxegee.mongodb.net/vy-service?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=vy-service
PORT=3000
NODE_ENV=production
```

**Note:** For Vercel serverless, you'll need to convert your Express app to serverless functions. Consider using `vercel.json` configuration.

#### Option B: Deploy Backend to Alternative Platform
- **Railway**: Good for Node.js apps
- **Render**: Free tier available
- **Heroku**: Requires credit card
- **DigitalOcean App Platform**: Simple deployment

---

## Step-by-Step Vercel Deployment

### Frontend Deployment:

1. **Project Settings:**
   - Project Name: `vy-service` (or your preferred name)
   - Framework Preset: **Other**
   - Root Directory: `./`

2. **Build Settings:**
   - Expand "Build and Output Settings"
   - Build Command: `npm install && npx expo export:web`
   - Output Directory: `web-build`
   - Install Command: `npm install`

3. **Environment Variables:**
   - Add `NODE_ENV=production`
   - Add `EXPO_PUBLIC_API_URL` with your backend URL

4. **Deploy:**
   - Click "Deploy" button

### Backend Deployment (Recommended: Railway or Render):

#### For Railway:
1. Connect your GitHub repository
2. Select the `backend` folder as root
3. Add environment variables:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
   - `PORT` (Railway auto-assigns, but you can set it)
4. Deploy

#### For Render:
1. Create a new Web Service
2. Connect GitHub repository
3. Set:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add environment variables
5. Deploy

---

## Important Notes

### 1. **API URL Configuration**
After deploying the backend, update the frontend's API URL:
- In `services/api.js`, the `API_BASE_URL` is currently set for local development
- You'll need to update it to use your deployed backend URL
- Or use environment variables: `EXPO_PUBLIC_API_URL`

### 2. **CORS Configuration**
Your backend already has CORS configured to allow all origins (`origin: '*'`), which should work for production.

### 3. **MongoDB Atlas**
- Ensure your MongoDB Atlas cluster allows connections from `0.0.0.0/0` (all IPs)
- The connection string is already in `backend/server.js` as a fallback

### 4. **Service Account Key**
- The file `backend/serviceAccountKey.json.json` should NOT be committed to Git
- If you need Firebase services, add it as an environment variable or use Vercel's file storage

---

## Post-Deployment Checklist

- [ ] Frontend deployed and accessible
- [ ] Backend deployed and accessible
- [ ] API health check endpoint works: `https://your-backend-url/api/health`
- [ ] Frontend can connect to backend API
- [ ] MongoDB connection working
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] Test login functionality
- [ ] Test API endpoints

---

## Troubleshooting

### Build Fails:
- Check Node.js version (should be 18.x)
- Ensure all dependencies are in `package.json`
- Check build logs in Vercel dashboard

### API Connection Issues:
- Verify backend URL is correct
- Check CORS settings
- Ensure backend is deployed and running
- Check environment variables

### MongoDB Connection Issues:
- Verify MongoDB Atlas network access allows all IPs
- Check connection string format
- Ensure password is URL encoded (%40 for @)

---

## Quick Reference

**Frontend Vercel Settings:**
- Framework: Other
- Root: ./
- Build: `npm install && npx expo export:web`
- Output: `web-build`

**Backend Environment Variables:**
```
MONGODB_URI=mongodb+srv://abhiramsanka6:Abhiram%401905@cluster0.yuxegee.mongodb.net/vy-service?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=vy-service
PORT=3000
NODE_ENV=production
```

