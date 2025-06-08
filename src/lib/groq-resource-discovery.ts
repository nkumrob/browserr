// Groq + Mixtral Resource Discovery - Ultra-Fast & Cost-Effective
// Uses Mixtral 8x7B MoE for structured JSON generation at ~100 tokens/ms

import Groq from 'groq-sdk';

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
  aiGenerated: boolean;
}

export interface ResourceDiscoveryResult {
  success: boolean;
  resources: ExternalResource[];
  tokensUsed: number;
  processingTime: number;
  model: string;
  errors?: string[];
}

export class GroqResourceDiscovery {
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  async findExternalResources(
    serverName: string, 
    description: string,
    githubUrl: string,
    category: string
  ): Promise<ResourceDiscoveryResult> {
    const startTime = Date.now();
    console.log(`🚀 Finding resources for ${serverName} using Groq + Mixtral...`);

    try {
      const completion = await this.groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are an expert at generating realistic, high-quality learning resources for software tools and libraries.

CRITICAL: You must respond with ONLY a valid JSON array. No other text, explanations, or markdown formatting.

Generate 5-6 realistic learning resources that would typically exist for the given MCP server. Base suggestions on common patterns for similar tools in the same category.

JSON Schema:
[
  {
    "title": "Specific, helpful title",
    "url": "https://realistic-platform.com/realistic-path",
    "description": "Concise description (1-2 sentences max)",
    "type": "video|blog|tutorial|documentation|discussion",
    "source": "youtube|devto|medium|github|reddit|stackoverflow|docs",
    "author": "Realistic author/channel name"
  }
]

Guidelines:
- Create realistic URLs using common patterns
- Focus on platforms that commonly have this content type
- Make titles specific and actionable
- Keep descriptions under 100 characters
- Ensure variety in resource types
- Base suggestions on the server's category and description`
          },
          {
            role: "user",
            content: `Generate learning resources for MCP server: "${serverName}"

Description: ${description}
GitHub: ${githubUrl}
Category: ${category}

Create 5-6 diverse, realistic resources. Focus on practical learning value.

Respond with ONLY the JSON array - no other text.`
          }
        ],
        temperature: 0.2, // Low temperature for consistent, structured output
        max_tokens: 2000,
        top_p: 0.9,
        stream: false
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

      console.log(`✅ Generated ${enhancedResources.length} resources in ${processingTime}ms (${tokensUsed} tokens)`);

