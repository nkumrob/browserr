// Content-Preserving Enrichment Service
// Preserves rich GitHub content and structures it intelligently with Mistral

import Groq from 'groq-sdk';
import { McpServer } from './semantic-search';

export interface RichContentServer extends McpServer {
  // Preserved original content
  original_readme: {
    full_content: string;
    sections: Array<{
      title: string;
      content: string;
      level: number;
    }>;
    code_examples: Array<{
      title?: string;
      language: string;
      code: string;
      description?: string;
    }>;
    features: Array<{
      title: string;
      description: string;
      details?: string;
    }>;
    installation_methods: Array<{
      method: string;
      commands: string[];
      description: string;
    }>;
    compatibility_info: {
      browsers?: Array<{
        name: string;
        version: string;
        platforms: string[];
      }>;
      platforms?: string[];
      requirements?: string[];
    };
    links: Array<{
      text: string;
      url: string;
      type: 'documentation' | 'api' | 'guide' | 'example' | 'other';
    }>;
  };

  // AI-structured content from the rich README
  structured_content: {
    tagline: string;
    key_capabilities: string[];
    feature_categories: Array<{
      category: string;
      features: Array<{
        name: string;
        description: string;
        benefits: string[];
      }>;
    }>;
    use_cases: Array<{
      title: string;
      description: string;
      code_example?: string;
      target_users: string[];
      difficulty: 'beginner' | 'intermediate' | 'advanced';
    }>;
    installation_guide: {
      quick_start: {
        preferred_method: string;
        command: string;
        additional_steps?: string[];
      };
      detailed_steps: Array<{
        step_number: number;
        title: string;
        commands: string[];
        explanation: string;
      }>;
      system_requirements: {
        minimum: Record<string, string>;
        recommended: Record<string, string>;
      };
    };
    api_overview: {
      main_classes?: string[];
      key_methods?: string[];
      configuration_options?: string[];
    };
  };

  // Enhanced metadata
  enhanced_metadata: {
    framework_type: string;
    primary_use_case: string;
    ecosystem_position: string;
    maturity_level: 'experimental' | 'beta' | 'stable' | 'mature';
    enterprise_ready: boolean;
    community_size: 'small' | 'medium' | 'large' | 'very_large';
  };
}

export class ContentPreservingEnrichment {
  private groq: Groq;
  private scrapingdogApiKey: string;

  constructor(groqApiKey: string, scrapingdogApiKey: string) {
    this.groq = new Groq({ apiKey: groqApiKey });
    this.scrapingdogApiKey = scrapingdogApiKey;
  }

  async enrichWithContentPreservation(server: McpServer): Promise<RichContentServer> {
    console.log(`📚 Content-preserving enrichment for ${server.name}...`);

    try {
      // Stage 1: Extract rich README content
      const readmeContent = await this.extractRichReadmeContent(server.githubUrl);
      
      // Stage 2: Structure the content with Mistral
      const structuredContent = await this.structureContentWithMistral(server, readmeContent);
      
      // Stage 3: Generate enhanced metadata
      const enhancedMetadata = await this.generateEnhancedMetadata(server, readmeContent);

      return {
        ...server,
        original_readme: readmeContent,
        structured_content: structuredContent,
        enhanced_metadata: enhancedMetadata
      };

    } catch (error) {
      console.error(`Failed to enrich ${server.name}:`, error);
      throw error;
    }
  }

