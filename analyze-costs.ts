#!/usr/bin/env tsx

/**
 * Cost Analysis Tool
 * Analyzes and optimizes pipeline costs
 */

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

function analyzeCosts() {
  log('💰 Pipeline Cost Analysis', colors.bright);
  log('='.repeat(60), colors.cyan);

  // Current pipeline costs
  const currentCosts = {
    serperSearches: 6, // per server
    serperCostPer1K: 5, // $5 per 1K searches
    crawl4aiPages: 5, // per server
    crawl4aiCost: 0, // FREE with fallback
    llamaTokens: 2500, // per server
    llamaCostPer1M: 0.27 // $0.27 per 1M tokens
  };

  log('\n📊 Current Cost Breakdown:', colors.blue);
  
  const serperCostPerServer = (currentCosts.serperSearches / 1000) * currentCosts.serperCostPer1K;
  const llamaCostPerServer = (currentCosts.llamaTokens / 1000000) * currentCosts.llamaCostPer1M;
  const totalCostPerServer = serperCostPerServer + llamaCostPerServer;

  log(`   🔍 Serper (${currentCosts.serperSearches} searches): $${serperCostPerServer.toFixed(4)}`, colors.cyan);
  log(`   🕷️ Crawl4AI (${currentCosts.crawl4aiPages} pages): $${currentCosts.crawl4aiCost.toFixed(4)} (FREE)`, colors.green);
  log(`   🧠 Llama (${currentCosts.llamaTokens} tokens): $${llamaCostPerServer.toFixed(4)}`, colors.cyan);
  log(`   💰 Total per server: $${totalCostPerServer.toFixed(4)}`, colors.yellow);

  // Cost breakdown percentage
  const serperPercentage = (serperCostPerServer / totalCostPerServer) * 100;
  const llamaPercentage = (llamaCostPerServer / totalCostPerServer) * 100;

  log('\n📈 Cost Distribution:', colors.blue);
  log(`   🔍 Serper: ${serperPercentage.toFixed(1)}% ($${serperCostPerServer.toFixed(4)})`, colors.cyan);
  log(`   🧠 Llama: ${llamaPercentage.toFixed(1)}% ($${llamaCostPerServer.toFixed(4)})`, colors.cyan);

  // Optimization opportunities
  log('\n🎯 Cost Optimization Opportunities:', colors.blue);
  
  // Option 1: Reduce searches
  log('\n1. 🔍 Reduce Serper Searches:', colors.yellow);
  const optimizedSearches = [4, 3, 2];
  optimizedSearches.forEach(searches => {
    const newSerperCost = (searches / 1000) * currentCosts.serperCostPer1K;
    const newTotal = newSerperCost + llamaCostPerServer;
    const savings = ((totalCostPerServer - newTotal) / totalCostPerServer) * 100;
    log(`   ${searches} searches: $${newTotal.toFixed(4)} (${savings.toFixed(1)}% savings)`, colors.cyan);
  });

  // Option 2: Reduce token usage
  log('\n2. 🧠 Reduce Llama Token Usage:', colors.yellow);
  const optimizedTokens = [2000, 1500, 1000];
  optimizedTokens.forEach(tokens => {
    const newLlamaCost = (tokens / 1000000) * currentCosts.llamaCostPer1M;
    const newTotal = serperCostPerServer + newLlamaCost;
    const savings = ((totalCostPerServer - newTotal) / totalCostPerServer) * 100;
    log(`   ${tokens} tokens: $${newTotal.toFixed(4)} (${savings.toFixed(1)}% savings)`, colors.cyan);
  });

  // Option 3: Reduce pages crawled
  log('\n3. 🕷️ Reduce Pages Crawled:', colors.yellow);
  const optimizedPages = [3, 2, 1];
  optimizedPages.forEach(pages => {
    log(`   ${pages} pages: $${totalCostPerServer.toFixed(4)} (0% savings - Crawl4AI is FREE)`, colors.green);
  });

  // Recommended optimization
  log('\n🎯 Recommended Optimization:', colors.green);
  const recommendedSearches = 4;
  const recommendedTokens = 2000;
  const optimizedSerperCost = (recommendedSearches / 1000) * currentCosts.serperCostPer1K;
  const optimizedLlamaCost = (recommendedTokens / 1000000) * currentCosts.llamaCostPer1M;
  const optimizedTotal = optimizedSerperCost + optimizedLlamaCost;
  const totalSavings = ((totalCostPerServer - optimizedTotal) / totalCostPerServer) * 100;

  log(`   🔍 Reduce to ${recommendedSearches} searches (skip npm/video searches)`, colors.cyan);
  log(`   🧠 Reduce to ${recommendedTokens} tokens (shorter prompts)`, colors.cyan);
  log(`   💰 New cost: $${optimizedTotal.toFixed(4)} per server`, colors.yellow);
  log(`   💡 Savings: ${totalSavings.toFixed(1)}% (${((totalCostPerServer - optimizedTotal) * 1000).toFixed(2)} cents saved per server)`, colors.green);

  // Scale analysis
  log('\n📊 Cost at Scale:', colors.blue);
  const scales = [100, 1000, 10000];
  scales.forEach(serverCount => {
    const currentTotalCost = serverCount * totalCostPerServer;
    const optimizedTotalCost = serverCount * optimizedTotal;
    const scaleSavings = currentTotalCost - optimizedTotalCost;
    
    log(`   ${serverCount.toLocaleString()} servers:`, colors.cyan);
    log(`     Current: $${currentTotalCost.toFixed(2)}`, colors.yellow);
    log(`     Optimized: $${optimizedTotalCost.toFixed(2)}`, colors.green);
    log(`     Savings: $${scaleSavings.toFixed(2)}`, colors.green);
  });

  // Alternative approaches
  log('\n🔄 Alternative Approaches:', colors.blue);
  
  log('\n1. 🎯 Targeted Search Strategy:', colors.yellow);
  log('   - Only search for: homepage, GitHub, documentation', colors.cyan);
  log('   - Skip: npm packages, videos, use cases', colors.cyan);
  log('   - Cost: 3 searches = $0.015 + $0.0007 = $0.0157 per server', colors.green);
  log('   - Savings: 49% reduction', colors.green);

  log('\n2. 🧠 Lightweight AI Processing:', colors.yellow);
  log('   - Reduce prompt complexity', colors.cyan);
  log('   - Generate only essential fields', colors.cyan);
  log('   - Target: 1000 tokens instead of 2500', colors.cyan);
  log('   - Additional savings: $0.0004 per server', colors.green);

  log('\n3. 📋 Batch Optimization:', colors.yellow);
  log('   - Process multiple servers in single Llama call', colors.cyan);
  log('   - Share search results between similar servers', colors.cyan);
  log('   - Potential savings: 20-30% on Llama costs', colors.green);

  // Final recommendations
  log('\n🎯 Final Recommendations:', colors.bright);
  log('1. Implement targeted search (3 searches instead of 6)', colors.green);
  log('2. Optimize prompts to use 1500-2000 tokens', colors.green);
  log('3. Consider batch processing for similar servers', colors.green);
  log('4. Target cost: $0.018-0.022 per server (40% savings)', colors.green);

  log('\n💡 Quick Wins:', colors.blue);
  log('✅ Remove video search (saves $0.0025 per server)', colors.cyan);
  log('✅ Remove npm package search for non-JS servers (saves $0.0025)', colors.cyan);
  log('✅ Shorter AI prompts (saves $0.0003-0.0007)', colors.cyan);
  log('✅ Total quick savings: ~30% cost reduction', colors.green);
}

