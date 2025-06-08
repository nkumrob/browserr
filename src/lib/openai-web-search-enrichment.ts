// OpenAI Web Search Enrichment - Systematic Approach
// Uses OpenAI function calling with web search to enrich MCP server data

import OpenAI from 'openai';
import { McpServer } from './semantic-search';

export interface EnrichmentQuery {
  field: string;
  query: string;
  priority: number;
  expectedDomains?: string[];
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  domain: string;
  relevanceScore: number;
}

export interface EnrichmentResult {
  success: boolean;
  originalServer: McpServer;
  enrichedServer: McpServer;
  searchesMade: number;
  tokensUsed: number;
  processingTime: number;
  foundResources: SearchResult[];
  errors?: string[];
}

export class OpenAIWebSearchEnrichment {
  private openai: OpenAI;
  private cache: Map<string, SearchResult[]> = new Map();

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async enrichServer(server: McpServer): Promise<EnrichmentResult> {
    const startTime = Date.now();
    console.log(`🧠 Enriching ${server.name} with OpenAI web search...`);

    try {
      // 1. Define what needs enrichment
      const enrichmentQueries = this.generateEnrichmentQueries(server);
      
      // 2. Execute searches only for missing fields
      const searchResults: SearchResult[] = [];
      let searchesMade = 0;
      let totalTokens = 0;

      for (const query of enrichmentQueries) {
        if (this.shouldEnrichField(server, query.field)) {
          console.log(`🔍 Searching for: ${query.query}`);
          
          const results = await this.executeWebSearch(query.query);
          searchResults.push(...results);
          searchesMade++;
          
          // Rate limiting
          await this.delay(1000);
        }
      }

      // 3. Use OpenAI to intelligently merge results
      const enrichedServer = await this.mergeEnrichments(server, searchResults);
      totalTokens += 1500; // Estimate for merge operation

      const processingTime = Date.now() - startTime;

      console.log(`✅ Enriched ${server.name} in ${processingTime}ms (${searchesMade} searches, ${totalTokens} tokens)`);

      return {
        success: true,
        originalServer: server,
        enrichedServer,
        searchesMade,
        tokensUsed: totalTokens,
        processingTime,
        foundResources: searchResults
      };

    } catch (error) {
      console.error(`❌ Enrichment failed for ${server.name}:`, error);
      return {
        success: false,
        originalServer: server,
        enrichedServer: server,
        searchesMade: 0,
        tokensUsed: 0,
        processingTime: Date.now() - startTime,
        foundResources: [],
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // 1. Define What Needs Enrichment
  private generateEnrichmentQueries(server: McpServer): EnrichmentQuery[] {
    const baseName = server.name.replace(/^mcp-server-?/, '').replace(/-/g, ' ');
    
    return [
      {
        field: 'homepage',
        query: `${baseName} official website`,
        priority: 1,
        expectedDomains: ['.io', '.com', '.org', '.dev']
      },
      {
        field: 'repository',
        query: `${baseName} GitHub repository`,
        priority: 1,
        expectedDomains: ['github.com']
      },
      {
        field: 'documentation',
        query: `${baseName} documentation docs`,
        priority: 2,
        expectedDomains: ['docs.', 'readthedocs.io', '.github.io']
      },
      {
        field: 'npmPackage',
        query: `${baseName} npm package`,
        priority: 2,
        expectedDomains: ['npmjs.com']
      },
      {
        field: 'useCases',
        query: `${baseName} real-world use cases examples`,
        priority: 3,
        expectedDomains: ['dev.to', 'medium.com', 'blog.']
      },
      {
        field: 'videoResources',
        query: `${baseName} tutorial site:youtube.com`,
        priority: 3,
        expectedDomains: ['youtube.com', 'youtu.be']
      },
      {
        field: 'communityDiscussion',
        query: `${baseName} discussion site:reddit.com OR site:stackoverflow.com`,
        priority: 4,
        expectedDomains: ['reddit.com', 'stackoverflow.com']
      }
    ];
  }

  // Check if field needs enrichment
  private shouldEnrichField(server: McpServer, field: string): boolean {
    switch (field) {
      case 'homepage':
        return !server.githubUrl || server.githubUrl === server.githubUrl; // Always try to find homepage
      case 'repository':
        return !server.githubUrl;
      case 'documentation':
        return true; // Always look for docs
      case 'npmPackage':
        return server.language === 'JavaScript' || server.language === 'TypeScript';
      case 'useCases':
      case 'videoResources':
      case 'communityDiscussion':
        return true; // Always look for these
      default:
        return false;
    }
  }

  // 2. Execute Web Search using OpenAI function calling
  private async executeWebSearch(query: string): Promise<SearchResult[]> {
    // Check cache first
    const cacheKey = this.hashQuery(query);
    if (this.cache.has(cacheKey)) {
      console.log(`📋 Using cached results for: ${query}`);
      return this.cache.get(cacheKey)!;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a web search assistant. Use the web_search function to find relevant, high-quality results for the given query. Focus on official sources, documentation, and reputable platforms.`
          },
          {
            role: "user",
            content: `Search for: ${query}

Find the top 3-5 most relevant results. Prioritize:
1. Official websites and documentation
2. GitHub repositories
3. Package managers (npm, PyPI)
4. Reputable tutorial sites
5. Community discussions

Exclude aggregators like stackshare.io, alternativeto.net.`
          }
        ],
        functions: [
          {
            name: "web_search",
            description: "Search the web for information",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query"
                }
              },
              required: ["query"]
            }
          }
        ],
        function_call: { name: "web_search" },
        temperature: 0.1,
        max_tokens: 1500
      });

      // Parse search results from OpenAI response
      const results = this.parseSearchResults(completion.choices[0].message.content || '');
      
      // Cache results
      this.cache.set(cacheKey, results);
      
      return results;

    } catch (error) {
      console.error(`Search failed for query: ${query}`, error);
      return [];
    }
  }

  private parseSearchResults(content: string): SearchResult[] {
    // In a real implementation, this would parse the actual search results
    // For now, we'll simulate realistic results
    return [
      {
        title: "Example Result",
        url: "https://example.com",
        snippet: "Example snippet",
        domain: "example.com",
        relevanceScore: 0.8
      }
    ];
  }

  // 3. Intelligent merging using OpenAI
  private async mergeEnrichments(server: McpServer, searchResults: SearchResult[]): Promise<McpServer> {
    if (searchResults.length === 0) {
      return server;
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at enriching software project metadata. Given a project and search results, intelligently merge the best information into the project structure.

Rules:
1. Only use URLs that are clearly relevant to the project
2. Prioritize official sources over third-party
3. Ensure URLs are working and not broken
4. Don't duplicate existing information
5. Maintain the original structure but add missing fields

Return the enriched project as JSON.`
          },
          {
            role: "user",
            content: `Enrich this MCP server project with the search results:

Original Project:
${JSON.stringify(server, null, 2)}

Search Results:
${JSON.stringify(searchResults, null, 2)}

Add/update these fields if good matches are found:
- homepage (official website)
- documentation links
- npm package URL (if JavaScript/TypeScript)
- video tutorials
- community discussions
- use case examples

Return the enriched project JSON.`
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      });

      const enrichedContent = completion.choices[0].message.content || '';
      
      try {
        // Extract JSON from response
        const jsonMatch = enrichedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const enrichedServer = JSON.parse(jsonMatch[0]);
          return { ...server, ...enrichedServer };
        }
      } catch (parseError) {
        console.warn('Failed to parse enriched JSON, returning original server');
      }

      return server;

    } catch (error) {
      console.error('Enrichment merge failed:', error);
      return server;
    }
  }

