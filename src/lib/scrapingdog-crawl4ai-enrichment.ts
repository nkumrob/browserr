// ScrapingDog + Crawl4AI + Mixtral Enrichment Pipeline
// Stage 1: ScrapingDog for Google search results
// Stage 2: Crawl4AI for deep content extraction  
// Stage 3: Mixtral for final structured processing

import Groq from 'groq-sdk';
import { McpServer } from './semantic-search';

export interface SearchQuery {
  field: string;
  query: string;
  priority: number;
  expectedDomains?: string[];
}

export interface ScrapingDogResult {
  title: string;
  link: string;
  snippet: string;
  domain: string;
  rank: number;
}

export interface CrawledContent {
  url: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    publishedDate?: string;
  };
  extractedData: {
    installationCommands?: string[];
    codeExamples?: string[];
    features?: string[];
    requirements?: string[];
  };
}

export interface EnrichmentResult {
  success: boolean;
  originalServer: McpServer;
  searchResults: ScrapingDogResult[];
  crawledContent: CrawledContent[];
  finalEnrichedServer: McpServer;
  searchesMade: number;
  pagesCrawled: number;
  creditsUsed: number;
  tokensUsed: number;
  processingTime: number;
  errors?: string[];
}

export class ScrapingDogCrawl4AIEnrichment {
  private groq: Groq;
  private scrapingdogApiKey: string;

  constructor(groqApiKey: string, scrapingdogApiKey: string) {
    this.groq = new Groq({ apiKey: groqApiKey });
    this.scrapingdogApiKey = scrapingdogApiKey;
  }

