// Change Detection Service - PRD Diff Mechanism
// Monitors GitHub repositories and external resources for changes

import { GitHubService } from './github-service';
import { SupabaseService } from './supabase-service';
import { McpRegistryService } from './mcp-registry-service';

export interface ChangeDetectionResult {
  hasChanges: boolean;
  changeType: 'readme' | 'package' | 'metadata' | 'external_resources' | 'none';
  oldHash: string;
  newHash: string;
  changedFields: string[];
  lastChecked: Date;
}

export interface MonitoringConfig {
  checkInterval: number; // milliseconds
  batchSize: number;
  enabledChecks: {
    readme: boolean;
    packageFiles: boolean;
    githubMetadata: boolean;
    externalResources: boolean;
  };
}

export class ChangeDetectionService {
  private githubService: GitHubService;
  private supabaseService: SupabaseService;
  private registryService: McpRegistryService;
  private config: MonitoringConfig;

  constructor(
    githubService: GitHubService,
    supabaseService: SupabaseService,
    registryService: McpRegistryService,
    config: MonitoringConfig
  ) {
    this.githubService = githubService;
    this.supabaseService = supabaseService;
    this.registryService = registryService;
    this.config = {
      checkInterval: 24 * 60 * 60 * 1000, // 24 hours default
      batchSize: 10,
      enabledChecks: {
        readme: true,
        packageFiles: true,
        githubMetadata: true,
        externalResources: true
      },
      ...config
    };
  }

  async checkServerForChanges(serverId: string): Promise<ChangeDetectionResult> {
    console.log(`🔍 Checking for changes: ${serverId}`);

    try {
      // Get current server data from database
      const dbServer = await this.supabaseService.getMcpServer(serverId);
      if (!dbServer) {
        throw new Error(`Server not found: ${serverId}`);
      }

      // Get current enriched content for version hash comparison
      const currentEnrichedContent = await this.supabaseService.getEnrichedContent(serverId);
      const oldVersionHash = currentEnrichedContent?.version_hash || '';

      // Fetch fresh data from GitHub
      const freshGitHubData = await this.githubService.extractRepoData(dbServer.github_url);
      
      // Generate new content hashes
      const newHashes = this.generateContentHashes(freshGitHubData);
      const newVersionHash = this.generateVersionHash(freshGitHubData);

      // Compare with stored data
      const changes = this.detectChanges(dbServer, freshGitHubData, oldVersionHash, newVersionHash);

      // Check external resources if enabled
      if (this.config.enabledChecks.externalResources) {
        const externalResourceChanges = await this.checkExternalResourceChanges(serverId);
        if (externalResourceChanges.hasChanges) {
          changes.hasChanges = true;
          changes.changeType = 'external_resources';
          changes.changedFields.push('external_resources');
        }
      }

      console.log(`${changes.hasChanges ? '🔄' : '✅'} Changes detected: ${changes.hasChanges} (${changes.changeType})`);

      return {
        ...changes,
        lastChecked: new Date()
      };

    } catch (error) {
      console.error(`❌ Change detection failed for ${serverId}:`, error);
      return {
        hasChanges: false,
        changeType: 'none',
        oldHash: '',
        newHash: '',
        changedFields: [],
        lastChecked: new Date()
      };
    }
  }

  async checkAllServersForChanges(): Promise<ChangeDetectionResult[]> {
    console.log('🔍 Starting batch change detection...');

    const servers = await this.supabaseService.getAllMcpServers({ limit: this.config.batchSize });
    const results: ChangeDetectionResult[] = [];

    for (const server of servers) {
      try {
        const result = await this.checkServerForChanges(server.id);
        results.push(result);

        // If changes detected, add to enrichment queue
        if (result.hasChanges) {
          await this.supabaseService.addToEnrichmentQueue(
            server.id,
            'auto',
            'change-detection-service'
          );
          console.log(`📝 Added ${server.name} to enrichment queue due to changes`);
        }

        // Rate limiting between checks
        await this.delay(1000);
      } catch (error) {
        console.error(`Failed to check changes for ${server.name}:`, error);
      }
    }

    const changedCount = results.filter(r => r.hasChanges).length;
    console.log(`📊 Change detection complete: ${changedCount}/${results.length} servers have changes`);

    return results;
  }

