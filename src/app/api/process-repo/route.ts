// Next.js API Route for Repository Processing
// POST /api/process-repo

import { NextRequest, NextResponse } from 'next/server';
import { McpRegistryService } from '@/lib/mcp-registry-service';

// Initialize the registry service
function createRegistryService() {
  const requiredEnvVars = ['OPENAI_API_KEY'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  return new McpRegistryService({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    githubToken: process.env.GITHUB_TOKEN,
    serperApiKey: process.env.SERPER_API_KEY,
    cacheEnabled: true,
    cacheTtl: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubUrl, forceRefresh = false } = body;
    
    // Validate input
    if (!githubUrl) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'GitHub URL is required' 
        },
        { status: 400 }
      );
    }

    // Validate GitHub URL format
    const githubUrlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+/;
    if (!githubUrlPattern.test(githubUrl)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid GitHub URL format' 
        },
        { status: 400 }
      );
    }
    
    console.log(`🚀 Processing repository: ${githubUrl}`);
    
    // Process the repository
    const service = createRegistryService();
    const result = await service.processRepository(githubUrl, forceRefresh);
    
    if (result.success) {
      console.log(`✅ Successfully processed: ${result.server?.name}`);
      
      return NextResponse.json({
        success: true,
        server: result.server,
        externalResources: result.externalResources,
        metadata: {
          processingTime: result.processingTime,
          tokensUsed: result.tokensUsed,
          webSearchesMade: result.webSearchesMade,
          cacheHit: result.cacheHit,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      console.error(`❌ Processing failed: ${result.errors?.join(', ')}`);
      
      return NextResponse.json(
        {
          success: false,
          errors: result.errors,
          metadata: {
            processingTime: result.processingTime,
            timestamp: new Date().toISOString()
          }
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('❌ API route error:', error);
    
    return NextResponse.json(
      {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: {
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// GET method for health check
export async function GET() {
  try {
    // Check if required environment variables are set
    const requiredEnvVars = ['OPENAI_API_KEY'];
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    
    const optionalEnvVars = ['GITHUB_TOKEN', 'SERPER_API_KEY'];
    const optional = optionalEnvVars.filter(key => !process.env[key]);
    
    return NextResponse.json({
      status: 'healthy',
      service: 'MCP Registry Processing API',
      version: '1.0.0',
      environment: {
        required: {
          configured: requiredEnvVars.length - missing.length,
          total: requiredEnvVars.length,
          missing: missing.length > 0 ? missing : undefined
        },
        optional: {
          configured: optionalEnvVars.length - optional.length,
          total: optionalEnvVars.length,
          missing: optional.length > 0 ? optional : undefined
        }
      },
      features: {
        githubExtraction: true,
        openaiEnrichment: missing.length === 0,
        webSearch: !!process.env.SERPER_API_KEY,
        caching: true
      },
      endpoints: {
        'POST /api/process-repo': 'Process a single GitHub repository',
        'POST /api/batch-process': 'Process multiple repositories',
        'GET /api/process-repo': 'Health check and configuration status'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
