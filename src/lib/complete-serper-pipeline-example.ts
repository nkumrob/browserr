// Complete Serper + Crawl4AI + Mixtral Pipeline Example
// Demonstrates the full enrichment workflow from GitHub URL to enriched database entry

import { SerperCrawl4AIEnrichment } from './serper-crawl4ai-enrichment';
import { McpRegistryService } from './mcp-registry-service';
import { SupabaseService } from './supabase-service';
import { McpServer } from './semantic-search';

export interface PipelineResult {
  success: boolean;
  originalGitHubUrl: string;
  extractedServer: McpServer;
  enrichedServer: McpServer;
  searchResults: any[];
  crawledContent: any[];
  databaseId?: string;
  processingTime: number;
  costs: {
    serper: number;
    crawl4ai: number;
    mixtral: number;
    total: number;
  };
  errors?: string[];
}

export class CompleteSerperPipeline {
  private registryService: McpRegistryService;
  private enrichmentService: SerperCrawl4AIEnrichment;
  private supabaseService: SupabaseService;

  constructor(config: {
    groqApiKey: string;
    serperApiKey: string;
    crawl4aiApiKey?: string;
    githubToken?: string;
    supabaseUrl: string;
    supabaseKey: string;
  }) {
    this.registryService = new McpRegistryService({
      githubToken: config.githubToken
    });

    this.enrichmentService = new SerperCrawl4AIEnrichment(
      config.groqApiKey,
      config.serperApiKey,
      config.crawl4aiApiKey
    );

    this.supabaseService = new SupabaseService({
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey
    });
  }

