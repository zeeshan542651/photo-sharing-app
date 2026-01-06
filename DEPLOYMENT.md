# Photo Sharing App Deployment Guide for Azure

This guide explains how to deploy Photo Sharing App to Azure with the server on Azure Web App and client on Azure Static Web Apps.

## Security Features

The application includes these security measures:

1. **Helmet.js** - Security headers (XSS protection, Content-Security-Policy, etc.)
2. **CORS** - Configured to only allow your frontend domain
3. **Rate Limiting** - 900 requests per 15 minutes per IP
4. **Secure Sessions** - HttpOnly, Secure cookies with SameSite protection
5. **Password Hashing** - scrypt with timing-safe comparison
6. **Input Validation** - Zod schemas validate all API inputs
7. **SQL Injection Protection** - Drizzle ORM with parameterized queries

## Prerequisites

1. Azure account with active subscription
2. Azure CLI installed (`az --version`)
3. Node.js 18+ installed locally
4. Git repository for your code

## Step 1: Create Azure Resources

### 1.1 Create Resource Group

```bash
az group create --name photo-sharing-app-rg --location eastus
```

### 1.2 Create Azure PostgreSQL Database

```bash
az postgres flexible-server create \
  --resource-group photo-sharing-app-rg \
  --name photo-sharing-app-db-server \
  --location eastus \
  --admin-user luminaadmin \
  --admin-password YOUR_STRONG_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15


az postgres flexible-server db create \
  --resource-group photo-sharing-app-rg \
  --server-name photo-sharing-app-db-server \
  --database-name photo-sharing-app
```

### 1.3 Create Azure Blob Storage

```bash
az storage account create \
  --name luminastorage \
  --resource-group photo-sharing-app-rg \
  --location eastus \
  --sku Standard_LRS

az storage container create \
  --name photos \
  --account-name luminastorage \
  --public-access blob
```

### 1.4 Create Azure Web App (for Server)

```bash
az appservice plan create \
  --name photo-sharing-app-plan \
  --resource-group photo-sharing-app-rg \
  --sku B1 \
  --is-linux

az webapp create \
  --resource-group photo-sharing-app-rg \
  --plan photo-sharing-app-plan \
  --name photo-sharing-app-api \
  --runtime "NODE:18-lts"
```

## Step 2: Configure Environment Variables

### 2.1 Server Environment Variables (Azure Web App)

Go to Azure Portal > photo-sharing-app-api > Configuration > Application settings:
Add environment variables

### 2.2 Client Environment Variables (Static Web App)

Create `staticwebapp.config.json` in your client folder:

```json
{
  "routes": [
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  }
}
```

Set build-time environment variable:

- `VITE_API_BASE_URL` = `https://photo-sharing-app-api.azurewebsites.net`

## Step 3: Build and Deploy

### 3.1 Build Server

```bash
npm run build
```

This creates `dist/` folder with compiled server code.

### 3.2 Deploy Server to Azure Web App

Option A: GitHub Actions (Recommended)

```yaml
# .github/workflows/deploy-server.yml
name: Deploy Server

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build
      - uses: azure/webapps-deploy@v2
        with:
          app-name: photo-sharing-app-api
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: dist
```

Option B: Manual Deploy

```bash
cd dist
zip -r ../deploy.zip .
az webapp deployment source config-zip \
  --resource-group photo-sharing-app-rg \
  --name photo-sharing-app-api \
  --src ../deploy.zip
```

## Step 4: Database Migration

Run migrations after deployment:

```bash
DATABASE_URL="your-azure-db-url" npm run db:push
```

## Step 5: Verify Deployment

1. Check server health: `https://photo-sharing-app-api.azurewebsites.net/api/user`
2. Check client: `https://photo-sharing-app-client.azurestaticapps.net`
3. Test login/registration
4. Test photo upload

## Troubleshooting

### CORS Errors

- Verify `ALLOWED_ORIGINS` includes your exact frontend URL
- Check browser console for specific CORS error details

### Session Issues

- Ensure `SESSION_SECRET` is set
- Verify `sameSite: 'none'` and `secure: true` for cross-origin

### Database Connection

- Check firewall rules allow Azure Web App IPs
- Verify SSL mode is enabled

### Static Files Not Loading

- Check `staticwebapp.config.json` routing rules
- Verify build output includes all assets

## Security Checklist

- [ ] Strong SESSION_SECRET (64+ characters)
- [ ] HTTPS only (Azure provides by default)
- [ ] Database firewall configured
- [ ] CORS whitelist only your domains
- [ ] Rate limiting enabled
- [ ] No secrets in code/git
- [ ] Regular dependency updates
