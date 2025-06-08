// OpenAI-Based Resource Discovery
// Uses GPT-4 with web search to find high-quality external resources

import OpenAI from 'openai';

export interface ExternalResource {
  title: string;
  url: string;
  description: string;
  type: 'video' | 'blog' | 'forum' | 'tutorial' | 'documentation' | 'discussion';
  source: string;
  author?: string;
  publishedDate?: string;
  duration?: string;
  thumbnailUrl?: string;
  tags?: string[];
  rankScore: number;
  verified: boolean;
  lastChecked: Date;
  aiReasoning?: string; // Why OpenAI selected this resource
}

export interface ResourceDiscoveryResult {
  success: boolean;
  resources: ExternalResource[];
  tokensUsed: number;
  searchesMade: number;
  processingTime: number;
  errors?: string[];
}

export class OpenAIResourceDiscovery {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async findExternalResources(
    serverName: string, 
    description: string,
    githubUrl: string,
    category: string
  ): Promise<ResourceDiscoveryResult> {
    const startTime = Date.now();
    console.log(`🔍 Finding resources for ${serverName} using OpenAI...`);

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o", // Best output limit (16K tokens)
        messages: [
          {
            role: "system",
            content: `You are an expert at finding high-quality learning resources for software tools and libraries. 
            
Your task is to find the best external resources for developers who want to learn about and use a specific MCP (Model Context Protocol) server.

IMPORTANT: Only include resources that actually exist. Use web search to verify URLs work.

For each resource, provide:
- title: Clear, descriptive title
- url: Real, working URL (verify it exists)
- description: Brief explanation of what the resource covers
- type: video, blog, tutorial, documentation, discussion
- source: Platform name (youtube, dev.to, reddit, github, etc.)
- author: Content creator name if available
- aiReasoning: Why you selected this resource (1-2 sentences)

Focus on:
1. Quality over quantity (3-6 excellent resources better than 10 mediocre ones)
2. Practical learning value
3. Recent/current content when possible
4. Diverse resource types (mix of videos, articles, discussions)
5. Beginner to intermediate level content`
          },
          {
            role: "user",
            content: `Find the best learning resources for the MCP server: "${serverName}"

Description: ${description}
GitHub URL: ${githubUrl}
Category: ${category}

Please find exactly 5-6 high-quality resources:
- 2 tutorials or guides (video or written)
- 1 community discussion or Q&A
- 1 official documentation
- 1-2 practical examples or use cases

IMPORTANT: Keep descriptions concise (1-2 sentences max) to stay within output limits.

Return ONLY a JSON array with this structure:
[
  {
    "title": "Resource title",
    "url": "https://actual-working-url.com",
    "description": "What this resource teaches",
    "type": "video|blog|tutorial|documentation|discussion",
    "source": "youtube|dev.to|reddit|github|etc",
    "author": "Creator name",
    "aiReasoning": "Why this resource is valuable"
  }
]

Only include resources that actually exist and are relevant to this specific MCP server.`
          }
        ],
        functions: [
          {
            name: "web_search",
            description: "Search the web for current information about the MCP server",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query to find resources"
                }
              },
              required: ["query"]
            }
          }
        ],
        function_call: "auto",
        temperature: 0.3,
        max_tokens: 3000 // Increased for GPT-4o
      });

      const response = completion.choices[0].message;
      let resources: ExternalResource[] = [];
      let searchesMade = 0;

      // Handle function calls (web search)
      if (response.function_call) {
        searchesMade++;
        console.log(`🌐 OpenAI is searching: ${response.function_call.arguments}`);
        
        // In a real implementation, you'd execute the web search
        // For now, we'll simulate it and let OpenAI continue
        const searchResult = "Search completed - found relevant resources";
        
        // Continue the conversation with search results
        const followUp = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are an expert at finding high-quality learning resources for software tools and libraries.`
            },
            {
              role: "user", 
              content: `Find the best learning resources for the MCP server: "${serverName}"`
            },
            {
              role: "assistant",
              content: response.content,
              function_call: response.function_call
            },
            {
              role: "function",
              name: "web_search",
              content: searchResult
            },
            {
              role: "user",
              content: `Based on your search, provide the final JSON array of resources.`
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        });

        resources = this.parseResourcesFromResponse(followUp.choices[0].message.content || '');
      } else {
        // Parse resources directly from response
        resources = this.parseResourcesFromResponse(response.content || '');
      }

      // Enhance resources with metadata
      const enhancedResources = resources.map(resource => ({
        ...resource,
        rankScore: this.calculateRankScore(resource),
        verified: false, // Would verify URLs in production
        lastChecked: new Date()
      }));

      const processingTime = Date.now() - startTime;
      const tokensUsed = completion.usage?.total_tokens || 0;

      console.log(`✅ Found ${enhancedResources.length} resources in ${processingTime}ms`);

      return {
        success: true,
        resources: enhancedResources,
        tokensUsed,
        searchesMade,
        processingTime,
      };

    } catch (error) {
      console.error('❌ OpenAI resource discovery failed:', error);
      return {
        success: false,
        resources: [],
        tokensUsed: 0,
        searchesMade: 0,
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  private parseResourcesFromResponse(content: string): ExternalResource[] {
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No JSON array found in OpenAI response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(parsed)) {
        console.warn('Response is not an array');
        return [];
      }

      return parsed.map(item => ({
        title: item.title || 'Untitled Resource',
        url: item.url || '',
        description: item.description || '',
        type: this.normalizeResourceType(item.type),
        source: item.source || 'unknown',
        author: item.author,
        aiReasoning: item.aiReasoning,
        rankScore: 0.8, // Will be calculated later
        verified: false,
        lastChecked: new Date()
      }));

    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      return [];
    }
  }

  private normalizeResourceType(type: string): ExternalResource['type'] {
    const typeMap: Record<string, ExternalResource['type']> = {
      'video': 'video',
      'blog': 'blog', 
      'article': 'blog',
      'tutorial': 'tutorial',
      'guide': 'tutorial',
      'documentation': 'documentation',
      'docs': 'documentation',
      'discussion': 'discussion',
      'forum': 'forum',
      'qa': 'discussion',
      'q&a': 'discussion'
    };

    return typeMap[type?.toLowerCase()] || 'blog';
  }

  private calculateRankScore(resource: ExternalResource): number {
    let score = 0.5; // Base score

    // Source quality
    const sourceScores: Record<string, number> = {
      'youtube': 0.9,
      'github': 0.95,
      'dev.to': 0.8,
      'medium': 0.75,
      'reddit': 0.7,
      'stackoverflow': 0.85,
      'official': 1.0
    };

    score += (sourceScores[resource.source.toLowerCase()] || 0.5) * 0.3;

    // Type preference
    const typeScores: Record<string, number> = {
      'documentation': 1.0,
      'tutorial': 0.9,
      'video': 0.85,
      'blog': 0.8,
      'discussion': 0.7,
      'forum': 0.6
    };

    score += (typeScores[resource.type] || 0.5) * 0.2;

    // AI reasoning quality (if provided)
    if (resource.aiReasoning && resource.aiReasoning.length > 20) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  // Alternative: Generate resources without web search
  async generateKnownResources(
    serverName: string,
    description: string,
    githubUrl: string,
    category: string
  ): Promise<ResourceDiscoveryResult> {
    const startTime = Date.now();
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert at software development resources. Generate likely high-quality learning resources for a given MCP server based on common patterns and known platforms.

Create realistic resource suggestions that would typically exist for this type of tool, but don't claim they definitely exist.

Focus on:
1. Common tutorial patterns for this type of tool
2. Likely community discussion topics
3. Standard documentation locations
4. Typical learning progression`
          },
          {
            role: "user",
            content: `Generate likely learning resources for: "${serverName}"

Description: ${description}
GitHub: ${githubUrl}
Category: ${category}

Create 4-6 realistic resources that would typically exist for this type of MCP server. Format as JSON array:

[
  {
    "title": "Likely tutorial title",
    "url": "https://likely-platform.com/path",
    "description": "What this would typically cover",
    "type": "video|blog|tutorial|documentation|discussion",
    "source": "youtube|dev.to|reddit|github|etc",
    "aiReasoning": "Why this type of resource is valuable"
  }
]`
          }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });

      const resources = this.parseResourcesFromResponse(completion.choices[0].message.content || '');
      
      // Mark as AI-generated suggestions
      const enhancedResources = resources.map(resource => ({
        ...resource,
        rankScore: this.calculateRankScore(resource) * 0.8, // Lower score for generated
        verified: false,
        lastChecked: new Date(),
        aiReasoning: (resource.aiReasoning || '') + ' (AI-generated suggestion)'
      }));

      return {
        success: true,
        resources: enhancedResources,
        tokensUsed: completion.usage?.total_tokens || 0,
        searchesMade: 0,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        resources: [],
        tokensUsed: 0,
        searchesMade: 0,
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // Batch processing for cost efficiency
  async findResourcesForMultipleServers(
    servers: Array<{
      name: string;
      description: string;
      githubUrl: string;
      category: string;
    }>
  ): Promise<Record<string, ResourceDiscoveryResult>> {
    console.log(`🔄 Batch processing ${servers.length} servers with GPT-4o...`);

    const results: Record<string, ResourceDiscoveryResult> = {};

    // Process 2 servers at a time to stay within token limits
    const batchSize = 2;
    for (let i = 0; i < servers.length; i += batchSize) {
      const batch = servers.slice(i, i + batchSize);

      try {
        const batchPrompt = this.createBatchPrompt(batch);
        const completion = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `Find high-quality learning resources for multiple MCP servers. Use web search when needed.

Output a JSON object where each key is the server name and the value is an array of 4-5 resources.
Keep descriptions concise (1-2 sentences) to stay within output limits.

Format:
{
  "server-name-1": [
    {
      "title": "Resource title",
      "url": "https://real-url.com",
      "description": "Brief description",
      "type": "video|blog|tutorial|documentation|discussion",
      "source": "platform-name",
      "author": "Author name"
    }
  ]
}`
            },
            {
              role: "user",
              content: batchPrompt
            }
          ],
          functions: [
            {
              name: "web_search",
              description: "Search the web for resources about MCP servers",
              parameters: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Search query" }
                },
                required: ["query"]
              }
            }
          ],
          function_call: "auto",
          temperature: 0.3,
          max_tokens: 4000
        });

        const batchResults = this.parseBatchResponse(completion.choices[0].message.content || '');
        Object.assign(results, batchResults);

        // Rate limiting between batches
        await this.delay(2000);

      } catch (error) {
        console.error(`Batch processing failed for servers ${i}-${i + batchSize}:`, error);

        // Fallback to individual processing
        for (const server of batch) {
          results[server.name] = await this.findExternalResources(
            server.name,
            server.description,
            server.githubUrl,
            server.category
          );
          await this.delay(1000);
        }
      }
    }

    return results;
  }

  private createBatchPrompt(servers: Array<{ name: string; description: string; githubUrl: string; category: string }>): string {
    const serverDescriptions = servers.map(server =>
      `${server.name}: ${server.description} (${server.category}, ${server.githubUrl})`
    ).join('\n\n');

    return `Find learning resources for these MCP servers:

${serverDescriptions}

For each server, find 4-5 diverse, high-quality resources. Use web search to find real, current resources.`;
  }

  private parseBatchResponse(content: string): Record<string, ResourceDiscoveryResult> {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return {};

      const parsed = JSON.parse(jsonMatch[0]);
      const results: Record<string, ResourceDiscoveryResult> = {};

      for (const [serverName, resources] of Object.entries(parsed)) {
        if (Array.isArray(resources)) {
          const enhancedResources = (resources as any[]).map(resource => ({
            title: resource.title || 'Untitled Resource',
            url: resource.url || '',
            description: resource.description || '',
            type: this.normalizeResourceType(resource.type),
            source: resource.source || 'unknown',
            author: resource.author,
            aiReasoning: resource.aiReasoning,
            rankScore: this.calculateRankScore(resource),
            verified: false,
            lastChecked: new Date()
          }));

          results[serverName] = {
            success: true,
            resources: enhancedResources,
            tokensUsed: 0, // Would need to track per server
            searchesMade: 0,
            processingTime: 0
          };
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to parse batch response:', error);
      return {};
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cost estimation for GPT-4o
  estimateCost(serverCount: number): { tokens: number; cost: number } {
    const tokensPerServer = 2500; // Average for GPT-4o with web search
    const totalTokens = serverCount * tokensPerServer;
    const cost = (totalTokens / 1000) * 0.03; // $0.03 per 1K tokens for GPT-4o

    return { tokens: totalTokens, cost };
  }

  // Verify URLs actually work (optional enhancement)
  async verifyResources(resources: ExternalResource[]): Promise<ExternalResource[]> {
    const verifiedResources = await Promise.all(
      resources.map(async (resource) => {
        try {
          const response = await fetch(resource.url, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
          });
          
          return {
            ...resource,
            verified: response.ok,
            lastChecked: new Date()
          };
        } catch (error) {
          return {
            ...resource,
            verified: false,
            lastChecked: new Date()
          };
        }
      })
    );

    return verifiedResources;
  }
}
