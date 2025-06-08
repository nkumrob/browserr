// MCP.so Registry Scraper using Craw4AI
// Primary data source for discovering MCP servers

export interface McpServerEntry {
  name: string;
  description: string;
  githubUrl: string;
  author: string;
  tags: string[];
  category: string;
  language?: string;
  stars?: number;
  lastUpdated?: string;
  sourceUrl: string; // URL where this was found on MCP.so
}

export interface ScrapingResult {
  success: boolean;
  servers: McpServerEntry[];
  totalFound: number;
  errors?: string[];
  scrapedAt: Date;
  sourceHash: string; // For change detection
}

export class McpSoScraper {
  private readonly mcpRegistryUrls = [
    'https://mcp.so',
    'https://github.com/modelcontextprotocol/servers',
    'https://github.com/anthropics/mcp-servers'
  ];

  private craw4aiApiKey?: string;
  private craw4aiBaseUrl = 'https://api.craw4ai.com/v1';

  constructor(craw4aiApiKey?: string) {
    this.craw4aiApiKey = craw4aiApiKey;
  }

  async scrapeAllSources(): Promise<ScrapingResult> {
    console.log('🕷️ Starting MCP.so registry scraping...');
    
    const allServers: McpServerEntry[] = [];
    const errors: string[] = [];
    
    for (const url of this.mcpRegistryUrls) {
      try {
        console.log(`📄 Scraping: ${url}`);
        const result = await this.scrapeSingleSource(url);
        
        if (result.success) {
          allServers.push(...result.servers);
          console.log(`✅ Found ${result.servers.length} servers from ${url}`);
        } else {
          errors.push(`Failed to scrape ${url}: ${result.errors?.join(', ')}`);
        }
      } catch (error) {
        const errorMsg = `Error scraping ${url}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Remove duplicates based on GitHub URL
    const uniqueServers = this.deduplicateServers(allServers);
    
    // Generate content hash for change detection
    const sourceHash = this.generateContentHash(uniqueServers);

    console.log(`🎯 Total unique servers found: ${uniqueServers.length}`);

    return {
      success: uniqueServers.length > 0,
      servers: uniqueServers,
      totalFound: uniqueServers.length,
      errors: errors.length > 0 ? errors : undefined,
      scrapedAt: new Date(),
      sourceHash
    };
  }

  private async scrapeSingleSource(url: string): Promise<ScrapingResult> {
    if (url.includes('mcp.so')) {
      return this.scrapeMcpSoWebsite(url);
    } else if (url.includes('github.com')) {
      return this.scrapeGitHubRepository(url);
    } else {
      throw new Error(`Unsupported URL: ${url}`);
    }
  }

  private async scrapeMcpSoWebsite(url: string): Promise<ScrapingResult> {
    try {
      // Use Craw4AI if available, otherwise fallback to direct scraping
      if (this.craw4aiApiKey) {
        return this.scrapeWithCraw4AI(url);
      } else {
        return this.scrapeWithFetch(url);
      }
    } catch (error) {
      console.error(`Failed to scrape MCP.so: ${error}`);
      return {
        success: false,
        servers: [],
        totalFound: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        scrapedAt: new Date(),
        sourceHash: ''
      };
    }
  }

  private async scrapeWithCraw4AI(url: string): Promise<ScrapingResult> {
    if (!this.craw4aiApiKey) {
      throw new Error('Craw4AI API key not provided');
    }

    try {
      const response = await fetch(`${this.craw4aiBaseUrl}/crawl`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.craw4aiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url,
          extraction_config: {
            type: 'structured',
            schema: {
              servers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    githubUrl: { type: 'string' },
                    author: { type: 'string' },
                    tags: { type: 'array', items: { type: 'string' } },
                    category: { type: 'string' }
                  }
                }
              }
            }
          },
          wait_for: 'networkidle',
          timeout: 30000
        })
      });

      if (!response.ok) {
        throw new Error(`Craw4AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const servers = this.processCraw4AIResponse(data, url);

      return {
        success: true,
        servers,
        totalFound: servers.length,
        scrapedAt: new Date(),
        sourceHash: this.generateContentHash(servers)
      };
    } catch (error) {
      console.error('Craw4AI scraping failed:', error);
      // Fallback to direct scraping
      return this.scrapeWithFetch(url);
    }
  }

  private async scrapeWithFetch(url: string): Promise<ScrapingResult> {
    try {
      console.log(`📄 Fallback scraping: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'MCP-Registry-Bot/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const servers = this.parseHtmlForServers(html, url);

      return {
        success: true,
        servers,
        totalFound: servers.length,
        scrapedAt: new Date(),
        sourceHash: this.generateContentHash(servers)
      };
    } catch (error) {
      throw new Error(`Direct scraping failed: ${error}`);
    }
  }

  private async scrapeGitHubRepository(url: string): Promise<ScrapingResult> {
    try {
      // Extract repository path
      const repoMatch = url.match(/github\.com\/([^\/]+\/[^\/]+)/);
      if (!repoMatch) {
        throw new Error('Invalid GitHub URL');
      }

      const repoPath = repoMatch[1];
      
      // Get repository contents
      const apiUrl = `https://api.github.com/repos/${repoPath}/contents`;
      const response = await fetch(apiUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MCP-Registry-Bot/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const contents = await response.json();
      const servers = await this.parseGitHubContents(contents, url);

      return {
        success: true,
        servers,
        totalFound: servers.length,
        scrapedAt: new Date(),
        sourceHash: this.generateContentHash(servers)
      };
    } catch (error) {
      throw new Error(`GitHub scraping failed: ${error}`);
    }
  }

  private processCraw4AIResponse(data: any, sourceUrl: string): McpServerEntry[] {
    const servers: McpServerEntry[] = [];
    
    try {
      if (data.extracted_data && data.extracted_data.servers) {
        for (const serverData of data.extracted_data.servers) {
          if (serverData.name && serverData.githubUrl) {
            servers.push({
              name: serverData.name,
              description: serverData.description || '',
              githubUrl: this.normalizeGitHubUrl(serverData.githubUrl),
              author: serverData.author || this.extractAuthorFromGitHub(serverData.githubUrl),
              tags: serverData.tags || [],
              category: serverData.category || this.inferCategory(serverData.name, serverData.description),
              sourceUrl
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to process Craw4AI response:', error);
    }

    return servers;
  }

  private parseHtmlForServers(html: string, sourceUrl: string): McpServerEntry[] {
    const servers: McpServerEntry[] = [];
    
    try {
      // Look for GitHub links in the HTML
      const githubLinkRegex = /https:\/\/github\.com\/[^\/\s"']+\/[^\/\s"']+/g;
      const githubUrls = html.match(githubLinkRegex) || [];
      
      // Extract server information from surrounding context
      for (const githubUrl of githubUrls) {
        // Skip if it's not a server repository
        if (githubUrl.includes('/issues') || githubUrl.includes('/pull') || githubUrl.includes('/blob')) {
          continue;
        }

        const server = this.extractServerFromContext(html, githubUrl, sourceUrl);
        if (server) {
          servers.push(server);
        }
      }
    } catch (error) {
      console.warn('Failed to parse HTML for servers:', error);
    }

    return servers;
  }

  private async parseGitHubContents(contents: any[], sourceUrl: string): Promise<McpServerEntry[]> {
    const servers: McpServerEntry[] = [];
    
    try {
      // Look for server directories or files
      for (const item of contents) {
        if (item.type === 'dir' && item.name.includes('server')) {
          // This is likely a server directory
          const server: McpServerEntry = {
            name: item.name,
            description: `MCP server: ${item.name}`,
            githubUrl: `${sourceUrl}/tree/main/${item.name}`,
            author: this.extractAuthorFromGitHub(sourceUrl),
            tags: [this.inferCategory(item.name, '')],
            category: this.inferCategory(item.name, ''),
            sourceUrl
          };
          servers.push(server);
        }
      }

      // Also check README for server listings
      const readmeItem = contents.find(item => 
        item.name.toLowerCase().includes('readme') && item.type === 'file'
      );
      
      if (readmeItem) {
        const readmeServers = await this.parseReadmeForServers(readmeItem.download_url, sourceUrl);
        servers.push(...readmeServers);
      }
    } catch (error) {
      console.warn('Failed to parse GitHub contents:', error);
    }

    return servers;
  }

  private async parseReadmeForServers(readmeUrl: string, sourceUrl: string): Promise<McpServerEntry[]> {
    const servers: McpServerEntry[] = [];
    
    try {
      const response = await fetch(readmeUrl);
      const readme = await response.text();
      
      // Look for server listings in README
      const githubLinkRegex = /https:\/\/github\.com\/[^\/\s\)]+\/[^\/\s\)]+/g;
      const githubUrls = readme.match(githubLinkRegex) || [];
      
      for (const githubUrl of githubUrls) {
        if (githubUrl.includes('mcp-server') || githubUrl.includes('server')) {
          const server = this.extractServerFromContext(readme, githubUrl, sourceUrl);
          if (server) {
            servers.push(server);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse README for servers:', error);
    }

    return servers;
  }

  private extractServerFromContext(content: string, githubUrl: string, sourceUrl: string): McpServerEntry | null {
    try {
      const repoName = githubUrl.split('/').pop() || '';
      const author = this.extractAuthorFromGitHub(githubUrl);
      
      // Try to find description near the GitHub URL
      const urlIndex = content.indexOf(githubUrl);
      const contextBefore = content.substring(Math.max(0, urlIndex - 200), urlIndex);
      const contextAfter = content.substring(urlIndex, urlIndex + 200);
      
      // Extract description from context
      let description = '';
      const descriptionMatch = contextAfter.match(/[:\-]\s*([^.\n]+)/);
      if (descriptionMatch) {
        description = descriptionMatch[1].trim();
      }
      
      return {
        name: repoName,
        description: description || `MCP server: ${repoName}`,
        githubUrl: this.normalizeGitHubUrl(githubUrl),
        author,
        tags: [this.inferCategory(repoName, description)],
        category: this.inferCategory(repoName, description),
        sourceUrl
      };
    } catch (error) {
      console.warn(`Failed to extract server from context: ${error}`);
      return null;
    }
  }

  private deduplicateServers(servers: McpServerEntry[]): McpServerEntry[] {
    const seen = new Set<string>();
    return servers.filter(server => {
      const key = server.githubUrl.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private normalizeGitHubUrl(url: string): string {
    return url.replace(/\.git$/, '').replace(/\/$/, '');
  }

  private extractAuthorFromGitHub(githubUrl: string): string {
    const match = githubUrl.match(/github\.com\/([^\/]+)/);
    return match ? match[1] : 'Unknown';
  }

  private inferCategory(name: string, description: string): string {
    const text = `${name} ${description}`.toLowerCase();
    
    if (text.includes('browser') || text.includes('playwright') || text.includes('puppeteer')) {
      return 'browser-automation';
    }
    if (text.includes('scrape') || text.includes('extract') || text.includes('crawl')) {
      return 'data-extraction';
    }
    if (text.includes('api') || text.includes('rest') || text.includes('graphql')) {
      return 'api-integration';
    }
    if (text.includes('file') || text.includes('pdf') || text.includes('document')) {
      return 'file-processing';
    }
    if (text.includes('search') || text.includes('query') || text.includes('index')) {
      return 'search';
    }
    if (text.includes('database') || text.includes('sql') || text.includes('postgres')) {
      return 'database';
    }
    
    return 'web-interaction';
  }

  private generateContentHash(servers: McpServerEntry[]): string {
    const content = servers.map(s => `${s.name}:${s.githubUrl}`).sort().join('|');
    return btoa(content).substring(0, 16);
  }

  // RSS feed generation for change detection
  async generateRssFeed(previousHash: string, currentResult: ScrapingResult): Promise<string | null> {
    if (previousHash === currentResult.sourceHash) {
      return null; // No changes
    }

    const rssItems = currentResult.servers.map(server => `
      <item>
        <title>${server.name}</title>
        <description>${server.description}</description>
        <link>${server.githubUrl}</link>
        <guid>${server.githubUrl}</guid>
        <pubDate>${currentResult.scrapedAt.toUTCString()}</pubDate>
        <category>${server.category}</category>
      </item>
    `).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>MCP.so Registry Updates</title>
    <description>Latest MCP server discoveries and updates</description>
    <link>https://mcp.so</link>
    <lastBuildDate>${currentResult.scrapedAt.toUTCString()}</lastBuildDate>
    ${rssItems}
  </channel>
</rss>`;
  }
}
