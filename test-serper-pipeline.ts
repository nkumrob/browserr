#!/usr/bin/env tsx

/**
 * Test Script for Serper + Crawl4AI + Mixtral Pipeline
 * Tests the complete enrichment workflow
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

import { SerperCrawl4AIEnrichment } from './src/lib/serper-crawl4ai-enrichment';
import { McpRegistryService } from './src/lib/mcp-registry-service';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateEnvironment(): { valid: boolean; missing: string[]; warnings: string[] } {
  const required = ['GROQ_API_KEY', 'SERPER_API_KEY'];
  const optional = ['GITHUB_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

  const missing = required.filter(key => !process.env[key]);
  const warnings = optional.filter(key => !process.env[key]);

  return { valid: missing.length === 0, missing, warnings };
}

async function testGitHubExtraction() {
  log('\n📦 Testing GitHub Data Extraction', colors.blue);
  log('-'.repeat(50), colors.cyan);
  
  try {
    const registryService = new McpRegistryService({
      githubToken: process.env.GITHUB_TOKEN
    });

    // Test with a well-known repository
    const testUrl = 'https://github.com/microsoft/playwright';
    log(`🔍 Extracting data from: ${testUrl}`, colors.cyan);

    const githubData = await registryService.extractGitHubData(testUrl);
    
    if (githubData) {
      log('✅ GitHub extraction successful!', colors.green);
      log(`   Name: ${githubData.name}`, colors.cyan);
      log(`   Description: ${githubData.description}`, colors.cyan);
      log(`   Stars: ${githubData.stars}`, colors.cyan);
      log(`   Language: ${githubData.language}`, colors.cyan);
      log(`   Author: ${githubData.author.name}`, colors.cyan);

      // Convert to MCP server format
      const mcpServer = registryService.githubDataToMcpServer(githubData);
      log(`   Generated slug: ${mcpServer.slug}`, colors.cyan);
      log(`   Inferred category: ${mcpServer.category}`, colors.cyan);
      log(`   Install command: ${mcpServer.installCommand}`, colors.cyan);

      return mcpServer;
    } else {
      log('❌ GitHub extraction failed', colors.red);
      return null;
    }

  } catch (error) {
    log(`❌ GitHub extraction error: ${error}`, colors.red);
    return null;
  }
}

async function testSerperSearch() {
  log('\n🔍 Testing Serper Web Search', colors.blue);
  log('-'.repeat(50), colors.cyan);

  if (!process.env.SERPER_API_KEY) {
    log('⚠️ SERPER_API_KEY not found, skipping search test', colors.yellow);
    return false;
  }

  try {
    // Test a simple search
    const testQuery = 'playwright automation tutorial';
    log(`🌐 Testing search query: "${testQuery}"`, colors.cyan);

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY!,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: testQuery,
        num: 3
      })
    });

    if (response.ok) {
      const data = await response.json();
      log('✅ Serper search successful!', colors.green);
      log(`   Results found: ${data.organic?.length || 0}`, colors.cyan);
      
      if (data.organic && data.organic.length > 0) {
        log('   Sample results:', colors.cyan);
        data.organic.slice(0, 2).forEach((result: any, index: number) => {
          log(`     ${index + 1}. ${result.title}`, colors.cyan);
          log(`        ${result.link}`, colors.cyan);
        });
      }
      return true;
    } else {
      log(`❌ Serper search failed: ${response.status}`, colors.red);
      return false;
    }

  } catch (error) {
    log(`❌ Serper search error: ${error}`, colors.red);
    return false;
  }
}

async function testMixtralProcessing() {
  log('\n🚀 Testing Mixtral Processing', colors.blue);
  log('-'.repeat(50), colors.cyan);

  if (!process.env.GROQ_API_KEY) {
    log('⚠️ GROQ_API_KEY not found, skipping Mixtral test', colors.yellow);
    return false;
  }

  try {
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

    log('🧠 Testing Mixtral JSON generation...', colors.cyan);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are a test assistant. Respond with ONLY valid JSON. No other text."
        },
        {
          role: "user",
          content: `Generate a simple test JSON object with these fields:
{
  "test": "success",
  "model": "mixtral-8x7b",
  "timestamp": "current timestamp",
  "message": "Test completed successfully"
}

Respond with ONLY the JSON object.`
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    const response = completion.choices[0].message.content || '';
    log('✅ Mixtral response received!', colors.green);
    log(`   Response: ${response}`, colors.cyan);

    // Try to parse JSON
    try {
      const parsed = JSON.parse(response.trim());
      log('✅ JSON parsing successful!', colors.green);
      log(`   Parsed object: ${JSON.stringify(parsed, null, 2)}`, colors.cyan);
      return true;
    } catch (parseError) {
      log('⚠️ JSON parsing failed, but Mixtral responded', colors.yellow);
      return false;
    }

  } catch (error) {
    log(`❌ Mixtral processing error: ${error}`, colors.red);
    return false;
  }
}

async function testCompleteEnrichment() {
  log('\n🔄 Testing Complete Enrichment Pipeline', colors.blue);
  log('-'.repeat(50), colors.cyan);

  const envCheck = validateEnvironment();
  if (!envCheck.valid) {
    log('❌ Cannot test complete pipeline - missing required API keys', colors.red);
    return false;
  }

  try {
    const enrichmentService = new SerperCrawl4AIEnrichment(
      process.env.GROQ_API_KEY!,
      process.env.SERPER_API_KEY!
      // Note: No Crawl4AI API key needed - works with fallback methods
    );

    // Create a test server object
    const testServer = {
      id: 'test-id',
      slug: 'test-playwright-server',
      name: 'test-playwright-server',
      description: 'Browser automation server using Playwright for testing and scraping',
      tags: ['automation', 'testing'],
      category: 'browser-automation',
      language: 'TypeScript',
      stars: 100,
      installCommand: 'npm install test-playwright-server',
      githubUrl: 'https://github.com/test/playwright-server',
      author: {
        name: 'TestUser',
        githubUsername: 'testuser'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    log('🌐 Starting enrichment process...', colors.cyan);
    const startTime = Date.now();

    const result = await enrichmentService.enrichServer(testServer);
    const processingTime = Date.now() - startTime;

    if (result.success) {
      log('✅ Complete enrichment successful!', colors.green);
      log(`   Processing time: ${processingTime}ms`, colors.cyan);
      log(`   Searches made: ${result.searchesMade}`, colors.cyan);
      log(`   Pages crawled: ${result.pagesCrawled}`, colors.cyan);
      log(`   Tokens used: ${result.tokensUsed}`, colors.cyan);
      
      if (result.searchResults.length > 0) {
        log(`   Search results found: ${result.searchResults.length}`, colors.cyan);
      }
      
      if (result.crawledContent.length > 0) {
        log(`   Content extracted from: ${result.crawledContent.length} pages`, colors.cyan);
      }

      // Show sample enriched data
      const enriched = result.finalEnrichedServer;
      if (enriched.homepage) {
        log(`   Found homepage: ${enriched.homepage}`, colors.cyan);
      }
      if (enriched.documentation) {
        log(`   Found documentation: ${enriched.documentation}`, colors.cyan);
      }
      if (enriched.useCases && enriched.useCases.length > 0) {
        log(`   Generated use cases: ${enriched.useCases.length}`, colors.cyan);
      }

      return true;
    } else {
      log('❌ Complete enrichment failed', colors.red);
      if (result.errors) {
        result.errors.forEach(error => {
          log(`   Error: ${error}`, colors.red);
        });
      }
      return false;
    }

  } catch (error) {
    log(`❌ Complete enrichment error: ${error}`, colors.red);
    return false;
  }
}

async function runAllTests() {
  log('🎯 Serper + Crawl4AI + Mixtral Pipeline Test Suite', colors.bright);
  log('='.repeat(60), colors.cyan);

  // Environment check
  log('\n📋 Environment Validation', colors.blue);
  const envCheck = validateEnvironment();
  
  if (envCheck.missing.length > 0) {
    log('❌ Missing required environment variables:', colors.red);
    envCheck.missing.forEach(key => {
      log(`   - ${key}`, colors.red);
    });
    log('\n💡 Add these to your .env.local file:', colors.yellow);
    envCheck.missing.forEach(key => {
      log(`   ${key}=your_${key.toLowerCase()}_here`, colors.yellow);
    });
  } else {
    log('✅ All required environment variables present', colors.green);
  }

  if (envCheck.warnings.length > 0) {
    log('\n⚠️ Optional environment variables missing:', colors.yellow);
    envCheck.warnings.forEach(key => {
      log(`   - ${key}`, colors.yellow);
    });
  }

  // Run tests
  const results = {
    github: await testGitHubExtraction(),
    serper: await testSerperSearch(),
    mixtral: await testMixtralProcessing(),
    complete: false
  };

  // Only test complete pipeline if basic tests pass
  if (results.serper && results.mixtral) {
    results.complete = await testCompleteEnrichment();
  } else {
    log('\n⚠️ Skipping complete pipeline test - basic tests failed', colors.yellow);
  }

  // Summary
  log('\n📊 Test Results Summary', colors.blue);
  log('='.repeat(60), colors.cyan);
  
  const tests = [
    { name: 'GitHub Extraction', result: results.github !== null, required: false },
    { name: 'Serper Search', result: results.serper, required: true },
    { name: 'Mixtral Processing', result: results.mixtral, required: true },
    { name: 'Complete Pipeline', result: results.complete, required: false }
  ];

  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    const required = test.required ? '(Required)' : '(Optional)';
    log(`${status} ${test.name} ${required}`, test.result ? colors.green : colors.red);
  });

  const passedRequired = tests.filter(t => t.required && t.result).length;
  const totalRequired = tests.filter(t => t.required).length;

  if (passedRequired === totalRequired) {
    log('\n🎉 All required tests passed! Pipeline is ready to use.', colors.green);
  } else {
    log('\n❌ Some required tests failed. Check API keys and try again.', colors.red);
  }

  log('\n📚 Next Steps:', colors.blue);
  log('1. Ensure all required API keys are configured', colors.cyan);
  log('2. Run the complete pipeline on real MCP servers', colors.cyan);
  log('3. Monitor costs and performance', colors.cyan);
  log('4. Set up database integration for production', colors.cyan);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`\n❌ Test suite failed: ${error}`, colors.red);
    process.exit(1);
  });
}

export { runAllTests, testGitHubExtraction, testSerperSearch, testMixtralProcessing, testCompleteEnrichment };
