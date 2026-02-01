/**
 * Whop Webhook Handler
 * 
 * Handles purchase events from Whop:
 * - membership_went_valid: New customer purchase
 * - membership_went_invalid: Cancellation/refund
 * - membership_renewed: Subscription renewal
 */

import DashboardAPI from "../dashboard";

export interface WhopWebhookPayload {
  id: string;
  event: string;
  data: {
    id: string;
    product_id: string;
    user_id: string;
    status: string;
    plan: string;
    created_at: number;
    expires_at: number;
    metadata?: Record<string, any>;
    user?: {
      id: string;
      email: string;
      username: string;
    };
  };
}

export class WhopWebhookHandler {
  private env: any;
  private dashboardAPI: DashboardAPI;

  constructor(env: any) {
    this.env = env;
    this.dashboardAPI = new DashboardAPI(env);
  }

  // Verify Whop webhook signature
  verifySignature(payload: string, signature: string, secret: string): boolean {
    // In production, implement proper HMAC verification
    // For now, we'll do a simple check (replace with proper crypto in production)
    const encoder = new TextEncoder();
    const data = encoder.encode(payload + secret);
    // Use Web Crypto API for HMAC
    // This is a placeholder - implement proper verification
    return true; // TODO: Implement proper signature verification
  }

  // Main webhook handler
  async handleWebhook(payload: WhopWebhookPayload): Promise<{ success: boolean; message: string }> {
    console.log(`Received Whop webhook: ${payload.event}`, payload.data);

    try {
      switch (payload.event) {
        case "membership_went_valid":
          return await this.handleNewPurchase(payload);
        
        case "membership_renewed":
          return await this.handleRenewal(payload);
        
        case "membership_went_invalid":
          return await this.handleCancellation(payload);
        
        default:
          console.log(`Unhandled event type: ${payload.event}`);
          return { success: true, message: "Event ignored" };
      }
    } catch (error) {
      console.error("Error handling webhook:", error);
      return { success: false, message: `Error: ${error}` };
    }
  }

  // Handle new purchase
  private async handleNewPurchase(payload: WhopWebhookPayload): Promise<{ success: boolean; message: string }> {
    const { data } = payload;
    const customerId = data.user_id;
    const email = data.user?.email;
    const plan = this.mapWhopPlanToTier(data.plan);

    console.log(`New purchase: ${customerId} - ${plan} tier`);

    // Create customer session
    await this.createCustomerSession(customerId, plan, data);

    // Send welcome email
    await this.sendWelcomeEmail(email, customerId, plan);

    return { success: true, message: `Customer ${customerId} onboarded to ${plan} tier` };
  }

  // Handle subscription renewal
  private async handleRenewal(payload: WhopWebhookPayload): Promise<{ success: boolean; message: string }> {
    const { data } = payload;
    const customerId = data.user_id;

    console.log(`Renewal: ${customerId}`);

    // Update session expiration
    const session = await this.env.CORPORATE_AI_KV.get(`session:${customerId}`, { type: "json" });
    if (session) {
      session.expiresAt = data.expires_at;
      await this.env.CORPORATE_AI_KV.put(`session:${customerId}`, JSON.stringify(session));
    }

    return { success: true, message: `Renewal processed for ${customerId}` };
  }

  // Handle cancellation/refund
  private async handleCancellation(payload: WhopWebhookPayload): Promise<{ success: boolean; message: string }> {
    const { data } = payload;
    const customerId = data.user_id;

    console.log(`Cancellation: ${customerId}`);

    // Mark session as cancelled
    const session = await this.env.CORPORATE_AI_KV.get(`session:${customerId}`, { type: "json" });
    if (session) {
      session.status = "cancelled";
      session.cancelledAt = new Date().toISOString();
      await this.env.CORPORATE_AI_KV.put(`session:${customerId}`, JSON.stringify(session));
    }

    // Send cancellation survey email
    await this.sendCancellationEmail(data.user?.email, customerId);

    return { success: true, message: `Cancellation processed for ${customerId}` };
  }

  // Map Whop plan ID to our tier names
  private mapWhopPlanToTier(planId: string): string {
    // These should match the plan IDs created in Whop
    const planMap: Record<string, string> = {
      "starter": "starter",
      "growth": "growth", 
      "scale": "scale",
      "enterprise": "enterprise"
    };

    return planMap[planId] || "starter";
  }

