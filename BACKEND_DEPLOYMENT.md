# Backend Server Deployment Details

## Backend Server Overview

**Technology Stack:**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB Atlas
- **Port**: 3000 (default, or set via PORT env var)

---

## Backend Server Configuration

### Server Entry Point
- **File**: `backend/server.js`
- **Start Command**: `npm start` (runs `node server.js`)
- **Dev Command**: `npm run dev` (runs `nodemon server.js`)

### API Endpoints

The backend exposes the following API routes:

#### Base URL Structure
```
/api/health          - Health check endpoint
/api/auth            - Authentication routes
/api/employees       - Employee management
/api/repairs         - Repair/service management
/api/attendance      - Attendance tracking
```

#### Detailed Endpoints:

**Authentication (`/api/auth`):**
- `POST /api/auth/login` - User login

**Employees (`/api/employees`):**
- `GET /api/employees` - Get all employees
- `POST /api/employees/signup` - Employee signup
- `PUT /api/employees/:id` - Update employee
- `PUT /api/employees/:id/approve` - Approve employee
- `DELETE /api/employees/:id` - Delete employee

**Repairs (`/api/repairs`):**
- `GET /api/repairs` - Get all repairs
- `POST /api/repairs` - Create new repair
- `GET /api/repairs/search/:uniqueId` - Get repair by unique ID
- `PUT /api/repairs/:id` - Update repair

**Attendance (`/api/attendance`):**
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/check` - Check attendance IP/location
- `GET /api/attendance/by-employee/:employeeId` - Get attendance by employee
- `POST /api/attendance/admin/set` - Admin set attendance
- `GET /api/attendance/today-count` - Get today's present count

**Health Check:**
- `GET /api/health` - Returns `{ status: 'OK', message: 'Server is running' }`

---

## Environment Variables Required

### Required Environment Variables:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://abhiramsanka6:Abhiram%401905@cluster0.yuxegee.mongodb.net/vy-service?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=vy-service

# Server Configuration
PORT=3000
NODE_ENV=production
```

### Environment Variable Details:

1. **MONGODB_URI** (Required)
   - MongoDB Atlas connection string
   - Default fallback is already in `server.js`
   - **Important**: Password with `@` must be URL encoded as `%40`
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?options`

2. **MONGODB_DB_NAME** (Optional, has default)
   - Database name: `vy-service`
   - Default: `vy-service`

3. **PORT** (Optional, has default)
   - Server port number
   - Default: `3000`
   - Most hosting platforms auto-assign this

4. **NODE_ENV** (Recommended)
   - Set to `production` for production deployments
   - Affects error message visibility

---

## Deployment Options

### Option 1: Deploy to Railway (Recommended for Express Backend)

**Why Railway?**
- Easy Node.js deployment
- Automatic HTTPS
- Environment variable management
- Free tier available

**Steps:**

1. **Sign up at** [railway.app](https://railway.app)

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository: `Abhir-1905-ram/VY-Service`

3. **Configure Service:**
   - **Root Directory**: Set to `backend`
   - **Start Command**: `npm start`
   - **Build Command**: (leave empty or `npm install`)

4. **Add Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://abhiramsanka6:Abhiram%401905@cluster0.yuxegee.mongodb.net/vy-service?retryWrites=true&w=majority&appName=Cluster0
   MONGODB_DB_NAME=vy-service
   NODE_ENV=production
   ```
   (PORT is auto-assigned by Railway)

5. **Deploy:**
   - Railway will automatically deploy
   - Get your backend URL (e.g., `https://your-app.railway.app`)

6. **Update Frontend API URL:**
   - In Vercel, add environment variable:
     ```
     EXPO_PUBLIC_API_URL=https://your-app.railway.app/api
     ```

---

### Option 2: Deploy to Render

**Steps:**

