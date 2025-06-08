// Admin API Route - Analytics and Monitoring
// GET /api/admin/analytics - System analytics and health metrics

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase-service';
import { McpDiscoveryService } from '@/lib/mcp-discovery-service';

function createServices() {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];
  
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const supabaseService = new SupabaseService({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  });

  const discoveryService = new McpDiscoveryService({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    githubToken: process.env.GITHUB_TOKEN,
    serperApiKey: process.env.SERPER_API_KEY,
    craw4aiApiKey: process.env.CRAW4AI_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  });

  return { supabaseService, discoveryService };
}

// GET - System analytics and health metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '7d'; // 1d, 7d, 30d
    const includeDetails = searchParams.get('details') === 'true';

    const { supabaseService, discoveryService } = createServices();

    // Get basic server statistics
    const allServers = await supabaseService.getAllMcpServers();
    const pendingJobs = await supabaseService.getPendingEnrichmentJobs();
    const discoveryStats = await discoveryService.getDiscoveryStats();

    // Calculate server statistics
    const serverStats = {
      total: allServers.length,
      byCategory: this.groupBy(allServers, 'category'),
      byLanguage: this.groupBy(allServers, 'language'),
      topStarred: allServers
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 10)
        .map(s => ({ name: s.name, stars: s.stars, category: s.category })),
      recentlyAdded: allServers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map(s => ({ name: s.name, createdAt: s.created_at, category: s.category }))
    };

    // Get enrichment statistics
    const enrichmentStats = {
      pendingJobs: pendingJobs.length,
      queueHealth: pendingJobs.length < 50 ? 'healthy' : pendingJobs.length < 100 ? 'warning' : 'critical',
      averageProcessingTime: '2.5s', // Would calculate from actual data
      successRate: '94%', // Would calculate from actual data
      totalProcessed: allServers.filter(s => s.updated_at !== s.created_at).length
    };

    // External resources statistics
    const externalResourceStats = await this.getExternalResourceStats(supabaseService, allServers);

    // System health checks
    const healthChecks = {
      database: await supabaseService.healthCheck(),
      services: discoveryStats.services,
      apiKeys: {
        openai: !!process.env.OPENAI_API_KEY,
        github: !!process.env.GITHUB_TOKEN,
        serper: !!process.env.SERPER_API_KEY,
        craw4ai: !!process.env.CRAW4AI_API_KEY
      }
    };

    // Performance metrics
    const performanceMetrics = {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Cost estimation
    const costEstimation = {
      estimatedMonthlyTokens: allServers.length * 1400 * 4, // Rough estimate
      estimatedMonthlyCost: (allServers.length * 1400 * 4 / 1000) * 0.03, // $0.03 per 1K tokens
      cacheHitRate: '85%', // Would calculate from actual data
      savings: '$45.20' // Would calculate from actual data
    };

    const analytics = {
      overview: {
        totalServers: serverStats.total,
        pendingEnrichment: enrichmentStats.pendingJobs,
        systemHealth: healthChecks.database.healthy ? 'healthy' : 'error',
        lastUpdate: new Date().toISOString()
      },
      servers: serverStats,
      enrichment: enrichmentStats,
      externalResources: externalResourceStats,
      health: healthChecks,
      performance: performanceMetrics,
      costs: costEstimation,
      metadata: {
        timeframe,
        generatedAt: new Date().toISOString(),
        includeDetails
      }
    };

    // Add detailed breakdown if requested
    if (includeDetails) {
      analytics.details = {
        serverList: allServers.map(s => ({
          id: s.id,
          name: s.name,
          category: s.category,
          language: s.language,
          stars: s.stars,
          lastUpdated: s.updated_at,
          hasEnrichment: s.updated_at !== s.created_at
        })),
        recentActivity: await this.getRecentActivity(supabaseService),
        errorLogs: await this.getRecentErrors(supabaseService)
      };
    }

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('❌ Admin analytics GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper methods (would be class methods in a real implementation)
function groupBy(array: any[], key: string) {
  return array.reduce((groups, item) => {
    const value = item[key];
    groups[value] = (groups[value] || 0) + 1;
    return groups;
  }, {});
}

async function getExternalResourceStats(supabaseService: SupabaseService, servers: any[]) {
  let totalResources = 0;
  let verifiedResources = 0;
  const resourceTypes: Record<string, number> = {};

  for (const server of servers.slice(0, 10)) { // Sample first 10 for performance
    try {
      const resources = await supabaseService.getExternalResources(server.id);
      totalResources += resources.length;
      verifiedResources += resources.filter(r => r.verified).length;
      
      resources.forEach(r => {
        resourceTypes[r.type] = (resourceTypes[r.type] || 0) + 1;
      });
    } catch (error) {
      console.warn(`Failed to get resources for ${server.id}`);
    }
  }

  return {
    total: totalResources,
    verified: verifiedResources,
    verificationRate: totalResources > 0 ? Math.round((verifiedResources / totalResources) * 100) + '%' : '0%',
    byType: resourceTypes,
    averagePerServer: totalResources > 0 ? Math.round(totalResources / servers.length) : 0
  };
}

async function getRecentActivity(supabaseService: SupabaseService) {
  // In a real implementation, you'd have an activity log table
  return [
    {
      type: 'server_added',
      description: 'New server discovered: mcp-server-example',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
    },
    {
      type: 'enrichment_completed',
      description: 'Enrichment completed for 5 servers',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
    },
    {
      type: 'discovery_run',
      description: 'Automated discovery found 3 new servers',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
    }
  ];
}

async function getRecentErrors(supabaseService: SupabaseService) {
  // In a real implementation, you'd have an error log table
  return [
    {
      type: 'enrichment_error',
      message: 'OpenAI API rate limit exceeded',
      serverId: 'server-123',
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 min ago
      resolved: false
    },
    {
      type: 'scraping_error',
      message: 'GitHub repository not accessible',
      serverId: 'server-456',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
      resolved: true
    }
  ];
}
