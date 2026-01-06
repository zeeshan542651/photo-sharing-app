# Lumina Deployment Guide for Azure

This guide explains how to deploy Lumina to Azure with the server on Azure Web App and client on Azure Static Web Apps.

## Architecture Overview

```
┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│   Azure Static Web App          │     │   Azure Web App                 │
│   (Client - React)              │────▶│   (Server - Express API)        │
│   yoursite.azurestaticapps.net  │     │   yourapi.azurewebsites.net     │
└─────────────────────────────────┘     └─────────────────────────────────┘
                                                        │
                                                        ▼
                                        ┌─────────────────────────────────┐
                                        │   Azure PostgreSQL              │
                                        │   (Database)                    │
                                        └─────────────────────────────────┘
                                                        │
                                                        ▼
                                        ┌─────────────────────────────────┐
                                        │   Azure Blob Storage            │
                                        │   (Photo Storage)               │
                                        └─────────────────────────────────┘
```

## Security Features

The application includes these security measures:

1. **Helmet.js** - Security headers (XSS protection, Content-Security-Policy, etc.)
2. **CORS** - Configured to only allow your frontend domain
3. **Rate Limiting** - 100 requests per 15 minutes per IP
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
az group create --name lumina-rg --location eastus
```

### 1.2 Create Azure PostgreSQL Database

```bash
az postgres flexible-server create \
  --resource-group lumina-rg \
  --name lumina-db-server \
  --location eastus \
  --admin-user luminaadmin \
  --admin-password YOUR_STRONG_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15

# photo_sharing_app_admin
# gf)F=l3pC{5lb'wWp58M6

az postgres flexible-server db create \
  --resource-group lumina-rg \
  --server-name lumina-db-server \
  --database-name lumina
```

### 1.3 Create Azure Blob Storage

```bash
az storage account create \
  --name luminastorage \
  --resource-group lumina-rg \
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
  --name lumina-plan \
  --resource-group lumina-rg \
  --sku B1 \
  --is-linux

az webapp create \
  --resource-group lumina-rg \
  --plan lumina-plan \
  --name lumina-api \
  --runtime "NODE:18-lts"
```

### 1.5 Create Azure Static Web App (for Client)

```bash
az staticwebapp create \
  --name lumina-client \
  --resource-group lumina-rg \
  --location eastus2
```

## Step 2: Configure Environment Variables

### 2.1 Server Environment Variables (Azure Web App)

Go to Azure Portal > lumina-api > Configuration > Application settings:

| Name                    | Value                                                                                                        | Description            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `NODE_ENV`              | `production`                                                                                                 | Production mode        |
| `DATABASE_URL`          | `postgresql://luminaadmin:PASSWORD@lumina-db-server.postgres.database.azure.com:5432/lumina?sslmode=require` | Database connection    |
| `SESSION_SECRET`        | `your-64-char-random-string`                                                                                 | Session encryption key |
| `ALLOWED_ORIGINS`       | `https://lumina-client.azurestaticapps.net`                                                                  | Your frontend URL      |
| `AZURE_STORAGE_ACCOUNT` | `luminastorage`                                                                                              | Blob storage account   |
| `AZURE_STORAGE_KEY`     | `your-storage-key`                                                                                           | Storage access key     |

Generate a strong SESSION_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

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

- `VITE_API_BASE_URL` = `https://lumina-api.azurewebsites.net`

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
    paths:
      - "server/**"
      - "shared/**"

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
          app-name: lumina-api
          publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE }}
          package: dist
```

Option B: Manual Deploy

```bash
cd dist
zip -r ../deploy.zip .
az webapp deployment source config-zip \
  --resource-group lumina-rg \
  --name lumina-api \
  --src ../deploy.zip
```

### 3.3 Deploy Client to Azure Static Web App

Option A: GitHub Actions (Automatic with Azure SWA)

- Connect your GitHub repo in Azure Portal
- Azure auto-generates workflow file

Option B: Manual via Azure CLI

```bash
npm run build
az staticwebapp upload \
  --name lumina-client \
  --resource-group lumina-rg \
  --source dist/public
```

## Step 4: Database Migration

Run migrations after deployment:

```bash
DATABASE_URL="your-azure-db-url" npm run db:push
```

## Step 5: Verify Deployment

1. Check server health: `https://lumina-api.azurewebsites.net/api/user`
2. Check client: `https://lumina-client.azurestaticapps.net`
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

## Cost Estimate (Monthly)

| Resource       | SKU           | Estimated Cost |
| -------------- | ------------- | -------------- |
| Web App        | B1            | ~$13           |
| PostgreSQL     | Standard_B1ms | ~$25           |
| Static Web App | Free          | $0             |
| Blob Storage   | Standard LRS  | ~$2            |
| **Total**      |               | **~$40/month** |

## Security Checklist

- [ ] Strong SESSION_SECRET (64+ characters)
- [ ] HTTPS only (Azure provides by default)
- [ ] Database firewall configured
- [ ] CORS whitelist only your domains
- [ ] Rate limiting enabled
- [ ] No secrets in code/git
- [ ] Regular dependency updates
