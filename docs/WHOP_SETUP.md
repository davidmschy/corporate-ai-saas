# Whop Product Setup Guide

This guide walks you through creating the Corporate AI product listing on Whop.

## Prerequisites
- Whop seller account (David's account)
- Access to Whop Dashboard

## Step 1: Create New Product

1. Go to https://whop.com/dashboard
2. Click "Create Product"
3. Select "Digital Product"

## Step 2: Basic Information

**Product Name:**
```
Corporate AI - AI Workforce as a Service
```

**Description:**
```
Deploy a complete AI executive team that works 24/7 for less than the cost of one human employee.

Get AI-powered C-suite executives (CEO, CFO, CTO, CMO, CSO, CHRO, General Counsel), a full Board of Directors (8 AI directors), and specialized financial team members (CRO, Business Development, Fundraising).

✅ Setup in 5 minutes
✅ 24/7 availability
✅ Integrates with Slack, Gmail, Salesforce, and 50+ tools
✅ 99% cheaper than human executives
✅ SOC 2 compliant & GDPR ready

Perfect for startups, scale-ups, and enterprises looking to augment their leadership team with AI.
```

**Category:** Business/Software

**Tags:**
- AI
- Business
- Automation
- SaaS
- Enterprise
- Productivity

## Step 3: Pricing Plans

### Plan 1: Starter
- **Name:** Starter
- **Price:** $99/month
- **Description:** 3 AI C-suite agents for startups and small teams
- **Features:**
  - CEO, CFO, COO Agents
  - 1,000 API requests/month
  - Basic dashboard
  - Email support
  - Slack integration

### Plan 2: Growth
- **Name:** Growth
- **Price:** $299/month
- **Description:** 8 AI C-suite agents for growing companies
- **Features:**
  - All C-suite agents (CEO, CFO, COO, CTO, CMO, CSO, CHRO, General Counsel)
  - 10,000 API requests/month
  - Advanced analytics
  - Priority support
  - All integrations

### Plan 3: Scale
- **Name:** Scale
- **Price:** $799/month
- **Description:** Full C-suite + Board of Directors for scale-ups
- **Features:**
  - 20 AI agents (C-suite + Board)
  - 100,000 API requests/month
  - Custom agent training
  - Dedicated support
  - Full API access

### Plan 4: Enterprise
- **Name:** Enterprise
- **Price:** Contact Us (custom)
- **Description:** Unlimited agents with white-glove service
- **Features:**
  - Unlimited AI agents
  - Unlimited API requests
  - On-premise option
  - SLA guarantees
  - Dedicated account manager

## Step 4: Product Media

### Thumbnail
- Use a professional image of executives/AI interface
- Recommended: 1200x630px

### Gallery Images
1. Dashboard screenshot showing AI agents
2. C-suite agent icons
3. Integration logos (Slack, Gmail, Salesforce, etc.)
4. Pricing comparison chart
5. Security/compliance badges

## Step 5: Webhook Configuration

After product creation, set up webhooks:

**Webhook URL:**
```
https://corporate-ai-saas.your-subdomain.workers.dev/webhooks/whop
```

**Events to Subscribe:**
- ✅ membership_went_valid (new purchase)
- ✅ membership_renewed (subscription renewal)
- ✅ membership_went_invalid (cancellation)

**Webhook Secret:**
Generate a secure random string and save it in:
1. Whop dashboard webhook settings
2. Cloudflare Workers secrets (WEBHOOK_SECRET)

## Step 6: Welcome Email Setup

The webhook handler automatically sends welcome emails via AgentMail.to. Ensure:

1. AGENTMAIL_API_KEY is set in environment variables
2. Email template is in `src/whop/webhook.ts`

## Step 7: Delivery Method

**Delivery Type:** URL Redirection

**Redirect URL:**
```
https://dashboard.corporateai.work/setup?customer={customer_id}
```

Or use the webhook to send setup instructions via email.

## Step 8: Testing

Before going live:

1. Create a test purchase with 100% discount code
2. Verify webhook receives event
3. Confirm welcome email is sent
4. Test dashboard access
5. Verify agent activation works

## Post-Setup Checklist

- [ ] Product created on Whop
- [ ] All 4 pricing plans configured
- [ ] Webhook URL configured
- [ ] Webhook secret generated and stored
- [ ] Test purchase completed
- [ ] Welcome email received
- [ ] Dashboard access working
- [ ] Product set to "Published"

## Product URL

Once published, your product will be available at:
```
https://whop.com/corporate-ai
```

Or customize the slug in Whop settings.

## Support

For issues with setup:
1. Check webhook logs in Whop dashboard
2. Verify Cloudflare Worker logs
3. Test email delivery via AgentMail.to
4. Contact: support@corporateai.work
