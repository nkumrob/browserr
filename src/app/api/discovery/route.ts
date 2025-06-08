// Discovery API Route - Main MCP Server Discovery
// POST /api/discovery - Run server discovery and enrichment

import { NextRequest, NextResponse } from 'next/server';
import { McpDiscoveryService } from '@/lib/mcp-discovery-service';

function createDiscoveryService() {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];
  
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return new McpDiscoveryService({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    githubToken: process.env.GITHUB_TOKEN,
    serperApiKey: process.env.SERPER_API_KEY,
    craw4aiApiKey: process.env.CRAW4AI_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    batchSize: 5,
    enableChangeDetection: true,
    processingDelay: 2000
  });
}

// POST - Run discovery process
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'discover', 
      sources = ['mcp.so', 'github'],
      batchSize = 5,
      enableEnrichment = true 
    } = body;

    console.log(`🚀 Starting discovery action: ${action}`);

    const discoveryService = createDiscoveryService();

    if (action === 'discover') {
      // Run full discovery process
      const result = await discoveryService.discoverAndProcessServers();
      
      return NextResponse.json({
        success: true,
        result,
        message: 'Discovery process completed',
        metadata: {
          action,
          sources,
          timestamp: new Date().toISOString()
        }
      });

    } else if (action === 'process_queue') {
      // Process existing enrichment queue
      await discoveryService.processEnrichmentQueue();
      
      return NextResponse.json({
        success: true,
        message: 'Enrichment queue processing started',
        metadata: {
          action,
          timestamp: new Date().toISOString()
        }
      });

    } else if (action === 'health_check') {
      // Get discovery service health status
      const stats = await discoveryService.getDiscoveryStats();
      
      return NextResponse.json({
        success: true,
        stats,
        message: 'Health check completed',
        metadata: {
          action,
          timestamp: new Date().toISOString()
        }
      });

    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid action. Use: discover, process_queue, or health_check' 
        },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Discovery API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// GET - Discovery service status
export async function GET() {
  try {
    const discoveryService = createDiscoveryService();
    const stats = await discoveryService.getDiscoveryStats();

    return NextResponse.json({
      success: true,
      service: 'MCP Discovery Service',
      version: '1.0.0',
      status: 'healthy',
      stats,
      features: {
        mcpSoScraping: true,
        githubIntegration: !!process.env.GITHUB_TOKEN,
        openaiEnrichment: !!process.env.OPENAI_API_KEY,
        webSearch: !!process.env.SERPER_API_KEY,
        craw4aiIntegration: !!process.env.CRAW4AI_API_KEY,
        changeDetection: true,
        rssFeeds: true
      },
      endpoints: {
        'POST /api/discovery': 'Run discovery process',
        'GET /api/discovery': 'Service status and health',
        'GET /api/feeds/mcpso-page': 'RSS feed for updates',
        'GET /api/admin/servers': 'Admin server management',
        'GET /api/admin/enrichment': 'Enrichment queue management',
        'GET /api/admin/analytics': 'System analytics'
      },
      usage: {
        discover: {
          method: 'POST',
          body: {
            action: 'discover',
            sources: ['mcp.so', 'github'],
            batchSize: 5,
            enableEnrichment: true
          }
        },
        processQueue: {
          method: 'POST',
          body: {
            action: 'process_queue'
          }
        },
        healthCheck: {
          method: 'POST',
          body: {
            action: 'health_check'
          }
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        service: 'MCP Discovery Service',
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
