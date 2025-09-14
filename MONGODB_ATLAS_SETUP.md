# MongoDB Atlas Setup for Production Deployment

The current application is experiencing database connection timeouts because it's trying to connect to a local MongoDB instance (`localhost:27017`) while deployed on Vercel, where localhost is not accessible.

## Issue
- Error: `Operation 'users.findOne()' buffering timed out after 10000ms`
- The backend is deployed on Vercel but configured to use a local MongoDB connection
- Production deployments need a cloud-based database solution

## Solution: Set up MongoDB Atlas

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new project

### Step 2: Create a Cluster
1. Click "Build a Database"
2. Choose the **FREE** tier (M0 Sandbox)
3. Select your preferred cloud provider and region
4. Name your cluster (e.g., "localoffers-cluster")
5. Click "Create Cluster" (takes 5-10 minutes)

### Step 3: Configure Database Access
1. Go to "Database Access" under Security
2. Click "Add New Database User"
3. Create a username and strong password
4. Set privileges to "Read and write to any database"
5. Click "Add User"

### Step 4: Configure Network Access
1. Go to "Network Access" under Security
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (sets to 0.0.0.0/0)
4. Click "Confirm"

### Step 5: Get Connection String
1. Go back to "Clusters"
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and version 4.1 or later
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/localoffers?retryWrites=true&w=majority
   ```

### Step 6: Update Vercel Environment Variable
Run this command to update the production MongoDB URI:

```bash
vercel env rm MONGODB_URI production
vercel env add MONGODB_URI production
```

When prompted, paste your Atlas connection string (replace `<username>` and `<password>` with your actual credentials).

### Step 7: Redeploy
```bash
vercel --prod
```

## Example Connection String Format
```
mongodb+srv://myuser:mypassword@localoffers-cluster.abc123.mongodb.net/localoffers?retryWrites=true&w=majority
```

## Important Notes
- Replace `<username>` and `<password>` with your actual database user credentials
- The database name `localoffers` will be created automatically when first accessed
- Make sure to URL-encode special characters in passwords
- Keep your credentials secure and never commit them to version control

## Testing the Connection
After updating the environment variable and redeploying, test the login functionality. The database connection timeout error should be resolved.