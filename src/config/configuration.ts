export const configuration = () => ({
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || "gpt-4o",
    maxTokens: Number.parseInt(process.env.OPENAI_MAX_TOKENS, 10) || 2000,
    temperature: Number.parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
  },
  auth: {
    apiKeys: process.env.API_KEYS?.split(",") || [],
  },
  rateLimit: {
    ttl: Number.parseInt(process.env.RATE_LIMIT_TTL, 10) || 60000,
    limit: Number.parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
})
