import { McpServer } from './semantic-search';
import { Mistral } from '@mistralai/mistralai';

interface MistralEnrichmentConfig {
  apiKey: string;
  model?: string;
}

interface EnrichmentResult {
  success: boolean;
  server?: McpServer;
  tokensUsed?: number;
  error?: string;
}

export class MistralEnrichmentService {
  private apiKey: string;
  private model: string;
  private mistral: Mistral;
  private hybridSearchService?: any;
  private lastRequestTime: number = 0;
  private requestQueue: Array<() => Promise<any>> = [];

  constructor(config: MistralEnrichmentConfig & { scrapingDogApiKey?: string }) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'mistral-medium-latest'; // Use Mistral Medium with rate limiting

    // Initialize Mistral AI client
    this.mistral = new Mistral({
      apiKey: this.apiKey
    });

    // Initialize Hybrid Search Service (ScrapingDog + Fast Crawler)
    if (config.scrapingDogApiKey) {
      try {
        const { HybridSearchService } = require('./hybrid-search-service');
        this.hybridSearchService = new HybridSearchService({
          scrapingDogApiKey: config.scrapingDogApiKey
        });
        console.log('✅ Hybrid Search Service initialized (ScrapingDog + Mistral Medium with Rate Limiting)');
      } catch (error) {
        console.warn('⚠️ Hybrid Search Service not available:', error);
        console.warn('Error details:', error.message);
      }
    } else {
      console.log('⚠️ ScrapingDog API key not provided');
    }
  }

  // Rate limiting: 1 request per second for Mistral
  private async rateLimitedRequest(requestFn: () => Promise<any>): Promise<any> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minInterval = 1100; // 1.1 seconds to be safe

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms before next Mistral request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    return await requestFn();
  }

  // Repair common JSON issues from Mistral responses
  private repairJsonString(jsonStr: string): string {
    try {
      // First, try to parse as-is
      JSON.parse(jsonStr);
      return jsonStr; // If it parses, return as-is
    } catch (error) {
      console.log('🔧 Attempting to repair malformed JSON...');

      // Common fixes for Mistral JSON issues
      let repaired = jsonStr;

      // Fix unescaped quotes in markdown content
      // Look for patterns like: "details": "## FAQ\n\n### General Information\n- **What is..."
      repaired = repaired.replace(
        /"details":\s*"([^"]*\*\*[^"]*?)"/g,
        (match, content) => {
          // Escape quotes within the content
          const escapedContent = content.replace(/"/g, '\\"');
          return `"details": "${escapedContent}"`;
        }
      );

      // Fix unescaped newlines and quotes in general
      repaired = repaired.replace(
        /"details":\s*"((?:[^"\\]|\\.)*)"/g,
        (match, content) => {
          // Properly escape the content
          const escapedContent = content
            .replace(/\\/g, '\\\\')  // Escape backslashes
            .replace(/"/g, '\\"')    // Escape quotes
            .replace(/\n/g, '\\n')   // Escape newlines
            .replace(/\r/g, '\\r')   // Escape carriage returns
            .replace(/\t/g, '\\t');  // Escape tabs
          return `"details": "${escapedContent}"`;
        }
      );

      // Try to find and fix truncated JSON
      if (!repaired.trim().endsWith('}')) {
        console.log('🔧 JSON appears truncated, attempting to close...');
        // Count open braces vs close braces
        const openBraces = (repaired.match(/{/g) || []).length;
        const closeBraces = (repaired.match(/}/g) || []).length;
        const missingBraces = openBraces - closeBraces;

        if (missingBraces > 0) {
          // Add missing closing braces
          repaired += '}'.repeat(missingBraces);
        }
      }

      console.log('🔧 Repaired JSON (first 200 chars):', repaired.substring(0, 200));
      return repaired;
    }
  }

  // Aggressive JSON cleanup for severely malformed responses
  private aggressiveJsonCleanup(jsonStr: string): string {
    console.log('🚨 Attempting aggressive JSON cleanup...');

    // Remove everything before the first {
    let cleaned = jsonStr.substring(jsonStr.indexOf('{'));

    // Remove everything after the last }
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(0, lastBrace + 1);
    }

    // Replace problematic content in details fields with safe placeholders
    cleaned = cleaned.replace(
      /"details":\s*"[^"]*"/g,
      '"details": "Content extracted from search results (see summary for key points)"'
    );

    console.log('🚨 Aggressively cleaned JSON (first 200 chars):', cleaned.substring(0, 200));
    return cleaned;
  }

  // Batch process all sections in ONE Mistral request
  private async batchStructureContentWithMistral(allSearchResults: Record<string, string[]>, completeData: any): Promise<Record<string, any>> {
    const repoName = completeData.repositoryMetadata?.name || 'Unknown';
    const repoDescription = completeData.repositoryMetadata?.description || '';

    // Build comprehensive prompt for ALL sections
    let batchPrompt = `TASK: Create human-readable, well-structured documentation for ${repoName} based on search results.

REPOSITORY: ${repoName} (${repoDescription})

CRITICAL INSTRUCTIONS:
1. Create ACTUAL FAQ questions and answers, not summaries
2. Write REAL tutorials with step-by-step instructions
3. Provide SPECIFIC troubleshooting solutions
4. Use proper markdown formatting with headers, lists, and code blocks
5. Extract concrete examples from search results
6. Make content immediately useful to developers
7. Use backticks for code to avoid JSON issues

CONTENT REQUIREMENTS BY SECTION:
- FAQ: Write 5-8 actual Q&A pairs based on search results
- Tutorials: Create step-by-step guides with code examples
- Troubleshooting: List specific problems and solutions
- Performance: Provide benchmarks, optimization tips
- Security: List security best practices with examples
- Testing: Show actual test examples and patterns
- Other sections: Create practical, actionable content

SEARCH RESULTS FROM MCP DIRECTORIES:
`;

    // Add all search results to the prompt
    for (const [field, searchResults] of Object.entries(allSearchResults)) {
      batchPrompt += `
=== ${field.toUpperCase().replace('_', ' ')} SECTION ===
Search Results:
${searchResults.join('\n\n---\n\n')}

`;
    }

    batchPrompt += `
CRITICAL: Return ONLY valid JSON. No explanations, no markdown formatting, no code blocks around the JSON.

REQUIRED OUTPUT FORMAT (Pure JSON only):
{`;

    // Add specific requirements for each field
    const fieldRequirements = {
      'faq': 'Create 5-8 actual FAQ questions and answers. Format as:\n### Q: [Question]?\nA: [Detailed answer with code examples if applicable]',
      'tutorials': 'Write step-by-step tutorials with:\n1. Prerequisites\n2. Installation steps\n3. Basic usage examples\n4. Advanced examples\n5. Common patterns',
      'troubleshooting': 'List specific problems and solutions:\n### Problem: [Issue description]\n**Solution:** [Step-by-step fix]\n**Code Example:** [If applicable]',
      'performance': 'Provide:\n- Performance benchmarks\n- Optimization techniques\n- Best practices for speed\n- Memory usage tips',
      'security': 'Include:\n- Security best practices\n- Common vulnerabilities\n- Secure coding examples\n- Authentication patterns',
      'testing': 'Show:\n- Unit test examples\n- Integration test patterns\n- Mocking strategies\n- Test configuration',
      'changelog': 'Format as:\n## Version X.X.X\n- Feature: [Description]\n- Fix: [Description]\n- Breaking: [Description]',
      'roadmap': 'List:\n- Upcoming features\n- Timeline estimates\n- Community requests\n- Development priorities',
      'deployment': 'Cover:\n- Deployment strategies\n- Environment setup\n- Configuration examples\n- Production tips',
      'monitoring': 'Include:\n- Monitoring setup\n- Key metrics to track\n- Alerting strategies\n- Debugging techniques',
      'best_practices': 'Provide:\n- Code organization\n- Error handling patterns\n- Performance tips\n- Maintainability guidelines'
    };

    for (const field of Object.keys(allSearchResults)) {
      const searchCount = allSearchResults[field]?.length || 0;
      const requirements = fieldRequirements[field] || 'Create practical, actionable content based on search results';

      batchPrompt += `
  "${field}": {
    "summary": "Brief overview of ${field.replace('_', ' ')} for ${repoName} based on ${searchCount} search results",
    "details": "${requirements}\n\nBase all content on the search results provided above. Include specific examples, code snippets, and real implementation details found in the search results."
  },`;
    }

    // Remove trailing comma and close JSON
    batchPrompt = batchPrompt.slice(0, -1) + '\n}\n\nEXAMPLE FAQ FORMAT:\n"faq": {\n  "summary": "Common questions about axios usage in MCP servers",\n  "details": "### Q: How do I install axios?\\nA: Run `npm install axios` in your project.\\n\\n### Q: How do I make GET requests?\\nA: Use `axios.get(url)` for simple requests."\n}\n\nIMPORTANT: Return ONLY the JSON object. Create human-readable, practical content that developers can immediately use.';

    try {
      console.log(`🤖 Making batch request to Mistral for ${Object.keys(allSearchResults).length} sections...`);
      console.log(`📊 Prompt size: ${batchPrompt.length} characters`);
      console.log(`⏳ This may take 30-60 seconds for large batch processing...`);

      const startTime = Date.now();

      const response = await Promise.race([
        this.rateLimitedRequest(() =>
          this.mistral.chat.complete({
            messages: [{ role: 'user', content: batchPrompt }],
            model: this.model,
            temperature: 0.2,
            maxTokens: 4000 // Increased for batch processing
          })
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Mistral API timeout after 90 seconds')), 90000)
        )
      ]) as any;

      const processingTime = Date.now() - startTime;
      console.log(`⚡ Batch processing completed in ${processingTime}ms`);

      const rawContent = response.choices?.[0]?.message?.content || '{}';
      console.log('🔍 Raw Mistral response (first 500 chars):', rawContent.substring(0, 500));

      // Clean up markdown code blocks that Mistral sometimes adds
      let cleanedContent = rawContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim();

      console.log('🧹 Cleaned content (first 200 chars):', cleanedContent.substring(0, 200));

      // Try multiple parsing approaches
      let result;
      try {
        // First attempt: direct parsing
        result = JSON.parse(cleanedContent);
      } catch (firstError) {
        console.log('🔧 First parse failed, attempting repair...');
        try {
          // Second attempt: repair and parse
          const repairedContent = this.repairJsonString(cleanedContent);
          result = JSON.parse(repairedContent);
        } catch (secondError) {
          console.log('🔧 Repair failed, attempting aggressive cleanup...');
          // Third attempt: aggressive cleanup
          const aggressiveCleanup = this.aggressiveJsonCleanup(cleanedContent);
          result = JSON.parse(aggressiveCleanup);
        }
      }

      // Validate the result structure
      const expectedFields = Object.keys(allSearchResults);
      const resultFields = Object.keys(result);

      console.log(`🔍 Expected fields: ${expectedFields.join(', ')}`);
      console.log(`🔍 Received fields: ${resultFields.join(', ')}`);

      // Check if each field has the expected structure
      let validStructure = true;
      for (const field of expectedFields) {
        if (!result[field] || !result[field].summary || !result[field].details) {
          console.warn(`⚠️ Invalid structure for field: ${field}`);
          validStructure = false;
        }
      }

      if (!validStructure) {
        console.warn('⚠️ Result structure validation failed');
        console.log('🔍 Sample result structure:', JSON.stringify(result, null, 2).substring(0, 500));
      }

      console.log(`✅ Batch processing completed for ${Object.keys(result).length} sections`);
      return result;

    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);

      // Log the raw response for debugging
      if (error.message?.includes('JSON')) {
        console.log('🔍 Raw Mistral response causing JSON error:');
        // Try to get the raw response from the error context
      }

      // Fallback: Try smaller batches if the large batch failed
      if (Object.keys(allSearchResults).length > 5) {
        console.log('🔄 Trying smaller batch sizes...');
        return await this.fallbackToSmallerBatches(allSearchResults, completeData);
      }

      throw error;
    }
  }

  // Fallback: Process in smaller batches if large batch fails
  private async fallbackToSmallerBatches(allSearchResults: Record<string, string[]>, completeData: any): Promise<Record<string, any>> {
    const results: Record<string, any> = {};
    const entries = Object.entries(allSearchResults);
    const batchSize = 3; // Process 3 sections at a time

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      const batchData = Object.fromEntries(batch);

      console.log(`🔄 Processing smaller batch ${Math.floor(i/batchSize) + 1}: ${Object.keys(batchData).join(', ')}`);

      try {
        const batchResults = await this.batchStructureContentWithMistral(batchData, completeData);
        Object.assign(results, batchResults);

        // Add delay between small batches to respect rate limits
        if (i + batchSize < entries.length) {
          console.log('⏳ Waiting 2s before next small batch...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`❌ Small batch failed for ${Object.keys(batchData).join(', ')}:`, error);

        // Add fallback content for failed batch
        for (const [field, searchResults] of batch) {
          results[field] = {
            summary: `${field.replace('_', ' ')} information`,
            details: searchResults.join('\n\n---\n\n')
          };
        }
      }
    }

    return results;
  }



  // Parse markdown sections from README content - capture ALL sections
  private parseMarkdownSections(readmeContent: string): {
    features: string;
    installation: string;
    examples: string;
    contributing: string;
    license: string;
    usage: string;
    api: string;
    browser_support: string;
    request_config: string;
    response_schema: string;
    interceptors: string;
    error_handling: string;
    cancellation: string;
    form_data: string;
    typescript: string;
    config_defaults: string;
    full_content: string;
  } {
    const sections = {
      features: '',
      installation: '',
      examples: '',
      contributing: '',
      license: '',
      usage: '',
      api: '',
      browser_support: '',
      request_config: '',
      response_schema: '',
      interceptors: '',
      error_handling: '',
      cancellation: '',
      form_data: '',
      typescript: '',
      config_defaults: '',
      full_content: readmeContent || ''
    };

    if (!readmeContent) return sections;

    // Extract major sections by finding their start and end positions
    const majorSections = this.extractMajorSections(readmeContent);

    // Map extracted sections to our schema - capture ALL major sections
    for (const [title, content] of Object.entries(majorSections)) {
      const titleLower = title.toLowerCase();

      if (titleLower.includes('feature')) {
        sections.features = content;
      } else if (titleLower.includes('install') || titleLower.includes('getting started')) {
        sections.installation = content;
      } else if (titleLower.includes('example') || titleLower.includes('quick start')) {
        sections.examples = content;
      } else if (titleLower.includes('usage')) {
        sections.usage = content;
      } else if (titleLower.includes('contribut')) {
        sections.contributing = content;
      } else if (titleLower.includes('license')) {
        sections.license = content;
      } else if (titleLower.includes('api') || titleLower.includes('reference') || titleLower.includes('method')) {
        sections.api = content;
      } else if (titleLower.includes('browser') && titleLower.includes('support')) {
        sections.browser_support = content;
      } else if (titleLower.includes('request') && titleLower.includes('config')) {
        sections.request_config = content;
      } else if (titleLower.includes('response') && titleLower.includes('schema')) {
        sections.response_schema = content;
      } else if (titleLower.includes('interceptor')) {
        sections.interceptors = content;
      } else if (titleLower.includes('error') || titleLower.includes('handling')) {
        sections.error_handling = content;
      } else if (titleLower.includes('cancel') || titleLower.includes('abort')) {
        sections.cancellation = content;
      } else if (titleLower.includes('form') || titleLower.includes('multipart') || titleLower.includes('urlencoded')) {
        sections.form_data = content;
      } else if (titleLower.includes('typescript')) {
        sections.typescript = content;
      } else if (titleLower.includes('config') && titleLower.includes('default')) {
        sections.config_defaults = content;
      }
    }

    return sections;
  }

  // Extract all major sections with their full content
  private extractMajorSections(content: string): Record<string, string> {
    const sections: Record<string, string> = {};
    const lines = content.split('\n');

    let currentSection = '';
    let currentContent: string[] = [];
    let currentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check if this is a header line
      const headerMatch = trimmedLine.match(/^(#{1,6})\s+(.+)/);

      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2];

        // If this is a top-level section (## level) or we're starting fresh
        if (level <= 2) {
          // Save previous section if we have one
          if (currentSection && currentContent.length > 0) {
            sections[currentSection] = currentContent.join('\n').trim();
          }

          // Start new section
          currentSection = title;
          currentContent = [line];
          currentLevel = level;
        } else {
          // This is a subsection, add to current section
          if (currentSection) {
            currentContent.push(line);
          }
        }
      } else {
        // Regular content line
        if (currentSection) {
          currentContent.push(line);
        }
      }
    }

    // Save the last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  // Collect ALL available data without filtering - let AI organize everything
  private collectAllAvailableData(repoData: any): {
    fullReadme: string;
    repositoryMetadata: any;
    extractedResources: any;
    packageInfo: any;
    additionalContext: any;
  } {
    return {
      // Complete README content (no truncation, no filtering)
      fullReadme: repoData.readme_content || '',

      // All repository metadata
      repositoryMetadata: {
        name: repoData.name,
        description: repoData.description,
        language: repoData.language,
        topics: repoData.topics || [],
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        issues: repoData.open_issues_count,
        license: repoData.license,
        homepage: repoData.homepage,
        created_at: repoData.created_at,
        updated_at: repoData.updated_at,
        owner: repoData.owner,
        default_branch: repoData.default_branch,
        size: repoData.size,
        archived: repoData.archived,
        disabled: repoData.disabled,
        private: repoData.private
      },

      // All extracted resources (videos, docs, tutorials, etc.)
      extractedResources: repoData.extracted_resources || {},

      // Package information if available
      packageInfo: {
        package_json: repoData.package_json || null,
        dependencies: repoData.dependencies || [],
        dev_dependencies: repoData.dev_dependencies || [],
        scripts: repoData.scripts || {}
      },

      // Additional context
      additionalContext: {
        file_structure: repoData.file_structure || [],
        recent_commits: repoData.recent_commits || [],
        contributors: repoData.contributors || [],
        releases: repoData.releases || []
      }
    };
  }

  async enrichServerData(repoData: any): Promise<EnrichmentResult> {
    try {
      // SMART APPROACH: Multi-stage processing
      console.log('🚀 Starting smart multi-stage enrichment...');

      // Stage 1: Direct extraction (no AI) - preserve 100% of original content
      const completeData = this.collectAllAvailableData(repoData);
      const extractedSections = this.parseMarkdownSections(completeData.fullReadme);

      console.log('📊 Direct extraction complete:');
      console.log('- README length:', completeData.fullReadme.length);
      console.log('- Sections found:', Object.keys(extractedSections).filter(k => extractedSections[k as keyof typeof extractedSections]).length);

      // STAGE 1: Clean README Preservation (already done above)
      console.log('📋 Stage 1: Clean README Preservation completed');

      // STAGE 2: Organize content intelligently (no AI yet)
      const organizedContent = this.organizeContentIntelligently(extractedSections, completeData);

      // STAGE 3: Schema Gap Analysis with Mistral AI
      console.log('🔍 Stage 2: Schema Gap Analysis with Mistral AI...');
      const schemaGaps = this.analyzeSchemaGaps(organizedContent, completeData);

      // STAGE 4: ScrapingDog + Mistral AI Gap Filling
      console.log('🌐 Stage 3: ScrapingDog + Mistral AI Gap Filling...');
      const filledContent = await this.fillSchemaGaps(schemaGaps, organizedContent, completeData);

      // Map to our McpServer interface
      const server: McpServer = {
        id: '', // Will be set by the API route
        name: repoData.name,
        description: repoData.description || 'No description available',
        tags: this.extractTagsFromRepo(repoData),
        category: this.inferCategory(repoData),
        language: repoData.language || 'Unknown',
        stars: repoData.stars,
        installCommand: this.generateInstallCommand(repoData),
        githubUrl: repoData.html_url,
        author: {
          name: repoData.owner.login,
          githubUsername: repoData.owner.login
        },
        // Include extracted real resources
        extracted_resources: repoData.extracted_resources || {
          video_links: [],
          documentation_links: [],
          tutorial_links: [],
          example_links: [],
          demo_links: [],
          code_examples: []
        },
        // Include the filled content from 3-stage orchestration
        preserved_content: filledContent
      };

      return {
        success: true,
        server,
        tokensUsed: 0 // No AI tokens used in this approach
      };

    } catch (error) {
      console.error('Error enriching server data:', error);

      // Fallback: Create server data without AI enrichment
      console.log('Using fallback enrichment...');
      const fallbackServer: McpServer = {
        id: '',
        name: repoData.name,
        description: repoData.description || 'No description available',
        tags: this.extractTagsFromRepo(repoData),
        category: this.inferCategory(repoData),
        language: repoData.language || 'Unknown',
        stars: repoData.stars,
        installCommand: this.generateInstallCommand(repoData),
        githubUrl: repoData.html_url,
        author: {
          name: repoData.owner.login,
          githubUsername: repoData.owner.login
        }
      };

      return {
        success: true,
        server: fallbackServer,
        tokensUsed: 0
      };
    }
  }

  // NEW: Intelligent organization prompt - give AI ALL data and let it decide organization
  private buildIntelligentOrganizationPrompt(completeData: any): string {
    const { fullReadme, repositoryMetadata, extractedResources, packageInfo } = completeData;

    // Extract sections first, then let AI organize them
    const extractedSections = this.parseMarkdownSections(fullReadme);

    // For large READMEs, rely on extracted sections instead of full content
    const maxReadmeLength = 8000; // Reduced to fit within token limits
    const truncatedReadme = fullReadme.length > maxReadmeLength
      ? fullReadme.substring(0, maxReadmeLength) + '\n\n[README TRUNCATED - USE EXTRACTED SECTIONS BELOW]'
      : fullReadme;

    return `TASK: Organize the EXTRACTED README SECTIONS into intelligent tabs. PRESERVE original content, don't generate new content.

REPOSITORY: ${repositoryMetadata.name}
DESCRIPTION: ${repositoryMetadata.description}
LANGUAGE: ${repositoryMetadata.language}

EXTRACTED SECTIONS FROM README:
FEATURES SECTION:
${extractedSections.features || 'Not found'}

INSTALLATION SECTION:
${extractedSections.installation || 'Not found'}

EXAMPLES SECTION:
${extractedSections.examples || 'Not found'}

API SECTION:
${extractedSections.api || 'Not found'}

USAGE SECTION:
${extractedSections.usage || 'Not found'}

BROWSER SUPPORT SECTION:
${extractedSections.browser_support || 'Not found'}

REQUEST CONFIG SECTION:
${extractedSections.request_config || 'Not found'}

RESPONSE SCHEMA SECTION:
${extractedSections.response_schema || 'Not found'}

INTERCEPTORS SECTION:
${extractedSections.interceptors || 'Not found'}

ERROR HANDLING SECTION:
${extractedSections.error_handling || 'Not found'}

CANCELLATION SECTION:
${extractedSections.cancellation || 'Not found'}

FORM DATA SECTION:
${extractedSections.form_data || 'Not found'}

TYPESCRIPT SECTION:
${extractedSections.typescript || 'Not found'}

CONFIG DEFAULTS SECTION:
${extractedSections.config_defaults || 'Not found'}

CONTRIBUTING SECTION:
${extractedSections.contributing || 'Not found'}

LICENSE SECTION:
${extractedSections.license || 'Not found'}

EXTRACTED RESOURCES: ${Object.keys(extractedResources).join(', ')}

YOUR TASK: REFINE AND ORGANIZE EXTRACTED SECTIONS (NO SUMMARIZATION)

REFINEMENT RULES (NOT SUMMARIZATION):
1. **PRESERVE 100% OF ORIGINAL TEXT** - Never shorten or condense
2. **ORGANIZE content** into logical tabs and sections
3. **STRUCTURE raw markdown** into clean, navigable format
4. **MAP content** to our schema without losing information
5. **ENHANCE incomplete sections** with factual data only
6. **STANDARDIZE formatting** while keeping all original content

REFINEMENT APPROACH:
📋 **Content Mapping**: Take extracted sections and map them to appropriate tabs
🔧 **Structure Enhancement**: Organize content logically without removing anything
📊 **Format Standardization**: Clean up markdown formatting, preserve all text
🎯 **Schema Alignment**: Fit content into our tab structure without loss
✨ **Gap Filling**: Only add missing information, never replace existing content

TAB STRUCTURE:
- **Features**: Use FEATURES SECTION content above
- **Installation**: Use INSTALLATION SECTION content above
- **Examples**: Use EXAMPLES SECTION + USAGE SECTION content above
- **API**: Use API SECTION content above

{
  "name": "${repositoryMetadata.name}",
  "description": "INTELLIGENT DECISION: Write 2-3 sentence summary for main heading",
  "tags": ${JSON.stringify(repositoryMetadata.topics.slice(0, 5))},
  "category": "INTELLIGENT DECISION: Choose best category based on content analysis",
  "language": "${repositoryMetadata.language}",
  "installCommand": "INTELLIGENT DECISION: Extract primary install command from README",
  "author": {"name": "${repositoryMetadata.owner.login}"},
  "preserved_content": {
    "features": {
      "summary": "REFINE: Create navigation-friendly overview (NOT a summary)",
      "detailed_features": "PRESERVE: Use EXACT TEXT from FEATURES SECTION above - all bullet points and formatting",
      "capabilities": "ORGANIZE: Group features logically without removing any content"
    },
    "installation_instructions": {
      "summary": "REFINE: Create clear installation navigation (NOT a summary)",
      "package_managers": "PRESERVE: Use EXACT TEXT from INSTALLATION SECTION above - all commands",
      "cdn_options": "ORGANIZE: Structure CDN links from INSTALLATION SECTION above",
      "setup_steps": "ORGANIZE: Structure setup steps from INSTALLATION SECTION above"
    },
    "usage_examples": {
      "summary": "REFINE: Create examples navigation (NOT a summary)",
      "basic_examples": "PRESERVE: Use EXACT TEXT from EXAMPLES SECTION above - all code blocks",
      "advanced_examples": "PRESERVE: Use EXACT TEXT from USAGE SECTION above - all code blocks",
      "code_snippets": "ORGANIZE: Structure all code examples from sections above"
    },
    "api_documentation": {
      "summary": "REFINE: Create API navigation (NOT a summary)",
      "methods": "PRESERVE: Use EXACT TEXT from API SECTION above - all method documentation",
      "endpoints": "ORGANIZE: Structure endpoints from API SECTION above",
      "parameters": "ORGANIZE: Structure parameters from API SECTION above"
    },
    "browser_support": {
      "summary": "Browser compatibility overview",
      "details": "USE EXACT TEXT from BROWSER SUPPORT SECTION above"
    },
    "request_config": {
      "summary": "Request configuration overview",
      "details": "USE EXACT TEXT from REQUEST CONFIG SECTION above"
    },
    "response_schema": {
      "summary": "Response structure overview",
      "details": "USE EXACT TEXT from RESPONSE SCHEMA SECTION above"
    },
    "interceptors": {
      "summary": "Interceptors functionality overview",
      "details": "USE EXACT TEXT from INTERCEPTORS SECTION above"
    },
    "error_handling": {
      "summary": "Error handling overview",
      "details": "USE EXACT TEXT from ERROR HANDLING SECTION above"
    },
    "cancellation": {
      "summary": "Request cancellation overview",
      "details": "USE EXACT TEXT from CANCELLATION SECTION above"
    },
    "form_data": {
      "summary": "Form data handling overview",
      "details": "USE EXACT TEXT from FORM DATA SECTION above"
    },
    "typescript": {
      "summary": "TypeScript support overview",
      "details": "USE EXACT TEXT from TYPESCRIPT SECTION above"
    },
    "config_defaults": {
      "summary": "Configuration defaults overview",
      "details": "USE EXACT TEXT from CONFIG DEFAULTS SECTION above"
    },
    "contributing": "USE EXACT TEXT from CONTRIBUTING SECTION above",
    "license": "USE EXACT TEXT from LICENSE SECTION above"
  },
  "extracted_resources": ${JSON.stringify(extractedResources)}
}

Return ONLY valid JSON.`;
  }

  private buildEnrichmentPrompt(repoData: any, extractedSections: any): string {
    const extractedResources = repoData.extracted_resources || {};

    // Show available sections for debugging
    const availableSections = Object.keys(extractedSections).filter(key => extractedSections[key]);

    return `TASK: Organize the README content into our schema. PRESERVE all original content.

Repository: ${repoData.name}
Description: ${repoData.description}
Language: ${repoData.language}

AVAILABLE SECTIONS: ${availableSections.join(', ')}

SPECIFIC CONTENT TO ORGANIZE:

FEATURES SECTION:
${extractedSections.features || 'Not found'}

INSTALLATION SECTION:
${extractedSections.installation || 'Not found'}

EXAMPLES SECTION:
${extractedSections.examples || 'Not found'}

USAGE SECTION:
${extractedSections.usage || 'Not found'}

API SECTION:
${extractedSections.api || 'Not found'}

CONTRIBUTING SECTION:
${extractedSections.contributing || 'Not found'}

LICENSE SECTION:
${extractedSections.license || 'Not found'}

RULES:
1. Preserve ALL original content - don't remove anything
2. Organize content clearly for our schema
3. Keep all bullet points, code blocks, formatting
4. Combine examples and usage if both exist
5. Extract key information while preserving detail

{
  "name": "${repoData.name}",
  "description": "${repoData.description}",
  "tags": ${JSON.stringify(repoData.topics?.slice(0, 5) || ['javascript'])},
  "category": "api-integration",
  "language": "${repoData.language}",
  "installCommand": "npm install ${repoData.name.toLowerCase()}",
  "author": {"name": "${repoData.owner.login}"},
  "preserved_content": {
    "features": "organize features content preserving all details",
    "installation_instructions": "organize installation content preserving all methods",
    "usage_examples": "organize examples/usage content preserving all code blocks",
    "contributing": "organize contributing content",
    "license": "organize license content"
  },
  "extracted_resources": ${JSON.stringify(extractedResources)}
}

Return ONLY valid JSON.`;
  }

  private extractTagsFromRepo(repoData: any): string[] {
    const tags = new Set<string>();
    
    // Add topics
    if (repoData.topics) {
      repoData.topics.forEach((topic: string) => tags.add(topic));
    }
    
    // Add language
    if (repoData.language) {
      tags.add(repoData.language.toLowerCase());
    }
    
    // Add common MCP-related tags
    const name = repoData.name.toLowerCase();
    const description = (repoData.description || '').toLowerCase();
    
    if (name.includes('mcp') || description.includes('mcp')) {
      tags.add('mcp');
    }
    
    return Array.from(tags).slice(0, 5);
  }

  private inferCategory(repoData: any): string {
    const name = repoData.name.toLowerCase();
    const description = (repoData.description || '').toLowerCase();
    const text = `${name} ${description}`;
    
    if (text.includes('browser') || text.includes('puppeteer') || text.includes('playwright')) {
      return 'browser-automation';
    }
    if (text.includes('scraper') || text.includes('extract')) {
      return 'data-extraction';
    }
    if (text.includes('api') || text.includes('integration')) {
      return 'api-integration';
    }
    if (text.includes('file') || text.includes('pdf') || text.includes('document')) {
      return 'file-processing';
    }
    if (text.includes('search')) {
      return 'search';
    }
    if (text.includes('database') || text.includes('sql')) {
      return 'database';
    }
    
    return 'api-integration'; // Default category
  }

  private generateInstallCommand(repoData: any): string {
    if (repoData.package_json) {
      return `npm install ${repoData.package_json.name || repoData.name}`;
    }

    if (repoData.language === 'Python') {
      return `pip install ${repoData.name}`;
    }

    return `npx ${repoData.name}`;
  }

  // NEW: Intelligent content organization without AI - just structure the extracted sections
  private organizeContentIntelligently(extractedSections: any, completeData: any): any {
    console.log('🎯 Organizing content intelligently...');

    // Organize the extracted sections into our schema structure
    const organized = {
      features: {
        summary: extractedSections.features ? 'Key features and capabilities' : 'Features not available',
        detailed_features: extractedSections.features || 'No features section found in README',
        capabilities: extractedSections.features || 'No capabilities information available'
      },
      installation_instructions: {
        summary: extractedSections.installation ? 'Installation and setup instructions' : 'Installation instructions not available',
        package_managers: extractedSections.installation || 'No installation instructions found',
        cdn_options: extractedSections.installation?.includes('cdn') || extractedSections.installation?.includes('CDN')
          ? extractedSections.installation
          : 'No CDN options specified',
        setup_steps: extractedSections.installation || 'No setup steps available'
      },
      usage_examples: {
        summary: extractedSections.examples || extractedSections.usage ? 'Usage examples and code samples' : 'Examples not available',
        basic_examples: extractedSections.examples || extractedSections.usage || 'No basic examples found',
        advanced_examples: extractedSections.usage || extractedSections.examples || 'No advanced examples found',
        code_snippets: extractedSections.examples || extractedSections.usage || 'No code snippets available'
      },
      api_documentation: {
        summary: extractedSections.api ? 'API reference and documentation' : 'API documentation not available',
        methods: extractedSections.api || 'No API methods documented',
        endpoints: extractedSections.api || 'No endpoints documented',
        parameters: extractedSections.api || 'No parameters documented'
      },
      browser_support: extractedSections.browser_support ? {
        summary: 'Browser compatibility information',
        details: extractedSections.browser_support
      } : null,
      request_config: extractedSections.request_config ? {
        summary: 'Request configuration options',
        details: extractedSections.request_config
      } : null,
      response_schema: extractedSections.response_schema ? {
        summary: 'Response structure and schema',
        details: extractedSections.response_schema
      } : null,
      interceptors: extractedSections.interceptors ? {
        summary: 'Request and response interceptors',
        details: extractedSections.interceptors
      } : null,
      error_handling: extractedSections.error_handling ? {
        summary: 'Error handling patterns',
        details: extractedSections.error_handling
      } : null,
      cancellation: extractedSections.cancellation ? {
        summary: 'Request cancellation',
        details: extractedSections.cancellation
      } : null,
      form_data: extractedSections.form_data ? {
        summary: 'Form data handling',
        details: extractedSections.form_data
      } : null,
      typescript: extractedSections.typescript ? {
        summary: 'TypeScript support',
        details: extractedSections.typescript
      } : null,
      config_defaults: extractedSections.config_defaults ? {
        summary: 'Configuration defaults',
        details: extractedSections.config_defaults
      } : null,
      contributing: extractedSections.contributing || 'No contributing guidelines found',
      license: extractedSections.license || completeData.repositoryMetadata?.license?.name || 'License information not available',
      full_description: completeData.fullReadme?.substring(0, 1000) + '...' || 'No description available'
    };

    console.log('✅ Content organized with sections:', Object.keys(organized).filter(key => organized[key]));
    return organized;
  }

  // STAGE 2: Analyze schema gaps using Mistral AI
  private analyzeSchemaGaps(organizedContent: any, completeData: any): string[] {
    console.log('🔍 Analyzing schema gaps...');

    // Define our complete schema structure
    const requiredFields = [
      'features', 'installation_instructions', 'usage_examples', 'api_documentation',
      'faq', 'tutorials', 'troubleshooting', 'changelog', 'roadmap', 'performance',
      'security', 'testing', 'deployment', 'monitoring', 'best_practices'
    ];

    const missingFields: string[] = [];

    // Check which fields are missing or have insufficient content
    requiredFields.forEach(field => {
      const content = organizedContent[field];
      if (!content ||
          (typeof content === 'string' && content.includes('not available')) ||
          (typeof content === 'object' && Object.values(content).every(v =>
            typeof v === 'string' && (v.includes('not available') || v.includes('not found'))
          ))) {
        missingFields.push(field);
      }
    });

    console.log('📊 Missing fields identified:', missingFields);
    return missingFields;
  }

  // STAGE 3: Fill schema gaps using ScrapingDog + Mistral AI - BATCH MODE
  private async fillSchemaGaps(schemaGaps: string[], organizedContent: any, completeData: any): Promise<any> {
    console.log('🌐 Filling schema gaps with ScrapingDog + Mistral AI (BATCH MODE)...');

    let filledContent = { ...organizedContent };

    if (schemaGaps.length === 0) {
      console.log('✅ No gaps to fill - content is complete');
      return filledContent;
    }

    // Step 1: Collect search results for ALL missing fields
    const allSearchResults: Record<string, string[]> = {};

    for (const missingField of schemaGaps) {
      try {
        console.log(`🔍 Searching for ${missingField} content...`);

        // Generate search query for this field
        const searchQuery = this.generateSearchQuery(missingField, completeData.repositoryMetadata);

        // Use Hybrid Search Service to find content
        let foundContent = null;
        if (this.hybridSearchService) {
          console.log(`🔍 Hybrid searching for ${missingField} with query: ${searchQuery}`);
          foundContent = await this.hybridSearchService.searchForContent(searchQuery, missingField);
          console.log(`📄 Found content for ${missingField}:`, foundContent ? `${foundContent.length} results` : 'No content found');
        } else {
          console.log('⚠️ Hybrid Search Service not available');
        }

        // Store search results for batch processing
        if (foundContent && foundContent.length > 0) {
          allSearchResults[missingField] = Array.isArray(foundContent) ? foundContent : [foundContent];
        } else {
          allSearchResults[missingField] = [`No specific ${missingField} content found in search results.`];
        }

      } catch (error) {
        console.warn(`⚠️ Failed to search for ${missingField}:`, error);
        allSearchResults[missingField] = [`Error searching for ${missingField} content.`];
      }
    }

    // Step 2: Process ALL fields in ONE batch request to Mistral
    if (Object.keys(allSearchResults).length > 0) {
      console.log(`🤖 Processing ${Object.keys(allSearchResults).length} sections in ONE batch request...`);

      try {
        const batchResults = await this.batchStructureContentWithMistral(allSearchResults, completeData);

        // Apply batch results
        for (const [field, structuredContent] of Object.entries(batchResults)) {
          if (structuredContent && Object.keys(structuredContent).length > 0) {
            filledContent[field] = structuredContent;
            console.log(`✅ Filled ${field} with AI-refined content`);
          } else {
            // Fallback to raw search results
            filledContent[field] = {
              summary: `${field.replace('_', ' ')} information`,
              details: allSearchResults[field]?.join('\n\n---\n\n') || 'No content available'
            };
            console.log(`⚠️ Used fallback content for ${field}`);
          }
        }

      } catch (error) {
        console.error('❌ Batch processing failed:', error);

        // Fallback: Use raw search results for all fields
        for (const [field, searchResults] of Object.entries(allSearchResults)) {
          filledContent[field] = {
            summary: `${field.replace('_', ' ')} information`,
            details: searchResults.join('\n\n---\n\n')
          };
          console.log(`✅ Filled ${field} with scraped content (fallback)`);
        }
      }
    }

    console.log('🎯 Schema gap filling completed');
    return filledContent;
  }

  // Generate targeted search queries for missing content
  private generateSearchQuery(field: string, repoMetadata: any): string {
    const repoName = repoMetadata.name;
    const language = repoMetadata.language;

    const queryMap: Record<string, string> = {
      'faq': `${repoName} ${language} frequently asked questions FAQ common issues`,
      'tutorials': `${repoName} ${language} tutorial guide walkthrough how to`,
      'troubleshooting': `${repoName} ${language} troubleshooting problems issues solutions`,
      'changelog': `${repoName} ${language} changelog release notes version history`,
      'roadmap': `${repoName} ${language} roadmap future plans development`,
      'performance': `${repoName} ${language} performance benchmarks optimization`,
      'security': `${repoName} ${language} security best practices vulnerabilities`,
      'testing': `${repoName} ${language} testing unit tests integration tests`,
      'deployment': `${repoName} ${language} deployment production setup`,
      'monitoring': `${repoName} ${language} monitoring logging observability`,
      'best_practices': `${repoName} ${language} best practices patterns conventions`
    };

    return queryMap[field] || `${repoName} ${language} ${field}`;
  }

  // Note: Using Hybrid Search Service instead of direct ScrapingDog calls

  // Structure content using Mistral AI via Groq
  private async structureContentWithMistral(field: string, foundContent: string | null, completeData: any): Promise<any> {
    try {
      // Use Mistral AI to generate rich content for missing fields
      const repoName = completeData.repositoryMetadata.name;
      const repoDescription = completeData.repositoryMetadata.description;
      const language = completeData.repositoryMetadata.language;

      // If we have scraped content, refine it with AI
      if (foundContent && foundContent.length > 0) {
        // Handle both array and string formats from ScrapingDog
        const combinedContent = Array.isArray(foundContent)
          ? foundContent.join('\n\n')
          : foundContent;

        const prompt = `You are an expert in Model Context Protocol (MCP) servers. Analyze this content about ${field} for the ${repoName} MCP server and create comprehensive, accurate documentation.

CONTENT FROM HIGH-QUALITY MCP DIRECTORIES:
${combinedContent}

CONTEXT: ${repoName} is a ${language} MCP server. ${repoDescription}

SOURCES INCLUDE: Glama (⭐ trusted reports), PulseMCP (📊 extensive catalog), Cursor Directory (🔧), API Tracker (📡), Awesome MCP Servers (🌟), Hugging Face (🤗), and official MCP sources (🎯).

TASK: Create detailed ${field} content based on these trusted MCP directory sources. Focus on MCP-specific details, real examples, and practical guidance.

REQUIREMENTS:
- Extract ONLY factual information from the scraped MCP content
- Prioritize MCP-specific examples, configurations, and use cases
- Include real code snippets, MCP protocol details, and specific solutions
- Organize content with clear sections and markdown formatting
- Focus on practical implementation details for MCP servers
- If content mentions specific MCP tools, protocols, or integrations, include those details
- Remove marketing content and focus on technical accuracy
- Highlight any MCP official sources with 🎯 [MCP Official] markers

Return ONLY valid JSON:
{
  "summary": "Brief, factual overview focusing on MCP-specific aspects",
  "details": "Comprehensive content with real MCP examples, specific implementation details, and organized sections. Use markdown formatting with code blocks, lists, and clear headings."
}`;

        const response = await this.rateLimitedRequest(() =>
          this.mistral.chat.complete({
            messages: [{ role: 'user', content: prompt }],
            model: this.model,
            temperature: 0.2,
            maxTokens: 2500
          })
        );

        const rawContent = response.choices?.[0]?.message?.content || '{}';
        const cleanedContent = rawContent
          .replace(/```json\s*/g, '')
          .replace(/```\s*$/g, '')
          .trim();

        const result = JSON.parse(cleanedContent);
        console.log(`✅ Mistral AI refined ${field} content from web search results`);
        return result;
      }

      // Generate AI content for missing fields
      const contentPrompts: Record<string, string> = {
        'faq': `Generate realistic FAQ content for ${repoName}, a ${language} ${repoDescription}. Include common questions about installation, usage, troubleshooting, and best practices.`,
        'tutorials': `Generate tutorial content for ${repoName}, a ${language} ${repoDescription}. Include getting started guides, common use cases, and step-by-step examples.`,
        'troubleshooting': `Generate troubleshooting content for ${repoName}, a ${language} ${repoDescription}. Include common issues, error messages, and solutions.`,
        'performance': `Generate performance content for ${repoName}, a ${language} ${repoDescription}. Include optimization tips, benchmarks, and best practices.`,
        'security': `Generate security content for ${repoName}, a ${language} ${repoDescription}. Include security considerations, best practices, and vulnerability prevention.`,
        'testing': `Generate testing content for ${repoName}, a ${language} ${repoDescription}. Include testing strategies, unit tests, and quality assurance.`,
        'changelog': `Generate changelog content for ${repoName}, a ${language} ${repoDescription}. Include recent updates, version history, and release notes.`,
        'contributing': `Generate contributing guidelines for ${repoName}, a ${language} ${repoDescription}. Include how to contribute, code standards, and development setup.`
      };

      const prompt = contentPrompts[field] || `Generate ${field.replace('_', ' ')} content for ${repoName}.`;

      const fullPrompt = `${prompt}

Create realistic, helpful content. Return ONLY valid JSON:
{
  "summary": "brief overview (1-2 sentences)",
  "details": "detailed, helpful content with specific information"
}`;

      const response = await this.rateLimitedRequest(() =>
        this.mistral.chat.complete({
          messages: [{ role: 'user', content: fullPrompt }],
          model: this.model,
          temperature: 0.4,
          maxTokens: 1500
        })
      );

      const rawContent = response.choices?.[0]?.message?.content || '{}';
      const cleanedContent = rawContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .trim();

      const result = JSON.parse(cleanedContent);
      return result;

    } catch (error) {
      console.warn(`⚠️ Mistral AI failed for ${field}:`, error);

      // Fallback to enhanced placeholder content
      const enhancedPlaceholders: Record<string, any> = {
        'faq': {
          summary: 'Common questions and answers about this project',
          details: `## Frequently Asked Questions

### Installation Issues
**Q: How do I install ${completeData.repositoryMetadata.name}?**
A: Use the package manager for your platform. Check the installation section for detailed instructions.

### Usage Questions
**Q: How do I get started?**
A: Check the examples section for basic usage patterns and common use cases.

### Troubleshooting
**Q: I'm getting errors, what should I do?**
A: Check the troubleshooting section and repository issues for common solutions.`
        },
        'tutorials': {
          summary: 'Step-by-step guides and learning resources',
          details: `## Tutorials & Guides

### Getting Started
1. Install the package using your preferred package manager
2. Import the library in your project
3. Follow the basic usage examples
4. Explore advanced features

### Common Use Cases
- Basic implementation patterns
- Integration with other tools
- Best practices and conventions

### Learning Resources
- Check the documentation for detailed guides
- Review example projects and demos
- Join the community for support`
        },
        'troubleshooting': {
          summary: 'Common issues and their solutions',
          details: `## Troubleshooting Guide

### Common Issues
- Installation problems
- Configuration errors
- Runtime exceptions
- Performance issues

### Getting Help
1. Check this troubleshooting guide
2. Search existing issues on GitHub
3. Review the documentation
4. Ask the community for help

### Reporting Bugs
If you find a bug, please report it with:
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Minimal code example`
        }
      };

      return enhancedPlaceholders[field] || {
        summary: `${field.replace('_', ' ')} information`,
        details: `Detailed ${field.replace('_', ' ')} content will be available soon.`
      };
    }
  }
}
