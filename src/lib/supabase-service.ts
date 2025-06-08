// Supabase Database Service - Using Established Schema
// Handles all database operations for MCP servers and enriched content

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { McpServer } from './semantic-search';
import { ExternalResource } from './web-search-service';
import { McpServerEntry } from './mcpso-scraper';

// Database types based on established McpServer schema
export interface DbMcpServer extends McpServer {
  slug?: string;
  created_at: string;
  updated_at: string;
}

// Extended content based on EnrichedMcpServer from semantic-search.ts
export interface DbEnrichedContent {
  id: string;
  server_id: string;
  summary: string;
  use_cases: any; // JSONB - stores use_cases array from EnrichedMcpServer
  integration_tips: string;
  faqs: any; // JSONB - stores faqs array from EnrichedMcpServer
  rephrased_content: string;
  classification_tags: string[];
  version_hash: string;
  community_resources: any; // JSONB - stores community_resources from EnrichedMcpServer
  project_info: any; // JSONB - stores project info from EnrichedMcpServer
  created_at: string;
  updated_at: string;
}

export interface DbExternalResource {
  id: string;
  server_id: string;
  type: 'video' | 'blog' | 'forum' | 'tutorial' | 'documentation' | 'discussion';
  title: string;
  url: string;
  source: string;
  description?: string;
  author?: string;
  published_date?: string;
  duration?: string;
  rank_score: number;
  thumbnail_url?: string;
  tags?: string[];
  verified: boolean;
  last_checked: string;
  created_at: string;
}

export interface DbEnrichmentQueue {
  id: string;
  server_id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  requested_by: string;
  last_processed_at?: string;
  trigger_source: 'auto' | 'manual';
  error_message?: string;
  processing_metadata?: any; // JSONB
  created_at: string;
  updated_at: string;
}

export interface DatabaseConfig {
  supabaseUrl: string;
  supabaseKey: string;
}

export class SupabaseService {
  private supabase: SupabaseClient;

  constructor(config: DatabaseConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
  }

