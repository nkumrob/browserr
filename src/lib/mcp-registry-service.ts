// MCP Registry Service - GitHub Integration
// Handles GitHub data extraction and basic server processing

import { McpServer } from './semantic-search';

export interface GitHubServerData {
  name: string;
  description: string;
  githubUrl: string;
  stars: number;
  language: string;
  author: {
    name: string;
    avatar?: string;
    githubUsername: string;
  };
  lastUpdated: string;
  topics: string[];
}

export interface RegistryConfig {
  githubToken?: string;
}

export class McpRegistryService {
  private githubToken?: string;

  constructor(config: RegistryConfig) {
    this.githubToken = config.githubToken;
  }

  // Extract GitHub data from repository URL
  async extractGitHubData(githubUrl: string): Promise<GitHubServerData | null> {
    try {
      const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) {
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repo] = repoMatch;
      const cleanRepo = repo.replace(/\.git$/, '');

      // Fetch repository data from GitHub API
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MCP-Registry/1.0'
      };

      if (this.githubToken) {
        headers['Authorization'] = `token ${this.githubToken}`;
      }

      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Repository not found: ${githubUrl}`);
          return null;
        }
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repoData = await response.json();

      return {
        name: repoData.name,
        description: repoData.description || 'No description available',
        githubUrl: repoData.html_url,
        stars: repoData.stargazers_count || 0,
        language: repoData.language || 'Unknown',
        author: {
          name: repoData.owner.login,
          avatar: repoData.owner.avatar_url,
          githubUsername: repoData.owner.login
        },
        lastUpdated: repoData.updated_at,
        topics: repoData.topics || []
      };

    } catch (error) {
      console.error(`Failed to extract GitHub data for ${githubUrl}:`, error);
      return null;
    }
  }

  // Convert GitHub data to McpServer format
  githubDataToMcpServer(githubData: GitHubServerData): McpServer {
    // Generate slug from name
    const slug = githubData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Infer category from name and description
    const category = this.inferCategory(githubData.name, githubData.description, githubData.topics);

    // Generate install command
    const installCommand = this.generateInstallCommand(githubData.name, githubData.language);

    return {
      id: '', // Will be set by database
      slug,
      name: githubData.name,
      description: githubData.description,
      tags: githubData.topics,
      category,
      language: githubData.language,
      stars: githubData.stars,
      installCommand,
      githubUrl: githubData.githubUrl,
      author: githubData.author,
      created_at: new Date().toISOString(),
      updated_at: githubData.lastUpdated
    };
  }

  // Infer category from project data
  private inferCategory(name: string, description: string, topics: string[]): string {
    const text = `${name} ${description} ${topics.join(' ')}`.toLowerCase();

    // Category patterns
    const categoryPatterns = {
      'search': ['search', 'query', 'index', 'elasticsearch', 'solr'],
      'browser-automation': ['browser', 'playwright', 'puppeteer', 'selenium', 'automation'],
      'data-extraction': ['scraping', 'scrape', 'extract', 'crawl', 'spider', 'parse'],
      'file-processing': ['file', 'document', 'pdf', 'csv', 'excel', 'parse', 'convert'],
      'api-integration': ['api', 'rest', 'graphql', 'webhook', 'integration', 'client'],
      'web-interaction': ['web', 'http', 'request', 'form', 'click', 'interact'],
      'data-integration': ['database', 'sql', 'postgres', 'mysql', 'mongo', 'redis', 'etl']
    };

    // Find best matching category
    let bestCategory = 'web-interaction'; // default
    let bestScore = 0;

    for (const [category, patterns] of Object.entries(categoryPatterns)) {
      const score = patterns.reduce((sum, pattern) => {
        return sum + (text.includes(pattern) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }

    return bestCategory;
  }

  // Generate install command based on language
  private generateInstallCommand(name: string, language: string): string {
    switch (language?.toLowerCase()) {
      case 'javascript':
      case 'typescript':
        return `npm install ${name}`;
      case 'python':
        return `pip install ${name}`;
      case 'rust':
        return `cargo install ${name}`;
      case 'go':
        return `go install github.com/user/${name}@latest`;
      case 'ruby':
        return `gem install ${name}`;
      case 'php':
        return `composer require user/${name}`;
      default:
        return `# Install ${name} - see repository for instructions`;
    }
  }

  // Batch process multiple GitHub URLs
  async processGitHubUrls(githubUrls: string[]): Promise<McpServer[]> {
    console.log(`📦 Processing ${githubUrls.length} GitHub repositories...`);
    
    const servers: McpServer[] = [];
    
    for (const url of githubUrls) {
      try {
        const githubData = await this.extractGitHubData(url);
        if (githubData) {
          const server = this.githubDataToMcpServer(githubData);
          servers.push(server);
          console.log(`✅ Processed: ${server.name}`);
        } else {
          console.warn(`⚠️ Skipped: ${url} (no data)`);
        }

        // Rate limiting for GitHub API
        await this.delay(this.githubToken ? 100 : 1000);

      } catch (error) {
        console.error(`❌ Failed to process ${url}:`, error);
      }
    }

    console.log(`📊 Successfully processed ${servers.length}/${githubUrls.length} repositories`);
    return servers;
  }

  // Validate GitHub URL format
  isValidGitHubUrl(url: string): boolean {
    const githubPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/;
    return githubPattern.test(url);
  }

  // Extract repository info from URL without API call
  parseGitHubUrl(githubUrl: string): { owner: string; repo: string } | null {
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;

    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '')
    };
  }

  // Check rate limit status
  async checkRateLimit(): Promise<{ remaining: number; resetTime: Date } | null> {
    if (!this.githubToken) {
      return null; // No rate limit info for unauthenticated requests
    }

    try {
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `token ${this.githubToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`Rate limit check failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        remaining: data.rate.remaining,
        resetTime: new Date(data.rate.reset * 1000)
      };

    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get service status
  getServiceInfo(): {
    hasGitHubToken: boolean;
    rateLimitInfo: string;
    supportedLanguages: string[];
  } {
    return {
      hasGitHubToken: !!this.githubToken,
      rateLimitInfo: this.githubToken 
        ? '5000 requests/hour (authenticated)' 
        : '60 requests/hour (unauthenticated)',
      supportedLanguages: ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go', 'Ruby', 'PHP']
    };
  }
}
