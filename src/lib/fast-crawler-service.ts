import { chromium, Browser, Page } from 'playwright';

interface CrawlResult {
  url: string;
  title: string;
  content: string;
  success: boolean;
  error?: string;
}

export class FastCrawlerService {
  private browser: Browser | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeBrowser();
  }

  private async initializeBrowser() {
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.isInitialized = true;
      console.log('✅ Fast Crawler (Playwright) initialized');
    } catch (error) {
      console.warn('⚠️ Fast Crawler initialization failed:', error);
    }
  }

  // Fast parallel content extraction from multiple URLs
  async extractContentFromUrls(urls: string[]): Promise<CrawlResult[]> {
    if (!this.isInitialized || !this.browser) {
      console.warn('⚠️ Fast Crawler not initialized');
      return [];
    }

    console.log(`🚀 Fast crawling ${urls.length} URLs in parallel...`);
    const startTime = Date.now();

    // Process URLs in parallel with concurrency limit
    const concurrencyLimit = 3; // Process 3 URLs at once
    const results: CrawlResult[] = [];

    for (let i = 0; i < urls.length; i += concurrencyLimit) {
      const batch = urls.slice(i, i + concurrencyLimit);
      const batchPromises = batch.map(url => this.extractSingleUrl(url));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              url: batch[index],
              title: 'Failed to crawl',
              content: '',
              success: false,
              error: result.reason?.message || 'Unknown error'
            });
          }
        });
      } catch (error) {
        console.warn(`⚠️ Batch crawling failed:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`⚡ Fast crawling completed in ${duration}ms - ${results.filter(r => r.success).length}/${urls.length} successful`);

    return results;
  }

  // Extract content from a single URL with timeout
  private async extractSingleUrl(url: string): Promise<CrawlResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Set timeout and user agent
      await page.setDefaultTimeout(10000); // 10 second timeout
      await page.setUserAgent('Mozilla/5.0 (compatible; MCPBot/1.0; +https://mcp.so)');

      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });

      // Extract title and content
      const title = await page.title();
      
      // Extract main content using multiple selectors
      const content = await page.evaluate(() => {
        // Remove unwanted elements
        const unwantedSelectors = [
          'script', 'style', 'nav', 'header', 'footer', 
          '.advertisement', '.ads', '.sidebar', '.menu'
        ];
        
        unwantedSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => el.remove());
        });

        // Try to find main content area
        const contentSelectors = [
          'main', 'article', '.content', '.main-content', 
          '.post-content', '.entry-content', '#content',
          '.markdown-body', '.readme', '.documentation'
        ];

        let mainContent = '';
        
        for (const selector of contentSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            mainContent = element.textContent || '';
            if (mainContent.length > 200) break;
          }
        }

        // Fallback to body if no main content found
        if (!mainContent || mainContent.length < 200) {
          mainContent = document.body.textContent || '';
        }

        // Clean up the text
        return mainContent
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim()
          .substring(0, 3000); // Limit to 3000 characters
      });

      await page.close();

      return {
        url,
        title,
        content,
        success: true
      };

    } catch (error) {
      await page.close();
      
      return {
        url,
        title: 'Error',
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Clean up resources
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('🧹 Fast Crawler cleaned up');
    }
  }

  // Extract content from search results with quality scoring
  async extractQualityContent(searchResults: any[]): Promise<string[]> {
    if (!searchResults || searchResults.length === 0) {
      return [];
    }

    // Extract URLs from search results
    const urls = searchResults
      .filter(result => result.link && result.link.startsWith('http'))
      .slice(0, 5) // Limit to top 5 results
      .map(result => result.link);

    if (urls.length === 0) {
      return [];
    }

    // Fast parallel extraction
    const crawlResults = await this.extractContentFromUrls(urls);
    
    // Format results with quality indicators
    const formattedResults = crawlResults
      .filter(result => result.success && result.content.length > 100)
      .map(result => {
        // Determine quality based on URL and content
        let qualityLabel = '';
        if (result.url.includes('mcp.so')) {
          qualityLabel = '🎯 [MCP Official]';
        } else if (result.url.includes('glama.ai')) {
          qualityLabel = '⭐ [Glama - Trusted]';
        } else if (result.url.includes('pulsemcp.com')) {
          qualityLabel = '📊 [PulseMCP]';
        } else if (result.url.includes('github.com')) {
          qualityLabel = '🔧 [GitHub]';
        }

        return `
**Source: ${result.title}** ${qualityLabel}
URL: ${result.url}

Content:
${result.content}
---
`;
      });

    console.log(`📄 Fast crawler extracted ${formattedResults.length} quality content pieces`);
    return formattedResults;
  }
}
