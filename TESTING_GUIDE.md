# Testing Guide for MongoDB to Supabase Migration

This guide explains how to test the migrated application after switching from MongoDB to Supabase.

## Prerequisites

1. **Supabase Project Setup**:
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the SQL schema from `backend/config/supabase-schema.sql` in your Supabase SQL Editor
   - Note down your project credentials

2. **Environment Variables**:
   - Update `backend/.env` with your actual Supabase credentials
   - Update `frontend/LocalOffersApp/config/supabase.js` if needed

## Step 1: Configure Environment Variables

### Backend Configuration

Update `backend/.env` with your actual Supabase credentials:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-actual-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key
SUPABASE_ANON_KEY=your-actual-anon-key

# JWT Configuration (copy from Supabase Dashboard -> Settings -> Auth -> JWT Settings)
JWT_SECRET=your-actual-supabase-jwt-secret
JWT_EXPIRE=30d
```

### Frontend Configuration

Update `frontend/LocalOffersApp/config/supabase.js`:

```javascript
export const SUPABASE_CONFIG = {
  url: 'https://your-actual-project-id.supabase.co',
  anonKey: 'your-actual-anon-key',
};
```

## Step 2: Database Schema Setup

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `backend/config/supabase-schema.sql`
4. Run the SQL to create all tables, indexes, and policies

## Step 3: Test Backend Server

### Start the Backend Server

```bash
cd backend
npm install  # Install dependencies if needed
npm start
```

### Expected Output

```
Server running on port 5000
Supabase connected successfully
```

### Test API Endpoints

1. **Health Check**:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected: `{"status":"OK","database":"connected"}`

2. **User Registration**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

3. **User Login**:
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

## Step 4: Test Frontend Application

### Start the Frontend

```bash
cd frontend/LocalOffersApp
npm install  # Install dependencies if needed
npm start
```

### Test Frontend Features

1. **User Registration/Login**:
   - Open the app in your browser/emulator
   - Try registering a new user
   - Try logging in with the registered user

2. **Shop Management**:
   - Create a new shop
   - View shop details
   - Update shop information

3. **Family Management**:
   - Create a family
   - Join a family using invite code
   - View family members

## Step 5: Verify Database Operations

### Check Supabase Dashboard

1. Go to **Database** → **Tables**
2. Verify that data is being created in the tables:
   - `users` table should have user records
   - `shops` table should have shop records
   - `families` table should have family records

### Check Authentication

1. Go to **Authentication** → **Users**
2. Verify that users are being created in Supabase Auth
3. Check that user profiles are created in the `users` table

## Common Issues and Solutions

### Issue 1: "supabaseUrl is required" Error

**Solution**: Ensure environment variables are properly set in `.env` file and restart the server.

### Issue 2: Database Connection Failed

**Solution**: 
- Verify Supabase URL and keys are correct
- Check if Supabase project is active
- Ensure database schema has been created

### Issue 3: Authentication Errors

**Solution**:
- Verify JWT_SECRET matches Supabase JWT secret
- Check Supabase Auth settings
- Ensure RLS policies are properly configured

### Issue 4: CORS Errors in Frontend

**Solution**:
- Check Supabase Auth settings for allowed origins
- Verify frontend URL configuration
- Update CORS settings in backend if needed

## Testing Checklist

### Backend Tests
- [ ] Server starts without errors
- [ ] Supabase connection established
- [ ] Health endpoint responds correctly
- [ ] User registration works
- [ ] User login works
- [ ] JWT tokens are generated
- [ ] Shop CRUD operations work
- [ ] Family CRUD operations work
- [ ] Error handling works properly

### Frontend Tests
- [ ] App starts without errors
- [ ] User can register
- [ ] User can login
- [ ] User can logout
- [ ] Shop creation works
- [ ] Shop listing works
- [ ] Family creation works
- [ ] Family joining works
- [ ] Navigation works properly

### Database Tests
- [ ] Users are created in auth.users
- [ ] User profiles are created in public.users
- [ ] Shops are created with proper relationships
- [ ] Families are created with proper relationships
- [ ] RLS policies are working
- [ ] Triggers are functioning
- [ ] Indexes are created

## Performance Testing

### Load Testing

1. **User Registration Load**:
   ```bash
   # Use a tool like Apache Bench or Artillery
   ab -n 100 -c 10 -H "Content-Type: application/json" \
      -p user_data.json http://localhost:5000/api/auth/register
   ```

2. **Shop Listing Load**:
   ```bash
   ab -n 1000 -c 50 http://localhost:5000/api/shops
   ```

### Database Performance

1. Check query performance in Supabase Dashboard
2. Monitor database metrics
3. Verify indexes are being used

## Security Testing

### Authentication Security

1. **Test JWT Token Validation**:
   - Try accessing protected endpoints without token
   - Try accessing with expired token
   - Try accessing with invalid token

2. **Test RLS Policies**:
   - Verify users can only access their own data
   - Test cross-user data access prevention
   - Verify admin permissions work correctly

### Input Validation

1. **Test SQL Injection Prevention**:
   - Try malicious input in forms
   - Verify parameterized queries are used

2. **Test XSS Prevention**:
   - Try script injection in text fields
   - Verify input sanitization

## Migration Verification

### Data Integrity

1. **Compare Data Models**:
   - Verify all MongoDB fields are mapped to PostgreSQL
   - Check data type conversions
   - Verify relationships are maintained

2. **Test Business Logic**:
   - Verify all features work as before
   - Check calculations and validations
   - Test edge cases

### Performance Comparison

1. **Response Times**:
   - Compare API response times
   - Monitor database query performance
   - Check frontend loading times

2. **Scalability**:
   - Test with multiple concurrent users
   - Monitor resource usage
   - Check connection pooling

## Deployment Testing

### Local Deployment

1. **Build Process**:
   ```bash
   # Backend
   cd backend
   npm run build  # if applicable
   
   # Frontend
   cd frontend/LocalOffersApp
   npm run build:web
   ```

2. **Environment Variables**:
   - Test with production-like environment variables
   - Verify all secrets are properly configured

### Production Deployment

1. **Vercel Deployment**:
   - Follow the deployment guide
   - Set environment variables in Vercel
   - Test deployed application

2. **Monitoring**:
   - Set up error monitoring
   - Configure performance monitoring
   - Set up database monitoring in Supabase

## Rollback Plan

If issues are found during testing:

1. **Immediate Rollback**:
   - Revert to MongoDB configuration
   - Restore previous codebase
   - Switch DNS back to old deployment

2. **Data Recovery**:
   - Restore from MongoDB backup
   - Verify data integrity
   - Test application functionality

## Success Criteria

✅ **Migration is successful when**:
- All tests pass
- Performance is equal or better than MongoDB version
- No data loss or corruption
- All features work as expected
- Security measures are in place
- Monitoring and logging are functional

## Next Steps After Testing

1. **Documentation Update**:
   - Update API documentation
   - Update deployment guides
   - Create troubleshooting guides

2. **Team Training**:
   - Train team on Supabase features
   - Update development workflows
   - Create best practices guide

3. **Monitoring Setup**:
   - Configure alerts
   - Set up dashboards
   - Plan regular health checks