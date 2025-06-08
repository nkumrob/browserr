// Mock MCP Server Data for Testing Budget Semantic Search

import { McpServer } from '@/lib/semantic-search';

export const MOCK_MCP_SERVERS: McpServer[] = [
  {
    id: '1',
    name: 'brave-search',
    description: 'Search the web using Brave Search API. Get comprehensive search results with snippets, web pages, and related queries.',
    tags: ['search', 'web', 'api', 'brave'],
    category: 'search',
    language: 'TypeScript',
    stars: 245,
    installCommand: 'npx @modelcontextprotocol/server-brave-search',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    author: {
      name: 'ModelContext Team',
      githubUsername: 'modelcontextprotocol'
    }
  },
  {
    id: '2',
    name: 'puppeteer',
    description: 'Browser automation server using Puppeteer. Control Chrome/Chromium browsers, take screenshots, generate PDFs, and scrape dynamic content.',
    tags: ['browser', 'automation', 'puppeteer', 'scraping', 'screenshots'],
    category: 'browser-automation',
    language: 'TypeScript',
    stars: 1250,
    installCommand: 'npx @modelcontextprotocol/server-puppeteer',
    githubUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer'
  },
  {
    id: '3',
    name: 'google-maps-scraper',
    description: 'Extract business data from Google Maps including names, addresses, phone numbers, reviews, and ratings. Outputs structured JSON data.',
    tags: ['scraper', 'google-maps', 'business-data', 'json', 'extraction'],
    category: 'data-extraction',
    language: 'Python',
    stars: 892,
    installCommand: 'pip install mcp-google-maps-scraper',
    githubUrl: 'https://github.com/example/google-maps-scraper'
  },
  {
    id: '4',
    name: 'pdf-parser',
    description: 'Parse PDF documents and extract text, metadata, images, and tables. Supports password-protected PDFs and batch processing.',
    tags: ['pdf', 'parser', 'text-extraction', 'metadata', 'documents'],
    category: 'file-processing',
    language: 'Python',
    stars: 567,
    installCommand: 'pip install mcp-pdf-parser',
    githubUrl: 'https://github.com/example/pdf-parser'
  },
  {
    id: '5',
    name: 'slack-api-wrapper',
    description: 'Complete Slack API integration for sending messages, managing channels, uploading files, and retrieving conversation history.',
    tags: ['slack', 'api', 'messaging', 'integration', 'wrapper'],
    category: 'api-integration',
    language: 'JavaScript',
    stars: 423,
    installCommand: 'npm install @mcp/slack-wrapper',
    githubUrl: 'https://github.com/example/slack-api-wrapper'
  },
  {
    id: '6',
    name: 'selenium-grid',
    description: 'Distributed browser testing using Selenium Grid. Run tests across multiple browsers and operating systems simultaneously.',
    tags: ['selenium', 'testing', 'browser', 'automation', 'grid'],
    category: 'browser-automation',
    language: 'Java',
    stars: 1567,
    installCommand: 'docker run selenium/grid',
    githubUrl: 'https://github.com/SeleniumHQ/selenium'
  },
  {
    id: '7',
    name: 'csv-processor',
    description: 'Process large CSV files with filtering, transformation, and aggregation capabilities. Handles millions of rows efficiently.',
    tags: ['csv', 'data-processing', 'transformation', 'filtering', 'big-data'],
    category: 'file-processing',
    language: 'Python',
    stars: 234,
    installCommand: 'pip install mcp-csv-processor',
    githubUrl: 'https://github.com/example/csv-processor'
  },
  {
    id: '8',
    name: 'twitter-scraper',
    description: 'Scrape Twitter/X posts, user profiles, and trending topics without API limits. Handles rate limiting and proxy rotation.',
    tags: ['twitter', 'scraper', 'social-media', 'posts', 'profiles'],
    category: 'data-extraction',
    language: 'Python',
    stars: 1834,
    installCommand: 'pip install mcp-twitter-scraper',
    githubUrl: 'https://github.com/example/twitter-scraper'
  },
  {
    id: '9',
    name: 'rest-api-tester',
    description: 'Test REST APIs with automated request generation, response validation, and performance monitoring. Supports OpenAPI specs.',
    tags: ['api', 'testing', 'rest', 'validation', 'monitoring'],
    category: 'api-integration',
    language: 'TypeScript',
    stars: 678,
    installCommand: 'npx @mcp/rest-api-tester',
    githubUrl: 'https://github.com/example/rest-api-tester'
  },
  {
    id: '10',
    name: 'json-transformer',
    description: 'Transform JSON data with custom rules, validation, and schema conversion. Supports complex nested transformations.',
    tags: ['json', 'transformation', 'validation', 'schema', 'data'],
    category: 'file-processing',
    language: 'JavaScript',
    stars: 345,
    installCommand: 'npm install @mcp/json-transformer',
    githubUrl: 'https://github.com/example/json-transformer'
  },
  {
    id: '11',
    name: 'playwright-automation',
    description: 'Modern browser automation with Playwright. Cross-browser testing, mobile emulation, and network interception.',
    tags: ['playwright', 'automation', 'testing', 'cross-browser', 'mobile'],
    category: 'browser-automation',
    language: 'TypeScript',
    stars: 2156,
    installCommand: 'npx @mcp/playwright-automation',
    githubUrl: 'https://github.com/example/playwright-automation'
  },
  {
    id: '12',
    name: 'email-parser',
    description: 'Parse email messages and extract attachments, headers, and content. Supports multiple email formats and encodings.',
    tags: ['email', 'parser', 'attachments', 'headers', 'mime'],
    category: 'file-processing',
    language: 'Python',
    stars: 456,
    installCommand: 'pip install mcp-email-parser',
    githubUrl: 'https://github.com/example/email-parser'
  },
  {
    id: '13',
    name: 'github-api-client',
    description: 'Complete GitHub API client with repository management, issue tracking, and pull request automation.',
    tags: ['github', 'api', 'repositories', 'issues', 'automation'],
    category: 'api-integration',
    language: 'TypeScript',
    stars: 789,
    installCommand: 'npm install @mcp/github-client',
    githubUrl: 'https://github.com/example/github-api-client'
  },
  {
    id: '14',
    name: 'web-form-filler',
    description: 'Automatically fill web forms with predefined data. Handles complex forms, CAPTCHAs, and multi-step processes.',
    tags: ['forms', 'automation', 'filling', 'web', 'interaction'],
    category: 'web-interaction',
    language: 'JavaScript',
    stars: 623,
    installCommand: 'npm install @mcp/form-filler',
    githubUrl: 'https://github.com/example/web-form-filler'
  },
  {
    id: '15',
    name: 'database-connector',
    description: 'Universal database connector supporting MySQL, PostgreSQL, MongoDB, and Redis. Query execution and data migration tools.',
    tags: ['database', 'connector', 'mysql', 'postgresql', 'mongodb'],
    category: 'data-integration',
    language: 'Python',
    stars: 1123,
    installCommand: 'pip install mcp-database-connector',
    githubUrl: 'https://github.com/example/database-connector'
  }
];

