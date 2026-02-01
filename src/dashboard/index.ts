/**
 * Customer Dashboard API
 * 
 * Provides endpoints for customers to interact with their AI workforce,
 * view analytics, manage agents, and configure settings.
 */

export interface DashboardSession {
  customerId: string;
  tier: "starter" | "growth" | "scale" | "enterprise";
  agents: string[];
  createdAt: Date;
  lastActive: Date;
}

export interface AgentStatus {
  agentId: string;
  name: string;
  role: string;
  status: "active" | "idle" | "busy" | "error";
  lastActivity: Date;
  tasksCompleted: number;
  tasksPending: number;
}

export interface UsageMetrics {
  period: string;
  apiCalls: number;
  tokensUsed: number;
  agentsActive: number;
  tasksCompleted: number;
  estimatedSavings: number; // Estimated cost vs human employees
}

// Dashboard API handlers
export class DashboardAPI {
  private kv: KVNamespace;
  private env: any;

  constructor(env: any) {
    this.env = env;
    this.kv = env.CORPORATE_AI_KV;
  }

  // Get customer dashboard overview
  async getDashboard(customerId: string): Promise<{
    session: DashboardSession;
    agents: AgentStatus[];
    metrics: UsageMetrics;
  }> {
    const session = await this.kv.get(`session:${customerId}`, { type: "json" }) as DashboardSession;
    
    if (!session) {
      throw new Error("Customer session not found");
    }

    // Get agent statuses
    const agentStatuses: AgentStatus[] = [];
    for (const agentId of session.agents) {
      const status = await this.kv.get(`agent:${customerId}:${agentId}`, { type: "json" }) as AgentStatus;
      if (status) {
        agentStatuses.push(status);
      }
    }

    // Get usage metrics for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const metrics = await this.kv.get(`metrics:${customerId}:${currentMonth}`, { type: "json" }) as UsageMetrics || {
      period: currentMonth,
      apiCalls: 0,
      tokensUsed: 0,
      agentsActive: session.agents.length,
      tasksCompleted: 0,
      estimatedSavings: 0
    };

    return {
      session,
      agents: agentStatuses,
      metrics
    };
  }

  // Get available agents based on tier
  async getAvailableAgents(tier: string): Promise<string[]> {
    const tierAgents: Record<string, string[]> = {
      starter: ["CEO", "CFO", "COO"],
      growth: ["CEO", "CFO", "COO", "CTO", "CMO", "CSO"],
      scale: ["CEO", "CFO", "COO", "CTO", "CMO", "CSO", "CHRO", "GeneralCounsel", "CRO"],
      enterprise: ["CEO", "CFO", "COO", "CTO", "CMO", "CSO", "CHRO", "GeneralCounsel", "CRO", "Hustler", "Fundraising"]
    };

    return tierAgents[tier] || tierAgents.starter;
  }

  // Activate an agent for a customer
  async activateAgent(customerId: string, agentId: string): Promise<boolean> {
    const session = await this.kv.get(`session:${customerId}`, { type: "json" }) as DashboardSession;
    
    if (!session) {
      throw new Error("Customer session not found");
    }

    const availableAgents = await this.getAvailableAgents(session.tier);
    
    if (!availableAgents.includes(agentId)) {
      throw new Error("Agent not available for your tier");
    }

    if (!session.agents.includes(agentId)) {
      session.agents.push(agentId);
      await this.kv.put(`session:${customerId}`, JSON.stringify(session));
    }

    // Initialize agent status
    await this.kv.put(`agent:${customerId}:${agentId}`, JSON.stringify({
      agentId,
      name: agentId,
      role: agentId,
      status: "active",
      lastActivity: new Date(),
      tasksCompleted: 0,
      tasksPending: 0
    }));

    return true;
  }

  // Get conversation history with an agent
  async getConversationHistory(customerId: string, agentId: string, limit: number = 50): Promise<any[]> {
    const history = await this.kv.list({ prefix: `conversation:${customerId}:${agentId}:` });
    const messages = [];
    
    let count = 0;
    for (const key of history.keys.reverse()) { // Most recent first
      if (count >= limit) break;
      const message = await this.kv.get(key.name, { type: "json" });
      if (message) {
        messages.push(message);
        count++;
      }
    }

    return messages;
  }

  // Send message to an agent
  async sendMessage(customerId: string, agentId: string, message: string): Promise<any> {
    // Store user message
    const timestamp = Date.now();
    await this.kv.put(
      `conversation:${customerId}:${agentId}:${timestamp}`,
      JSON.stringify({
        role: "user",
        content: message,
        timestamp: new Date()
      })
    );

    // Here you would call the actual agent logic
    // For now, return a placeholder response
    const response = {
      role: "assistant",
      content: `Agent ${agentId} received: "${message}". Full agent integration coming soon.`,
      timestamp: new Date()
    };

    await this.kv.put(
      `conversation:${customerId}:${agentId}:${timestamp + 1}`,
      JSON.stringify(response)
    );

    // Update metrics
    await this.incrementMetrics(customerId, "apiCalls", 1);

    return response;
  }

  // Update usage metrics
  private async incrementMetrics(customerId: string, metric: string, value: number): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const key = `metrics:${customerId}:${currentMonth}`;
    
    const metrics = await this.kv.get(key, { type: "json" }) as UsageMetrics || {
      period: currentMonth,
      apiCalls: 0,
      tokensUsed: 0,
      agentsActive: 0,
      tasksCompleted: 0,
      estimatedSavings: 0
    };

    (metrics as any)[metric] = ((metrics as any)[metric] || 0) + value;
    
    // Calculate estimated savings (rough estimate: $100/hour per agent equivalent)
    metrics.estimatedSavings = metrics.tasksCompleted * 50; // $50 per task equivalent

    await this.kv.put(key, JSON.stringify(metrics));
  }

  // Get tier limits
  getTierLimits(tier: string): { maxAgents: number; maxRequests: number; support: string } {
    const limits: Record<string, { maxAgents: number; maxRequests: number; support: string }> = {
      starter: { maxAgents: 3, maxRequests: 1000, support: "email" },
      growth: { maxAgents: 8, maxRequests: 10000, support: "priority" },
      scale: { maxAgents: 20, maxRequests: 100000, support: "dedicated" },
      enterprise: { maxAgents: Infinity, maxRequests: Infinity, support: "white_glove" }
    };

    return limits[tier] || limits.starter;
  }
}

export default DashboardAPI;