  private detectChanges(
    dbServer: any,
    freshData: any,
    oldVersionHash: string,
    newVersionHash: string
  ): Omit<ChangeDetectionResult, 'lastChecked'> {
    const changedFields: string[] = [];
    let changeType: ChangeDetectionResult['changeType'] = 'none';

    // Check README changes
    if (this.config.enabledChecks.readme) {
      const oldReadmeHash = this.hashContent(dbServer.description || '');
      const newReadmeHash = this.hashContent(freshData.readme_content || '');
      
      if (oldReadmeHash !== newReadmeHash) {
        changedFields.push('readme');
        changeType = 'readme';
      }
    }

    // Check package file changes
    if (this.config.enabledChecks.packageFiles) {
      const oldPackageHash = this.hashContent(JSON.stringify(dbServer.package_metadata || {}));
      const newPackageHash = this.hashContent(JSON.stringify(freshData.package_json || {}));
      
      if (oldPackageHash !== newPackageHash) {
        changedFields.push('package_files');
        changeType = 'package';
      }
    }

    // Check GitHub metadata changes
    if (this.config.enabledChecks.githubMetadata) {
      if (dbServer.stars !== freshData.stargazers_count) {
        changedFields.push('stars');
        changeType = 'metadata';
      }
      
      if (dbServer.language !== freshData.language) {
        changedFields.push('language');
        changeType = 'metadata';
      }
      
      if (JSON.stringify(dbServer.tags) !== JSON.stringify(freshData.topics)) {
        changedFields.push('tags');
        changeType = 'metadata';
      }
    }

    // Check overall version hash
    if (oldVersionHash !== newVersionHash) {
      changedFields.push('version_hash');
      if (changeType === 'none') {
        changeType = 'metadata';
      }
    }

    return {
      hasChanges: changedFields.length > 0,
      changeType,
      oldHash: oldVersionHash,
      newHash: newVersionHash,
      changedFields
    };
  }