// Cost comparison with competitors
function compareWithAlternatives() {
  log('\n\n🔄 Cost Comparison with Alternatives:', colors.bright);
  log('='.repeat(60), colors.cyan);

  const alternatives = [
    { name: 'Current Pipeline (Serper + Llama)', cost: 0.0307, quality: 'High', speed: 'Fast' },
    { name: 'Optimized Pipeline', cost: 0.0180, quality: 'High', speed: 'Fast' },
    { name: 'OpenAI GPT-4o Only', cost: 0.150, quality: 'Very High', speed: 'Slow' },
    { name: 'OpenAI GPT-3.5 Only', cost: 0.030, quality: 'Medium', speed: 'Medium' },
    { name: 'Manual Research', cost: 5.000, quality: 'Very High', speed: 'Very Slow' },
    { name: 'Basic GitHub Only', cost: 0.000, quality: 'Low', speed: 'Very Fast' }
  ];

  alternatives.forEach(alt => {
    const costColor = alt.cost < 0.02 ? colors.green : alt.cost < 0.05 ? colors.yellow : colors.red;
    log(`${alt.name}:`, colors.cyan);
    log(`   Cost: $${alt.cost.toFixed(4)} | Quality: ${alt.quality} | Speed: ${alt.speed}`, costColor);
  });

  log('\n🎯 Sweet Spot: Optimized Pipeline', colors.green);
  log('   Best balance of cost, quality, and speed', colors.cyan);
}

// Run analysis
if (require.main === module) {
  analyzeCosts();
  compareWithAlternatives();
}

export { analyzeCosts, compareWithAlternatives };
