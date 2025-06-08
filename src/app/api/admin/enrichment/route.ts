// Admin API Route - Enrichment Queue Management
// GET /api/admin/enrichment - View enrichment queue status
// POST /api/admin/enrichment - Process enrichment queue
// PUT /api/admin/enrichment/[id] - Update enrichment job status

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

// GET - View enrichment queue status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // pending, processing, completed, error
    const limit = parseInt(searchParams.get('limit') || '50');

    const { supabaseService } = createServices();

    // Get enrichment queue jobs
    let jobs;
    if (status === 'pending') {
      jobs = await supabaseService.getPendingEnrichmentJobs(limit);
    } else {
      // For now, just get pending jobs - in a real implementation you'd filter by status
      jobs = await supabaseService.getPendingEnrichmentJobs(limit);
    }

    // Get server details for each job
    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        const server = await supabaseService.getMcpServer(job.server_id);
        return {
          ...job,
          server: server ? {
            name: server.name,
            githubUrl: server.githubUrl,
            category: server.category,
            language: server.language
          } : null
        };
      })
    );

    // Get queue statistics
    const allJobs = await supabaseService.getPendingEnrichmentJobs(1000); // Get more for stats
    const stats = {
      total: allJobs.length,
      pending: allJobs.filter(j => j.status === 'pending').length,
      processing: allJobs.filter(j => j.status === 'processing').length,
      completed: allJobs.filter(j => j.status === 'completed').length,
      error: allJobs.filter(j => j.status === 'error').length
    };

    return NextResponse.json({
      success: true,
      jobs: enrichedJobs,
      statistics: stats,
      metadata: {
        totalJobs: enrichedJobs.length,
        filter: status || 'all',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Admin enrichment GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Process enrichment queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, serverId, batchSize = 5 } = body;

    const { supabaseService, discoveryService } = createServices();

    if (action === 'process_queue') {
      console.log('🚀 Starting enrichment queue processing...');
      
      // Process the enrichment queue
      await discoveryService.processEnrichmentQueue();
      
      return NextResponse.json({
        success: true,
        message: 'Enrichment queue processing started',
        timestamp: new Date().toISOString()
      });

    } else if (action === 'add_server' && serverId) {
      // Add specific server to enrichment queue
      await supabaseService.addToEnrichmentQueue(serverId, 'manual', 'admin');
      
      return NextResponse.json({
        success: true,
        message: `Server ${serverId} added to enrichment queue`,
        timestamp: new Date().toISOString()
      });

    } else if (action === 'discover_new') {
      console.log('🔍 Starting new server discovery...');
      
      // Run full discovery process
      const discoveryResult = await discoveryService.discoverAndProcessServers();
      
      return NextResponse.json({
        success: true,
        result: discoveryResult,
        message: 'Server discovery completed',
        timestamp: new Date().toISOString()
      });

    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use: process_queue, add_server, or discover_new' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('❌ Admin enrichment POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update enrichment job status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, status, errorMessage } = body;

    if (!jobId || !status) {
      return NextResponse.json(
        { success: false, error: 'Job ID and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'processing', 'completed', 'error'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const { supabaseService } = createServices();

    // Update job status
    const updatedJob = await supabaseService.updateEnrichmentQueueStatus(
      jobId,
      status,
      errorMessage
    );

    return NextResponse.json({
      success: true,
      job: updatedJob,
      message: `Job ${jobId} status updated to ${status}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin enrichment PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
