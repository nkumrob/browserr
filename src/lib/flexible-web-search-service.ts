// Flexible Web Search Service - Multiple Provider Support
// Works with Serper, Google, Bing, DuckDuckGo, or direct platform APIs

export interface ExternalResource {
  title: string;
  url: string;
  description?: string;
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
}

export interface SearchProvider {
  name: string;
  search: (query: string, options?: any) => Promise<ExternalResource[]>;
  available: boolean;
  cost: 'free' | 'freemium' | 'paid';
}

export class FlexibleWebSearchService {
  private providers: SearchProvider[] = [];

  constructor(config: {
    serperApiKey?: string;
    googleApiKey?: string;
    googleCx?: string;
    bingApiKey?: string;
    youtubeApiKey?: string;
  }) {
    this.initializeProviders(config);
  }

  private initializeProviders(config: any) {
    // Serper API (if available)
    if (config.serperApiKey) {
      this.providers.push({
        name: 'serper',
        search: this.searchWithSerper.bind(this, config.serperApiKey),
        available: true,
        cost: 'paid'
      });
    }

    // Google Custom Search (if available)
    if (config.googleApiKey && config.googleCx) {
      this.providers.push({
        name: 'google',
        search: this.searchWithGoogle.bind(this, config.googleApiKey, config.googleCx),
        available: true,
        cost: 'freemium'
      });
    }

    // Bing Search (if available)
    if (config.bingApiKey) {
      this.providers.push({
        name: 'bing',
        search: this.searchWithBing.bind(this, config.bingApiKey),
        available: true,
        cost: 'freemium'
      });
    }

    // DuckDuckGo (always available, free)
    this.providers.push({
      name: 'duckduckgo',
      search: this.searchWithDuckDuckGo.bind(this),
      available: true,
      cost: 'free'
    });

    // Direct platform APIs
    if (config.youtubeApiKey) {
      this.providers.push({
        name: 'youtube',
        search: this.searchYouTube.bind(this, config.youtubeApiKey),
        available: true,
        cost: 'freemium'
      });
    }

    // Reddit (always available, free)
    this.providers.push({
      name: 'reddit',
      search: this.searchReddit.bind(this),
      available: true,
      cost: 'free'
    });

    // Dev.to (always available, free)
    this.providers.push({
      name: 'devto',
      search: this.searchDevTo.bind(this),
      available: true,
      cost: 'free'
    });
  }

  async findExternalResources(serverName: string, description: string): Promise<ExternalResource[]> {
    const queries = this.generateSearchQueries(serverName, description);
    const allResources: ExternalResource[] = [];

    // Use the best available provider first
    const primaryProvider = this.getBestProvider();
    
    if (primaryProvider) {
      console.log(`🔍 Using ${primaryProvider.name} for web search`);
      
      for (const query of queries) {
        try {
          const resources = await primaryProvider.search(query);
          allResources.push(...resources);
        } catch (error) {
          console.warn(`Search failed for query "${query}":`, error);
        }
      }
    }

    // Fallback to direct platform searches
    await this.addDirectPlatformResults(serverName, allResources);

    // Remove duplicates and rank results
    return this.deduplicateAndRank(allResources);
  }

  private getBestProvider(): SearchProvider | null {
    // Prefer paid services for better results, fallback to free
    const priorities = ['serper', 'google', 'bing', 'duckduckgo'];
    
    for (const priority of priorities) {
      const provider = this.providers.find(p => p.name === priority && p.available);
      if (provider) return provider;
    }
    
    return null;
  }

  private generateSearchQueries(serverName: string, description: string): string[] {
    const baseQueries = [
      `${serverName} tutorial`,
      `${serverName} documentation`,
      `${serverName} example usage`,
      `${serverName} setup guide`
    ];

    // Add description-based queries
    if (description.includes('browser')) {
      baseQueries.push(`${serverName} browser automation tutorial`);
    }
    if (description.includes('scraping')) {
      baseQueries.push(`${serverName} web scraping guide`);
    }
    if (description.includes('API')) {
      baseQueries.push(`${serverName} API integration`);
    }

    return baseQueries.slice(0, 3); // Limit to avoid rate limits
  }

