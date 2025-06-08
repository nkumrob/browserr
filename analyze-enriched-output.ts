#!/usr/bin/env tsx

/**
 * Analyze Enriched Output Schema
 * Shows what fields are populated vs missing in the enriched MCP server data
 */

// Load environment variables from .env.local
import { readFileSync } from 'fs';
import { join } from 'path';

try {
  const envPath = join(__dirname, '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
  
  console.log('✅ Environment variables loaded from .env.local');
} catch (error) {
  console.log('⚠️ Could not load .env.local file');
}

import { ScrapingDogCrawl4AIEnrichment } from './src/lib/scrapingdog-crawl4ai-enrichment';
import { McpRegistryService } from './src/lib/mcp-registry-service';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Define the complete expected schema
interface CompleteEnrichedServer {
  // Core fields (from original McpServer)
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
  
  // Enriched fields (added by pipeline)
  homepage?: string;
  documentation?: string;
  npmPackage?: string;
  useCases?: Array<{
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    codeExample?: string;
  }>;
  installation?: {
    command: string;
    requirements: string[];
    troubleshooting?: string[];
  };
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  externalResources?: Array<{
    title: string;
    url: string;
    type: 'video' | 'blog' | 'tutorial' | 'documentation' | 'discussion';
    source: string;
    description?: string;
  }>;
  relatedTools?: string[];
  
  // Potential additional fields for complete schema
  created_at?: string;
  updated_at?: string;
  slug?: string;
  license?: string;
  contributors?: number;
  lastCommit?: string;
  issues?: number;
  pullRequests?: number;
  forks?: number;
  topics?: string[];
  readme?: string;
  changelog?: string;
  examples?: Array<{
    title: string;
    description: string;
    code: string;
    language: string;
  }>;
  dependencies?: string[];
  devDependencies?: string[];
  compatibility?: {
    nodeVersion?: string;
    pythonVersion?: string;
    platforms?: string[];
  };
  performance?: {
    benchmarks?: Array<{
      name: string;
      value: number;
      unit: string;
    }>;
    memoryUsage?: string;
    cpuUsage?: string;
  };
  security?: {
    vulnerabilities?: number;
    lastSecurityAudit?: string;
    securityScore?: number;
  };
}

function analyzeFieldCoverage(enrichedServer: any): void {
  log('\n📊 Field Coverage Analysis', colors.bright);
  log('='.repeat(80), colors.cyan);

  const coreFields = [
    'id', 'name', 'description', 'tags', 'category', 'language', 
    'stars', 'installCommand', 'githubUrl', 'author'
  ];

  const enrichedFields = [
    'homepage', 'documentation', 'npmPackage', 'useCases', 'installation',
    'faqs', 'externalResources', 'relatedTools'
  ];

  const additionalFields = [
    'created_at', 'updated_at', 'slug', 'license', 'contributors',
    'lastCommit', 'issues', 'pullRequests', 'forks', 'topics',
    'readme', 'changelog', 'examples', 'dependencies', 'devDependencies',
    'compatibility', 'performance', 'security'
  ];

  log('\n✅ Core Fields (Required):', colors.green);
  coreFields.forEach(field => {
    const hasField = enrichedServer.hasOwnProperty(field);
    const value = enrichedServer[field];
    const status = hasField ? '✅' : '❌';
    const preview = hasField ? (typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value).substring(0, 50)) : 'Missing';
    log(`   ${status} ${field}: ${preview}`, hasField ? colors.green : colors.red);
  });

  log('\n🔍 Enriched Fields (Added by Pipeline):', colors.blue);
  enrichedFields.forEach(field => {
    const hasField = enrichedServer.hasOwnProperty(field) && enrichedServer[field] !== null && enrichedServer[field] !== undefined;
    const value = enrichedServer[field];
    const status = hasField ? '✅' : '❌';
    
    let preview = 'Missing';
    if (hasField) {
      if (Array.isArray(value)) {
        preview = `Array(${value.length}) - ${value.length > 0 ? JSON.stringify(value[0]).substring(0, 40) + '...' : 'Empty'}`;
      } else if (typeof value === 'object') {
        preview = JSON.stringify(value).substring(0, 50) + '...';
      } else {
        preview = String(value).substring(0, 50);
      }
    }
    
    log(`   ${status} ${field}: ${preview}`, hasField ? colors.green : colors.yellow);
  });

  log('\n⚠️ Additional Fields (Not Currently Populated):', colors.yellow);
  additionalFields.forEach(field => {
    const hasField = enrichedServer.hasOwnProperty(field) && enrichedServer[field] !== null && enrichedServer[field] !== undefined;
    const status = hasField ? '✅' : '❌';
    log(`   ${status} ${field}`, hasField ? colors.green : colors.yellow);
  });

  // Calculate coverage percentages
  const corePresent = coreFields.filter(field => enrichedServer.hasOwnProperty(field)).length;
  const enrichedPresent = enrichedFields.filter(field => 
    enrichedServer.hasOwnProperty(field) && enrichedServer[field] !== null && enrichedServer[field] !== undefined
  ).length;
  const additionalPresent = additionalFields.filter(field => 
    enrichedServer.hasOwnProperty(field) && enrichedServer[field] !== null && enrichedServer[field] !== undefined
  ).length;

  log('\n📈 Coverage Statistics:', colors.bright);
  log(`   Core Fields: ${corePresent}/${coreFields.length} (${((corePresent/coreFields.length)*100).toFixed(1)}%)`, colors.green);
  log(`   Enriched Fields: ${enrichedPresent}/${enrichedFields.length} (${((enrichedPresent/enrichedFields.length)*100).toFixed(1)}%)`, colors.blue);
  log(`   Additional Fields: ${additionalPresent}/${additionalFields.length} (${((additionalPresent/additionalFields.length)*100).toFixed(1)}%)`, colors.yellow);
  
  const totalFields = coreFields.length + enrichedFields.length + additionalFields.length;
  const totalPresent = corePresent + enrichedPresent + additionalPresent;
  log(`   Overall Coverage: ${totalPresent}/${totalFields} (${((totalPresent/totalFields)*100).toFixed(1)}%)`, colors.cyan);
}

