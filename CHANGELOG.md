# Changelog

All notable changes to Corporate AI will be documented in this file.

## [1.0.0] - 2024-02-01

### Added
- Initial release of Corporate AI platform
- 8 C-suite AI agents (CEO, CFO, COO, CTO, CMO, CSO, CHRO, General Counsel)
- 8 Board of Director AI agents
- 3 Financial team AI agents (CRO, Hustler, Fundraising)
- Customer dashboard with agent management
- Whop webhook integration for subscriptions
- Automated welcome email system
- Cloudflare Workers deployment
- REST API for dashboard operations
- Tier-based pricing (Starter, Growth, Scale, Enterprise)

### Features by Tier

**Starter ($99/month)**
- 3 AI agents (CEO, CFO, COO)
- 1,000 API requests/month
- Basic dashboard
- Email support

**Growth ($299/month)**
- 8 C-suite agents
- 10,000 API requests/month
- Advanced analytics
- Priority support

**Scale ($799/month)**
- 20 agents (C-suite + Board + Financial)
- 100,000 API requests/month
- Custom agent training
- Dedicated support

**Enterprise (Custom)**
- Unlimited agents
- Unlimited API requests
- On-premise option
- White-glove onboarding

### Technical
- TypeScript codebase
- Cloudflare Workers hosting
- KV storage for sessions
- R2 storage for documents
- AgentMail.to for email delivery
- SOC 2 compliant architecture