  // Provider implementations
  private async searchWithSerper(apiKey: string, query: string): Promise<ExternalResource[]> {
    try {
      const response = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query, num: 10 })
      });

      const data = await response.json();
      return this.parseSerperResults(data);
    } catch (error) {
      console.error('Serper search failed:', error);
      return [];
    }
  }

  private async searchWithGoogle(apiKey: string, cx: string, query: string): Promise<ExternalResource[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=10`
      );
      const data = await response.json();
      return this.parseGoogleResults(data);
    } catch (error) {
      console.error('Google search failed:', error);
      return [];
    }
  }

  private async searchWithBing(apiKey: string, query: string): Promise<ExternalResource[]> {
    try {
      const response = await fetch(
        `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=10`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': apiKey
          }
        }
      );
      const data = await response.json();
      return this.parseBingResults(data);
    } catch (error) {
      console.error('Bing search failed:', error);
      return [];
    }
  }

  private async searchWithDuckDuckGo(query: string): Promise<ExternalResource[]> {
    try {
      // DuckDuckGo Instant Answer API (limited but free)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`
      );
      const data = await response.json();
      return this.parseDuckDuckGoResults(data);
    } catch (error) {
      console.error('DuckDuckGo search failed:', error);
      return [];
    }
  }

  private async searchYouTube(apiKey: string, query: string): Promise<ExternalResource[]> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=5&key=${apiKey}`
      );
      const data = await response.json();
      return this.parseYouTubeResults(data);
    } catch (error) {
      console.error('YouTube search failed:', error);
      return [];
    }
  }

  private async searchReddit(query: string): Promise<ExternalResource[]> {
    try {
      const response = await fetch(
        `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5&sort=relevance`
      );
      const data = await response.json();
      return this.parseRedditResults(data);
    } catch (error) {
      console.error('Reddit search failed:', error);
      return [];
    }
  }

  private async searchDevTo(query: string): Promise<ExternalResource[]> {
    try {
      // Dev.to doesn't have a search API, but we can search by tags
      const tag = query.split(' ')[0].toLowerCase();
      const response = await fetch(
        `https://dev.to/api/articles?tag=${encodeURIComponent(tag)}&per_page=5`
      );
      const data = await response.json();
      return this.parseDevToResults(data);
    } catch (error) {
      console.error('Dev.to search failed:', error);
      return [];
    }
  }

  private async addDirectPlatformResults(serverName: string, resources: ExternalResource[]) {
    // Add known resource patterns
    const knownResources = [
      {
        title: `${serverName} GitHub Repository`,
        url: `https://github.com/search?q=${encodeURIComponent(serverName)}`,
        type: 'documentation' as const,
        source: 'github',
        rankScore: 0.8,
        verified: false,
        lastChecked: new Date()
      },
      {
        title: `${serverName} NPM Package`,
        url: `https://www.npmjs.com/search?q=${encodeURIComponent(serverName)}`,
        type: 'documentation' as const,
        source: 'npm',
        rankScore: 0.7,
        verified: false,
        lastChecked: new Date()
      }
    ];

    resources.push(...knownResources);
  }

  // Result parsers (simplified implementations)
  private parseSerperResults(data: any): ExternalResource[] {
    if (!data.organic) return [];
    
    return data.organic.slice(0, 5).map((result: any) => ({
      title: result.title,
      url: result.link,
      description: result.snippet,
      type: this.inferResourceType(result.link, result.title),
      source: 'serper',
      rankScore: 0.9,
      verified: false,
      lastChecked: new Date()
    }));
  }

  private parseGoogleResults(data: any): ExternalResource[] {
    if (!data.items) return [];
    
    return data.items.slice(0, 5).map((result: any) => ({
      title: result.title,
      url: result.link,
      description: result.snippet,
      type: this.inferResourceType(result.link, result.title),
      source: 'google',
      rankScore: 0.85,
      verified: false,
      lastChecked: new Date()
    }));
  }

  private parseBingResults(data: any): ExternalResource[] {
    if (!data.webPages?.value) return [];
    
    return data.webPages.value.slice(0, 5).map((result: any) => ({
      title: result.name,
      url: result.url,
      description: result.snippet,
      type: this.inferResourceType(result.url, result.name),
      source: 'bing',
      rankScore: 0.8,
      verified: false,
      lastChecked: new Date()
    }));
  }

  private parseDuckDuckGoResults(data: any): ExternalResource[] {
    const results: ExternalResource[] = [];
    
    // DuckDuckGo instant answers are limited, but we can extract some info
    if (data.AbstractURL) {
      results.push({
        title: data.Heading || 'DuckDuckGo Result',
        url: data.AbstractURL,
        description: data.Abstract,
        type: 'documentation',
        source: 'duckduckgo',
        rankScore: 0.6,
        verified: false,
        lastChecked: new Date()
      });
    }
    
    return results;
  }

  private parseYouTubeResults(data: any): ExternalResource[] {
    if (!data.items) return [];
    
    return data.items.map((item: any) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      description: item.snippet.description,
      type: 'video' as const,
      source: 'youtube',
      author: item.snippet.channelTitle,
      publishedDate: item.snippet.publishedAt,
      thumbnailUrl: item.snippet.thumbnails?.default?.url,
      rankScore: 0.85,
      verified: false,
      lastChecked: new Date()
    }));
  }

  private parseRedditResults(data: any): ExternalResource[] {
    if (!data.data?.children) return [];
    
    return data.data.children.slice(0, 3).map((post: any) => ({
      title: post.data.title,
      url: `https://reddit.com${post.data.permalink}`,
      description: post.data.selftext?.substring(0, 200),
      type: 'discussion' as const,
      source: 'reddit',
      author: post.data.author,
      publishedDate: new Date(post.data.created_utc * 1000).toISOString(),
      rankScore: 0.7,
      verified: false,
      lastChecked: new Date()
    }));
  }

  private parseDevToResults(data: any): ExternalResource[] {
    if (!Array.isArray(data)) return [];
    
    return data.slice(0, 3).map((article: any) => ({
      title: article.title,
      url: article.url,
      description: article.description,
      type: 'blog' as const,
      source: 'devto',
      author: article.user?.name,
      publishedDate: article.published_at,
      tags: article.tag_list,
      rankScore: 0.75,
      verified: false,
      lastChecked: new Date()
    }));
  }

  private inferResourceType(url: string, title: string): ExternalResource['type'] {
    const urlLower = url.toLowerCase();
    const titleLower = title.toLowerCase();
    
    if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'video';
    if (urlLower.includes('dev.to') || urlLower.includes('medium.com')) return 'blog';
    if (urlLower.includes('reddit.com') || urlLower.includes('stackoverflow.com')) return 'discussion';
    if (urlLower.includes('github.com') && urlLower.includes('blob')) return 'documentation';
    if (titleLower.includes('tutorial') || titleLower.includes('guide')) return 'tutorial';
    if (titleLower.includes('documentation') || titleLower.includes('docs')) return 'documentation';
    
    return 'blog';
  }

  private deduplicateAndRank(resources: ExternalResource[]): ExternalResource[] {
    // Remove duplicates by URL
    const seen = new Set<string>();
    const unique = resources.filter(resource => {
      if (seen.has(resource.url)) return false;
      seen.add(resource.url);
      return true;
    });

    // Sort by rank score
    return unique.sort((a, b) => b.rankScore - a.rankScore).slice(0, 10);
  }

  getAvailableProviders(): SearchProvider[] {
    return this.providers.filter(p => p.available);
  }
}