function displayDetailedOutput(enrichedServer: any): void {
  log('\n📋 Detailed Enriched Output', colors.bright);
  log('='.repeat(80), colors.cyan);

  // Core Information
  log('\n🏷️ Core Information:', colors.blue);
  log(`   Name: ${enrichedServer.name}`, colors.cyan);
  log(`   Description: ${enrichedServer.description}`, colors.cyan);
  log(`   Category: ${enrichedServer.category}`, colors.cyan);
  log(`   Language: ${enrichedServer.language}`, colors.cyan);
  log(`   Stars: ${enrichedServer.stars?.toLocaleString() || 'N/A'}`, colors.cyan);
  log(`   GitHub: ${enrichedServer.githubUrl}`, colors.cyan);

  // Enriched URLs
  log('\n🔗 Discovered URLs:', colors.blue);
  if (enrichedServer.homepage) {
    log(`   🏠 Homepage: ${enrichedServer.homepage}`, colors.green);
  }
  if (enrichedServer.documentation) {
    log(`   📚 Documentation: ${enrichedServer.documentation}`, colors.green);
  }
  if (enrichedServer.npmPackage) {
    log(`   📦 NPM Package: ${enrichedServer.npmPackage}`, colors.green);
  }

  // Use Cases
  if (enrichedServer.useCases && enrichedServer.useCases.length > 0) {
    log('\n🎯 Use Cases:', colors.blue);
    enrichedServer.useCases.forEach((useCase: any, index: number) => {
      log(`   ${index + 1}. ${useCase.title} (${useCase.difficulty})`, colors.green);
      log(`      ${useCase.description}`, colors.cyan);
      if (useCase.codeExample) {
        log(`      Code: ${useCase.codeExample.substring(0, 60)}...`, colors.magenta);
      }
    });
  }

  // Installation
  if (enrichedServer.installation) {
    log('\n⚙️ Installation:', colors.blue);
    if (enrichedServer.installation.command) {
      log(`   Command: ${enrichedServer.installation.command}`, colors.green);
    }
    if (enrichedServer.installation.requirements && enrichedServer.installation.requirements.length > 0) {
      log(`   Requirements: ${enrichedServer.installation.requirements.join(', ')}`, colors.cyan);
    }
    if (enrichedServer.installation.troubleshooting && enrichedServer.installation.troubleshooting.length > 0) {
      log(`   Troubleshooting: ${enrichedServer.installation.troubleshooting.length} tips`, colors.yellow);
    }
  }

  // FAQs
  if (enrichedServer.faqs && enrichedServer.faqs.length > 0) {
    log('\n❓ FAQs:', colors.blue);
    enrichedServer.faqs.forEach((faq: any, index: number) => {
      log(`   ${index + 1}. Q: ${faq.question}`, colors.yellow);
      log(`      A: ${faq.answer}`, colors.cyan);
    });
  }

  // External Resources
  if (enrichedServer.externalResources && enrichedServer.externalResources.length > 0) {
    log('\n🔗 External Resources:', colors.blue);
    enrichedServer.externalResources.forEach((resource: any, index: number) => {
      log(`   ${index + 1}. ${resource.title} (${resource.type})`, colors.green);
      log(`      URL: ${resource.url}`, colors.cyan);
      log(`      Source: ${resource.source}`, colors.cyan);
      if (resource.description) {
        log(`      Description: ${resource.description}`, colors.cyan);
      }
    });
  }

  // Tags and Related Tools
  if (enrichedServer.tags && enrichedServer.tags.length > 0) {
    log(`\n🏷️ Tags: ${enrichedServer.tags.join(', ')}`, colors.blue);
  }
  
  if (enrichedServer.relatedTools && enrichedServer.relatedTools.length > 0) {
    log(`\n🔧 Related Tools: ${enrichedServer.relatedTools.join(', ')}`, colors.blue);
  }
}