1. **Sign up at** [render.com](https://render.com)

2. **Create New Web Service:**
   - Connect GitHub repository
   - Repository: `Abhir-1905-ram/VY-Service`

3. **Configure Service:**
   - **Name**: `vy-service-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

4. **Add Environment Variables:**
   ```
   MONGODB_URI=mongodb+srv://abhiramsanka6:Abhiram%401905@cluster0.yuxegee.mongodb.net/vy-service?retryWrites=true&w=majority&appName=Cluster0
   MONGODB_DB_NAME=vy-service
   NODE_ENV=production
   ```

5. **Deploy:**
   - Render will build and deploy
   - Get your backend URL (e.g., `https://vy-service-backend.onrender.com`)

---

### Option 3: Deploy to Vercel (Serverless Functions)

**Note**: Vercel is optimized for serverless functions. To deploy Express backend, you need to convert it to serverless functions or use a wrapper.

**Steps:**

1. **Create Separate Vercel Project for Backend**

2. **Root Directory**: `backend`

3. **Framework Preset**: `Other`

4. **Build Settings:**
   - **Build Command**: (leave empty)
   - **Output Directory**: (leave empty)
   - **Install Command**: `npm install`

5. **Create `vercel.json` in `backend/` folder:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "server.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "server.js"
       }
     ]
   }
   ```

6. **Update `backend/server.js`** to export the app:
   ```javascript
   // At the end of server.js, add:
   module.exports = app;
   ```

7. **Add Environment Variables** in Vercel dashboard

8. **Deploy**

---

## MongoDB Atlas Configuration

### Network Access
1. Go to MongoDB Atlas Dashboard
2. Navigate to **Network Access**
3. Ensure **IP Access List** includes:
   - `0.0.0.0/0` (allows all IPs) - for production
   - OR add specific IPs of your hosting provider

### Database User
- Username: `abhiramsanka6`
- Password: `Abhiram@1905` (URL encoded as `Abhiram%401905` in connection string)

### Connection String
```
mongodb+srv://abhiramsanka6:Abhiram%401905@cluster0.yuxegee.mongodb.net/vy-service?retryWrites=true&w=majority&appName=Cluster0
```

---

## CORS Configuration

The backend is configured to accept requests from all origins:
```javascript
app.use(cors({
  origin: '*', // Allow all origins (for mobile app)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}));
```

This is suitable for production with mobile apps.

---

## Testing Backend Deployment

### 1. Health Check
```bash
curl https://your-backend-url.com/api/health
```
Expected response:
```json
{
  "status": "OK",
  "message": "Server is running"
}
```

### 2. Test Login Endpoint
```bash
curl -X POST https://your-backend-url.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin@1152"}'
```

### 3. Check MongoDB Connection
- Check server logs for MongoDB connection status
- Should see: `✅ Connected to MongoDB Atlas`

---

## Post-Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Health check endpoint returns `200 OK`
- [ ] MongoDB connection successful (check logs)
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] Backend URL obtained (e.g., `https://your-backend.railway.app`)
- [ ] Frontend API URL updated in Vercel environment variables
- [ ] Test login endpoint works
- [ ] Test at least one API endpoint (e.g., GET /api/repairs)

---

## Quick Reference

### Backend Server Details:
- **Entry Point**: `backend/server.js`
- **Port**: `3000` (or set via PORT env var)
- **Database**: MongoDB Atlas
- **Framework**: Express.js
- **Node Version**: Recommended 18.x or higher

### Required Environment Variables:
```
MONGODB_URI=mongodb+srv://abhiramsanka6:Abhiram%401905@cluster0.yuxegee.mongodb.net/vy-service?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=vy-service
PORT=3000
NODE_ENV=production
```

### API Base URL Format:
```
https://your-backend-url.com/api
```

### Recommended Deployment Platform:
**Railway** or **Render** (better for traditional Express apps than Vercel)

---

## Troubleshooting

### Backend Won't Start:
- Check Node.js version (should be 18.x+)
- Verify all dependencies installed (`npm install` in `backend/` folder)
- Check PORT environment variable

### MongoDB Connection Fails:
- Verify MongoDB Atlas cluster is running (not paused)
- Check Network Access allows `0.0.0.0/0`
- Verify connection string is correct
- Ensure password is URL encoded (`%40` for `@`)

### CORS Errors:
- Backend already configured for `origin: '*'`
- If issues persist, check if hosting platform adds extra CORS headers

### API Returns 404:
- Verify routes are correctly mounted in `server.js`
- Check that API calls use `/api/` prefix
- Ensure backend URL doesn't have trailing slash issues

---

## Next Steps After Backend Deployment

1. **Get Backend URL**: Copy your deployed backend URL
2. **Update Frontend**: In Vercel project settings, add:
   ```
   EXPO_PUBLIC_API_URL=https://your-backend-url.com/api
   ```
3. **Redeploy Frontend**: Trigger a new deployment in Vercel
4. **Test Integration**: Verify frontend can connect to backend

