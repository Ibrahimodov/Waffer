# Supabase Deployment Guide for Vercel

This guide explains how to configure your application to use Supabase instead of MongoDB and deploy it to Vercel.

## Prerequisites

1. A Supabase project created at [supabase.com](https://supabase.com)
2. A Vercel account and project
3. Your Supabase project URL and anon key

## Environment Variables Configuration

### Backend Environment Variables

Add these environment variables to your Vercel project:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

# JWT Configuration (use the same JWT secret from Supabase)
JWT_SECRET=your-supabase-jwt-secret
JWT_EXPIRE=30d

# Node Environment
NODE_ENV=production
```

### Frontend Environment Variables

Add these environment variables for the frontend (Expo/React Native):

```bash
# Supabase Configuration for Frontend
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## How to Set Environment Variables in Vercel

### Method 1: Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each environment variable:
   - **Name**: Variable name (e.g., `SUPABASE_URL`)
   - **Value**: Your actual value
   - **Environments**: Select Production, Preview, and Development
4. Click **Save**

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add SUPABASE_ANON_KEY
vercel env add JWT_SECRET
vercel env add JWT_EXPIRE
vercel env add NODE_ENV
vercel env add EXPO_PUBLIC_SUPABASE_URL
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY
```

## Finding Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → Use for `SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `SUPABASE_ANON_KEY` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → Use for `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **Settings** → **Auth** → **JWT Settings**
6. Copy the **JWT Secret** → Use for `JWT_SECRET`

## Database Schema Setup

Ensure your Supabase database has the required tables. You can find the schema in `backend/config/supabase-schema.sql`.

## Deployment Steps

1. **Set Environment Variables** (as described above)
2. **Build Frontend**:
   ```bash
   cd frontend/LocalOffersApp
   npm run build:web
   ```
3. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

## Verification

After deployment:

1. Check that your API endpoints work: `https://your-app.vercel.app/api/health`
2. Test authentication and data operations
3. Monitor Vercel function logs for any errors
4. Check Supabase dashboard for database activity

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Ensure variables are set for all environments (Production, Preview, Development)
   - Redeploy after adding new environment variables

2. **CORS Issues**:
   - Check Supabase Auth settings
   - Verify allowed origins in Supabase dashboard

3. **Database Connection Issues**:
   - Verify Supabase URL and keys are correct
   - Check Supabase project status
   - Review database schema and RLS policies

4. **JWT Token Issues**:
   - Ensure JWT_SECRET matches Supabase JWT secret
   - Check token expiration settings

### Logs and Monitoring

- **Vercel Logs**: Check function logs in Vercel dashboard
- **Supabase Logs**: Monitor database and auth logs in Supabase dashboard
- **Browser Console**: Check for frontend errors

## Security Notes

1. **Never expose service role key** in frontend code
2. **Use Row Level Security (RLS)** in Supabase for data protection
3. **Configure proper CORS settings** in Supabase
4. **Use environment variables** for all sensitive data
5. **Regularly rotate API keys** for security

## Migration Checklist

- [ ] Supabase project created
- [ ] Database schema imported
- [ ] Environment variables configured in Vercel
- [ ] Frontend updated to use Supabase
- [ ] Backend updated to use Supabase
- [ ] MongoDB dependencies removed
- [ ] Application tested locally
- [ ] Application deployed to Vercel
- [ ] Production testing completed

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review Supabase project logs
3. Verify environment variable configuration
4. Test API endpoints individually