  async enrichServer(server: McpServer): Promise<EnrichmentResult> {
    const startTime = Date.now();
    console.log(`🔍 Enriching ${server.name} with ScrapingDog + Crawl4AI + Mixtral...`);

    try {
      // Stage 1: Generate search queries and execute with ScrapingDog
      console.log(`🌐 Stage 1: Web search with ScrapingDog...`);
      const searchQueries = this.generateSearchQueries(server);
      const searchResults = await this.executeScrapingDogSearches(searchQueries);

      // Stage 2: Deep content extraction with Crawl4AI
      console.log(`🕷️ Stage 2: Content extraction with Crawl4AI...`);
      const crawledContent = await this.crawlSelectedPages(searchResults);

      // Stage 3: Final processing with Mixtral
      console.log(`🚀 Stage 3: Final processing with Mixtral...`);
      const finalEnrichedServer = await this.processWithMixtral(server, searchResults, crawledContent);

      const processingTime = Date.now() - startTime;
      const creditsUsed = searchQueries.length * 5; // 5 credits per Google search

      console.log(`✅ Enrichment completed for ${server.name} in ${processingTime}ms`);
      console.log(`   - Searches made: ${searchQueries.length}`);
      console.log(`   - Credits used: ${creditsUsed}`);
      console.log(`   - Pages crawled: ${crawledContent.length}`);

      return {
        success: true,
        originalServer: server,
        searchResults,
        crawledContent,
        finalEnrichedServer,
        searchesMade: searchQueries.length,
        pagesCrawled: crawledContent.length,
        creditsUsed,
        tokensUsed: 1500, // Estimate for Mixtral processing
        processingTime
      };

    } catch (error) {
      console.error(`❌ Enrichment failed for ${server.name}:`, error);
      return {
        success: false,
        originalServer: server,
        searchResults: [],
        crawledContent: [],
        finalEnrichedServer: server,
        searchesMade: 0,
        pagesCrawled: 0,
        creditsUsed: 0,
        tokensUsed: 0,
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // 🛠 1. Generate Search Queries per JSON Field (Optimized for Cost)
  private generateSearchQueries(server: McpServer): SearchQuery[] {
    const baseName = server.name.replace(/^mcp-server-?/, '').replace(/-/g, ' ');
    
    const coreQueries = [
      {
        field: 'homepage',
        query: `${baseName} official site`,
        priority: 1,
        expectedDomains: ['.io', '.com', '.org', '.dev']
      },
      {
        field: 'repository',
        query: `${baseName} GitHub`,
        priority: 1,
        expectedDomains: ['github.com']
      },
      {
        field: 'documentation',
        query: `${baseName} documentation`,
        priority: 2,
        expectedDomains: ['docs.', 'readthedocs.io', '.github.io']
      },
      {
        field: 'useCases',
        query: `${baseName} examples tutorial`,
        priority: 3,
        expectedDomains: ['dev.to', 'medium.com', 'blog.', 'github.com']
      }
    ];

    // Only add npm search for JavaScript/TypeScript servers
    if (server.language === 'JavaScript' || server.language === 'TypeScript') {
      coreQueries.push({
        field: 'npmPackage',
        query: `${baseName} npm package`,
        priority: 2,
        expectedDomains: ['npmjs.com']
      });
    }

    return coreQueries;
  }

  // 🔍 2. Execute Searches with ScrapingDog Google Search API
  private async executeScrapingDogSearches(queries: SearchQuery[]): Promise<ScrapingDogResult[]> {
    const allResults: ScrapingDogResult[] = [];

    for (const query of queries) {
      try {
        console.log(`🔍 Searching: ${query.query}`);
        
        const response = await fetch(`https://api.scrapingdog.com/google/?api_key=${this.scrapingdogApiKey}&query=${encodeURIComponent(query.query)}&results=5&country=us`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`ScrapingDog API error: ${response.status}`);
        }

        const data = await response.json();
        const results = this.parseScrapingDogResults(data, query.field);
        allResults.push(...results);

        // Rate limiting
        await this.delay(500);

      } catch (error) {
        console.error(`Search failed for query: ${query.query}`, error);
      }
    }

    // Deduplicate and prioritize results
    return this.deduplicateAndPrioritize(allResults);
  }

  private parseScrapingDogResults(data: any, field: string): ScrapingDogResult[] {
    if (!data.organic_data || !Array.isArray(data.organic_data)) {
      return [];
    }

    return data.organic_data.slice(0, 3).map((result: any) => ({
      title: result.title || '',
      link: result.link || '',
      snippet: result.snippet || '',
      domain: this.extractDomain(result.link || ''),
      rank: result.rank || 0,
      field
    }));
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  private deduplicateAndPrioritize(results: ScrapingDogResult[]): ScrapingDogResult[] {
    // Remove duplicates by URL
    const seen = new Set<string>();
    const unique = results.filter(result => {
      if (seen.has(result.link)) return false;
      seen.add(result.link);
      return true;
    });

    // Prioritize by domain quality and exclude aggregators
    const excludeDomains = ['stackshare.io', 'alternativeto.net', 'capterra.com'];
    const filtered = unique.filter(result => 
      !excludeDomains.some(domain => result.domain.includes(domain))
    );

    // Sort by domain preference
    const domainPriority: Record<string, number> = {
      'github.com': 10,
      'npmjs.com': 9,
      'pypi.org': 9,
      'docs.': 8,
      'readthedocs.io': 8,
      '.github.io': 7,
      'youtube.com': 6,
      'dev.to': 5,
      'medium.com': 4
    };

    return filtered.sort((a, b) => {
      const aPriority = Object.entries(domainPriority).find(([domain]) => 
        a.domain.includes(domain)
      )?.[1] || 0;
      
      const bPriority = Object.entries(domainPriority).find(([domain]) => 
        b.domain.includes(domain)
      )?.[1] || 0;

      return bPriority - aPriority;
    }).slice(0, 10); // Keep top 10 results
  }

  // 🌐 3. Deep Content Extraction with Crawl4AI (same as before)
  private async crawlSelectedPages(searchResults: ScrapingDogResult[]): Promise<CrawledContent[]> {
    const crawledContent: CrawledContent[] = [];
    
    // Select best URLs for crawling (max 3 for cost optimization)
    const urlsToCrawl = searchResults.slice(0, 3).map(result => result.link);

    for (const url of urlsToCrawl) {
      try {
        console.log(`🕷️ Crawling: ${url}`);
        
        const crawledData = await this.simpleFetch(url); // Using fallback method
        if (crawledData) {
          crawledContent.push(crawledData);
        }

        // Rate limiting
        await this.delay(1000);

      } catch (error) {
        console.error(`Crawling failed for ${url}:`, error);
      }
    }

    return crawledContent;
  }

  private async simpleFetch(url: string): Promise<CrawledContent | null> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MCP-Registry-Bot/1.0)'
        }
      });

      if (!response.ok) return null;

      const html = await response.text();
      
      // Basic extraction
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const descMatch = html.match(/<meta name="description" content="(.*?)"/i);
      
      return {
        url,
        title: titleMatch?.[1] || '',
        content: html.substring(0, 5000), // First 5KB
        metadata: {
          description: descMatch?.[1]
        },
        extractedData: {
          installationCommands: this.extractInstallCommands(html),
          codeExamples: this.extractCodeExamples(html),
          features: this.extractFeatures(html),
          requirements: this.extractRequirements(html)
        }
      };

    } catch (error) {
      console.error(`Simple fetch failed for ${url}:`, error);
      return null;
    }
  }

  // Extract structured data from HTML content
  private extractInstallCommands(content: string): string[] {
    const commands: string[] = [];
    const patterns = [
      /npm install ([^\s\n<]+)/g,
      /pip install ([^\s\n<]+)/g,
      /yarn add ([^\s\n<]+)/g,
      /cargo install ([^\s\n<]+)/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        commands.push(match[0]);
      }
    });

    return [...new Set(commands)]; // Deduplicate
  }

  private extractCodeExamples(content: string): string[] {
    const examples: string[] = [];
    const codeBlocks = content.match(/<code[^>]*>[\s\S]*?<\/code>/g) || [];
    
    return codeBlocks.slice(0, 3).map(block => 
      block.replace(/<\/?code[^>]*>/g, '').trim()
    );
  }

  private extractFeatures(content: string): string[] {
    const features: string[] = [];
    
    // Look for list items
    const listItems = content.match(/<li[^>]*>([^<]+)<\/li>/g) || [];
    
    listItems.forEach(item => {
      const cleaned = item.replace(/<\/?li[^>]*>/g, '').trim();
      if (cleaned.length > 10 && cleaned.length < 100) {
        features.push(cleaned);
      }
    });

    return features.slice(0, 5); // Top 5 features
  }

  private extractRequirements(content: string): string[] {
    const requirements: string[] = [];
    
    // Look for common requirement patterns
    const patterns = [
      /Node\.js\s+[\d.]+/gi,
      /Python\s+[\d.]+/gi,
      /npm\s+[\d.]+/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        requirements.push(match[0]);
      }
    });

    return [...new Set(requirements)].slice(0, 5);
  }

  // 🚀 4. Final Processing with Mixtral (same as before)
  private async processWithMixtral(
    server: McpServer,
    searchResults: ScrapingDogResult[],
    crawledContent: CrawledContent[]
  ): Promise<McpServer> {
    
    const completion = await this.groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert at analyzing software projects and creating structured documentation. Given a project with existing content, extract and enhance the information into structured JSON.

IMPORTANT:
- If the project already has rich content (README, descriptions), extract and structure it
- If content is missing, generate it based on the project context
- Always provide comprehensive, accurate information
- Respond with ONLY valid JSON

Schema:
{
  "enhancedDescription": "Enhanced description (improve if too short/generic, otherwise keep original)",
  "homepage": "Official website URL or null",
  "documentation": "Documentation URL or null",
  "npmPackage": "Package manager URL or null",
  "useCases": [{"title": "Use case title", "description": "What this accomplishes", "difficulty": "beginner|intermediate|advanced", "codeExample": "Optional code snippet"}],
  "installation": {"command": "Primary install command", "requirements": ["Prerequisites"], "troubleshooting": ["Common issues"]},
  "faqs": [{"question": "Relevant question", "answer": "Helpful answer"}],
  "externalResources": [{"title": "Resource title", "url": "URL", "type": "tutorial|documentation|blog|video", "source": "Platform", "description": "Brief description"}],
  "tags": ["relevant", "technical", "tags"],
  "relatedTools": ["similar", "alternative", "tools"],
  "extractedFeatures": ["key", "features", "from", "readme"],
  "apiMethods": ["main", "api", "methods"]
}`
        },
        {
          role: "user",
          content: `Analyze and enhance this MCP server project:

## Project Information
Name: ${server.name}
Description: ${server.description}
Category: ${server.category}
Language: ${server.language}
Stars: ${server.stars}
Install Command: ${server.installCommand}

## Existing Content Analysis
${this.buildContentAnalysis(server, searchResults, crawledContent)}

## Task: Intelligent Content Structuring with Mistral
Analyze the rich GitHub content and structure it intelligently:

1. **Extract use cases** from existing documentation sections or generate 2-3 relevant ones
2. **Generate FAQs** based on project context, common issues, and user questions
3. **Structure installation** info properly with requirements and troubleshooting
4. **Categorize and tag** appropriately based on functionality and content analysis
5. **Find related tools** and external resources from content and search results
6. **Extract key features** and API methods from README sections and code examples
7. **Organize everything** into consistent, structured output

Leverage the rich content analysis above. Use actual URLs from search results.

JSON only:`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000, // Reduced for cost optimization
      top_p: 0.9
    });

    const enrichedData = this.parseMixtralResponse(completion.choices[0].message.content || '');
    
    // PRESERVE original data and only ADD missing information
    return {
      ...server, // Keep ALL original data

      // Only enhance description if original is too short or generic
      description: this.shouldEnhanceDescription(server.description, enrichedData.enhancedDescription)
        ? enrichedData.enhancedDescription
        : server.description,

      // Only add URLs if not already present
      homepage: server.homepage || enrichedData.homepage,
      documentation: server.documentation || enrichedData.documentation,
      npmPackage: server.npmPackage || enrichedData.npmPackage,

      // Always add AI-generated content (these are new fields)
      useCases: enrichedData.useCases || [],
      installation: this.mergeInstallation(server.installCommand, enrichedData.installation),
      faqs: enrichedData.faqs || [],
      externalResources: enrichedData.externalResources || [],

      // Merge tags (preserve original + add new)
      tags: [...new Set([...server.tags, ...(enrichedData.tags || [])])],
      relatedTools: enrichedData.relatedTools || []
    };
  }

  private parseMixtralResponse(content: string): any {
    try {
      let cleanContent = content.trim();
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');
      
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse Mixtral response:', error);
    }

    return {};
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Build comprehensive content analysis for Mistral
  private buildContentAnalysis(server: any, searchResults: any[], crawledContent: any[]): string {
    let analysis = '';

    // Existing server content
    if (server.readme && server.readme.content) {
      analysis += `### Existing README Content (${server.readme.content.length} chars)\n`;

      if (server.readme.sections && server.readme.sections.length > 0) {
        analysis += `**Sections Found:**\n`;
        server.readme.sections.forEach((section: any, index: number) => {
          analysis += `${index + 1}. ${section.title} (Level ${section.level})\n`;
        });
      }

      if (server.readme.codeExamples && server.readme.codeExamples.length > 0) {
        analysis += `**Code Examples:** ${server.readme.codeExamples.length} examples in languages: ${server.readme.codeExamples.map((ex: any) => ex.language).join(', ')}\n`;
      }

      if (server.readme.screenshots && server.readme.screenshots.length > 0) {
        analysis += `**Screenshots:** ${server.readme.screenshots.length} images found\n`;
      }

      // Extract key content snippets
      const contentPreview = server.readme.content.substring(0, 500).replace(/\n/g, ' ');
      analysis += `**Content Preview:** ${contentPreview}...\n\n`;
    }

    // Search results
    if (searchResults.length > 0) {
      analysis += `### Web Search Results\n`;
      searchResults.slice(0, 3).forEach((result: any, index: number) => {
        analysis += `${index + 1}. ${result.title}\n   URL: ${result.link}\n   Snippet: ${result.snippet}\n`;
      });
      analysis += '\n';
    }

    // Crawled content
    if (crawledContent.length > 0) {
      analysis += `### Crawled Content\n`;
      crawledContent.forEach((content: any, index: number) => {
        analysis += `${index + 1}. ${content.title}\n   URL: ${content.url}\n`;
        if (content.extractedData.installationCommands && content.extractedData.installationCommands.length > 0) {
          analysis += `   Install Commands: ${content.extractedData.installationCommands.join(', ')}\n`;
        }
        if (content.extractedData.features && content.extractedData.features.length > 0) {
          analysis += `   Features: ${content.extractedData.features.slice(0, 3).join(', ')}\n`;
        }
      });
    }

    return analysis || 'No additional content analysis available.';
  }

  // Smart helper methods for preserving original content
  private shouldEnhanceDescription(original: string, enhanced?: string): boolean {
    if (!enhanced) return false;

    // Only enhance if original is very short or generic
    const isShort = original.length < 50;
    const isGeneric = original.toLowerCase().includes('no description') ||
                     original.toLowerCase().includes('mcp server') ||
                     original.trim() === '';

    return isShort || isGeneric;
  }

  private mergeInstallation(originalCommand: string, aiInstallation?: any) {
    if (!aiInstallation) {
      return {
        command: originalCommand,
        requirements: [],
        troubleshooting: []
      };
    }

    return {
      command: originalCommand || aiInstallation.command,
      requirements: aiInstallation.requirements || [],
      troubleshooting: aiInstallation.troubleshooting || []
    };
  }

  // Cost estimation for ScrapingDog
  estimateCost(serverCount: number): { 
    scrapingdogCredits: number;
    scrapingdogCost: number;
    crawl4aiCost: number; 
    llamaCost: number; 
    totalCost: number 
  } {
    const searchesPerServer = 4; // Reduced from 6
    const creditsPerServer = searchesPerServer * 5; // 5 credits per Google search
    const crawl4aiPagesPerServer = 3; // Reduced from 5
    const llamaTokensPerServer = 1500; // Reduced from 2500

    // ScrapingDog pricing: ~$0.0002 per credit (based on $40 for 200K credits)
    const scrapingdogCredits = serverCount * creditsPerServer;
    const scrapingdogCost = scrapingdogCredits * 0.0002;
    const crawl4aiCost = 0; // FREE with fallback methods
    const llamaCost = (serverCount * llamaTokensPerServer / 1000000) * 0.27; // $0.27 per 1M tokens

    return {
      scrapingdogCredits,
      scrapingdogCost,
      crawl4aiCost,
      llamaCost,
      totalCost: scrapingdogCost + crawl4aiCost + llamaCost
    };
  }
}