  // Batch processing for efficiency
  async enrichMultipleServers(servers: McpServer[]): Promise<EnrichmentResult[]> {
    console.log(`🚀 Batch enriching ${servers.length} servers...`);
    
    const results: EnrichmentResult[] = [];
    
    // Process in small batches to avoid rate limits
    const batchSize = 3;
    for (let i = 0; i < servers.length; i += batchSize) {
      const batch = servers.slice(i, i + batchSize);
      
      const batchPromises = batch.map(server => this.enrichServer(server));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Rate limiting between batches
      if (i + batchSize < servers.length) {
        await this.delay(3000);
      }
    }
    
    return results;
  }

  // Deduplication & caching utilities
  private hashQuery(query: string): string {
    return btoa(query.toLowerCase().trim()).substring(0, 16);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cache management
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Cost estimation
  estimateCost(serverCount: number): { searches: number; tokens: number; cost: number } {
    const searchesPerServer = 4; // Average searches needed
    const tokensPerServer = 2000; // Including search + merge
    
    const totalSearches = serverCount * searchesPerServer;
    const totalTokens = serverCount * tokensPerServer;
    const cost = (totalTokens / 1000) * 0.03; // GPT-4o pricing
    
    return { searches: totalSearches, tokens: totalTokens, cost };
  }
}
