// Serper + Crawl4AI + Mixtral Enrichment Pipeline
// Stage 1: Serper.dev for web search
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

export interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  domain: string;
  position: number;
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
  searchResults: SerperResult[];
  crawledContent: CrawledContent[];
  finalEnrichedServer: McpServer;
  searchesMade: number;
  pagesCrawled: number;
  tokensUsed: number;
  processingTime: number;
  errors?: string[];
}

export class SerperCrawl4AIEnrichment {
  private groq: Groq;
  private serperApiKey: string;
  private crawl4aiApiKey?: string;

  constructor(groqApiKey: string, serperApiKey: string, crawl4aiApiKey?: string) {
    this.groq = new Groq({ apiKey: groqApiKey });
    this.serperApiKey = serperApiKey;
    this.crawl4aiApiKey = crawl4aiApiKey;
  }

  async enrichServer(server: McpServer): Promise<EnrichmentResult> {
    const startTime = Date.now();
    console.log(`🔍 Enriching ${server.name} with Serper + Crawl4AI + Mixtral...`);

    try {
      // Stage 1: Generate search queries and execute with Serper
      console.log(`🌐 Stage 1: Web search with Serper.dev...`);
      const searchQueries = this.generateSearchQueries(server);
      const searchResults = await this.executeSerperSearches(searchQueries);

      // Stage 2: Deep content extraction with Crawl4AI
      console.log(`🕷️ Stage 2: Content extraction with Crawl4AI...`);
      const crawledContent = await this.crawlSelectedPages(searchResults);

      // Stage 3: Final processing with Mixtral
      console.log(`🚀 Stage 3: Final processing with Mixtral...`);
      const finalEnrichedServer = await this.processWithMixtral(server, searchResults, crawledContent);

      const processingTime = Date.now() - startTime;

      console.log(`✅ Enrichment completed for ${server.name} in ${processingTime}ms`);
      console.log(`   - Searches made: ${searchQueries.length}`);
      console.log(`   - Pages crawled: ${crawledContent.length}`);

      return {
        success: true,
        originalServer: server,
        searchResults,
        crawledContent,
        finalEnrichedServer,
        searchesMade: searchQueries.length,
        pagesCrawled: crawledContent.length,
        tokensUsed: 2500, // Estimate for Mixtral processing
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
        tokensUsed: 0,
        processingTime: Date.now() - startTime,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // 🛠 1. Generate Search Queries per JSON Field
  private generateSearchQueries(server: McpServer): SearchQuery[] {
    const baseName = server.name.replace(/^mcp-server-?/, '').replace(/-/g, ' ');
    
    return [
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
        field: 'npmPackage',
        query: `${baseName} npm package`,
        priority: 2,
        expectedDomains: ['npmjs.com']
      },
      {
        field: 'useCases',
        query: `${baseName} real-world use cases`,
        priority: 3,
        expectedDomains: ['dev.to', 'medium.com', 'blog.']
      },
      {
        field: 'videoResources',
        query: `${baseName} tutorial site:youtube.com`,
        priority: 3,
        expectedDomains: ['youtube.com', 'youtu.be']
      }
    ];
  }

  // 🔍 2. Execute Searches with Serper.dev
  private async executeSerperSearches(queries: SearchQuery[]): Promise<SerperResult[]> {
    const allResults: SerperResult[] = [];

    for (const query of queries) {
      try {
        console.log(`🔍 Searching: ${query.query}`);
        
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': this.serperApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            q: query.query,
            num: 5, // Get top 5 results per query
            gl: 'us',
            hl: 'en'
          })
        });

        if (!response.ok) {
          throw new Error(`Serper API error: ${response.status}`);
        }

        const data = await response.json();
        const results = this.parseSerperResults(data, query.field);
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

  private parseSerperResults(data: any, field: string): SerperResult[] {
    if (!data.organic) return [];

    return data.organic.slice(0, 3).map((result: any, index: number) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
      domain: new URL(result.link).hostname,
      position: index + 1,
      field
    }));
  }

  private deduplicateAndPrioritize(results: SerperResult[]): SerperResult[] {
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

  // 🌐 3. Deep Content Extraction with Crawl4AI
  private async crawlSelectedPages(searchResults: SerperResult[]): Promise<CrawledContent[]> {
    const crawledContent: CrawledContent[] = [];
    
    // Select best URLs for crawling (max 5 to avoid rate limits)
    const urlsToCrawl = searchResults.slice(0, 5).map(result => result.link);

    for (const url of urlsToCrawl) {
      try {
        console.log(`🕷️ Crawling: ${url}`);
        
        const crawledData = await this.crawlWithCrawl4AI(url);
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

  private async crawlWithCrawl4AI(url: string): Promise<CrawledContent | null> {
    if (!this.crawl4aiApiKey) {
      // Fallback: Simple fetch for basic content
      return this.simpleFetch(url);
    }

    try {
      const response = await fetch('https://api.crawl4ai.com/crawl', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.crawl4aiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          formats: ['markdown', 'structured'],
          extract_structured_data: true,
          remove_overlay_elements: true,
          extract_media: false
        })
      });

      if (!response.ok) {
        throw new Error(`Crawl4AI error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseCrawl4AIResponse(url, data);

    } catch (error) {
      console.error(`Crawl4AI failed for ${url}:`, error);
      return this.simpleFetch(url);
    }
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
        extractedData: {}
      };

    } catch (error) {
      console.error(`Simple fetch failed for ${url}:`, error);
      return null;
    }
  }

  private parseCrawl4AIResponse(url: string, data: any): CrawledContent {
    return {
      url,
      title: data.title || '',
      content: data.markdown || data.text || '',
      metadata: {
        description: data.metadata?.description,
        keywords: data.metadata?.keywords,
        author: data.metadata?.author,
        publishedDate: data.metadata?.publishedDate
      },
      extractedData: {
        installationCommands: this.extractInstallCommands(data.markdown || ''),
        codeExamples: this.extractCodeExamples(data.markdown || ''),
        features: this.extractFeatures(data.markdown || ''),
        requirements: this.extractRequirements(data.markdown || '')
      }
    };
  }

  // Extract structured data from markdown content
  private extractInstallCommands(content: string): string[] {
    const commands: string[] = [];
    const patterns = [
      /npm install ([^\s\n]+)/g,
      /pip install ([^\s\n]+)/g,
      /yarn add ([^\s\n]+)/g,
      /cargo install ([^\s\n]+)/g
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
    const codeBlocks = content.match(/```[\s\S]*?```/g) || [];
    
    return codeBlocks.slice(0, 3).map(block => 
      block.replace(/```\w*\n?/, '').replace(/```$/, '').trim()
    );
  }

  private extractFeatures(content: string): string[] {
    const features: string[] = [];
    
    // Look for bullet points and numbered lists
    const bulletPoints = content.match(/^[\s]*[-*+]\s+(.+)$/gm) || [];
    const numberedPoints = content.match(/^[\s]*\d+\.\s+(.+)$/gm) || [];
    
    [...bulletPoints, ...numberedPoints].forEach(point => {
      const cleaned = point.replace(/^[\s]*[-*+\d.]\s+/, '').trim();
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
      /npm\s+[\d.]+/gi,
      /requires?\s+([^.\n]+)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        requirements.push(match[0]);
      }
    });

    return [...new Set(requirements)].slice(0, 5);
  }

  // 🚀 4. Final Processing with Mixtral
  private async processWithMixtral(
    server: McpServer,
    searchResults: SerperResult[],
    crawledContent: CrawledContent[]
  ): Promise<McpServer> {
    
    const completion = await this.groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating comprehensive software documentation. Given a project and web research data, create detailed, structured information.

CRITICAL: Respond with ONLY valid JSON. No other text.

JSON Schema:
{
  "enhancedDescription": "Detailed description based on research",
  "homepage": "Official website URL or null",
  "documentation": "Documentation URL or null",
  "npmPackage": "Package manager URL or null",
  "useCases": [
    {
      "title": "Use case title",
      "description": "What this accomplishes",
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "installation": {
    "command": "Primary install command",
    "requirements": ["List of requirements"],
    "troubleshooting": ["Common issues"]
  },
  "faqs": [
    {
      "question": "Common question",
      "answer": "Helpful answer"
    }
  ],
  "externalResources": [
    {
      "title": "Resource title",
      "url": "Resource URL",
      "type": "video|blog|tutorial|documentation|discussion",
      "source": "Platform name"
    }
  ],
  "tags": ["relevant", "tags"],
  "relatedTools": ["similar", "tools"]
}`
        },
        {
          role: "user",
          content: `Create comprehensive documentation for this MCP server:

Original Server:
${JSON.stringify(server, null, 2)}

Search Results:
${JSON.stringify(searchResults.slice(0, 5), null, 2)}

Crawled Content:
${JSON.stringify(crawledContent.map(c => ({
  url: c.url,
  title: c.title,
  description: c.metadata.description,
  installCommands: c.extractedData.installationCommands,
  features: c.extractedData.features,
  requirements: c.extractedData.requirements
})), null, 2)}

Based on this research data, create comprehensive documentation. Use actual URLs found in the search results. Make it practical and helpful for developers.

Respond with ONLY the JSON object.`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      top_p: 0.9
    });

    const enrichedData = this.parseMixtralResponse(completion.choices[0].message.content || '');
    
    // Merge with original server
    return {
      ...server,
      description: enrichedData.enhancedDescription || server.description,
      homepage: enrichedData.homepage,
      documentation: enrichedData.documentation,
      npmPackage: enrichedData.npmPackage,
      useCases: enrichedData.useCases || [],
      installation: enrichedData.installation,
      faqs: enrichedData.faqs || [],
      externalResources: enrichedData.externalResources || [],
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

  // Cost estimation
  estimateCost(serverCount: number): { 
    serperCost: number; 
    crawl4aiCost: number; 
    mixtralCost: number; 
    totalCost: number 
  } {
    const serperSearchesPerServer = 6;
    const crawl4aiPagesPerServer = 5;
    const mixtralTokensPerServer = 2500;

    const serperCost = (serverCount * serperSearchesPerServer / 1000) * 5; // $5 per 1K searches
    const crawl4aiCost = (serverCount * crawl4aiPagesPerServer / 1000) * 3; // $3 per 1K pages
    const mixtralCost = (serverCount * mixtralTokensPerServer / 1000000) * 0.27; // $0.27 per 1M tokens

    return {
      serperCost,
      crawl4aiCost,
      mixtralCost,
      totalCost: serperCost + crawl4aiCost + mixtralCost
    };
  }
}