  private async checkExternalResourceChanges(serverId: string): Promise<{ hasChanges: boolean }> {
    try {
      const externalResources = await this.supabaseService.getExternalResources(serverId);
      let hasChanges = false;

      // Check a sample of URLs to see if they're still valid
      const samplesToCheck = externalResources.slice(0, 3); // Check first 3 resources
      
      for (const resource of samplesToCheck) {
        try {
          const response = await fetch(resource.url, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          
          if (!response.ok && resource.verified) {
            // Resource was verified but now broken
            hasChanges = true;
            console.log(`🔗 Broken link detected: ${resource.url}`);
          } else if (response.ok && !resource.verified) {
            // Resource was broken but now working
            hasChanges = true;
            console.log(`🔗 Fixed link detected: ${resource.url}`);
          }
        } catch (error) {
          if (resource.verified) {
            hasChanges = true;
            console.log(`🔗 Link became inaccessible: ${resource.url}`);
          }
        }
      }

      return { hasChanges };
    } catch (error) {
      console.warn('Failed to check external resource changes:', error);
      return { hasChanges: false };
    }
  }

  private generateContentHashes(githubData: any): Record<string, string> {
    return {
      readme: this.hashContent(githubData.readme_content || ''),
      package: this.hashContent(JSON.stringify(githubData.package_json || {})),
      metadata: this.hashContent(JSON.stringify({
        stars: githubData.stargazers_count,
        language: githubData.language,
        topics: githubData.topics,
        updated_at: githubData.updated_at
      }))
    };
  }

  private generateVersionHash(githubData: any): string {
    const content = JSON.stringify({
      readme_length: githubData.readme_content?.length || 0,
      package_hash: this.hashContent(JSON.stringify(githubData.package_json || {})),
      stars: githubData.stargazers_count,
      last_commit: githubData.pushed_at
    });
    return this.hashContent(content);
  }

  private hashContent(content: string): string {
    // Simple hash function for change detection
    return btoa(content).substring(0, 16);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Automated monitoring methods
  async startMonitoring(): Promise<void> {
    console.log(`🔄 Starting automated change detection (interval: ${this.config.checkInterval}ms)`);
    
    const runCheck = async () => {
      try {
        await this.checkAllServersForChanges();
      } catch (error) {
        console.error('❌ Automated change detection failed:', error);
      }
    };

    // Run initial check
    await runCheck();

    // Schedule periodic checks
    setInterval(runCheck, this.config.checkInterval);
  }

  async processEnrichmentQueue(): Promise<void> {
    console.log('📝 Processing enrichment queue...');

    const pendingJobs = await this.supabaseService.getPendingEnrichmentJobs(5);
    
    for (const job of pendingJobs) {
      try {
        // Update status to processing
        await this.supabaseService.updateEnrichmentQueueStatus(job.id, 'processing');

        // Get server data
        const server = await this.supabaseService.getMcpServer(job.server_id);
        if (!server) {
          throw new Error('Server not found');
        }

        console.log(`🤖 Processing enrichment for: ${server.name}`);

        // Process the repository with force refresh
        const result = await this.registryService.processRepository(server.github_url, true);

        if (result.success && result.server) {
          // Update database with new enriched content
          await this.supabaseService.updateEnrichedContent(job.server_id, result.server);
          
          // Update external resources if any
          if (result.externalResources && result.externalResources.length > 0) {
            // Clear old external resources
            // Note: In a real implementation, you'd want to update rather than replace
            await this.supabaseService.insertExternalResources(job.server_id, result.externalResources);
          }

          // Update server metadata
          await this.supabaseService.updateMcpServer(job.server_id, {
            stars: result.server.stars,
            language: result.server.language,
            tags: result.server.tags,
            last_updated: new Date().toISOString()
          });

          // Mark job as completed
          await this.supabaseService.updateEnrichmentQueueStatus(
            job.id, 
            'completed',
            undefined,
            {
              tokensUsed: result.tokensUsed,
              webSearchesMade: result.webSearchesMade,
              processingTime: result.processingTime
            }
          );

          console.log(`✅ Enrichment completed for: ${server.name}`);
        } else {
          throw new Error(`Processing failed: ${result.errors?.join(', ')}`);
        }

      } catch (error) {
        console.error(`❌ Enrichment failed for job ${job.id}:`, error);
        
        // Mark job as error
        await this.supabaseService.updateEnrichmentQueueStatus(
          job.id,
          'error',
          error instanceof Error ? error.message : String(error)
        );
      }

      // Rate limiting between jobs
      await this.delay(2000);
    }

    console.log(`📝 Enrichment queue processing complete: ${pendingJobs.length} jobs processed`);
  }

  // RSS Feed Generation for Changes
  async generateChangesFeed(): Promise<string> {
    const recentChanges = await this.supabaseService.getAllMcpServers({
      limit: 20
    });

    const rssItems = recentChanges.map(server => `
      <item>
        <title>${server.name} - Updated</title>
        <description>${server.description}</description>
        <link>${server.github_url}</link>
        <guid>${server.github_url}#${server.updated_at}</guid>
        <pubDate>${new Date(server.updated_at).toUTCString()}</pubDate>
        <category>${server.language}</category>
      </item>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>MCP Registry Changes</title>
    <description>Latest updates to MCP servers in the registry</description>
    <link>https://your-domain.com</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;
  }

  // Health monitoring
  async getMonitoringStats(): Promise<{
    totalServers: number;
    serversWithChanges: number;
    pendingEnrichmentJobs: number;
    lastCheckTime: Date;
    averageCheckTime: number;
  }> {
    const totalServers = (await this.supabaseService.getAllMcpServers()).length;
    const pendingJobs = await this.supabaseService.getPendingEnrichmentJobs();
    
    return {
      totalServers,
      serversWithChanges: 0, // Would need to track this in database
      pendingEnrichmentJobs: pendingJobs.length,
      lastCheckTime: new Date(),
      averageCheckTime: 2500 // milliseconds, would calculate from actual data
    };
  }
}