// Featured server categories for homepage
export const FEATURED_CATEGORIES = [
  {
    title: 'Most Starred',
    servers: MOCK_MCP_SERVERS.sort((a, b) => b.stars - a.stars).slice(0, 6)
  },
  {
    title: 'Browser Automation',
    servers: MOCK_MCP_SERVERS.filter(s => s.category === 'browser-automation')
  },
  {
    title: 'Data Extraction',
    servers: MOCK_MCP_SERVERS.filter(s => s.category === 'data-extraction')
  },
  {
    title: 'API Integration',
    servers: MOCK_MCP_SERVERS.filter(s => s.category === 'api-integration')
  }
];

// Search examples for testing
export const SEARCH_EXAMPLES = [
  {
    query: "scraper for Google Maps data that outputs structured JSON",
    expectedResults: ['google-maps-scraper', 'twitter-scraper']
  },
  {
    query: "browser automation tool for testing web applications",
    expectedResults: ['puppeteer', 'selenium-grid', 'playwright-automation']
  },
  {
    query: "PDF parser that extracts text and metadata",
    expectedResults: ['pdf-parser', 'email-parser']
  },
  {
    query: "API wrapper for social media platforms",
    expectedResults: ['slack-api-wrapper', 'twitter-scraper', 'github-api-client']
  }
];
