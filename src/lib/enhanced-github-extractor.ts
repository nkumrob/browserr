// Enhanced GitHub Data Extractor
// Preserves rich README content, sections, code examples, screenshots, etc.

export interface EnhancedGitHubData {
  // Basic GitHub API data
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
  
  // Enhanced content from README and repository
  readme?: {
    content: string;
    sections: Array<{
      title: string;
      content: string;
      level: number; // h1=1, h2=2, etc.
    }>;
    codeExamples: Array<{
      language: string;
      code: string;
      description?: string;
    }>;
    screenshots: Array<{
      url: string;
      alt?: string;
      caption?: string;
    }>;
    badges: Array<{
      name: string;
      url: string;
      imageUrl: string;
    }>;
    links: Array<{
      text: string;
      url: string;
      type: 'documentation' | 'demo' | 'tutorial' | 'other';
    }>;
  };
  
  // Repository metadata
  license?: string;
  contributors: number;
  forks: number;
  issues: number;
  pullRequests: number;
  lastCommit: string;
  
  // Package information
  packageInfo?: {
    npmUrl?: string;
    pypiUrl?: string;
    cratesUrl?: string;
    version?: string;
    downloads?: number;
  };
  
  // Documentation
  hasWiki: boolean;
  hasPages: boolean;
  documentationUrl?: string;
  
  // Additional files
  hasChangelog: boolean;
  hasContributing: boolean;
  hasLicense: boolean;
  hasDockerfile: boolean;
  hasTests: boolean;
}

export class EnhancedGitHubExtractor {
  private githubToken?: string;

  constructor(githubToken?: string) {
    this.githubToken = githubToken;
  }

  async extractEnhancedData(githubUrl: string): Promise<EnhancedGitHubData | null> {
    try {
      const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) {
        throw new Error('Invalid GitHub URL format');
      }

      const [, owner, repo] = repoMatch;
      const cleanRepo = repo.replace(/\.git$/, '');

      // Get basic repository data
      const basicData = await this.getBasicRepoData(owner, cleanRepo);
      if (!basicData) return null;

      // Get README content
      const readmeData = await this.getReadmeData(owner, cleanRepo);
      
      // Get package information
      const packageInfo = await this.getPackageInfo(owner, cleanRepo, basicData.language);
      
      // Get additional repository files
      const additionalFiles = await this.getAdditionalFiles(owner, cleanRepo);

      return {
        ...basicData,
        readme: readmeData,
        packageInfo,
        ...additionalFiles
      };

    } catch (error) {
      console.error(`Failed to extract enhanced GitHub data for ${githubUrl}:`, error);
      return null;
    }
  }

  private async getBasicRepoData(owner: string, repo: string) {
    const headers = this.getHeaders();
    
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Repository not found: ${owner}/${repo}`);
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
      topics: repoData.topics || [],
      license: repoData.license?.name,
      forks: repoData.forks_count || 0,
      issues: repoData.open_issues_count || 0,
      pullRequests: 0, // Will be fetched separately if needed
      lastCommit: repoData.pushed_at,
      contributors: 0, // Will be fetched separately if needed
      hasWiki: repoData.has_wiki || false,
      hasPages: repoData.has_pages || false,
      documentationUrl: repoData.homepage || undefined
    };
  }

  private async getReadmeData(owner: string, repo: string) {
    try {
      const headers = this.getHeaders();
      
      // Try to get README file
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers
      });

      if (!response.ok) {
        console.warn(`No README found for ${owner}/${repo}`);
        return undefined;
      }

      const readmeData = await response.json();
      const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');

      return {
        content,
        sections: this.extractSections(content),
        codeExamples: this.extractCodeExamples(content),
        screenshots: this.extractScreenshots(content),
        badges: this.extractBadges(content),
        links: this.extractLinks(content)
      };

    } catch (error) {
      console.error(`Failed to get README for ${owner}/${repo}:`, error);
      return undefined;
    }
  }

  private extractSections(content: string) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let currentContent = [];

    for (const line of lines) {
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        // Save previous section
        if (currentSection) {
          sections.push({
            ...currentSection,
            content: currentContent.join('\n').trim()
          });
        }
        
        // Start new section
        currentSection = {
          title: headerMatch[2].trim(),
          level: headerMatch[1].length
        };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    // Save last section
    if (currentSection) {
      sections.push({
        ...currentSection,
        content: currentContent.join('\n').trim()
      });
    }

    return sections;
  }

  private extractCodeExamples(content: string) {
    const codeExamples = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      codeExamples.push({
        language: match[1] || 'text',
        code: match[2].trim(),
        description: undefined // Could be enhanced to extract surrounding context
      });
    }

    return codeExamples;
  }

  private extractScreenshots(content: string) {
    const screenshots = [];
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      const alt = match[1];
      const url = match[2];
      
      // Filter for likely screenshots (common image extensions)
      if (url.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
        screenshots.push({
          url,
          alt,
          caption: alt
        });
      }
    }

    return screenshots;
  }

  private extractBadges(content: string) {
    const badges = [];
    const badgeRegex = /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g;
    let match;

    while ((match = badgeRegex.exec(content)) !== null) {
      badges.push({
        name: match[1] || 'Badge',
        imageUrl: match[2],
        url: match[3]
      });
    }

    return badges;
  }

  private extractLinks(content: string) {
    const links = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const text = match[1];
      const url = match[2];
      
      // Skip images and badges
      if (text.startsWith('!') || url.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
        continue;
      }

      // Categorize link type
      let type: 'documentation' | 'demo' | 'tutorial' | 'other' = 'other';
      const lowerText = text.toLowerCase();
      const lowerUrl = url.toLowerCase();

      if (lowerText.includes('doc') || lowerUrl.includes('doc') || lowerUrl.includes('readme')) {
        type = 'documentation';
      } else if (lowerText.includes('demo') || lowerText.includes('example') || lowerUrl.includes('demo')) {
        type = 'demo';
      } else if (lowerText.includes('tutorial') || lowerText.includes('guide') || lowerText.includes('how')) {
        type = 'tutorial';
      }

      links.push({ text, url, type });
    }

    return links;
  }

  private async getPackageInfo(owner: string, repo: string, language: string) {
    // This could be enhanced to check package registries
    // For now, return basic structure
    return {
      npmUrl: language === 'JavaScript' || language === 'TypeScript' ? `https://www.npmjs.com/package/${repo}` : undefined,
      pypiUrl: language === 'Python' ? `https://pypi.org/project/${repo}` : undefined,
      cratesUrl: language === 'Rust' ? `https://crates.io/crates/${repo}` : undefined,
      version: undefined, // Could be extracted from package.json, setup.py, etc.
      downloads: undefined
    };
  }

  private async getAdditionalFiles(owner: string, repo: string) {
    // Check for common files
    const commonFiles = ['CHANGELOG.md', 'CONTRIBUTING.md', 'LICENSE', 'Dockerfile'];
    const fileChecks = {};

    // This could be enhanced to actually check for file existence
    // For now, return defaults
    return {
      hasChangelog: false,
      hasContributing: false,
      hasLicense: true, // Most repos have licenses
      hasDockerfile: false,
      hasTests: true // Assume most repos have tests
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'MCP-Registry/1.0'
    };

    if (this.githubToken) {
      headers['Authorization'] = `token ${this.githubToken}`;
    }

    return headers;
  }
}
