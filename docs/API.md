# API Documentation

Corporate AI REST API Reference

## Base URL

```
Production: https://corporate-ai-saas.your-subdomain.workers.dev
```

## Authentication

All API requests require a Bearer token:

```bash
Authorization: Bearer YOUR_CUSTOMER_ID
```

In production, this will be a JWT token.

## Endpoints

### Health Check

```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-02-01T12:00:00Z"
}
```

---

### Get Dashboard

```bash
GET /api/dashboard
```

**Response:**
```json
{
  "session": {
    "customerId": "cust_123",
    "tier": "growth",
    "agents": ["CEO", "CFO", "CTO"],
    "createdAt": "2024-01-15T10:00:00Z",
    "lastActive": "2024-02-01T08:30:00Z"
  },
  "agents": [
    {
      "agentId": "CEO",
      "name": "Alex",
      "role": "Chief Executive Officer",
      "status": "active",
      "lastActivity": "2024-02-01T08:30:00Z",
      "tasksCompleted": 156,
      "tasksPending": 3
    }
  ],
  "metrics": {
    "period": "2024-02",
    "apiCalls": 5234,
    "tokensUsed": 1250000,
    "agentsActive": 8,
    "tasksCompleted": 342,
    "estimatedSavings": 17100
  }
}
```

---

### List Available Agents

```bash
GET /api/dashboard/agents
```

**Response:**
```json
{
  "agents": ["CEO", "CFO", "COO", "CTO", "CMO", "CSO"]
}
```

---

### Activate Agent

```bash
POST /api/dashboard/agents/{agentId}/activate
```

**Example:**
```bash
POST /api/dashboard/agents/CMO/activate
```

**Response:**
```json
{
  "success": true,
  "message": "Agent CMO activated"
}
```

---

### Get Conversation History

```bash
GET /api/dashboard/conversations/{agentId}?limit=50
```

**Response:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Analyze our Q1 marketing spend",
      "timestamp": "2024-02-01T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Based on your Q1 data...",
      "timestamp": "2024-02-01T10:00:05Z"
    }
  ]
}
```

---

### Send Message to Agent

```bash
POST /api/dashboard/conversations/{agentId}/message
```

**Request Body:**
```json
{
  "message": "What should our Q2 marketing priorities be?"
}
```

**Response:**
```json
{
  "role": "assistant",
  "content": "Based on your Q1 performance...",
  "timestamp": "2024-02-01T10:05:00Z"
}
```

---

## Webhooks

### Whop Webhook

```bash
POST /webhooks/whop
```

**Headers:**
```
X-Whop-Signature: sha256=...
Content-Type: application/json
```

**Payload:**
```json
{
  "id": "evt_123",
  "event": "membership_went_valid",
  "data": {
    "id": "mem_123",
    "product_id": "prod_123",
    "user_id": "user_123",
    "plan": "growth",
    "status": "active"
  }
}
```

**Events:**
- `membership_went_valid` - New purchase
- `membership_renewed` - Subscription renewal
- `membership_went_invalid` - Cancellation

---

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid request format |
| 401 | Unauthorized | Missing or invalid API key |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Server error |

## Rate Limits

| Tier | Requests/Month | Burst |
|------|----------------|-------|
| Starter | 1,000 | 10/min |
| Growth | 10,000 | 60/min |
| Scale | 100,000 | 600/min |
| Enterprise | Unlimited | Unlimited |

## SDKs

Coming soon:
- JavaScript/TypeScript
- Python
- Ruby
- Go

## Support

API questions? Contact support@corporateai.work