async function analyzeEnrichedOutput() {
  log('🔍 Enriched Output Schema Analysis', colors.bright);
  log('='.repeat(80), colors.cyan);

  // Validate environment
  const requiredEnvVars = ['GROQ_API_KEY', 'SCRAPINGDOG_API_KEY'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log('❌ Missing required environment variables:', colors.red);
    missing.forEach(key => {
      log(`   - ${key}`, colors.red);
    });
    return;
  }

  try {
    // Create test server
    const testServer = {
      id: 'test-analysis',
      slug: 'playwright-mcp-server',
      name: 'playwright-mcp-server',
      description: 'Browser automation server using Playwright for web testing and scraping',
      tags: ['automation', 'testing', 'browser'],
      category: 'browser-automation',
      language: 'TypeScript',
      stars: 1500,
      installCommand: 'npm install playwright-mcp-server',
      githubUrl: 'https://github.com/test/playwright-mcp-server',
      author: {
        name: 'TestUser',
        githubUsername: 'testuser'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    log('🌐 Running enrichment to analyze output...', colors.cyan);
    
    const enrichmentService = new ScrapingDogCrawl4AIEnrichment(
      process.env.GROQ_API_KEY!,
      process.env.SCRAPINGDOG_API_KEY!
    );

    const result = await enrichmentService.enrichServer(testServer);

    if (result.success) {
      const enrichedServer = result.finalEnrichedServer;
      
      // Show the raw JSON structure
      log('\n📄 Raw JSON Output:', colors.blue);
      log(JSON.stringify(enrichedServer, null, 2), colors.cyan);
      
      // Analyze field coverage
      analyzeFieldCoverage(enrichedServer);
      
      // Display detailed output
      displayDetailedOutput(enrichedServer);
      
      // Recommendations for missing fields
      log('\n💡 Recommendations for Complete Schema:', colors.bright);
      log('1. Add database timestamps (created_at, updated_at)', colors.yellow);
      log('2. Include GitHub metadata (contributors, issues, forks)', colors.yellow);
      log('3. Add license and compatibility information', colors.yellow);
      log('4. Include performance and security metrics', colors.yellow);
      log('5. Add code examples and dependencies', colors.yellow);
      log('6. Include README and changelog content', colors.yellow);

    } else {
      log('❌ Enrichment failed', colors.red);
      if (result.errors) {
        result.errors.forEach(error => {
          log(`   Error: ${error}`, colors.red);
        });
      }
    }

  } catch (error) {
    log(`❌ Analysis failed: ${error}`, colors.red);
  }
}

// Run analysis if this file is executed directly
if (require.main === module) {
  analyzeEnrichedOutput().catch(error => {
    log(`\n❌ Analysis failed: ${error}`, colors.red);
    process.exit(1);
  });
}

export { analyzeEnrichedOutput };