      return {
        success: true,
        resources: enhancedResources,
        tokensUsed,
        processingTime,
        model: 'llama-3.3-70b-versatile'
      };

    } catch (error) {
      console.error('❌ Groq resource discovery failed:', error);
      return {
        success: false,
        resources: [],
        tokensUsed: 0,
        processingTime: Date.now() - startTime,
        model: 'llama-3.3-70b-versatile',
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // Ultra-fast batch processing - Groq's specialty
  async findResourcesForMultipleServers(
    servers: Array<{
      name: string;
      description: string;
      githubUrl: string;
      category: string;
    }>
  ): Promise<Record<string, ResourceDiscoveryResult>> {
    console.log(`🚀 Batch processing ${servers.length} servers with Groq + Mixtral...`);
    
    const results: Record<string, ResourceDiscoveryResult> = {};
    
    // Groq can handle larger batches due to speed - process 5 at a time
    const batchSize = 5;
    for (let i = 0; i < servers.length; i += batchSize) {
      const batch = servers.slice(i, i + batchSize);
      
      try {
        const batchPrompt = this.createBatchPrompt(batch);
        const completion = await this.groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Generate realistic learning resources for multiple MCP servers.

CRITICAL: Respond with ONLY a valid JSON object. No other text.

JSON Schema:
{
  "server-name-1": [
    {
      "title": "Resource title",
      "url": "https://realistic-url.com",
      "description": "Brief description",
      "type": "video|blog|tutorial|documentation|discussion",
      "source": "platform-name",
      "author": "Author name"
    }
  ],
  "server-name-2": [...]
}

Generate 4-5 diverse resources per server. Keep descriptions under 100 characters.`
            },
            {
              role: "user",
              content: batchPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 4000,
          top_p: 0.9
        });

        const batchResults = this.parseBatchResponse(completion.choices[0].message.content || '');
        Object.assign(results, batchResults);
        
        // Minimal delay due to Groq's speed
        await this.delay(100);
        
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
          await this.delay(50); // Very short delay due to Groq speed
        }
      }
    }
    
    return results;
  }

  private createBatchPrompt(servers: Array<{ name: string; description: string; githubUrl: string; category: string }>): string {
    const serverDescriptions = servers.map(server => 
      `${server.name}: ${server.description} (${server.category})`
    ).join('\n');

    return `Generate learning resources for these MCP servers:

${serverDescriptions}

For each server, create 4-5 realistic, diverse resources. Respond with ONLY the JSON object.`;
  }

  private parseResourcesFromResponse(content: string): ExternalResource[] {
    try {
      // Clean the response - remove any markdown formatting
      let cleanContent = content.trim();
      
      // Remove markdown code blocks if present
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      // Extract JSON array
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No JSON array found in Groq response');
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
        rankScore: 0.8, // Good quality from Mixtral
        verified: false,
        lastChecked: new Date(),
        aiGenerated: true
      }));

    } catch (error) {
      console.error('Failed to parse Groq response:', error);
      console.log('Raw response:', content);
      
      // Auto-repair logic for malformed JSON
      return this.attemptJsonRepair(content);
    }
  }

  private parseBatchResponse(content: string): Record<string, ResourceDiscoveryResult> {
    try {
      // Clean the response
      let cleanContent = content.trim();
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
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
            tokensUsed: 0,
            processingTime: 0,
            model: 'llama-3.3-70b-versatile'
          };
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to parse batch response:', error);
      return {};
    }
  }

  private attemptJsonRepair(content: string): ExternalResource[] {
    try {
      // Try to fix common JSON issues
      let repaired = content
        .replace(/,\s*}/g, '}') // Remove trailing commas
        .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .trim();

      // Try to extract and parse again
      const jsonMatch = repaired.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          console.log('✅ Successfully repaired malformed JSON');
          return parsed.map(item => ({
            title: item.title || 'Untitled Resource',
            url: item.url || '',
            description: item.description || '',
            type: this.normalizeResourceType(item.type),
            source: item.source || 'unknown',
            author: item.author,
            rankScore: 0.7, // Lower score for repaired JSON
            verified: false,
            lastChecked: new Date(),
            aiGenerated: true
          }));
        }
      }
    } catch (error) {
      console.error('JSON repair failed:', error);
    }

    return this.generateFallbackResources();
  }

  private generateFallbackResources(): ExternalResource[] {
    return [
      {
        title: 'GitHub Repository Search',
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
    let score = 0.7; // Base score for Mixtral-generated

    // Source quality
    const sourceScores: Record<string, number> = {
      'youtube': 0.9,
      'github': 0.95,
      'devto': 0.8,
      'medium': 0.75,
      'reddit': 0.7,
      'stackoverflow': 0.85,
      'docs': 1.0
    };

    score += (sourceScores[resource.source?.toLowerCase()] || 0.5) * 0.2;

    // Type preference
    const typeScores: Record<string, number> = {
      'documentation': 1.0,
      'tutorial': 0.9,
      'video': 0.85,
      'blog': 0.8,
      'discussion': 0.75
    };

    score += (typeScores[resource.type] || 0.5) * 0.1;

    return Math.min(score, 1.0);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cost estimation for Groq + Mixtral
  estimateCost(serverCount: number): { tokens: number; cost: number } {
    const tokensPerServer = 1500; // Average for Mixtral
    const totalTokens = serverCount * tokensPerServer;
    const cost = (totalTokens / 1000000) * 0.27; // $0.27 per million tokens
    
    return { tokens: totalTokens, cost };
  }

  // Performance metrics
  getPerformanceStats(): {
    model: string;
    speed: string;
    cost: string;
    outputFormat: string;
    latency: string;
  } {
    return {
      model: 'Mixtral 8x7B MoE',
      speed: '~100 tokens/ms',
      cost: '~$0.27 per million tokens',
      outputFormat: 'Structured JSON',
      latency: 'Sub-100ms for 5K tokens'
    };
  }
}
