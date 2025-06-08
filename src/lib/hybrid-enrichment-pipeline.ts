// Hybrid Enrichment Pipeline
// Stage 1: OpenAI web search for real data gathering
// Stage 2: Mixtral (Groq) for fast, cost-effective final processing

import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { McpServer } from './semantic-search';

export interface EnrichmentStage1Result {
  server: McpServer;
  webSearchData: {
    homepage?: string;
    documentation?: string;
    npmPackage?: string;
    videoTutorials: string[];
    communityDiscussions: string[];
    useCaseExamples: string[];
    relatedProjects: string[];
  };
  searchesMade: number;
  openaiTokens: number;
}

export interface EnrichmentStage2Result {
  server: McpServer;
  finalEnrichedData: {
    enhancedDescription: string;
    useCases: Array<{
      title: string;
      description: string;
      codeExample?: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }>;
    installation: {
      quickInstall: { command: string; description: string };
      requirements: string[];
      troubleshooting: string[];
    };
    faqs: Array<{
      question: string;
      answer: string;
    }>;
    tags: string[];
    relatedTools: string[];
  };
  mixtralTokens: number;
}

export interface HybridEnrichmentResult {
  success: boolean;
  originalServer: McpServer;
  stage1Result?: EnrichmentStage1Result;
  stage2Result?: EnrichmentStage2Result;
  finalServer: McpServer;
  totalTokens: number;
  totalCost: number;
  processingTime: number;
  errors?: string[];
}

export class HybridEnrichmentPipeline {
  private openai: OpenAI;
  private groq: Groq;

  constructor(openaiApiKey: string, groqApiKey: string) {
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.groq = new Groq({ apiKey: groqApiKey });
  }

