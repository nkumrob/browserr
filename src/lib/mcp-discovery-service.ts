// MCP Discovery Service - Main Orchestrator
// Coordinates MCP.so scraping, GitHub enrichment, and database operations

import { McpSoScraper, ScrapingResult } from './mcpso-scraper';
import { SupabaseService } from './supabase-service';
import { McpRegistryService } from './mcp-registry-service';
import { ChangeDetectionService } from './change-detection-service';
import { GitHubService } from './github-service';
import { HybridEnrichmentPipeline } from './hybrid-enrichment-pipeline';

export interface DiscoveryConfig {
  // API Keys
  openaiApiKey: string; // Required for web search
  groqApiKey: string; // Required for final processing
  githubToken?: string;
  craw4aiApiKey?: string;

  // Database
  supabaseUrl: string;
  supabaseKey: string;

  // Processing options
  batchSize?: number;
  enableChangeDetection?: boolean;
  processingDelay?: number; // ms between processing servers
  useHybridEnrichment?: boolean; // Use OpenAI + Mixtral hybrid approach
}

export interface DiscoveryResult {
  success: boolean;
  totalServersFound: number;
  newServersAdded: number;
  serversUpdated: number;
  errors: string[];
  processingTime: number;
  estimatedCost: number;
}

export class McpDiscoveryService {
  private scraper: McpSoScraper;
  private supabaseService: SupabaseService;
  private registryService: McpRegistryService;
  private changeDetectionService: ChangeDetectionService;
  private hybridEnrichment: HybridEnrichmentPipeline;
  private config: DiscoveryConfig;

  constructor(config: DiscoveryConfig) {
    this.config = {
      batchSize: 2, // Conservative for OpenAI rate limits in Stage 1
      enableChangeDetection: true,
      processingDelay: 5000, // 5 seconds for OpenAI rate limiting
      useHybridEnrichment: true, // Default to hybrid OpenAI + Mixtral
      ...config
    };

    // Initialize services
    this.scraper = new McpSoScraper(config.craw4aiApiKey);
    this.supabaseService = new SupabaseService({
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey
    });
    this.registryService = new McpRegistryService({
      openaiApiKey: config.openaiApiKey,
      githubToken: config.githubToken
    });
    this.hybridEnrichment = new HybridEnrichmentPipeline(
      config.openaiApiKey,
      config.groqApiKey
    );

    const githubService = new GitHubService(config.githubToken);
    this.changeDetectionService = new ChangeDetectionService(
      githubService,
      this.supabaseService,
      this.registryService,
      {
        checkInterval: 24 * 60 * 60 * 1000, // 24 hours
        batchSize: config.batchSize || 10,
        enabledChecks: {
          readme: true,
          packageFiles: true,
          githubMetadata: true,
          externalResources: true
        }
      }
    );
  }

  // Main discovery workflow
  async discoverAndProcessServers(): Promise<DiscoveryResult> {
    const startTime = Date.now();
    console.log('🚀 Starting MCP server discovery and processing...');

    try {
      // Step 1: Scrape MCP.so and other sources
      console.log('📄 Step 1: Scraping MCP registry sources...');
      const scrapingResult = await this.scraper.scrapeAllSources();
      
      if (!scrapingResult.success) {
        throw new Error(`Scraping failed: ${scrapingResult.errors?.join(', ')}`);
      }

      console.log(`✅ Found ${scrapingResult.totalFound} servers from registry sources`);

      // Step 2: Process each server
      console.log('🔄 Step 2: Processing servers...');
      const processingResults = await this.processServers(scrapingResult.servers);

      // Step 3: Update change detection if enabled
      if (this.config.enableChangeDetection) {
        console.log('🔍 Step 3: Setting up change detection...');
        await this.setupChangeDetection();
      }

      const processingTime = Date.now() - startTime;
      const estimatedCost = processingResults.reduce((sum, r) => sum + (r.tokensUsed || 0), 0) * 0.00003; // Rough estimate

      console.log(`🎉 Discovery completed in ${processingTime}ms`);
      console.log(`💰 Estimated cost: $${estimatedCost.toFixed(3)}`);

      return {
        success: true,
        totalServersFound: scrapingResult.totalFound,
        newServersAdded: processingResults.filter(r => r.success && !r.cacheHit).length,
        serversUpdated: processingResults.filter(r => r.success && r.cacheHit).length,
        errors: processingResults.filter(r => !r.success).flatMap(r => r.errors || []),
        processingTime,
        estimatedCost
      };

    } catch (error) {
      console.error('❌ Discovery failed:', error);
      return {
        success: false,
        totalServersFound: 0,
        newServersAdded: 0,
        serversUpdated: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        processingTime: Date.now() - startTime,
        estimatedCost: 0
      };
    }
  }

