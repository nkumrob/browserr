// Budget-Friendly Semantic Search Implementation
// Zero AI costs - Pure JavaScript/TypeScript solution

export interface McpServer {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: string;
  language: string;
  stars: number;
  installCommand: string;
  githubUrl: string;
  author: {
    name: string;
    avatar?: string;
    githubUsername?: string;
  };
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
  preserved_content?: {
    full_description: string;
    features: string;
    installation_instructions: string;
    usage_examples: string;
    api_documentation: string;
    contributing: string;
    license: string;
    changelog: string;
    troubleshooting: string;
  };
}

export interface SearchResult extends McpServer {
  relevanceScore: number;
  matchReasons: string[];
}

// Smart keyword patterns for semantic understanding (FREE)
const SEMANTIC_PATTERNS = {
  'data-extraction': {
    keywords: ['scrape', 'extract', 'parse', 'crawl', 'harvest', 'collect'],
    synonyms: ['scraper', 'parser', 'extractor', 'crawler']
  },
  'browser-automation': {
    keywords: ['browser', 'automate', 'selenium', 'puppeteer', 'playwright'],
    synonyms: ['automation', 'control', 'navigate', 'click']
  },
  'api-integration': {
    keywords: ['api', 'rest', 'graphql', 'webhook', 'endpoint'],
    synonyms: ['service', 'integration', 'wrapper', 'client']
  },
  'file-processing': {
    keywords: ['pdf', 'csv', 'json', 'xml', 'file', 'document'],
    synonyms: ['parser', 'reader', 'processor', 'converter']
  },
  'web-interaction': {
    keywords: ['form', 'submit', 'click', 'input', 'interact'],
    synonyms: ['interaction', 'manipulation', 'control']
  }
};

// Query expansion for better matching (FREE)
export function expandQuery(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const expandedTerms = new Set(words);
  
  // Add synonyms and related terms
  for (const [category, patterns] of Object.entries(SEMANTIC_PATTERNS)) {
    for (const keyword of patterns.keywords) {
      if (words.some(word => word.includes(keyword) || keyword.includes(word))) {
        patterns.synonyms.forEach(synonym => expandedTerms.add(synonym));
        expandedTerms.add(category.replace('-', ' '));
      }
    }
  }
  
  return Array.from(expandedTerms);
}

// Extract semantic categories from text (FREE)
export function extractSemanticCategories(text: string): string[] {
  const categories = [];
  const lowerText = text.toLowerCase();
  
  for (const [category, patterns] of Object.entries(SEMANTIC_PATTERNS)) {
    const hasKeyword = patterns.keywords.some(keyword => 
      lowerText.includes(keyword)
    );
    const hasSynonym = patterns.synonyms.some(synonym => 
      lowerText.includes(synonym)
    );
    
    if (hasKeyword || hasSynonym) {
      categories.push(category);
    }
  }
  
  return categories;
}

// Calculate relevance score without AI (FREE)
export function calculateRelevanceScore(
  server: McpServer, 
  query: string, 
  expandedTerms: string[]
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;
  
  const searchText = [
    server.name,
    server.description,
    ...server.tags,
    server.category
  ].join(' ').toLowerCase();
  
  // Exact name match (highest weight)
  if (server.name.toLowerCase().includes(query.toLowerCase())) {
    score += 0.4;
    reasons.push('Exact name match');
  }
  
  // Tag matches
  const queryWords = query.toLowerCase().split(/\s+/);
  const tagMatches = server.tags.filter(tag => 
    queryWords.some(word => tag.toLowerCase().includes(word))
  );
  if (tagMatches.length > 0) {
    score += 0.3 * (tagMatches.length / server.tags.length);
    reasons.push(`Tag matches: ${tagMatches.join(', ')}`);
  }
  
  // Semantic category matches
  const serverCategories = extractSemanticCategories(searchText);
  const queryCategories = extractSemanticCategories(query);
  const categoryOverlap = serverCategories.filter(cat => 
    queryCategories.includes(cat)
  );
  if (categoryOverlap.length > 0) {
    score += 0.2 * categoryOverlap.length;
    reasons.push(`Semantic match: ${categoryOverlap.join(', ')}`);
  }
  
  // Expanded term matches
  const expandedMatches = expandedTerms.filter(term => 
    searchText.includes(term.toLowerCase())
  );
  if (expandedMatches.length > 0) {
    score += 0.1 * (expandedMatches.length / expandedTerms.length);
    reasons.push(`Related terms: ${expandedMatches.slice(0, 3).join(', ')}`);
  }
  
  // Popularity boost (GitHub stars)
  const popularityBoost = Math.min(server.stars / 1000, 0.1);
  score += popularityBoost;
  if (popularityBoost > 0.05) {
    reasons.push(`Popular (${server.stars} stars)`);
  }
  
  return { score, reasons };
}

// Main search function (FREE - no API calls)
export function budgetSemanticSearch(
  servers: McpServer[],
  query: string,
  filters?: {
    category?: string;
    language?: string;
    minStars?: number;
  }
): SearchResult[] {
  if (!query.trim()) return [];
  
  // Expand query terms for better matching
  const expandedTerms = expandQuery(query);
  
  // Filter servers based on criteria
  let filteredServers = servers;
  if (filters?.category) {
    filteredServers = filteredServers.filter(s => s.category === filters.category);
  }
  if (filters?.language) {
    filteredServers = filteredServers.filter(s => s.language === filters.language);
  }
  if (filters?.minStars) {
    filteredServers = filteredServers.filter(s => s.stars >= filters.minStars);
  }
  
  // Calculate relevance scores
  const results: SearchResult[] = filteredServers
    .map(server => {
      const { score, reasons } = calculateRelevanceScore(server, query, expandedTerms);
      return {
        ...server,
        relevanceScore: score,
        matchReasons: reasons
      };
    })
    .filter(result => result.relevanceScore > 0.1) // Minimum relevance threshold
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return results;
}

// Smart search suggestions (FREE)
export function generateSearchSuggestions(query: string): string[] {
  const suggestions = [];
  
  // Extract intent from partial query
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('scrap')) {
    suggestions.push(
      'scraper for Google Maps data',
      'web scraping tool with JSON output',
      'scraper that handles JavaScript'
    );
  }
  
  if (lowerQuery.includes('browser') || lowerQuery.includes('automat')) {
    suggestions.push(
      'browser automation for testing',
      'automated form filling tool',
      'browser control with screenshots'
    );
  }
  
  if (lowerQuery.includes('api')) {
    suggestions.push(
      'API wrapper for social media',
      'REST API testing tool',
      'API documentation generator'
    );
  }
  
  if (lowerQuery.includes('pdf') || lowerQuery.includes('file')) {
    suggestions.push(
      'PDF parser with text extraction',
      'file converter for multiple formats',
      'document processing pipeline'
    );
  }
  
  return suggestions.slice(0, 5);
}

// Example usage:
export const EXAMPLE_QUERIES = [
  "scraper for Google Maps data that outputs structured JSON",
  "browser automation tool for testing web applications", 
  "PDF parser that extracts text and metadata",
  "API wrapper for social media platforms",
  "file converter that handles multiple formats",
  "web scraping tool that handles JavaScript rendering"
];
