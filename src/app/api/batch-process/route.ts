// Next.js API Route for Batch Repository Processing
// POST /api/batch-process

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
    const { githubUrls } = body;
    
    // Validate input
    if (!githubUrls || !Array.isArray(githubUrls)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'githubUrls array is required' 
        },
        { status: 400 }
      );
    }

    if (githubUrls.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'At least one GitHub URL is required' 
        },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    if (githubUrls.length > 50) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Maximum 50 repositories per batch' 
        },
        { status: 400 }
      );
    }

    // Validate GitHub URL format
    const githubUrlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+/;
    const invalidUrls = githubUrls.filter((url: string) => !githubUrlPattern.test(url));
    
    if (invalidUrls.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid GitHub URLs: ${invalidUrls.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    console.log(`🚀 Starting batch processing of ${githubUrls.length} repositories`);
    
    // Process the repositories
    const service = createRegistryService();
    const batchResult = await service.processBatch(githubUrls);
    
    console.log(`✅ Batch processing completed: ${batchResult.summary.successful}/${batchResult.summary.total} successful`);
    
    // Separate successful and failed results
    const successful = batchResult.processed.filter(r => r.success);
    const failed = batchResult.processed.filter(r => !r.success);
    
    return NextResponse.json({
      success: true,
      summary: {
        total: batchResult.summary.total,
        successful: batchResult.summary.successful,
        failed: batchResult.summary.failed,
        cacheHits: batchResult.summary.cacheHits,
        totalTokensUsed: batchResult.summary.totalTokensUsed,
        totalWebSearches: batchResult.summary.totalWebSearches,
        averageProcessingTime: batchResult.summary.averageProcessingTime,
        estimatedCost: batchResult.summary.estimatedCost
      },
      results: {
        successful: successful.map(result => ({
          server: result.server,
          externalResources: result.externalResources,
          metadata: {
            processingTime: result.processingTime,
            tokensUsed: result.tokensUsed,
            webSearchesMade: result.webSearchesMade,
            cacheHit: result.cacheHit
          }
        })),
        failed: failed.map(result => ({
          errors: result.errors,
          metadata: {
            processingTime: result.processingTime
          }
        }))
      },
      metadata: {
        batchId: `batch_${Date.now()}`,
        timestamp: new Date().toISOString(),
        processingTimeTotal: batchResult.processed.reduce((sum, r) => sum + r.processingTime, 0)
      }
    });
    
  } catch (error) {
    console.error('❌ Batch processing API error:', error);
    
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

// GET method for batch processing status and limits
export async function GET() {
  try {
    return NextResponse.json({
      service: 'MCP Registry Batch Processing API',
      version: '1.0.0',
      limits: {
        maxRepositoriesPerBatch: 50,
        defaultConcurrency: 3,
        maxConcurrency: 5,
        rateLimitDelay: '2 seconds between batches'
      },
      costEstimation: {
        averageTokensPerRepo: 1400,
        estimatedCostPerRepo: '$0.05-0.10',
        cacheHitCost: '$0.00'
      },
      features: {
        batchProcessing: true,
        concurrencyControl: true,
        costTracking: true,
        cacheOptimization: true,
        errorHandling: true
      },
      usage: {
        endpoint: 'POST /api/batch-process',
        requestFormat: {
          githubUrls: ['https://github.com/user/repo1', 'https://github.com/user/repo2'],
          maxConcurrency: 3
        },
        responseFormat: {
          success: true,
          summary: 'Processing statistics',
          results: {
            successful: 'Array of enriched servers',
            failed: 'Array of error details'
          }
        }
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
