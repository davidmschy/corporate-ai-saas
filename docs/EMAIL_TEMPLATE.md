# Welcome Email Template

This is the welcome email sent to new customers after purchase.

## Email Details

- **From:** welcome@corporateai.work
- **Subject:** 🚀 Welcome to Corporate AI - Your AI Workforce is Ready!
- **Type:** HTML + Plain Text

## Preview

```
🚀 Welcome to Corporate AI

Thank you for joining Corporate AI! Your AI Workforce is Ready.

QUICK START (5 minutes):
1. Access your dashboard
2. Activate your agents
3. Connect integrations
4. Start collaborating

[🎯 Set Up Your AI Workforce]
```

## HTML Template Location

Full HTML template is in: `src/whop/webhook.ts`

## Customization

To customize the welcome email:

1. Edit `src/whop/webhook.ts`
2. Modify `getWelcomeEmailTemplate()` method
3. Redeploy to Cloudflare Workers

## Variables

Available template variables:
- `{{customerId}}` - Customer's unique ID
- `{{tier}}` - Subscription tier (starter/growth/scale/enterprise)
- `{{setupUrl}}` - Direct link to dashboard setup

## Testing

Test email delivery:

```bash
curl -X POST https://api.agentmail.to/v1/send \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "from": "welcome@corporateai.work",
    "subject": "Test Welcome Email",
    "html": "<h1>Test</h1>"
  }'
```

## Email Deliverability Tips

1. **DKIM/SPF:** Set up for corporateai.work domain
2. **Subject Line:** Keep under 50 characters
3. **Preheader:** First 100 characters matter
4. **Images:** Include alt text
5. **CTA:** Single clear call-to-action
6. **Mobile:** Test on mobile devices
7. **Unsubscribe:** Include footer with unsubscribe link