  // Complete pipeline: GitHub URL → Enriched Database Entry
  async processGitHubUrl(githubUrl: string): Promise<PipelineResult> {
    const startTime = Date.now();
    console.log(`🚀 Starting complete pipeline for: ${githubUrl}`);

    try {
      // Step 1: Extract GitHub data
      console.log(`📦 Step 1: Extracting GitHub data...`);
      const githubData = await this.registryService.extractGitHubData(githubUrl);
      
      if (!githubData) {
        throw new Error('Failed to extract GitHub data');
      }

      // Step 2: Convert to McpServer format
      console.log(`🔄 Step 2: Converting to MCP server format...`);
      const extractedServer = this.registryService.githubDataToMcpServer(githubData);

      // Step 3: Enrich with Serper + Crawl4AI + Mixtral
      console.log(`🌐 Step 3: Enriching with web search and AI...`);
      const enrichmentResult = await this.enrichmentService.enrichServer(extractedServer);

      if (!enrichmentResult.success) {
        throw new Error(`Enrichment failed: ${enrichmentResult.errors?.join(', ')}`);
      }

      // Step 4: Store in database
      console.log(`💾 Step 4: Storing in database...`);
      const databaseId = await this.storeInDatabase(enrichmentResult.finalEnrichedServer);

      const processingTime = Date.now() - startTime;
      const costs = this.calculateCosts(enrichmentResult);

      console.log(`✅ Pipeline completed successfully in ${processingTime}ms`);
      console.log(`💰 Total cost: $${costs.total.toFixed(4)}`);

      return {
        success: true,
        originalGitHubUrl: githubUrl,
        extractedServer,
        enrichedServer: enrichmentResult.finalEnrichedServer,
        searchResults: enrichmentResult.searchResults,
        crawledContent: enrichmentResult.crawledContent,
        databaseId,
        processingTime,
        costs
      };

    } catch (error) {
      console.error(`❌ Pipeline failed for ${githubUrl}:`, error);
      
      return {
        success: false,
        originalGitHubUrl: githubUrl,
        extractedServer: {} as McpServer,
        enrichedServer: {} as McpServer,
        searchResults: [],
        crawledContent: [],
        processingTime: Date.now() - startTime,
        costs: { serper: 0, crawl4ai: 0, mixtral: 0, total: 0 },
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // Batch process multiple GitHub URLs
  async processBatchGitHubUrls(githubUrls: string[]): Promise<PipelineResult[]> {
    console.log(`🔄 Starting batch processing for ${githubUrls.length} repositories...`);
    
    const results: PipelineResult[] = [];
    let totalCost = 0;
    let successCount = 0;

    for (let i = 0; i < githubUrls.length; i++) {
      const url = githubUrls[i];
      console.log(`\n📦 Processing ${i + 1}/${githubUrls.length}: ${url}`);

      const result = await this.processGitHubUrl(url);
      results.push(result);

      if (result.success) {
        successCount++;
        totalCost += result.costs.total;
      }

      // Rate limiting between repositories
      if (i < githubUrls.length - 1) {
        console.log('⏳ Rate limiting...');
        await this.delay(3000); // 3 second delay
      }
    }

    console.log(`\n🎉 Batch processing completed:`);
    console.log(`   ✅ Successful: ${successCount}/${githubUrls.length}`);
    console.log(`   💰 Total cost: $${totalCost.toFixed(4)}`);
    console.log(`   📊 Average cost per server: $${(totalCost / successCount).toFixed(4)}`);

    return results;
  }

  // Store enriched server in database
  private async storeInDatabase(enrichedServer: McpServer): Promise<string> {
    try {
      // Insert main server record
      const serverData = {
        slug: enrichedServer.slug,
        name: enrichedServer.name,
        description: enrichedServer.description,
        tags: enrichedServer.tags,
        category: enrichedServer.category,
        language: enrichedServer.language,
        stars: enrichedServer.stars,
        installCommand: enrichedServer.installCommand,
        githubUrl: enrichedServer.githubUrl,
        authorName: enrichedServer.author.name,
        authorAvatar: enrichedServer.author.avatar,
        authorGithubUsername: enrichedServer.author.githubUsername
      };

      const insertedServer = await this.supabaseService.insertMcpServer(serverData);
      const serverId = insertedServer.id;

      // Insert enriched content if available
      if (enrichedServer.useCases || enrichedServer.faqs) {
        const enrichedContent = {
          summary: enrichedServer.description,
          useCases: enrichedServer.useCases || [],
          integrationTips: enrichedServer.installation?.command || '',
          faqs: enrichedServer.faqs || [],
          rephrased_content: enrichedServer.description,
          classificationTags: enrichedServer.tags,
          versionHash: this.generateVersionHash(enrichedServer),
          tokensUsed: 2500, // Estimate
          processingTimeMs: 5000, // Estimate
          enrichmentSource: 'serper-crawl4ai-mixtral'
        };

        await this.supabaseService.insertEnrichedContent(serverId, enrichedContent);
      }

      // Insert external resources if available
      if (enrichedServer.externalResources && enrichedServer.externalResources.length > 0) {
        for (const resource of enrichedServer.externalResources) {
          await this.supabaseService.insertExternalResource(serverId, {
            type: resource.type,
            title: resource.title,
            url: resource.url,
            source: resource.source,
            description: resource.description || '',
            rankScore: 0.8,
            verified: false
          });
        }
      }

      console.log(`💾 Stored server in database with ID: ${serverId}`);
      return serverId;

    } catch (error) {
      console.error('Failed to store in database:', error);
      throw error;
    }
  }

  // Calculate costs for the enrichment process
  private calculateCosts(enrichmentResult: any): {
    serper: number;
    crawl4ai: number;
    mixtral: number;
    total: number;
  } {
    const serperCost = (enrichmentResult.searchesMade / 1000) * 5; // $5 per 1K searches
    const crawl4aiCost = (enrichmentResult.pagesCrawled / 1000) * 3; // $3 per 1K pages
    const mixtralCost = (enrichmentResult.tokensUsed / 1000000) * 0.27; // $0.27 per 1M tokens

    return {
      serper: serperCost,
      crawl4ai: crawl4aiCost,
      mixtral: mixtralCost,
      total: serperCost + crawl4aiCost + mixtralCost
    };
  }

  // Generate version hash for change detection
  private generateVersionHash(server: McpServer): string {
    const content = JSON.stringify({
      name: server.name,
      description: server.description,
      githubUrl: server.githubUrl,
      stars: server.stars
    });
    
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get pipeline statistics
  async getPipelineStats(): Promise<{
    totalServersProcessed: number;
    averageCostPerServer: number;
    averageProcessingTime: number;
    successRate: number;
  }> {
    // In a real implementation, this would query the database for actual stats
    return {
      totalServersProcessed: 0,
      averageCostPerServer: 0.046,
      averageProcessingTime: 30000, // 30 seconds
      successRate: 0.95
    };
  }
}

// Example usage and testing
export async function runCompleteExample() {
  console.log('🎯 Complete Serper Pipeline Example\n');
  console.log('=' .repeat(60));

  try {
    // Validate environment
    const requiredEnvVars = ['GROQ_API_KEY', 'SERPER_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    const missing = requiredEnvVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing);
      return;
    }

    // Initialize pipeline
    const pipeline = new CompleteSerperPipeline({
      groqApiKey: process.env.GROQ_API_KEY!,
      serperApiKey: process.env.SERPER_API_KEY!,
      crawl4aiApiKey: process.env.CRAWL4AI_API_KEY,
      githubToken: process.env.GITHUB_TOKEN,
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });

    // Example GitHub URLs to process
    const exampleUrls = [
      'https://github.com/microsoft/playwright',
      'https://github.com/puppeteer/puppeteer',
      'https://github.com/SeleniumHQ/selenium'
    ];

    console.log(`🚀 Processing ${exampleUrls.length} example repositories...\n`);

    // Process single URL
    console.log('📦 Single URL Processing:');
    const singleResult = await pipeline.processGitHubUrl(exampleUrls[0]);
    
    if (singleResult.success) {
      console.log(`✅ Successfully processed: ${singleResult.enrichedServer.name}`);
      console.log(`💰 Cost: $${singleResult.costs.total.toFixed(4)}`);
      console.log(`⏱️ Time: ${singleResult.processingTime}ms`);
      console.log(`🔍 Search results: ${singleResult.searchResults.length}`);
      console.log(`🕷️ Pages crawled: ${singleResult.crawledContent.length}`);
    }

    // Uncomment to test batch processing
    // console.log('\n📦 Batch Processing:');
    // const batchResults = await pipeline.processBatchGitHubUrls(exampleUrls);
    // console.log(`✅ Batch completed: ${batchResults.filter(r => r.success).length}/${batchResults.length} successful`);

    console.log('\n🎉 Example completed successfully!');

  } catch (error) {
    console.error('❌ Example failed:', error);
  }
}

// Cost estimation utility
export function estimatePipelineCosts(serverCount: number): {
  breakdown: { serper: number; crawl4ai: number; mixtral: number };
  total: number;
  perServer: number;
} {
  const serperCost = (serverCount * 6 / 1000) * 5; // 6 searches per server
  const crawl4aiCost = (serverCount * 5 / 1000) * 3; // 5 pages per server
  const mixtralCost = (serverCount * 2500 / 1000000) * 0.27; // 2500 tokens per server

  const total = serperCost + crawl4aiCost + mixtralCost;

  return {
    breakdown: {
      serper: serperCost,
      crawl4ai: crawl4aiCost,
      mixtral: mixtralCost
    },
    total,
    perServer: total / serverCount
  };
}

export const COMPLETE_PIPELINE_USAGE = `
🚀 Complete Serper + Crawl4AI + Mixtral Pipeline

## Quick Start
1. Set environment variables in .env.local
2. Run: npm run dev
3. Test: import { runCompleteExample } from './complete-serper-pipeline-example'

## Environment Variables
Required:
- GROQ_API_KEY=gsk-...
- SERPER_API_KEY=...
- SUPABASE_URL=https://...
- SUPABASE_SERVICE_ROLE_KEY=...

Optional:
- CRAWL4AI_API_KEY=... (improves content extraction)
- GITHUB_TOKEN=ghp-... (higher rate limits)

## Pipeline Stages
1. 📦 GitHub Data Extraction
2. 🔍 Serper Web Search (6 searches per server)
3. 🕷️ Crawl4AI Content Extraction (5 pages per server)
4. 🚀 Mixtral Final Processing (2500 tokens per server)
5. 💾 Database Storage

## Costs
- Per server: ~$0.046 (4.6 cents)
- 100 servers: ~$4.60
- 1000 servers: ~$46.00

## Features
✅ Real URLs from Google search
✅ Rich content extraction
✅ Structured documentation generation
✅ Complete database integration
✅ Cost tracking and optimization
✅ Error handling and retry logic
`;
