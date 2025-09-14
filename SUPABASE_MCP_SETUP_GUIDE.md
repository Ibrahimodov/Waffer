# Supabase MCP Server Setup Guide

## Overview
This guide will help you complete the setup of the Supabase MCP server for your Local Offers App project.

## Prerequisites
✅ **Completed Steps:**
- ✅ `@supabase/mcp-server-supabase@0.5.3` - Installed locally and globally
- ✅ `@modelcontextprotocol/sdk@1.18.0` - MCP SDK installed globally  
- ✅ `@supabase/supabase-js@2.57.4` - Supabase JavaScript client installed globally
- ✅ NPX cache cleared - Resolved MODULE_NOT_FOUND errors
- ✅ Local installation completed - Package accessible via npx
- ✅ MCP configuration files updated with Supabase-only server setup
- ✅ Vercel configuration removed from MCP files (separate concern)

## Required Configuration Steps

### 1. Get Your Supabase Credentials

#### Personal Access Token (PAT)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click on your profile icon in the top right corner
3. Select "Access Tokens" from the dropdown menu
4. Click "Generate new token"
5. Give your token a name (e.g., "Trae MCP Server")
6. Copy the generated token (it starts with `sbp_`)

#### Project Reference ID
1. Go to your Supabase project dashboard
2. Navigate to Settings > General
3. Copy your "Project ID" (also called project reference)

### 2. Update MCP Configuration Files

You need to update both configuration files with your actual credentials:

#### File 1: `.trae/mcp.json`
#### File 2: `.cursor/mcp.json`

In both files, replace the placeholder values:
- Replace `<your-project-ref>` with your actual Supabase project ID
- Replace `<your-personal-access-token>` with your actual PAT

**Example:**
```json
"args": [
  "/c",
  "npx",
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--read-only",
  "--project-ref=abcdefghijklmnop"
],
"env": {
  "SUPABASE_ACCESS_TOKEN": "sbp_1234567890abcdef..."
}
```

### 3. Security Best Practices

- **Read-Only Mode**: The `--read-only` flag is included to prevent unintended database changes
- **Project Scoping**: The `--project-ref` flag limits access to your specific project
- **Token Security**: Keep your access token secure and never commit it to version control

### 4. Alternative Configuration (If Issues Persist)

If you encounter issues with the npx approach, you can use the direct path to the installed module:

```json
"supabase": {
  "command": "node",
  "args": [
    "C:\\Users\\ibrah\\AppData\\Roaming\\npm\\node_modules\\@supabase\\mcp-server-supabase\\dist\\stdio.js",
    "--read-only",
    "--project-ref=<your-project-ref>",
    "--access-token",
    "<your-personal-access-token>"
  ]
}
```

### 5. Restart Your IDE

After updating the configuration:
1. Save both MCP configuration files
2. Completely close and restart Trae/Cursor
3. The Supabase MCP server should now be available

### 6. Verify Setup

Once configured, you should be able to:
- Query your Supabase database through the AI assistant
- Fetch project configuration
- Generate TypeScript types from your database schema
- Run read-only SQL queries

## Troubleshooting

### Common Issues:

1. **Module Not Found Error**: Ensure the global installation completed successfully
2. **Authentication Error**: Verify your PAT is correct and has proper permissions
3. **Project Access Error**: Confirm your project reference ID is accurate
4. **Windows Path Issues**: Ensure you're using the `cmd /c` prefix for Windows

### Testing the Setup:

You can test if the MCP server is working by asking your AI assistant to:
- "Show me the tables in my Supabase database"
- "What's the structure of my users table?"
- "Generate TypeScript types for my database schema"

## Next Steps

Once the Supabase MCP server is configured:
1. Test database connectivity
2. Explore available MCP tools and commands
3. Use the AI assistant to help with database operations
4. Consider setting up additional MCP servers for other services

## Support

If you encounter issues:
- Check the [Supabase MCP Documentation](https://supabase.com/docs/guides/getting-started/mcp)
- Review the [GitHub repository](https://github.com/supabase-community/supabase-mcp)
- Ensure Node.js version compatibility (v18+ recommended)