  async enrichServer(server: McpServer): Promise<HybridEnrichmentResult> {
    const startTime = Date.now();
    console.log(`🔄 Starting hybrid enrichment for ${server.name}...`);

    try {
      // Stage 1: OpenAI Web Search for Real Data
      console.log(`🌐 Stage 1: Web search with OpenAI...`);
      const stage1Result = await this.stage1WebSearchEnrichment(server);

      // Stage 2: Mixtral Processing for Final Enrichment
      console.log(`🚀 Stage 2: Final processing with Mixtral...`);
      const stage2Result = await this.stage2MixtralProcessing(server, stage1Result.webSearchData);

      // Merge results into final server object
      const finalServer = this.mergeFinalResults(server, stage1Result, stage2Result);

      const processingTime = Date.now() - startTime;
      const totalTokens = stage1Result.openaiTokens + stage2Result.mixtralTokens;
      const totalCost = this.calculateTotalCost(stage1Result.openaiTokens, stage2Result.mixtralTokens);

      console.log(`✅ Hybrid enrichment completed for ${server.name}`);
      console.log(`   - Processing time: ${processingTime}ms`);
      console.log(`   - Total tokens: ${totalTokens}`);
      console.log(`   - Total cost: $${totalCost.toFixed(4)}`);

      return {
        success: true,
        originalServer: server,
        stage1Result,
        stage2Result,
        finalServer,
        totalTokens,
        totalCost,
        processingTime
      };

    } catch (error) {
      console.error(`❌ Hybrid enrichment failed for ${server.name}:`, error);
      return {
        success: false,
        originalServer: server,
        finalServer: server,
        totalTokens: 0,
        totalCost: 0,
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // Stage 1: OpenAI Web Search for Real Data Gathering
  private async stage1WebSearchEnrichment(server: McpServer): Promise<EnrichmentStage1Result> {
    const baseName = server.name.replace(/^mcp-server-?/, '').replace(/-/g, ' ');
    
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a web research assistant. Use web search to find real, current information about software projects. Focus on finding official sources, documentation, tutorials, and community resources.

When you find results, extract:
- Official homepage/website
- Documentation links
- Package manager links (npm, PyPI, etc.)
- Video tutorials (YouTube)
- Community discussions (Reddit, Stack Overflow)
- Real-world use case examples
- Related/similar projects

Return results as JSON with actual URLs you find.`
        },
        {
          role: "user",
          content: `Research the MCP server: "${server.name}"

Description: ${server.description}
GitHub: ${server.githubUrl}
Category: ${server.category}
Language: ${server.language}

Find real resources for this project. Search for:
1. Official website/homepage
2. Documentation and guides
3. Package manager page (npm if JS/TS, PyPI if Python, etc.)
4. Video tutorials on YouTube
5. Community discussions on Reddit/Stack Overflow
6. Real-world usage examples and case studies
7. Related or similar projects

Return JSON with actual URLs you find:
{
  "homepage": "actual URL or null",
  "documentation": "actual URL or null", 
  "npmPackage": "actual URL or null",
  "videoTutorials": ["array of YouTube URLs"],
  "communityDiscussions": ["array of discussion URLs"],
  "useCaseExamples": ["array of example/case study URLs"],
  "relatedProjects": ["array of related project URLs"]
}`
        }
      ],
      functions: [
        {
          name: "web_search",
          description: "Search the web for current information",
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
      temperature: 0.2,
      max_tokens: 2000
    });

    // Parse web search results
    const webSearchData = this.parseWebSearchResults(completion.choices[0].message.content || '');
    const tokensUsed = completion.usage?.total_tokens || 0;

    return {
      server,
      webSearchData,
      searchesMade: 5, // Estimate
      openaiTokens: tokensUsed
    };
  }

  // Stage 2: Mixtral Processing for Fast Final Enrichment
  private async stage2MixtralProcessing(
    server: McpServer, 
    webSearchData: any
  ): Promise<EnrichmentStage2Result> {
    
    const completion = await this.groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating comprehensive, structured documentation for software tools. 

Generate detailed, practical information based on the project details and web research data provided. Create realistic, helpful content that would be valuable for developers.

CRITICAL: Respond with ONLY valid JSON. No other text.

JSON Schema:
{
  "enhancedDescription": "Detailed 2-3 sentence description",
  "useCases": [
    {
      "title": "Use case title",
      "description": "What this accomplishes",
      "codeExample": "Optional code snippet",
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "installation": {
    "quickInstall": {
      "command": "Installation command",
      "description": "What this does"
    },
    "requirements": ["List of requirements"],
    "troubleshooting": ["Common issues and solutions"]
  },
  "faqs": [
    {
      "question": "Common question",
      "answer": "Helpful answer"
    }
  ],
  "tags": ["relevant", "tags", "for", "categorization"],
  "relatedTools": ["similar", "tools", "or", "alternatives"]
}`
        },
        {
          role: "user",
          content: `Create comprehensive documentation for this MCP server:

Original Server:
${JSON.stringify(server, null, 2)}

Web Research Data:
${JSON.stringify(webSearchData, null, 2)}

Generate:
1. Enhanced description (2-3 sentences, more detailed than original)
2. 3-4 practical use cases with difficulty levels
3. Installation instructions with requirements and troubleshooting
4. 4-5 frequently asked questions with answers
5. Relevant tags for categorization
6. Related tools or alternatives

Make it practical and helpful for developers. Base content on the category (${server.category}) and language (${server.language}).

Respond with ONLY the JSON object.`
        }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      top_p: 0.9
    });

    const finalEnrichedData = this.parseMixtralResults(completion.choices[0].message.content || '');
    const tokensUsed = completion.usage?.total_tokens || 0;

    return {
      server,
      finalEnrichedData,
      mixtralTokens: tokensUsed
    };
  }

  // Parse web search results from OpenAI
  private parseWebSearchResults(content: string): any {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse web search results');
    }

