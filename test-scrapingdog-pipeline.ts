#!/usr/bin/env tsx

/**
 * Test Script for ScrapingDog + Crawl4AI + Mixtral Pipeline
 * Tests the complete enrichment workflow with ScrapingDog
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
  cyan: '\x1b[36m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateEnvironment(): { valid: boolean; missing: string[]; warnings: string[] } {
  const required = ['GROQ_API_KEY', 'SCRAPINGDOG_API_KEY'];
  const optional = ['GITHUB_TOKEN', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  
  const missing = required.filter(key => !process.env[key]);
  const warnings = optional.filter(key => !process.env[key]);
  
  return { valid: missing.length === 0, missing, warnings };
}

async function testScrapingDogSearch() {
  log('\n🔍 Testing ScrapingDog Google Search', colors.blue);
  log('-'.repeat(50), colors.cyan);

  if (!process.env.SCRAPINGDOG_API_KEY) {
    log('⚠️ SCRAPINGDOG_API_KEY not found, skipping search test', colors.yellow);
    return false;
  }

  try {
    // Test a simple search
    const testQuery = 'playwright automation tutorial';
    log(`🌐 Testing search query: "${testQuery}"`, colors.cyan);

    const response = await fetch(`https://api.scrapingdog.com/google/?api_key=${process.env.SCRAPINGDOG_API_KEY}&query=${encodeURIComponent(testQuery)}&results=3&country=us`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      log('✅ ScrapingDog search successful!', colors.green);
      log(`   Results found: ${data.organic_data?.length || 0}`, colors.cyan);
      log(`   Credits used: 5 (per Google search)`, colors.yellow);
      
      if (data.organic_data && data.organic_data.length > 0) {
        log('   Sample results:', colors.cyan);
        data.organic_data.slice(0, 2).forEach((result: any, index: number) => {
          log(`     ${index + 1}. ${result.title}`, colors.cyan);
          log(`        ${result.link}`, colors.cyan);
        });
      }
      return true;
    } else {
      log(`❌ ScrapingDog search failed: ${response.status}`, colors.red);
      const errorText = await response.text();
      log(`   Error: ${errorText}`, colors.red);
      return false;
    }

  } catch (error) {
    log(`❌ ScrapingDog search error: ${error}`, colors.red);
    return false;
  }
}

async function testCompleteScrapingDogEnrichment() {
  log('\n🔄 Testing Complete ScrapingDog Enrichment Pipeline', colors.blue);
  log('-'.repeat(50), colors.cyan);

  const envCheck = validateEnvironment();
  if (!envCheck.valid) {
    log('❌ Cannot test complete pipeline - missing required API keys', colors.red);
    return false;
  }

  try {
    const enrichmentService = new ScrapingDogCrawl4AIEnrichment(
      process.env.GROQ_API_KEY!,
      process.env.SCRAPINGDOG_API_KEY!
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
      log(`   Credits used: ${result.creditsUsed}`, colors.yellow);
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

      // Calculate cost
      const costEstimate = enrichmentService.estimateCost(1);
      log(`   Estimated cost: $${costEstimate.totalCost.toFixed(4)}`, colors.yellow);
      log(`     - ScrapingDog: $${costEstimate.scrapingdogCost.toFixed(4)} (${costEstimate.scrapingdogCredits} credits)`, colors.yellow);
      log(`     - Llama: $${costEstimate.llamaCost.toFixed(4)}`, colors.yellow);

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

async function compareCosts() {
  log('\n💰 Cost Comparison: ScrapingDog vs Serper', colors.blue);
  log('-'.repeat(50), colors.cyan);

  const enrichmentService = new ScrapingDogCrawl4AIEnrichment('dummy', 'dummy');
  
  // ScrapingDog costs
  const scrapingdogCosts = enrichmentService.estimateCost(1000);
  
  // Serper costs (for comparison)
  const serperSearches = 4;
  const serperCost = (serperSearches / 1000) * 5; // $5 per 1K searches
  const llamaCost = (1500 / 1000000) * 0.27; // $0.27 per 1M tokens
  const serperTotal = serperCost + llamaCost;

  log('📊 Cost per 1000 servers:', colors.cyan);
  log(`   ScrapingDog + Llama: $${scrapingdogCosts.totalCost.toFixed(2)}`, colors.green);
  log(`     - ScrapingDog: $${scrapingdogCosts.scrapingdogCost.toFixed(2)} (${scrapingdogCosts.scrapingdogCredits} credits)`, colors.cyan);
  log(`     - Llama: $${scrapingdogCosts.llamaCost.toFixed(2)}`, colors.cyan);
  
  log(`   Serper + Llama: $${(serperTotal * 1000).toFixed(2)}`, colors.yellow);
  log(`     - Serper: $${(serperCost * 1000).toFixed(2)} (4000 searches)`, colors.cyan);
  log(`     - Llama: $${(llamaCost * 1000).toFixed(2)}`, colors.cyan);

  const savings = ((serperTotal * 1000) - scrapingdogCosts.totalCost) / (serperTotal * 1000) * 100;
  log(`\n💡 ScrapingDog savings: ${savings.toFixed(1)}%`, colors.green);
  log(`   Cost per server: $${(scrapingdogCosts.totalCost / 1000).toFixed(4)} vs $${serperTotal.toFixed(4)}`, colors.green);
}

async function runAllTests() {
  log('🎯 ScrapingDog + Crawl4AI + Mixtral Pipeline Test Suite', colors.bright);
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
    scrapingdog: await testScrapingDogSearch(),
    complete: false
  };

  // Only test complete pipeline if basic tests pass
  if (results.scrapingdog) {
    results.complete = await testCompleteScrapingDogEnrichment();
  } else {
    log('\n⚠️ Skipping complete pipeline test - ScrapingDog test failed', colors.yellow);
  }

  // Cost comparison
  await compareCosts();

  // Summary
  log('\n📊 Test Results Summary', colors.blue);
  log('='.repeat(60), colors.cyan);
  
  const tests = [
    { name: 'ScrapingDog Search', result: results.scrapingdog, required: true },
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
    log('\n🎉 All required tests passed! ScrapingDog pipeline is ready to use.', colors.green);
    log('\n📚 Benefits of ScrapingDog:', colors.blue);
    log('✅ More cost-effective than Serper', colors.green);
    log('✅ Reliable Google search results', colors.green);
    log('✅ Better rate limits', colors.green);
    log('✅ Comprehensive API features', colors.green);
  } else {
    log('\n❌ Some required tests failed. Check API keys and try again.', colors.red);
  }

  log('\n📚 Next Steps:', colors.blue);
  log('1. Get ScrapingDog API key from scrapingdog.com', colors.cyan);
  log('2. Update .env.local with SCRAPINGDOG_API_KEY', colors.cyan);
  log('3. Run the complete pipeline on real MCP servers', colors.cyan);
  log('4. Monitor costs and performance', colors.cyan);
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`\n❌ Test suite failed: ${error}`, colors.red);
    process.exit(1);
  });
}

export { runAllTests, testScrapingDogSearch, testCompleteScrapingDogEnrichment };
