# Environment Variables

This document lists all environment variables required for the Corporate AI platform.

## Required Variables

### AI Model APIs
```bash
# OpenAI (for GPT-4, GPT-3.5)
OPENAI_API_KEY=sk-...

# Anthropic (for Claude)
ANTHROPIC_API_KEY=sk-ant-...
```

### Payment & Webhooks
```bash
# Whop API Key
WHOP_API_KEY=apik_...

# Webhook Secret (for verifying Whop webhooks)
WEBHOOK_SECRET=your_random_secret_here
```

### Email
```bash
# AgentMail.to API Key
AGENTMAIL_API_KEY=am_...
```

### Cloudflare
```bash
# KV Namespace binding (set via wrangler.toml)
CORPORATE_AI_KV=your_kv_namespace_id

# R2 Bucket for documents (set via wrangler.toml)
DOCUMENTS=your_r2_bucket_name
```

## Setting Secrets

### Local Development
Create `.env` file:
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
WHOP_API_KEY=apik_...
AGENTMAIL_API_KEY=am_...
WEBHOOK_SECRET=super_secret_123
```

### Cloudflare Workers (Production)
Use wrangler CLI:
```bash
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put WHOP_API_KEY
wrangler secret put AGENTMAIL_API_KEY
wrangler secret put WEBHOOK_SECRET
```

### GitHub Actions (CI/CD)
Add to repository secrets:
- Settings → Secrets and variables → Actions
- Add each secret with prefix: `CF_`

## Optional Variables

### Monitoring
```bash
# Sentry DSN for error tracking
SENTRY_DSN=https://...

# Log level (debug, info, warn, error)
LOG_LEVEL=info
```

### Feature Flags
```bash
# Enable beta features
ENABLE_BETA_FEATURES=false

# Rate limiting
RATE_LIMIT_REQUESTS=1000
```

### Integrations
```bash
# Slack OAuth
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...

# Salesforce
SALESFORCE_CLIENT_ID=...
SALESFORCE_CLIENT_SECRET=...
```

## Security Best Practices

1. **Never commit secrets** to git (use .gitignore)
2. **Rotate keys regularly** (every 90 days)
3. **Use different keys** for dev/staging/prod
4. **Limit permissions** on API keys
5. **Monitor usage** for anomalies

## Verification

Test all secrets are set:
```bash
wrangler secret list
```

## Troubleshooting

### Secret not found
```
Error: Secret not found
```
Solution: Run `wrangler secret put VARIABLE_NAME`

### Permission denied
```
Error: 401 Unauthorized
```
Solution: Check API key is correct and has required permissions

### KV namespace error
```
Error: KV namespace not found
```
Solution: Verify KV binding in wrangler.toml matches your account