  // MCP Servers CRUD Operations
  async insertMcpServer(serverData: McpServerEntry): Promise<DbMcpServer> {
    const slug = this.generateSlug(serverData.name);

    const dbServer: Omit<DbMcpServer, 'created_at' | 'updated_at'> = {
      id: this.generateId(serverData.name),
      slug,
      name: serverData.name,
      description: serverData.description,
      tags: serverData.tags,
      category: serverData.category,
      language: serverData.language || 'Unknown',
      stars: serverData.stars || 0,
      installCommand: this.inferInstallCommand(serverData),
      githubUrl: serverData.githubUrl,
      author: {
        name: serverData.author,
        githubUsername: serverData.author
      }
    };

    const { data, error } = await this.supabase
      .from('mcp_servers')
      .insert(dbServer)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert MCP server: ${error.message}`);
    }

    return data;
  }

  async updateMcpServer(id: string, updates: Partial<DbMcpServer>): Promise<DbMcpServer> {
    const { data, error } = await this.supabase
      .from('mcp_servers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update MCP server: ${error.message}`);
    }

    return data;
  }

  async getMcpServer(id: string): Promise<DbMcpServer | null> {
    const { data, error } = await this.supabase
      .from('mcp_servers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get MCP server: ${error.message}`);
    }

    return data;
  }

  async getMcpServerByGithubUrl(githubUrl: string): Promise<DbMcpServer | null> {
    const { data, error } = await this.supabase
      .from('mcp_servers')
      .select('*')
      .eq('githubUrl', githubUrl)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get MCP server by GitHub URL: ${error.message}`);
    }

    return data;
  }

  async getAllMcpServers(filters?: {
    category?: string;
    language?: string;
    minStars?: number;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<DbMcpServer[]> {
    let query = this.supabase.from('mcp_servers').select('*');

    if (filters?.language) {
      query = query.eq('language', filters.language);
    }

    if (filters?.minStars) {
      query = query.gte('stars', filters.minStars);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.overlaps('tags', filters.tags);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    query = query.order('stars', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get MCP servers: ${error.message}`);
    }

    return data || [];
  }

  // Enriched Content Operations
  async insertEnrichedContent(serverId: string, enrichedServer: McpServer): Promise<DbEnrichedContent> {
    const enrichedContent: Omit<DbEnrichedContent, 'id' | 'created_at' | 'updated_at'> = {
      server_id: serverId,
      summary: enrichedServer.description,
      use_cases: [], // Will be populated if EnrichedMcpServer interface is used
      integration_tips: this.generateIntegrationTips(enrichedServer),
      faqs: [], // Will be populated if EnrichedMcpServer interface is used
      rephrased_content: this.generateRephrasedContent(enrichedServer),
      classification_tags: enrichedServer.tags,
      version_hash: this.generateVersionHash(enrichedServer),
      community_resources: {}, // Will be populated if EnrichedMcpServer interface is used
      project_info: {}
    };

    const { data, error } = await this.supabase
      .from('enriched_content')
      .insert(enrichedContent)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to insert enriched content: ${error.message}`);
    }

    return data;
  }

  async getEnrichedContent(serverId: string): Promise<DbEnrichedContent | null> {
    const { data, error } = await this.supabase
      .from('enriched_content')
      .select('*')
      .eq('server_id', serverId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get enriched content: ${error.message}`);
    }

    return data;
  }

  async updateEnrichedContent(serverId: string, enrichedServer: McpServer): Promise<DbEnrichedContent> {
    const updates = {
      summary: enrichedServer.description,
      use_cases: [], // Will be populated if EnrichedMcpServer interface is used
      integration_tips: this.generateIntegrationTips(enrichedServer),
      faqs: [], // Will be populated if EnrichedMcpServer interface is used
      rephrased_content: this.generateRephrasedContent(enrichedServer),
      classification_tags: enrichedServer.tags,
      version_hash: this.generateVersionHash(enrichedServer),
      community_resources: {},
      project_info: {},
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('enriched_content')
      .update(updates)
      .eq('server_id', serverId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update enriched content: ${error.message}`);
    }

    return data;
  }

  // External Resources Operations
  async insertExternalResources(serverId: string, resources: ExternalResource[]): Promise<DbExternalResource[]> {
    const dbResources = resources.map(resource => ({
      server_id: serverId,
      type: resource.type,
      title: resource.title,
      url: resource.url,
      source: resource.source,
      description: resource.description,
      author: resource.author,
      published_date: resource.publishedDate,
      duration: resource.duration,
      rank_score: resource.rankScore,
      thumbnail_url: resource.thumbnailUrl,
      tags: resource.tags,
      verified: resource.verified,
      last_checked: resource.lastChecked.toISOString()
    }));

    const { data, error } = await this.supabase
      .from('external_resources')
      .insert(dbResources)
      .select();

    if (error) {
      throw new Error(`Failed to insert external resources: ${error.message}`);
    }

    return data || [];
  }

  async getExternalResources(serverId: string): Promise<DbExternalResource[]> {
    const { data, error } = await this.supabase
      .from('external_resources')
      .select('*')
      .eq('server_id', serverId)
      .order('rank_score', { ascending: false });

    if (error) {
      throw new Error(`Failed to get external resources: ${error.message}`);
    }

    return data || [];
  }

  // Enrichment Queue Operations
  async addToEnrichmentQueue(serverId: string, triggerSource: 'auto' | 'manual', requestedBy: string): Promise<DbEnrichmentQueue> {
    const queueEntry: Omit<DbEnrichmentQueue, 'id' | 'created_at' | 'updated_at'> = {
      server_id: serverId,
      status: 'pending',
      requested_by: requestedBy,
      trigger_source: triggerSource
    };

    const { data, error } = await this.supabase
      .from('enrichment_queue')
      .insert(queueEntry)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add to enrichment queue: ${error.message}`);
    }

    return data;
  }

  async updateEnrichmentQueueStatus(
    id: string, 
    status: DbEnrichmentQueue['status'], 
    errorMessage?: string,
    processingMetadata?: any
  ): Promise<DbEnrichmentQueue> {
    const updates: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed' || status === 'error') {
      updates.last_processed_at = new Date().toISOString();
    }

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    if (processingMetadata) {
      updates.processing_metadata = processingMetadata;
    }

    const { data, error } = await this.supabase
      .from('enrichment_queue')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update enrichment queue: ${error.message}`);
    }

    return data;
  }

  async getPendingEnrichmentJobs(limit = 10): Promise<DbEnrichmentQueue[]> {
    const { data, error } = await this.supabase
      .from('enrichment_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to get pending enrichment jobs: ${error.message}`);
    }

    return data || [];
  }

  // Change Detection
  async checkForChanges(serverId: string, newVersionHash: string): Promise<boolean> {
    const enrichedContent = await this.getEnrichedContent(serverId);
    return !enrichedContent || enrichedContent.version_hash !== newVersionHash;
  }

  // Search Operations
  async searchServers(query: string, filters?: {
    category?: string;
    language?: string;
    limit?: number;
  }): Promise<DbMcpServer[]> {
    let dbQuery = this.supabase
      .from('mcp_servers')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);

    if (filters?.language) {
      dbQuery = dbQuery.eq('language', filters.language);
    }

    if (filters?.limit) {
      dbQuery = dbQuery.limit(filters.limit);
    }

    dbQuery = dbQuery.order('stars', { ascending: false });

    const { data, error } = await dbQuery;

    if (error) {
      throw new Error(`Failed to search servers: ${error.message}`);
    }

    return data || [];
  }

  // Utility Methods
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private inferInstallCommand(serverData: McpServerEntry): string {
    const name = serverData.name.toLowerCase();
    
    if (name.includes('npm') || serverData.language === 'JavaScript' || serverData.language === 'TypeScript') {
      return `npm install ${serverData.name}`;
    }
    if (name.includes('pip') || serverData.language === 'Python') {
      return `pip install ${serverData.name}`;
    }
    if (serverData.language === 'Go') {
      return `go get ${serverData.githubUrl}`;
    }
    if (serverData.language === 'Rust') {
      return `cargo install ${serverData.name}`;
    }
    
    return `# See ${serverData.githubUrl} for installation instructions`;
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  private generateIntegrationTips(server: McpServer): string {
    const tips = [];

    tips.push(`Install with: ${server.installCommand}`);
    tips.push(`Language: ${server.language}`);
    tips.push(`Category: ${server.category}`);

    return tips.join(' | ');
  }

  private generateRephrasedContent(server: McpServer): string {
    // PRD requirement: Rewrite content to avoid copyright issues
    const originalDesc = server.description;
    const tags = server.tags.join(', ');

    return `This MCP server provides ${originalDesc.toLowerCase()}. Tagged as: ${tags}. Designed for integration with AI agents and automation workflows.`;
  }

  private generateVersionHash(server: McpServer): string {
    const content = JSON.stringify({
      description: server.description,
      tags: server.tags,
      category: server.category,
      stars: server.stars
    });
    return btoa(content).substring(0, 16);
  }

  // Database Health Check
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      const { data, error } = await this.supabase
        .from('mcp_servers')
        .select('count')
        .limit(1);

      if (error) {
        return { healthy: false, message: `Database error: ${error.message}` };
      }

      return { healthy: true, message: 'Database connection healthy' };
    } catch (error) {
      return { 
        healthy: false, 
        message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
}
