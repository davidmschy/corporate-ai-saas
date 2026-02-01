/**
 * Corporate AI SaaS - Main Entry Point
 * 
 * Cloudflare Worker that serves as the API gateway for the
 * Corporate AI platform. Handles webhook events, dashboard API,
 * and agent orchestration.
 */

import WhopWebhookHandler, { WhopWebhookPayload } from "./whop/webhook";
import DashboardAPI from "./dashboard";

// Environment interface
export interface Env {
  CORPORATE_AI_KV: KVNamespace;
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  WHOP_API_KEY: string;
  AGENTMAIL_API_KEY: string;
  WEBHOOK_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Whop webhook endpoint
      if (path === "/webhooks/whop" && request.method === "POST") {
        return await handleWhopWebhook(request, env, corsHeaders);
      }

      // Dashboard API endpoints
      if (path.startsWith("/api/dashboard")) {
        return await handleDashboardAPI(request, env, corsHeaders);
      }

      // Health check
      if (path === "/health") {
        return jsonResponse({ status: "healthy", timestamp: new Date().toISOString() }, corsHeaders);
      }

      // Root - API info
      if (path === "/") {
        return jsonResponse({
          name: "Corporate AI API",
          version: "1.0.0",
          description: "AI Workforce as a Service",
          endpoints: {
            health: "/health",
            webhooks: "/webhooks/whop",
            dashboard: "/api/dashboard"
          },
          documentation: "https://docs.corporateai.work"
        }, corsHeaders);
      }

      // 404 for unknown paths
      return jsonResponse({ error: "Not found" }, corsHeaders, 404);

    } catch (error) {
      console.error("Unhandled error:", error);
      return jsonResponse({ error: "Internal server error" }, corsHeaders, 500);
    }
  }
};

// Handle Whop webhooks
async function handleWhopWebhook(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  // Verify webhook secret
  const signature = request.headers.get("X-Whop-Signature");
  if (!signature) {
    return jsonResponse({ error: "Missing signature" }, corsHeaders, 401);
  }

  const payload = await request.text();
  
  const handler = new WhopWebhookHandler(env);
  
  // Verify signature (implement proper verification in production)
  // if (!handler.verifySignature(payload, signature, env.WEBHOOK_SECRET)) {
  //   return jsonResponse({ error: "Invalid signature" }, corsHeaders, 401);
  // }

  try {
    const data = JSON.parse(payload) as WhopWebhookPayload;
    const result = await handler.handleWebhook(data);
    
    return jsonResponse(result, corsHeaders, result.success ? 200 : 400);
  } catch (error) {
    console.error("Webhook processing error:", error);
    return jsonResponse({ error: "Invalid payload" }, corsHeaders, 400);
  }
}

// Handle Dashboard API requests
async function handleDashboardAPI(request: Request, env: Env, corsHeaders: Record<string, string>): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const dashboard = new DashboardAPI(env);

  // Extract customer ID from Authorization header
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, corsHeaders, 401);
  }
  
  const customerId = authHeader.slice(7); // In production, verify JWT

  try {
    // GET /api/dashboard - Get dashboard overview
    if (path === "/api/dashboard" && request.method === "GET") {
      const data = await dashboard.getDashboard(customerId);
      return jsonResponse(data, corsHeaders);
    }

    // GET /api/dashboard/agents - List available agents
    if (path === "/api/dashboard/agents" && request.method === "GET") {
      const session = await env.CORPORATE_AI_KV.get(`session:${customerId}`, { type: "json" }) as any;
      if (!session) {
        return jsonResponse({ error: "Session not found" }, corsHeaders, 404);
      }
      const agents = await dashboard.getAvailableAgents(session.tier);
      return jsonResponse({ agents }, corsHeaders);
    }

    // POST /api/dashboard/agents/:agentId/activate - Activate an agent
    const activateMatch = path.match(/\/api\/dashboard\/agents\/([^/]+)\/activate/);
    if (activateMatch && request.method === "POST") {
      const agentId = activateMatch[1];
      await dashboard.activateAgent(customerId, agentId);
      return jsonResponse({ success: true, message: `Agent ${agentId} activated` }, corsHeaders);
    }

    // GET /api/dashboard/conversations/:agentId - Get conversation history
    const conversationMatch = path.match(/\/api\/dashboard\/conversations\/([^/]+)/);
    if (conversationMatch && request.method === "GET") {
      const agentId = conversationMatch[1];
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const messages = await dashboard.getConversationHistory(customerId, agentId, limit);
      return jsonResponse({ messages }, corsHeaders);
    }

    // POST /api/dashboard/conversations/:agentId/message - Send message
    const messageMatch = path.match(/\/api\/dashboard\/conversations\/([^/]+)\/message/);
    if (messageMatch && request.method === "POST") {
      const agentId = messageMatch[1];
      const body = await request.json() as { message: string };
      const response = await dashboard.sendMessage(customerId, agentId, body.message);
      return jsonResponse(response, corsHeaders);
    }

    return jsonResponse({ error: "Not found" }, corsHeaders, 404);

  } catch (error) {
    console.error("Dashboard API error:", error);
    return jsonResponse({ error: String(error) }, corsHeaders, 500);
  }
}

// Helper to create JSON responses
function jsonResponse(data: any, corsHeaders: Record<string, string>, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}
