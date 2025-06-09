interface GitHubRepoData {
  name: string;
  description: string;
  stars: number;
  language: string;
  topics: string[];
  readme_content?: string;
  package_json?: any;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  created_at: string;
  updated_at: string;
  license?: {
    name: string;
  };
  // Enhanced data for real resources
  extracted_resources?: {
    video_links: string[];
    documentation_links: string[];
    tutorial_links: string[];
    example_links: string[];
    demo_links: string[];
    installation_section?: string;
    code_examples: Array<{
      title: string;
      code: string;
      language: string;
    }>;
    api_documentation?: string;
  };
}

interface GitHubServiceConfig {
  token?: string;
  scrapingDogApiKey?: string;
}

export class GitHubService {
  private token?: string;
  private scrapingDogService?: any; // Import will be added later

  constructor(config: GitHubServiceConfig) {
    this.token = config.token;

    // ScrapingDog functionality moved to MistralEnrichmentService
    console.log('✅ GitHub Service initialized');
  }

  async extractRepositoryData(githubUrl: string): Promise<{
    success: boolean;
    data?: GitHubRepoData;
    error?: string;
  }> {
    try {
      // Parse GitHub URL to get owner and repo
      const urlMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!urlMatch) {
        return { success: false, error: 'Invalid GitHub URL format' };
      }

      const [, owner, repo] = urlMatch;
      const cleanRepo = repo.replace(/\.git$/, '');

      // Fetch repository data from GitHub API
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MCP-Registry-Bot/1.0'
      };