  private async processServers(servers: any[]) {
    const results = [];
    
    for (let i = 0; i < servers.length; i += this.config.batchSize!) {
      const batch = servers.slice(i, i + this.config.batchSize!);
      console.log(`📦 Processing batch ${Math.floor(i / this.config.batchSize!) + 1}/${Math.ceil(servers.length / this.config.batchSize!)}`);

      for (const server of batch) {
        try {
          // Check if server already exists in database
          const existingServer = await this.supabaseService.getMcpServerByGithubUrl(server.githubUrl);
          
          if (existingServer) {
            // Check for changes
            const hasChanges = await this.changeDetectionService.checkServerForChanges(existingServer.id);
            
            if (hasChanges.hasChanges) {
              console.log(`🔄 Updating existing server: ${server.name}`);
              const result = await this.registryService.processRepository(server.githubUrl, true);
              
              if (result.success && result.server) {
                await this.updateServerInDatabase(existingServer.id, result.server, result.externalResources || []);
              }
              
              results.push(result);
            } else {
              console.log(`✅ Server up to date: ${server.name}`);
              results.push({
                success: true,
                cacheHit: true,
                processingTime: 0
              });
            }
          } else {
            // New server - add to database
            console.log(`➕ Adding new server: ${server.name}`);
            const result = await this.registryService.processRepository(server.githubUrl);
            
            if (result.success && result.server) {
              await this.addServerToDatabase(server, result.server, result.externalResources || []);
            }
            
            results.push(result);
          }

          // Rate limiting
          await this.delay(this.config.processingDelay!);

        } catch (error) {
          console.error(`❌ Failed to process ${server.name}:`, error);
          results.push({
            success: false,
            errors: [error instanceof Error ? error.message : String(error)],
            processingTime: 0
          });
        }
      }
    }

    return results;
  }

  private async addServerToDatabase(scrapedServer: any, enrichedServer: any, externalResources: any[]) {
    // Insert basic server data
    const dbServer = await this.supabaseService.insertMcpServer(scrapedServer);
    
    // Insert enriched content
    await this.supabaseService.insertEnrichedContent(dbServer.id, enrichedServer);
    
    // Insert external resources
    if (externalResources.length > 0) {
      await this.supabaseService.insertExternalResources(dbServer.id, externalResources);
    }
    
    console.log(`✅ Added ${scrapedServer.name} to database`);
  }

  private async updateServerInDatabase(serverId: string, enrichedServer: any, externalResources: any[]) {
    // Update server metadata
    await this.supabaseService.updateMcpServer(serverId, {
      stars: enrichedServer.stars,
      language: enrichedServer.language,
      tags: enrichedServer.tags,
      description: enrichedServer.description
    });
    
    // Update enriched content
    await this.supabaseService.updateEnrichedContent(serverId, enrichedServer);
    
    // Update external resources (simplified - in production you'd want to merge/update)
    if (externalResources.length > 0) {
      await this.supabaseService.insertExternalResources(serverId, externalResources);
    }
    
    console.log(`✅ Updated ${enrichedServer.name} in database`);
  }

  private async setupChangeDetection() {
    // Add all servers to monitoring
    const servers = await this.supabaseService.getAllMcpServers();
    
    for (const server of servers) {
      await this.supabaseService.addToEnrichmentQueue(
        server.id,
        'auto',
        'discovery-service'
      );
    }
    
    console.log(`📝 Added ${servers.length} servers to change detection queue`);
  }

  // Automated workflows
  async startAutomatedDiscovery(intervalHours = 24) {
    console.log(`🔄 Starting automated discovery (every ${intervalHours} hours)`);
    
    const runDiscovery = async () => {
      try {
        await this.discoverAndProcessServers();
      } catch (error) {
        console.error('❌ Automated discovery failed:', error);
      }
    };

    // Run initial discovery
    await runDiscovery();

    // Schedule periodic discovery
    setInterval(runDiscovery, intervalHours * 60 * 60 * 1000);
  }

  async processEnrichmentQueue() {
    return this.changeDetectionService.processEnrichmentQueue();
  }

  // RSS feed generation
  async generateRssFeed(): Promise<string> {
    const recentServers = await this.supabaseService.getAllMcpServers({ limit: 20 });
    
    const rssItems = recentServers.map(server => `
      <item>
        <title>${server.name}</title>
        <description>${server.description}</description>
        <link>${server.githubUrl}</link>
        <guid>${server.githubUrl}</guid>
        <pubDate>${new Date(server.updated_at).toUTCString()}</pubDate>
        <category>${server.category}</category>
        <author>${server.author.name}</author>
      </item>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>MCP Registry - Latest Servers</title>
    <description>Discover the latest Model Context Protocol servers</description>
    <link>https://your-domain.com</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <language>en-us</language>
    ${rssItems}
  </channel>
</rss>`;
  }

  // Health monitoring
  async getDiscoveryStats() {
    const totalServers = (await this.supabaseService.getAllMcpServers()).length;
    const pendingJobs = await this.supabaseService.getPendingEnrichmentJobs();
    const dbHealth = await this.supabaseService.healthCheck();
    
    return {
      totalServers,
      pendingEnrichmentJobs: pendingJobs.length,
      databaseHealthy: dbHealth.healthy,
      lastDiscoveryRun: new Date().toISOString(),
      services: {
        scraper: 'healthy',
        database: dbHealth.healthy ? 'healthy' : 'error',
        enrichment: 'healthy',
        changeDetection: 'healthy'
      }
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
