# Railway Deployment Guide

This guide will help you deploy your NestJS ChatGPT Wrapper to Railway.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Environment Variables**: Have your environment variables ready

## Deployment Steps

### Option 1: Deploy via Railway Dashboard (Recommended)

1. **Connect GitHub Repository**
   - Go to [railway.app](https://railway.app)
   - Click "Start a New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Environment Variables**
   Add the following environment variables in Railway dashboard:
   \`\`\`
   NODE_ENV=production
   PORT=3000
   OPENAI_API_KEY=your_openai_api_key
   OPENAI_MODEL=gpt-4o
   OPENAI_MAX_TOKENS=2000
   OPENAI_TEMPERATURE=0.7
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   RATE_LIMIT_TTL=60000
   RATE_LIMIT_MAX=100
   ALLOWED_ORIGINS=https://your-domain.railway.app
   \`\`\`

3. **Deploy**
   - Railway will automatically detect the Node.js project
   - It will install dependencies and build the application
   - Your app will be deployed and accessible via a Railway domain

### Option 2: Deploy via Railway CLI

1. **Install Railway CLI**
   \`\`\`bash
   npm install -g @railway/cli
   \`\`\`

2. **Login to Railway**
   \`\`\`bash
   railway login
   \`\`\`

3. **Initialize Railway Project**
   \`\`\`bash
   railway init
   \`\`\`

4. **Set Environment Variables**
   \`\`\`bash
   railway variables set NODE_ENV=production
   railway variables set PORT=3000
   railway variables set OPENAI_API_KEY=your_openai_api_key
   # ... add all other environment variables
   \`\`\`

5. **Deploy**
   \`\`\`bash
   railway up
   \`\`\`

### Option 3: Use Deployment Script

1. **Make the script executable**
   \`\`\`bash
   chmod +x scripts/deploy.sh
   \`\`\`

2. **Run the deployment script**
   \`\`\`bash
   ./scripts/deploy.sh
   \`\`\`

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production) | Yes |
| `PORT` | Server port (3000) | Yes |
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |
| `OPENAI_MODEL` | Default model (gpt-4o) | No |
| `OPENAI_MAX_TOKENS` | Max tokens per request | No |
| `OPENAI_TEMPERATURE` | Model temperature | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `RATE_LIMIT_TTL` | Rate limit time window | No |
| `RATE_LIMIT_MAX` | Max requests per window | No |
| `ALLOWED_ORIGINS` | CORS allowed origins | No |

## Post-Deployment

1. **Test the API**
   \`\`\`bash
   curl https://your-app.railway.app/api/v1/health
   \`\`\`

2. **Check API Documentation**
   Visit: `https://your-app.railway.app/api/docs`

3. **Monitor Logs**
   \`\`\`bash
   railway logs
   \`\`\`

## Custom Domain (Optional)

1. Go to your Railway project dashboard
2. Click on "Settings"
3. Scroll to "Domains"
4. Add your custom domain
5. Update DNS records as instructed

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compiles without errors
   - Verify environment variables are set

2. **Runtime Errors**
   - Check Railway logs: `railway logs`
   - Verify Supabase connection
   - Ensure OpenAI API key is valid

3. **Database Connection Issues**
   - Verify Supabase environment variables
   - Check Supabase project status
   - Ensure database tables exist

### Getting Help

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Check Railway status: [status.railway.app](https://status.railway.app)

## Scaling

Railway automatically handles scaling, but you can:
- Monitor usage in Railway dashboard
- Set up alerts for high usage
- Upgrade to Pro plan for better performance
- Configure auto-scaling policies