      if (this.token) {
        headers['Authorization'] = `token ${this.token}`;
      }

      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`, {
        headers
      });

      if (!repoResponse.ok) {
        if (repoResponse.status === 404) {
          return { success: false, error: 'Repository not found' };
        }
        if (repoResponse.status === 403) {
          return { success: false, error: 'GitHub API rate limit exceeded' };
        }
        return { success: false, error: `GitHub API error: ${repoResponse.status}` };
      }

      const repoData = await repoResponse.json();

      // Fetch README content
      let readmeContent = '';
      try {
        const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/readme`, {
          headers
        });
        if (readmeResponse.ok) {
          const readmeData = await readmeResponse.json();
          readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        }
      } catch (error) {
        console.warn('Could not fetch README:', error);
      }

      // Fetch package.json if it exists
      let packageJson = null;
      try {
        const packageResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contents/package.json`, {
          headers
        });
        if (packageResponse.ok) {
          const packageData = await packageResponse.json();
          const packageContent = Buffer.from(packageData.content, 'base64').toString('utf-8');
          packageJson = JSON.parse(packageContent);
        }
      } catch (error) {
        console.warn('Could not fetch package.json:', error);
      }

      // Extract real resources from README with enhanced ScrapingDog discovery
      const extractedResources = await this.extractResourcesFromReadme(readmeContent, repoData.html_url);

      const result: GitHubRepoData = {
        name: repoData.name,
        description: repoData.description || '',
        stars: repoData.stargazers_count || 0,
        language: repoData.language || 'Unknown',
        topics: repoData.topics || [],
        readme_content: readmeContent,
        package_json: packageJson,
        owner: {
          login: repoData.owner.login,
          avatar_url: repoData.owner.avatar_url
        },
        html_url: repoData.html_url,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        license: repoData.license ? { name: repoData.license.name } : undefined,
        extracted_resources: extractedResources
      };

      return { success: true, data: result };

    } catch (error) {
      console.error('Error extracting repository data:', error);
      return { success: false, error: 'Failed to extract repository data' };
    }
  }

  private async extractResourcesFromReadme(readmeContent: string, githubUrl: string) {
    if (!readmeContent) {
      return {
        video_links: [],
        documentation_links: [],
        tutorial_links: [],
        example_links: [],
        demo_links: [],
        code_examples: []
      };
    }

    console.log('🔍 Extracting resources with enhanced ScrapingDog discovery...');

    // Enhanced link discovery using ScrapingDog if available
    let enhancedLinks = null;
    if (this.scrapingDogService) {
      try {
        enhancedLinks = await this.scrapingDogService.discoverRepositoryLinks(githubUrl, readmeContent);
        console.log('✅ ScrapingDog enhanced discovery completed');
      } catch (error) {
        console.warn('⚠️ ScrapingDog discovery failed, falling back to regex:', error);
      }
    }

    // Extract video links (YouTube, Vimeo, etc.)
    const videoLinks = enhancedLinks?.video_links || this.extractVideoLinks(readmeContent);

    // Extract documentation and tutorial links
    const documentationLinks = enhancedLinks?.documentation_links || this.extractDocumentationLinks(readmeContent);
    const tutorialLinks = enhancedLinks?.tutorial_links || this.extractTutorialLinks(readmeContent);
    const exampleLinks = enhancedLinks?.example_links || this.extractExampleLinks(readmeContent);
    const demoLinks = enhancedLinks?.demo_links || this.extractDemoLinks(readmeContent);

    // Extract installation section
    const installationSection = this.extractInstallationSection(readmeContent);

    // Extract code examples
    const codeExamples = this.extractCodeExamples(readmeContent);

    // Extract API documentation section
    const apiDocumentation = this.extractApiDocumentation(readmeContent);

    console.log(`📊 Resource extraction complete:
      - Videos: ${videoLinks.length}
      - Documentation: ${documentationLinks.length}
      - Tutorials: ${tutorialLinks.length}
      - Examples: ${exampleLinks.length}
      - Demos: ${demoLinks.length}
      - Code Examples: ${codeExamples.length}`);

    return {
      video_links: videoLinks,
      documentation_links: documentationLinks,
      tutorial_links: tutorialLinks,
      example_links: exampleLinks,
      demo_links: demoLinks,
      installation_section: installationSection,
      code_examples: codeExamples,
      api_documentation: apiDocumentation
    };
  }

  private extractVideoLinks(content: string): string[] {
    const videoLinks: string[] = [];

    // YouTube links
    const youtubeRegex = /https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g;
    let match;
    while ((match = youtubeRegex.exec(content)) !== null) {
      videoLinks.push(match[0]);
    }

    // Vimeo links
    const vimeoRegex = /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/g;
    while ((match = vimeoRegex.exec(content)) !== null) {
      videoLinks.push(match[0]);
    }

    return [...new Set(videoLinks)]; // Remove duplicates
  }

  private extractDocumentationLinks(content: string): string[] {
    const docLinks: string[] = [];

    // Look for documentation-related links
    const docPatterns = [
      /\[.*?(?:docs?|documentation|guide|manual).*?\]\((https?:\/\/[^\)]+)\)/gi,
      /https?:\/\/[^\s]+\.(?:readthedocs\.io|gitbook\.io|notion\.so|confluence\.[^\s]+)/g,
      /https?:\/\/docs\.[^\s]+/g
    ];

    docPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const url = match[1] || match[0];
        if (url && !docLinks.includes(url)) {
          docLinks.push(url);
        }
      }
    });

    return docLinks;
  }

  private extractTutorialLinks(content: string): string[] {
    const tutorialLinks: string[] = [];

    // Look for tutorial-related links
    const tutorialPatterns = [
      /\[.*?(?:tutorial|guide|walkthrough|how-?to).*?\]\((https?:\/\/[^\)]+)\)/gi,
      /https?:\/\/[^\s]+\/(?:tutorial|guide|walkthrough)/g
    ];

    tutorialPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const url = match[1] || match[0];
        if (url && !tutorialLinks.includes(url)) {
          tutorialLinks.push(url);
        }
      }
    });

    return tutorialLinks;
  }

  private extractExampleLinks(content: string): string[] {
    const exampleLinks: string[] = [];

    // Look for example-related links
    const examplePatterns = [
      /\[.*?(?:example|sample|demo).*?\]\((https?:\/\/[^\)]+)\)/gi,
      /https?:\/\/[^\s]+\/(?:example|sample|demo)/g
    ];

    examplePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const url = match[1] || match[0];
        if (url && !exampleLinks.includes(url)) {
          exampleLinks.push(url);
        }
      }
    });

    return exampleLinks;
  }

  private extractDemoLinks(content: string): string[] {
    const demoLinks: string[] = [];

    // Look for demo-related links
    const demoPatterns = [
      /\[.*?(?:demo|live|playground|try).*?\]\((https?:\/\/[^\)]+)\)/gi,
      /https?:\/\/[^\s]+\.(?:netlify\.app|vercel\.app|herokuapp\.com|github\.io)/g
    ];

    demoPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const url = match[1] || match[0];
        if (url && !demoLinks.includes(url)) {
          demoLinks.push(url);
        }
      }
    });

    return demoLinks;
  }

  private extractInstallationSection(content: string): string | undefined {
    // Look for installation section
    const installationRegex = /##?\s*(?:Installation|Install|Getting Started|Quick Start)(.*?)(?=##|\n\n\n|$)/is;
    const match = installationRegex.exec(content);

    if (match && match[1]) {
      return match[1].trim();
    }

    return undefined;
  }

  private extractCodeExamples(content: string): Array<{ title: string; code: string; language: string }> {
    const codeExamples: Array<{ title: string; code: string; language: string }> = [];

    // Extract code blocks with language
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    let exampleCount = 1;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();

      if (code.length > 10) { // Only include substantial code examples
        // Try to find a title from the preceding text
        const beforeCode = content.substring(0, match.index);
        const titleMatch = beforeCode.match(/(?:^|\n)([^\n]*(?:example|usage|sample|demo)[^\n]*)\s*$/i);
        const title = titleMatch ? titleMatch[1].trim() : `Example ${exampleCount}`;

        codeExamples.push({
          title,
          code,
          language
        });

        exampleCount++;
      }
    }

    return codeExamples.slice(0, 5); // Limit to 5 examples
  }

  private extractApiDocumentation(content: string): string | undefined {
    // Look for API documentation section
    const apiRegex = /##?\s*(?:API|API Reference|Methods|Functions)(.*?)(?=##|\n\n\n|$)/is;
    const match = apiRegex.exec(content);

    if (match && match[1]) {
      return match[1].trim();
    }

    return undefined;
  }
}