    // Fallback structure
    return {
      homepage: null,
      documentation: null,
      npmPackage: null,
      videoTutorials: [],
      communityDiscussions: [],
      useCaseExamples: [],
      relatedProjects: []
    };
  }

  // Parse Mixtral results
  private parseMixtralResults(content: string): any {
    try {
      // Clean response
      let cleanContent = content.trim();
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse Mixtral results');
    }

    // Fallback structure
    return {
      enhancedDescription: '',
      useCases: [],
      installation: {
        quickInstall: { command: '', description: '' },
        requirements: [],
        troubleshooting: []
      },
      faqs: [],
      tags: [],
      relatedTools: []
    };
  }

  // Merge all results into final server object
  private mergeFinalResults(
    originalServer: McpServer,
    stage1: EnrichmentStage1Result,
    stage2: EnrichmentStage2Result
  ): McpServer {
    return {
      ...originalServer,
      // Enhanced description
      description: stage2.finalEnrichedData.enhancedDescription || originalServer.description,
      
      // Web search data
      homepage: stage1.webSearchData.homepage,
      documentation: stage1.webSearchData.documentation,
      
      // Mixtral enriched data
      useCases: stage2.finalEnrichedData.useCases,
      installation: stage2.finalEnrichedData.installation,
      faqs: stage2.finalEnrichedData.faqs,
      
      // Enhanced tags (merge original + new)
      tags: [...new Set([...originalServer.tags, ...stage2.finalEnrichedData.tags])],
      
      // External resources from web search
      externalResources: [
        ...stage1.webSearchData.videoTutorials.map((url: string) => ({
          title: 'Video Tutorial',
          url,
          type: 'video' as const,
          source: 'youtube'
        })),
        ...stage1.webSearchData.communityDiscussions.map((url: string) => ({
          title: 'Community Discussion',
          url,
          type: 'discussion' as const,
          source: url.includes('reddit') ? 'reddit' : 'stackoverflow'
        })),
        ...stage1.webSearchData.useCaseExamples.map((url: string) => ({
          title: 'Use Case Example',
          url,
          type: 'tutorial' as const,
          source: 'blog'
        }))
      ],
      
      // Related tools
      relatedTools: stage2.finalEnrichedData.relatedTools
    };
  }

  // Cost calculation
  private calculateTotalCost(openaiTokens: number, mixtralTokens: number): number {
    const openaiCost = (openaiTokens / 1000) * 0.03; // GPT-4o: $0.03/1K tokens
    const mixtralCost = (mixtralTokens / 1000000) * 0.27; // Mixtral: $0.27/1M tokens
    return openaiCost + mixtralCost;
  }

  // Batch processing
  async enrichMultipleServers(servers: McpServer[]): Promise<HybridEnrichmentResult[]> {
    console.log(`🔄 Starting hybrid batch enrichment for ${servers.length} servers...`);
    
    const results: HybridEnrichmentResult[] = [];
    
    // Process in small batches to manage rate limits
    const batchSize = 2; // Conservative for OpenAI rate limits
    for (let i = 0; i < servers.length; i += batchSize) {
      const batch = servers.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(servers.length / batchSize)}`);
      
      const batchPromises = batch.map(server => this.enrichServer(server));
      const batchResults = await Promise.all(batchPromises);
      
      results.push(...batchResults);
      
      // Rate limiting between batches
      if (i + batchSize < servers.length) {
        console.log('⏳ Rate limiting...');
        await this.delay(5000); // 5 second delay for OpenAI
      }
    }
    
    // Summary statistics
    const successful = results.filter(r => r.success).length;
    const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
    const avgProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0) / results.length;
    
    console.log(`✅ Hybrid batch enrichment completed:`);
    console.log(`   - Successful: ${successful}/${servers.length}`);
    console.log(`   - Total cost: $${totalCost.toFixed(4)}`);
    console.log(`   - Avg processing time: ${avgProcessingTime.toFixed(0)}ms`);
    
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Cost estimation
  estimateCost(serverCount: number): { 
    openaiTokens: number; 
    mixtralTokens: number; 
    totalCost: number;
    breakdown: { openai: number; mixtral: number };
  } {
    const openaiTokensPerServer = 2000; // Web search + function calling
    const mixtralTokensPerServer = 2500; // Final processing
    
    const totalOpenaiTokens = serverCount * openaiTokensPerServer;
    const totalMixtralTokens = serverCount * mixtralTokensPerServer;
    
    const openaiCost = (totalOpenaiTokens / 1000) * 0.03;
    const mixtralCost = (totalMixtralTokens / 1000000) * 0.27;
    const totalCost = openaiCost + mixtralCost;
    
    return {
      openaiTokens: totalOpenaiTokens,
      mixtralTokens: totalMixtralTokens,
      totalCost,
      breakdown: { openai: openaiCost, mixtral: mixtralCost }
    };
  }
}
