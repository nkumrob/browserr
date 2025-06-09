// import { FastCrawlerService } from './fast-crawler-service';

interface HybridSearchConfig {
  scrapingDogApiKey?: string;
}

export class HybridSearchService {
  private scrapingDogApiKey?: string;

  constructor(config: HybridSearchConfig) {
    this.scrapingDogApiKey = config.scrapingDogApiKey;
    console.log('✅ Hybrid Search Service initialized (ScrapingDog + Basic Fetch)');
  }

  // Search for content using ScrapingDog + Fast Crawler extraction
  async searchForContent(query: string, contentType: string): Promise<string[]> {
    if (!this.scrapingDogApiKey) {
      console.log('⚠️ ScrapingDog API key not available');
      return [];
    }

    try {
      console.log(`🔍 Hybrid search for ${contentType}: ${query}`);

      // Extract repository name from query for targeted search
      const repoMatch = query.match(/(\w+)\s+\w+/);
      const repoName = repoMatch ? repoMatch[1] : query.split(' ')[0];

      // Target high-quality MCP directories
      const mcpTargets = [
        // Official and primary sources
        `site:mcp.so "${repoName}" ${contentType}`,
        `site:github.com/modelcontextprotocol "${repoName}"`,
        
        // High-quality MCP directories
        `site:glama.ai "${repoName}" MCP server`,
        `site:pulsemcp.com "${repoName}"`,
        `site:cursor.directory "${repoName}" MCP`,
        
        // Broader searches for specific content types
        `"${repoName}" MCP server ${contentType} tutorial guide`,
        `"${repoName}" model context protocol ${contentType} examples`
      ];

      const allSearchResults: any[] = [];

      // Search each target with ScrapingDog
      for (const target of mcpTargets.slice(0, 3)) { // Limit to 3 searches
        try {
          const searchUrl = `https://api.scrapingdog.com/google?api_key=${this.scrapingDogApiKey}&query=${encodeURIComponent(target)}&results=3`;
          
          const response = await fetch(searchUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          });

          if (!response.ok) {
            console.warn(`ScrapingDog search failed for "${target}": ${response.status}`);
            continue;
          }

          const data = await response.json();
          
          if (data.organic_results && data.organic_results.length > 0) {
            console.log(`✅ Found ${data.organic_results.length} results for: ${target}`);
            allSearchResults.push(...data.organic_results);
          }

          // Small delay between searches
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error) {
          console.warn(`Search failed for target "${target}":`, error);
        }
      }

      if (allSearchResults.length === 0) {
        console.log('📄 No search results found');
        return [];
      }

      // Remove duplicates based on URL
      const uniqueResults = allSearchResults.filter((result, index, self) => 
        index === self.findIndex(r => r.link === result.link)
      );

      console.log(`🔍 Found ${uniqueResults.length} unique search results`);

      // For now, return search results with snippets (Fast Crawler will be added later)
      const extractedContent = uniqueResults.map(result => {
        let qualityLabel = '';
        if (result.link.includes('mcp.so')) {
          qualityLabel = '🎯 [MCP Official]';
        } else if (result.link.includes('glama.ai')) {
          qualityLabel = '⭐ [Glama - Trusted]';
        } else if (result.link.includes('pulsemcp.com')) {
          qualityLabel = '📊 [PulseMCP]';
        } else if (result.link.includes('github.com')) {
          qualityLabel = '🔧 [GitHub]';
        }

        return `
**Source: ${result.title}** ${qualityLabel}
URL: ${result.link}
Snippet: ${result.snippet}
---
`;
      });

      console.log(`📄 Extracted ${extractedContent.length} quality content pieces from search results`);
      return extractedContent;

    } catch (error) {
      console.error('Hybrid search error:', error);
      return [];
    }
  }

  // Clean up resources
  async cleanup() {
    console.log('🧹 Hybrid Search Service cleaned up');
  }
}
