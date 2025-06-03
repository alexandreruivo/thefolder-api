#!/bin/bash

# Railway deployment script
echo "🚀 Starting Railway deployment..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway login --browserless

# Deploy to Railway
echo "📦 Deploying to Railway..."
railway up

echo "✅ Deployment completed!"
echo "🌐 Your application should be available at your Railway domain"
