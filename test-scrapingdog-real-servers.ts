#!/usr/bin/env tsx

/**
 * Test ScrapingDog Pipeline with Real MCP Servers
 * Tests the complete enrichment workflow with actual MCP repositories
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

// Real MCP server repositories from GitHub
const REAL_MCP_SERVERS = [
  {
    name: 'MCP Servers Collection',
    url: 'https://github.com/modelcontextprotocol/servers',
    description: 'Official MCP servers collection including filesystem, git, memory, and more'
  },
  {
    name: 'GitHub MCP Server',
    url: 'https://github.com/github/github-mcp-server',
    description: 'Official GitHub MCP server for repository management and API integration'
  },
  {
    name: 'Playwright MCP Server',
    url: 'https://github.com/executeautomation/mcp-playwright',
    description: 'Browser automation and web scraping using Playwright'
  }
];

async function testSingleRealServerWithScrapingDog(serverInfo: { name: string; url: string; description: string }) {
  log(`\n🔍 Testing: ${serverInfo.name}`, colors.blue);
  log(`📍 URL: ${serverInfo.url}`, colors.cyan);
  log('-'.repeat(60), colors.cyan);

  const startTime = Date.now();

  try {
    // Step 1: Extract GitHub data
    log('📦 Step 1: Extracting GitHub data...', colors.cyan);
    const registryService = new McpRegistryService({
      githubToken: process.env.GITHUB_TOKEN
    });

    let githubData = await registryService.extractGitHubData(serverInfo.url);
    
    if (!githubData) {
      log('⚠️ Could not extract GitHub data (using mock data)', colors.yellow);
      // Create mock data for testing
      const urlParts = serverInfo.url.split('/');
      const repoName = urlParts[urlParts.length - 1];
      
      githubData = {
        name: repoName,
        description: serverInfo.description,
        githubUrl: serverInfo.url,
        stars: 0,
        language: 'TypeScript',
        author: {
          name: urlParts[urlParts.length - 2],
          githubUsername: urlParts[urlParts.length - 2]
        },
        lastUpdated: new Date().toISOString(),
        topics: ['mcp', 'server']
      };
      log('📝 Using mock GitHub data for testing', colors.yellow);
    } else {
      log(`✅ GitHub data extracted successfully`, colors.green);
      log(`   Name: ${githubData.name}`, colors.cyan);
      log(`   Stars: ${githubData.stars}`, colors.cyan);
      log(`   Language: ${githubData.language}`, colors.cyan);
    }

    // Step 2: Convert to MCP server format
    log('🔄 Step 2: Converting to MCP server format...', colors.cyan);
    const mcpServer = registryService.githubDataToMcpServer(githubData);
    log(`   Generated slug: ${mcpServer.slug}`, colors.cyan);
    log(`   Inferred category: ${mcpServer.category}`, colors.cyan);

    // Step 3: Enrich with ScrapingDog pipeline
    log('🌐 Step 3: Enriching with ScrapingDog + Crawl4AI + Llama...', colors.cyan);
    const enrichmentService = new ScrapingDogCrawl4AIEnrichment(
      process.env.GROQ_API_KEY!,
      process.env.SCRAPINGDOG_API_KEY!
    );

    const enrichmentResult = await enrichmentService.enrichServer(mcpServer);

    if (enrichmentResult.success) {
      const processingTime = Date.now() - startTime;
      log(`✅ Enrichment completed successfully!`, colors.green);
      log(`   Processing time: ${processingTime}ms`, colors.cyan);
      log(`   Searches made: ${enrichmentResult.searchesMade}`, colors.cyan);
      log(`   Credits used: ${enrichmentResult.creditsUsed}`, colors.yellow);
      log(`   Pages crawled: ${enrichmentResult.pagesCrawled}`, colors.cyan);
      log(`   Tokens used: ${enrichmentResult.tokensUsed}`, colors.cyan);

      // Show enriched data
      const enriched = enrichmentResult.finalEnrichedServer;
      log('\n📊 Enriched Data Found:', colors.blue);
      
      if (enriched.homepage) {
        log(`   🏠 Homepage: ${enriched.homepage}`, colors.green);
      }
      
      if (enriched.documentation) {
        log(`   📚 Documentation: ${enriched.documentation}`, colors.green);
      }
      
      if (enriched.npmPackage) {
        log(`   📦 NPM Package: ${enriched.npmPackage}`, colors.green);
      }

      if (enriched.useCases && enriched.useCases.length > 0) {
        log(`   🎯 Use Cases Generated: ${enriched.useCases.length}`, colors.green);
        enriched.useCases.slice(0, 2).forEach((useCase, index) => {
          log(`     ${index + 1}. ${useCase.title} (${useCase.difficulty})`, colors.cyan);
        });
      }

      if (enriched.faqs && enriched.faqs.length > 0) {
        log(`   ❓ FAQs Generated: ${enriched.faqs.length}`, colors.green);
      }

      if (enriched.externalResources && enriched.externalResources.length > 0) {
        log(`   🔗 External Resources: ${enriched.externalResources.length}`, colors.green);
        enriched.externalResources.slice(0, 2).forEach((resource, index) => {
          log(`     ${index + 1}. ${resource.title} (${resource.type})`, colors.cyan);
        });
      }

      // Calculate cost
      const costEstimate = enrichmentService.estimateCost(1);
      log(`   💰 Estimated cost: $${costEstimate.totalCost.toFixed(4)}`, colors.yellow);

      return {
        success: true,
        serverName: serverInfo.name,
        processingTime,
        cost: costEstimate.totalCost,
        creditsUsed: enrichmentResult.creditsUsed,
        enrichedData: enriched
      };

    } else {
      log(`❌ Enrichment failed`, colors.red);
      if (enrichmentResult.errors) {
        enrichmentResult.errors.forEach(error => {
          log(`   Error: ${error}`, colors.red);
        });
      }
      return {
        success: false,
        serverName: serverInfo.name,
        processingTime: Date.now() - startTime,
        cost: 0,
        creditsUsed: 0,
        errors: enrichmentResult.errors
      };
    }

  } catch (error) {
    log(`❌ Test failed: ${error}`, colors.red);
    return {
      success: false,
      serverName: serverInfo.name,
      processingTime: Date.now() - startTime,
      cost: 0,
      creditsUsed: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

async function testBatchRealServersWithScrapingDog(serverCount: number = 3) {
  log('🚀 ScrapingDog Real MCP Server Pipeline Test', colors.bright);
  log('='.repeat(60), colors.cyan);

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

  log(`📋 Testing ${serverCount} real MCP servers with ScrapingDog...`, colors.blue);
  log(`🎯 Selected servers:`, colors.cyan);
  
  const serversToTest = REAL_MCP_SERVERS.slice(0, serverCount);
  serversToTest.forEach((server, index) => {
    log(`   ${index + 1}. ${server.name}`, colors.cyan);
  });

  const results = [];
  let totalCost = 0;
  let totalCredits = 0;
  let totalTime = 0;

  for (let i = 0; i < serversToTest.length; i++) {
    const server = serversToTest[i];
    log(`\n📦 Processing ${i + 1}/${serversToTest.length}...`, colors.blue);
    
    const result = await testSingleRealServerWithScrapingDog(server);
    results.push(result);
    
    if (result.success) {
      totalCost += result.cost;
      totalCredits += result.creditsUsed;
      totalTime += result.processingTime;
    }

    // Rate limiting between servers
    if (i < serversToTest.length - 1) {
      log('⏳ Rate limiting (3 seconds)...', colors.yellow);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Summary
  log('\n📊 ScrapingDog Batch Test Results Summary', colors.blue);
  log('='.repeat(60), colors.cyan);
  
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  log(`✅ Successful: ${successful}/${results.length}`, colors.green);
  log(`❌ Failed: ${failed}/${results.length}`, failed > 0 ? colors.red : colors.green);
  log(`💰 Total cost: $${totalCost.toFixed(4)}`, colors.yellow);
  log(`🔍 Total credits used: ${totalCredits}`, colors.yellow);
  log(`⏱️ Total time: ${(totalTime / 1000).toFixed(1)}s`, colors.cyan);
  log(`📊 Average cost per server: $${(totalCost / successful).toFixed(4)}`, colors.yellow);
  log(`📊 Average time per server: ${(totalTime / successful / 1000).toFixed(1)}s`, colors.cyan);

  // Show successful enrichments
  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    log('\n🎉 Successfully Enriched Servers:', colors.green);
    successfulResults.forEach((result, index) => {
      log(`   ${index + 1}. ${result.serverName}`, colors.green);
      log(`      Cost: $${result.cost.toFixed(4)}, Credits: ${result.creditsUsed}, Time: ${(result.processingTime / 1000).toFixed(1)}s`, colors.cyan);
    });
  }

  // Compare with Serper costs
  log('\n💰 Cost Comparison with Serper:', colors.blue);
  const serperCostPerServer = 0.0204; // From previous analysis
  const scrapingdogCostPerServer = totalCost / successful;
  const totalSerperCost = successful * serperCostPerServer;
  const savings = totalSerperCost - totalCost;
  const savingsPercentage = (savings / totalSerperCost) * 100;

  log(`   ScrapingDog total: $${totalCost.toFixed(4)}`, colors.green);
  log(`   Serper would cost: $${totalSerperCost.toFixed(4)}`, colors.yellow);
  log(`   Savings: $${savings.toFixed(4)} (${savingsPercentage.toFixed(1)}%)`, colors.green);

  log('\n🎯 ScrapingDog Pipeline Performance:', colors.blue);
  if (successful > 0) {
    log(`✅ Success rate: ${((successful / results.length) * 100).toFixed(1)}%`, colors.green);
    log(`💰 Cost efficiency: $${scrapingdogCostPerServer.toFixed(4)} per server`, colors.yellow);
    log(`⚡ Speed: ${(totalTime / successful / 1000).toFixed(1)}s per server`, colors.cyan);
    log(`🔍 Credit efficiency: ${(totalCredits / successful).toFixed(0)} credits per server`, colors.yellow);
  }

  log('\n📚 Next Steps:', colors.blue);
  log('1. Scale to larger batches (10-50 servers)', colors.cyan);
  log('2. Set up database integration', colors.cyan);
  log('3. Build frontend UI for results', colors.cyan);
  log('4. Monitor long-term costs and performance', colors.cyan);

  return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
  const serverCount = process.argv[2] ? parseInt(process.argv[2]) : 3;
  
  testBatchRealServersWithScrapingDog(serverCount).catch(error => {
    log(`\n❌ Test suite failed: ${error}`, colors.red);
    process.exit(1);
  });
}

export { testSingleRealServerWithScrapingDog, testBatchRealServersWithScrapingDog };
