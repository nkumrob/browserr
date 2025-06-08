// GPT-3.5 Resource Discovery - Cost-Optimized Version
// Uses GPT-3.5-turbo for generating realistic resource suggestions

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
  aiGenerated: boolean; // Mark as AI-suggested
}

export interface ResourceDiscoveryResult {
  success: boolean;
  resources: ExternalResource[];
  tokensUsed: number;
  processingTime: number;
  model: string;
  errors?: string[];
}

export class GPT35ResourceDiscovery {
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
    console.log(`🔍 Finding resources for ${serverName} using GPT-3.5...`);

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert at suggesting realistic learning resources for software tools.

Generate likely high-quality learning resources that would typically exist for a given MCP server. Base suggestions on common patterns for similar tools.

IMPORTANT GUIDELINES:
1. Create realistic URLs using common patterns (don't invent specific IDs)
2. Focus on platforms that commonly have this type of content
3. Generate 4-6 diverse, high-quality suggestions
4. Make titles specific and helpful
5. Provide clear descriptions of what each resource would cover

Output ONLY a valid JSON array, no other text.`
          },
          {
            role: "user",
            content: `Generate realistic learning resources for MCP server: "${serverName}"

Description: ${description}
GitHub: ${githubUrl}
Category: ${category}

Create 4-6 realistic resources using these patterns:

YouTube videos: "How to use [tool]", "[Tool] Tutorial", "Getting started with [tool]"
Blog posts: Dev.to, Medium articles about the tool
Documentation: Official docs, GitHub README guides
Discussions: Reddit threads, Stack Overflow questions
Examples: GitHub repositories with examples

JSON format:
[
  {
    "title": "Specific tutorial title",
    "url": "https://realistic-platform.com/realistic-path",
    "description": "What this resource covers (2-3 sentences)",
    "type": "video|blog|tutorial|documentation|discussion",
    "source": "youtube|devto|medium|github|reddit|stackoverflow",
    "author": "Likely author name or channel"
  }
]`
          }
        ],
        temperature: 0.4,
        max_tokens: 1200, // Limit output to control costs
        top_p: 0.9
      });

      const response = completion.choices[0].message.content || '';
      const resources = this.parseResourcesFromResponse(response);
      
      // Enhance with metadata
      const enhancedResources = resources.map(resource => ({
        ...resource,
        rankScore: this.calculateRankScore(resource),
        verified: false,
        lastChecked: new Date(),
        aiGenerated: true
      }));

      const processingTime = Date.now() - startTime;
      const tokensUsed = completion.usage?.total_tokens || 0;

      console.log(`✅ Generated ${enhancedResources.length} resource suggestions in ${processingTime}ms (${tokensUsed} tokens)`);

      return {
        success: true,
        resources: enhancedResources,
        tokensUsed,
        processingTime,
        model: 'gpt-3.5-turbo'
      };

    } catch (error) {
      console.error('❌ GPT-3.5 resource discovery failed:', error);
      return {
        success: false,
        resources: [],
        tokensUsed: 0,
        processingTime: Date.now() - startTime,
        model: 'gpt-3.5-turbo',
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
    console.log(`🔄 Batch processing ${servers.length} servers with GPT-3.5...`);
    
    const results: Record<string, ResourceDiscoveryResult> = {};
    
    // Process in smaller batches to avoid token limits
    const batchSize = 3;
    for (let i = 0; i < servers.length; i += batchSize) {
      const batch = servers.slice(i, i + batchSize);
      
      try {
        const batchPrompt = this.createBatchPrompt(batch);
        const completion = await this.openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `Generate realistic learning resources for multiple MCP servers. 
              
Output a JSON object where each key is the server name and the value is an array of resources.

Format:
{
  "server-name-1": [
    {
      "title": "Resource title",
      "url": "https://realistic-url.com",
      "description": "What this covers",
      "type": "video|blog|tutorial|documentation|discussion",
      "source": "platform-name",
      "author": "Author name"
    }
  ],
  "server-name-2": [...]
}`
            },
            {
              role: "user",
              content: batchPrompt
            }
          ],
          temperature: 0.4,
          max_tokens: 2000
        });

        const batchResults = this.parseBatchResponse(completion.choices[0].message.content || '');
        Object.assign(results, batchResults);
        
        // Rate limiting
        await this.delay(1000);
        
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
        }
      }
    }
    
    return results;
  }

  private createBatchPrompt(servers: Array<{ name: string; description: string; githubUrl: string; category: string }>): string {
    const serverDescriptions = servers.map(server => 
      `${server.name}: ${server.description} (${server.category})`
    ).join('\n');

    return `Generate 3-4 realistic learning resources for each of these MCP servers:

${serverDescriptions}

For each server, suggest diverse resource types (video, blog, documentation, discussion).`;
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
            rankScore: this.calculateRankScore(resource),
            verified: false,
            lastChecked: new Date(),
            aiGenerated: true
          }));

          results[serverName] = {
            success: true,
            resources: enhancedResources,
            tokensUsed: 0, // Would need to track per server
            processingTime: 0,
            model: 'gpt-3.5-turbo'
          };
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to parse batch response:', error);
      return {};
    }
  }

  private parseResourcesFromResponse(content: string): ExternalResource[] {
    try {
      // Extract JSON array from response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No JSON array found in GPT-3.5 response');
        return this.generateFallbackResources();
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!Array.isArray(parsed)) {
        console.warn('Response is not an array');
        return this.generateFallbackResources();
      }

      return parsed.map(item => ({
        title: item.title || 'Untitled Resource',
        url: item.url || '',
        description: item.description || '',
        type: this.normalizeResourceType(item.type),
        source: item.source || 'unknown',
        author: item.author,
        rankScore: 0.7, // Lower than GPT-4 since it's generated
        verified: false,
        lastChecked: new Date(),
        aiGenerated: true
      }));

    } catch (error) {
      console.error('Failed to parse GPT-3.5 response:', error);
      return this.generateFallbackResources();
    }
  }

  private generateFallbackResources(): ExternalResource[] {
    // Minimal fallback if parsing fails
    return [
      {
        title: 'GitHub Repository',
        url: 'https://github.com/search?q=mcp-server',
        description: 'Search for related MCP servers and examples',
        type: 'documentation',
        source: 'github',
        rankScore: 0.6,
        verified: false,
        lastChecked: new Date(),
        aiGenerated: true
      }
    ];
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
      'qa': 'discussion'
    };

    return typeMap[type?.toLowerCase()] || 'blog';
  }

  private calculateRankScore(resource: any): number {
    let score = 0.6; // Base score for AI-generated

    // Source quality
    const sourceScores: Record<string, number> = {
      'youtube': 0.8,
      'github': 0.9,
      'devto': 0.75,
      'medium': 0.7,
      'reddit': 0.65,
      'stackoverflow': 0.8
    };

    score += (sourceScores[resource.source?.toLowerCase()] || 0.5) * 0.2;

    // Type preference
    const typeScores: Record<string, number> = {
      'documentation': 0.9,
      'tutorial': 0.85,
      'video': 0.8,
      'blog': 0.75,
      'discussion': 0.7
    };

    score += (typeScores[resource.type] || 0.5) * 0.2;

    return Math.min(score, 1.0);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cost estimation
  estimateCost(serverCount: number): { tokens: number; cost: number } {
    const tokensPerServer = 800; // Average for GPT-3.5
    const totalTokens = serverCount * tokensPerServer;
    const cost = (totalTokens / 1000) * 0.002; // $0.002 per 1K tokens
    
    return { tokens: totalTokens, cost };
  }
}