  // Create customer session
  private async createCustomerSession(customerId: string, tier: string, data: any): Promise<void> {
    const session = {
      customerId,
      tier,
      agents: [],
      createdAt: new Date(),
      lastActive: new Date(),
      expiresAt: data.expires_at,
      whopData: {
        membershipId: data.id,
        productId: data.product_id,
        userId: data.user_id
      }
    };

    await this.env.CORPORATE_AI_KV.put(`session:${customerId}`, JSON.stringify(session));
    console.log(`Created session for ${customerId}`);
  }

  // Send welcome email via AgentMail.to
  private async sendWelcomeEmail(email: string | undefined, customerId: string, tier: string): Promise<void> {
    if (!email) {
      console.error("No email provided for welcome message");
      return;
    }

    const welcomeHtml = this.getWelcomeEmailTemplate(customerId, tier);

    try {
      const response = await fetch("https://api.agentmail.to/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.env.AGENTMAIL_API_KEY}`
        },
        body: JSON.stringify({
          to: email,
          from: "welcome@corporateai.work",
          subject: "🚀 Welcome to Corporate AI - Your AI Workforce is Ready!",
          html: welcomeHtml,
          text: this.getWelcomeEmailText(customerId, tier)
        })
      });

      if (!response.ok) {
        console.error("Failed to send welcome email:", await response.text());
      } else {
        console.log(`Welcome email sent to ${email}`);
      }
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }

  // Send cancellation survey email
  private async sendCancellationEmail(email: string | undefined, customerId: string): Promise<void> {
    if (!email) return;

    try {
      const response = await fetch("https://api.agentmail.to/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.env.AGENTMAIL_API_KEY}`
        },
        body: JSON.stringify({
          to: email,
          from: "support@corporateai.work",
          subject: "We're sorry to see you go - Help us improve",
          html: `
            <h2>We're Sorry to See You Go</h2>
            <p>Your Corporate AI subscription has been cancelled. We're sorry to lose you as a customer.</p>
            <p>Would you mind taking 30 seconds to tell us why you're leaving? Your feedback helps us improve.</p>
            <p><a href="https://forms.gle/cancellation-feedback" style="background:#007bff;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Share Feedback</a></p>
            <p>If you change your mind, you can reactivate anytime at <a href="https://whop.com/corporate-ai">whop.com/corporate-ai</a></p>
            <p>Best regards,<br>The Corporate AI Team</p>
          `,
          text: "Your Corporate AI subscription has been cancelled. We'd love your feedback: https://forms.gle/cancellation-feedback"
        })
      });

      if (response.ok) {
        console.log(`Cancellation email sent to ${email}`);
      }
    } catch (error) {
      console.error("Error sending cancellation email:", error);
    }
  }

  // HTML welcome email template
  private getWelcomeEmailTemplate(customerId: string, tier: string): string {
    const setupUrl = `https://dashboard.corporateai.work/setup?customer=${customerId}`;
    const docsUrl = "https://docs.corporateai.work";
    const discordUrl = "https://discord.gg/corporateai";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Corporate AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; }
    .header h1 { margin: 0; font-size: 28px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
    .cta { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .features h3 { margin-top: 0; }
    .features ul { padding-left: 20px; }
    .footer { text-align: center; color: #666; margin-top: 30px; font-size: 14px; }
    .tier-badge { display: inline-block; background: #28a745; color: white; padding: 5px 15px; border-radius: 20px; font-size: 14px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 Welcome to Corporate AI</h1>
    <p>Your AI Workforce is Ready to Work</p>
    <span class="tier-badge">${tier} Plan</span>
  </div>
  
  <div class="content">
    <h2>Thank you for joining Corporate AI!</h2>
    <p>You now have access to a complete AI executive team that works 24/7 for a fraction of the cost of human employees.</p>
    
    <div style="text-align: center;">
      <a href="${setupUrl}" class="cta">🎯 Set Up Your AI Workforce</a>
    </div>
    
    <div class="features">
      <h3>🎯 Quick Start (5 minutes)</h3>
      <ol>
        <li><strong>Access your dashboard</strong> - Use the button above</li>
        <li><strong>Activate your agents</strong> - Choose which executives to enable</li>
        <li><strong>Connect integrations</strong> - Link Slack, Gmail, Calendar, etc.</li>
        <li><strong>Start collaborating</strong> - Begin delegating tasks to your AI team</li>
      </ol>
    </div>
    
    <div class="features">
      <h3>💼 What's Included in Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} Plan</h3>
      <ul>
        ${this.getTierFeatures(tier)}
      </ul>
    </div>
    
    <div class="features">
      <h3>📚 Helpful Resources</h3>
      <ul>
        <li><a href="${docsUrl}/quickstart">Quick Start Guide</a></li>
        <li><a href="${docsUrl}/agents">Agent Capabilities</a></li>
        <li><a href="${docsUrl}/integrations">Integration Setup</a></li>
        <li><a href="${discordUrl}">Join our Discord Community</a></li>
      </ul>
    </div>
    
    <p><strong>Need help?</strong> Reply to this email or join our <a href="${discordUrl}">Discord</a> for direct support.</p>
    
    <p>Let's build something amazing together!</p>
    
    <p>Best regards,<br>
    <strong>The Corporate AI Team</strong></p>
  </div>
  
  <div class="footer">
    <p>Corporate AI - AI Workforce as a Service</p>
    <p><a href="https://corporateai.work">corporateai.work</a> | <a href="mailto:support@corporateai.work">support@corporateai.work</a></p>
  </div>
</body>
</html>
    `;
  }

  // Plain text welcome email
  private getWelcomeEmailText(customerId: string, tier: string): string {
    return `
Welcome to Corporate AI!

Thank you for joining Corporate AI! Your AI Workforce is Ready to Work.

QUICK START (5 minutes):
1. Access your dashboard: https://dashboard.corporateai.work/setup?customer=${customerId}
2. Activate your agents - Choose which executives to enable
3. Connect integrations - Link Slack, Gmail, Calendar, etc.
4. Start collaborating - Begin delegating tasks to your AI team

YOUR ${tier.toUpperCase()} PLAN INCLUDES:
${this.getTierFeaturesText(tier)}

HELPFUL RESOURCES:
- Quick Start Guide: https://docs.corporateai.work/quickstart
- Agent Capabilities: https://docs.corporateai.work/agents
- Integration Setup: https://docs.corporateai.work/integrations
- Discord Community: https://discord.gg/corporateai

Need help? Reply to this email or join our Discord for direct support.

Let's build something amazing together!

Best regards,
The Corporate AI Team

corporateai.work | support@corporateai.work
    `;
  }

  // Get tier features as HTML list items
  private getTierFeatures(tier: string): string {
    const features: Record<string, string[]> = {
      starter: [
        "3 AI C-Suite agents (CEO, CFO, COO)",
        "1,000 API requests/month",
        "Basic dashboard access",
        "Email support",
        "Slack integration"
      ],
      growth: [
        "8 AI C-Suite agents",
        "10,000 API requests/month",
        "Advanced analytics dashboard",
        "Priority support",
        "All integrations (Slack, Gmail, Calendar, etc.)"
      ],
      scale: [
        "Full C-Suite + Board of Directors",
        "100,000 API requests/month",
        "Custom agent training",
        "Dedicated support channel",
        "API access for custom integrations"
      ],
      enterprise: [
        "Unlimited AI agents",
        "Unlimited API requests",
        "On-premise deployment option",
        "White-glove onboarding",
        "Custom SLA guarantees",
        "Dedicated account manager"
      ]
    };

    return (features[tier] || features.starter).map(f => `<li>${f}</li>`).join("");
  }

  // Get tier features as text
  private getTierFeaturesText(tier: string): string {
    const features: Record<string, string[]> = {
      starter: [
        "3 AI C-Suite agents (CEO, CFO, COO)",
        "1,000 API requests/month",
        "Basic dashboard access",
        "Email support"
      ],
      growth: [
        "8 AI C-Suite agents",
        "10,000 API requests/month",
        "Advanced analytics dashboard",
        "Priority support"
      ],
      scale: [
        "Full C-Suite + Board of Directors",
        "100,000 API requests/month",
        "Custom agent training",
        "Dedicated support channel"
      ],
      enterprise: [
        "Unlimited AI agents",
        "Unlimited API requests",
        "On-premise deployment option",
        "White-glove onboarding"
      ]
    };

    return (features[tier] || features.starter).map(f => `- ${f}`).join("\n");
  }
}

export default WhopWebhookHandler;