  private async extractRichReadmeContent(githubUrl: string) {
    console.log('📖 Extracting rich README content...');
    
    try {
      const repoMatch = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!repoMatch) throw new Error('Invalid GitHub URL');

      const [, owner, repo] = repoMatch;
      const cleanRepo = repo.replace(/\.git$/, '');

      // Fetch README from GitHub API
      const response = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/readme`, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MCP-Registry/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const readmeData = await response.json();
      const content = Buffer.from(readmeData.content, 'base64').toString('utf-8');

      return {
        full_content: content,
        sections: this.extractSections(content),
        code_examples: this.extractCodeExamples(content),
        features: this.extractFeatures(content),
        installation_methods: this.extractInstallationMethods(content),
        compatibility_info: this.extractCompatibilityInfo(content),
        links: this.extractLinks(content)
      };

    } catch (error) {
      console.error('Failed to extract README content:', error);
      // Return empty structure if README extraction fails
      return {
        full_content: '',
        sections: [],
        code_examples: [],
        features: [],
        installation_methods: [],
        compatibility_info: {},
        links: []
      };
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
    const examples = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'text';
      const code = match[2].trim();
      
      // Try to find a title/description before the code block
      const beforeCode = content.substring(0, match.index);
      const lines = beforeCode.split('\n');
      const lastFewLines = lines.slice(-5);
      
      let title = undefined;
      let description = undefined;
      
      // Look for a title in the lines before the code block
      for (let i = lastFewLines.length - 1; i >= 0; i--) {
        const line = lastFewLines[i].trim();
        if (line && !line.startsWith('```') && !line.startsWith('#')) {
          if (!description && line.length < 100) {
            title = line;
          } else if (!description) {
            description = line;
          }
          break;
        }
      }

      examples.push({
        title,
        language,
        code,
        description
      });
    }

    return examples;
  }

  private extractFeatures(content: string) {
    const features = [];
    
    // Look for feature lists (bullet points with descriptions)
    const featurePatterns = [
      /^[•\-\*]\s*\*\*([^*]+)\*\*[.\s]*(.+)$/gm,
      /^[•\-\*]\s*([^.]+)\.\s*(.+)$/gm,
      /^#{3,4}\s+([^#\n]+)\n([^#]+?)(?=\n#{1,4}|\n\n|$)/gm
    ];

    featurePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        features.push({
          title: match[1].trim(),
          description: match[2].trim(),
          details: undefined
        });
      }
    });

    return features.slice(0, 10); // Limit to top 10 features
  }

  private extractInstallationMethods(content: string) {
    const methods = [];
    
    // Look for installation sections
    const installSections = this.extractSections(content).filter(section =>
      section.title.toLowerCase().includes('install') ||
      section.title.toLowerCase().includes('getting started') ||
      section.title.toLowerCase().includes('setup')
    );

    installSections.forEach(section => {
      const commands = this.extractCommandsFromText(section.content);
      if (commands.length > 0) {
        methods.push({
          method: section.title,
          commands,
          description: section.content.substring(0, 200) + '...'
        });
      }
    });

    return methods;
  }

  private extractCommandsFromText(text: string): string[] {
    const commands = [];
    const commandPatterns = [
      /```(?:bash|shell|sh)?\n([^`]+)```/g,
      /`([^`]*(?:npm|yarn|pip|cargo|go|docker)[^`]*)`/g
    ];

    commandPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const command = match[1].trim();
        if (command && command.length > 5) {
          commands.push(command);
        }
      }
    });

    return [...new Set(commands)]; // Remove duplicates
  }

  private extractCompatibilityInfo(content: string) {
    const info: any = {};
    
    // Look for browser/platform compatibility tables or lists
    const browserPattern = /(chromium|firefox|webkit|safari|chrome|edge)\s+([0-9.]+)/gi;
    const platformPattern = /(linux|macos|windows|ubuntu|debian)/gi;
    
    const browsers = [];
    const platforms = [];
    
    let match;
    while ((match = browserPattern.exec(content)) !== null) {
      browsers.push({
        name: match[1],
        version: match[2],
        platforms: ['Linux', 'macOS', 'Windows'] // Default assumption
      });
    }
    
    while ((match = platformPattern.exec(content)) !== null) {
      platforms.push(match[1]);
    }

    if (browsers.length > 0) info.browsers = browsers;
    if (platforms.length > 0) info.platforms = [...new Set(platforms)];

    return info;
  }

  private extractLinks(content: string) {
    const links = [];
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const text = match[1];
      const url = match[2];
      
      // Skip images
      if (text.startsWith('!') || url.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
        continue;
      }

      // Categorize link type
      let type: 'documentation' | 'api' | 'guide' | 'example' | 'other' = 'other';
      const lowerText = text.toLowerCase();
      const lowerUrl = url.toLowerCase();

      if (lowerText.includes('api') || lowerUrl.includes('api')) {
        type = 'api';
      } else if (lowerText.includes('doc') || lowerUrl.includes('doc')) {
        type = 'documentation';
      } else if (lowerText.includes('guide') || lowerText.includes('tutorial')) {
        type = 'guide';
      } else if (lowerText.includes('example') || lowerUrl.includes('example')) {
        type = 'example';
      }

      links.push({ text, url, type });
    }

    return links;
  }

  private async structureContentWithMistral(server: McpServer, readmeContent: any) {
    console.log('🧠 Structuring content with Mistral...');

    const completion = await this.groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an expert technical analyst. Given rich README content from a software project, structure and organize it intelligently while preserving all the valuable information.

CRITICAL:
- PRESERVE all existing rich content
- STRUCTURE it into organized categories
- EXTRACT key information without losing details
- ENHANCE understanding through better organization
- Respond with ONLY valid JSON

Focus on creating a well-structured representation that maintains the original quality while making it more accessible and organized.`
        },
        {
          role: "user",
          content: `Analyze and structure this rich README content:

## Project: ${server.name}
Category: ${server.category}
Language: ${server.language}

## Rich README Content:
Full Content Length: ${readmeContent.full_content.length} characters
Sections: ${readmeContent.sections.length}
Code Examples: ${readmeContent.code_examples.length}
Features: ${readmeContent.features.length}
Installation Methods: ${readmeContent.installation_methods.length}

## Sections Found:
${readmeContent.sections.map((s: any) => `- ${s.title} (Level ${s.level})`).join('\n')}

## Code Examples:
${readmeContent.code_examples.map((ex: any, i: number) => `${i+1}. ${ex.language} - ${ex.title || 'Untitled'}`).join('\n')}

## Features Extracted:
${readmeContent.features.map((f: any) => `- ${f.title}: ${f.description.substring(0, 100)}...`).join('\n')}

## Sample Content:
${readmeContent.full_content.substring(0, 1000)}...

Create a structured JSON response that organizes this rich content intelligently:

{
  "tagline": "Professional tagline based on content",
  "key_capabilities": ["capability1", "capability2", "capability3"],
  "feature_categories": [
    {
      "category": "Category Name",
      "features": [
        {
          "name": "Feature Name",
          "description": "Feature description from content",
          "benefits": ["benefit1", "benefit2"]
        }
      ]
    }
  ],
  "use_cases": [
    {
      "title": "Use Case Title",
      "description": "Description from examples",
      "code_example": "Actual code from README",
      "target_users": ["user_type1", "user_type2"],
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "installation_guide": {
    "quick_start": {
      "preferred_method": "Method name",
      "command": "Primary command",
      "additional_steps": ["step1", "step2"]
    },
    "detailed_steps": [
      {
        "step_number": 1,
        "title": "Step title",
        "commands": ["command1", "command2"],
        "explanation": "What this step does"
      }
    ],
    "system_requirements": {
      "minimum": {"requirement": "value"},
      "recommended": {"requirement": "value"}
    }
  },
  "api_overview": {
    "main_classes": ["Class1", "Class2"],
    "key_methods": ["method1", "method2"],
    "configuration_options": ["option1", "option2"]
  }
}

JSON only:`
        }
      ],
      temperature: 0.2,
      max_tokens: 3000,
      top_p: 0.9
    });

    return this.parseStructuredResponse(completion.choices[0].message.content || '');
  }

  private async generateEnhancedMetadata(server: McpServer, readmeContent: any) {
    console.log('📊 Generating enhanced metadata...');

    // Analyze content to determine metadata
    const contentLength = readmeContent.full_content.length;
    const hasExamples = readmeContent.code_examples.length > 0;
    const hasFeatures = readmeContent.features.length > 0;
    const hasInstallation = readmeContent.installation_methods.length > 0;

    return {
      framework_type: this.determineFrameworkType(server, readmeContent),
      primary_use_case: this.determinePrimaryUseCase(server, readmeContent),
      ecosystem_position: this.determineEcosystemPosition(server),
      maturity_level: this.determineMaturityLevel(server, readmeContent),
      enterprise_ready: this.isEnterpriseReady(server, readmeContent),
      community_size: this.determineCommunitySize(server)
    };
  }

  private determineFrameworkType(server: McpServer, readmeContent: any): string {
    const content = readmeContent.full_content.toLowerCase();

    if (content.includes('testing') || content.includes('test')) return 'Testing Framework';
    if (content.includes('automation') || content.includes('browser')) return 'Automation Tool';
    if (content.includes('api') || content.includes('client')) return 'API Client';
    if (content.includes('server') || content.includes('service')) return 'Server Framework';
    if (content.includes('library') || content.includes('sdk')) return 'Library/SDK';

    return 'Development Tool';
  }

  private determinePrimaryUseCase(server: McpServer, readmeContent: any): string {
    const content = readmeContent.full_content.toLowerCase();

    if (content.includes('browser automation') || content.includes('web testing')) return 'Browser Automation';
    if (content.includes('data extraction') || content.includes('scraping')) return 'Data Extraction';
    if (content.includes('api integration') || content.includes('webhook')) return 'API Integration';
    if (content.includes('file processing') || content.includes('document')) return 'File Processing';

    return server.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private determineEcosystemPosition(server: McpServer): string {
    if (server.stars > 10000) return 'Industry Standard';
    if (server.stars > 5000) return 'Popular Choice';
    if (server.stars > 1000) return 'Established Tool';
    if (server.stars > 100) return 'Growing Project';
    return 'Emerging Tool';
  }

  private determineMaturityLevel(server: McpServer, readmeContent: any): 'experimental' | 'beta' | 'stable' | 'mature' {
    const hasRichDocs = readmeContent.sections.length > 5;
    const hasExamples = readmeContent.code_examples.length > 3;
    const isPopular = server.stars > 1000;

    if (hasRichDocs && hasExamples && isPopular) return 'mature';
    if (hasRichDocs && hasExamples) return 'stable';
    if (hasRichDocs || hasExamples) return 'beta';
    return 'experimental';
  }

  private isEnterpriseReady(server: McpServer, readmeContent: any): boolean {
    const content = readmeContent.full_content.toLowerCase();
    const indicators = [
      'enterprise', 'production', 'scale', 'security', 'compliance',
      'support', 'sla', 'monitoring', 'logging', 'docker'
    ];

    return indicators.some(indicator => content.includes(indicator)) && server.stars > 500;
  }

  private determineCommunitySize(server: McpServer): 'small' | 'medium' | 'large' | 'very_large' {
    if (server.stars > 10000) return 'very_large';
    if (server.stars > 5000) return 'large';
    if (server.stars > 1000) return 'medium';
    return 'small';
  }

  private parseStructuredResponse(content: string): any {
    try {
      let cleanContent = content.trim();
      cleanContent = cleanContent.replace(/```json\s*/, '').replace(/```\s*$/, '');

      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse structured response:', error);
    }

    // Return fallback structure
    return {
      tagline: "Modern development tool",
      key_capabilities: ["Easy to use", "Well documented", "Reliable"],
      feature_categories: [],
      use_cases: [],
      installation_guide: {
        quick_start: {
          preferred_method: "Package Manager",
          command: "npm install",
          additional_steps: []
        },
        detailed_steps: [],
        system_requirements: {
          minimum: {},
          recommended: {}
        }
      },
      api_overview: {
        main_classes: [],
        key_methods: [],
        configuration_options: []
      }
    };
  }

  // Cost estimation
  estimateCost(serverCount: number): {
    githubApiCalls: number;
    llamaCost: number;
    totalCost: number
  } {
    const githubApiCalls = serverCount; // 1 README fetch per server
    const llamaTokensPerServer = 3000; // For content structuring
    const llamaCost = (serverCount * llamaTokensPerServer / 1000000) * 0.27;

    return {
      githubApiCalls,
      llamaCost,
      totalCost: llamaCost // GitHub API is free for public repos
    };
  }
}
