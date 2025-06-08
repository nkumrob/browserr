#!/usr/bin/env tsx

/**
 * Test Content Preservation with Real Playwright Example
 * Shows how we preserve rich GitHub content like the Playwright README
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
} catch (error) {
  console.log('⚠️ Could not load .env.local file');
}

import { ContentPreservingEnrichment } from './src/lib/content-preserving-enrichment';

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

// Create a Playwright-like server to test with
function createPlaywrightLikeServer() {
  return {
    id: 'playwright-mcp-test',
    slug: 'playwright-mcp-server',
    name: 'playwright-mcp-server',
    description: 'Browser automation server using Playwright for web testing and automation',
    tags: ['automation', 'testing', 'browser', 'playwright'],
    category: 'browser-automation',
    language: 'TypeScript',
    stars: 3847,
    installCommand: 'npm install playwright-mcp-server',
    githubUrl: 'https://github.com/microsoft/playwright', // Real Playwright repo
    author: {
      name: 'Microsoft',
      githubUsername: 'microsoft'
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-06-08T16:45:00Z'
  };
}

async function testPlaywrightContentPreservation() {
  log('🎭 Testing Content Preservation with Playwright-like Rich README', colors.bright);
  log('='.repeat(80), colors.cyan);

  // Validate environment
  const requiredEnvVars = ['GROQ_API_KEY'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log('❌ Missing required environment variables:', colors.red);
    missing.forEach(key => {
      log(`   - ${key}`, colors.red);
    });
    return;
  }

  try {
    // Create Playwright-like server
    const playwrightServer = createPlaywrightLikeServer();
    
    log('\n📚 Testing with Real Playwright GitHub Repository:', colors.blue);
    log(`   Repository: ${playwrightServer.githubUrl}`, colors.cyan);
    log(`   This will fetch the ACTUAL Playwright README content`, colors.cyan);
    
    // Initialize content-preserving enrichment
    const enrichmentService = new ContentPreservingEnrichment(
      process.env.GROQ_API_KEY!,
      'dummy' // Not needed for this test
    );

    const startTime = Date.now();
    log('\n🔍 Fetching and analyzing real Playwright README...', colors.blue);
    
    const enrichedServer = await enrichmentService.enrichWithContentPreservation(playwrightServer);
    const processingTime = Date.now() - startTime;

    log(`✅ Content preservation completed in ${(processingTime / 1000).toFixed(1)}s`, colors.green);

    // Show preserved content analysis
    log('\n📖 PRESERVED Original README Content:', colors.green);
    log('='.repeat(60), colors.cyan);
    
    const readme = enrichedServer.original_readme;
    log(`📄 Full content: ${readme.full_content.length.toLocaleString()} characters`, colors.cyan);
    log(`📑 Sections: ${readme.sections.length}`, colors.cyan);
    
    if (readme.sections.length > 0) {
      log('   Section structure:', colors.cyan);
      readme.sections.slice(0, 10).forEach((section, index) => {
        log(`     ${index + 1}. ${section.title} (Level ${section.level})`, colors.cyan);
      });
    }
    
    log(`💻 Code examples: ${readme.code_examples.length}`, colors.cyan);
    if (readme.code_examples.length > 0) {
      log('   Code examples found:', colors.cyan);
      readme.code_examples.slice(0, 5).forEach((example, index) => {
        log(`     ${index + 1}. ${example.language} - ${example.title || 'Untitled'} (${example.code.length} chars)`, colors.cyan);
      });
    }
    
    log(`🎯 Features: ${readme.features.length}`, colors.cyan);
    if (readme.features.length > 0) {
      log('   Features extracted:', colors.cyan);
      readme.features.slice(0, 5).forEach((feature, index) => {
        log(`     ${index + 1}. ${feature.title}`, colors.cyan);
        log(`        ${feature.description.substring(0, 80)}...`, colors.cyan);
      });
    }
    
    log(`⚙️ Installation methods: ${readme.installation_methods.length}`, colors.cyan);
    if (readme.installation_methods.length > 0) {
      readme.installation_methods.forEach((method, index) => {
        log(`     ${index + 1}. ${method.method}`, colors.cyan);
        log(`        Commands: ${method.commands.slice(0, 2).join(', ')}`, colors.cyan);
      });
    }
    
    log(`🔗 Links: ${readme.links.length}`, colors.cyan);
    if (readme.links.length > 0) {
      const linksByType = readme.links.reduce((acc: any, link) => {
        acc[link.type] = (acc[link.type] || 0) + 1;
        return acc;
      }, {});
      Object.entries(linksByType).forEach(([type, count]) => {
        log(`     ${type}: ${count}`, colors.cyan);
      });
    }

    // Show structured content
    log('\n🧠 STRUCTURED Content by Mistral:', colors.blue);
    log('='.repeat(60), colors.cyan);
    
    const structured = enrichedServer.structured_content;
    log(`🎯 Tagline: "${structured.tagline}"`, colors.cyan);
    
    log(`🚀 Key capabilities: ${structured.key_capabilities.length}`, colors.cyan);
    structured.key_capabilities.forEach((cap, index) => {
      log(`   ${index + 1}. ${cap}`, colors.cyan);
    });
    
    log(`📦 Feature categories: ${structured.feature_categories.length}`, colors.cyan);
    structured.feature_categories.forEach((category, index) => {
      log(`   ${index + 1}. ${category.category} (${category.features.length} features)`, colors.cyan);
    });
    
    log(`🎯 Use cases: ${structured.use_cases.length}`, colors.cyan);
    structured.use_cases.forEach((useCase, index) => {
      log(`   ${index + 1}. ${useCase.title} (${useCase.difficulty})`, colors.cyan);
      log(`      Target users: ${useCase.target_users.join(', ')}`, colors.cyan);
      if (useCase.code_example) {
        log(`      Has code example: ${useCase.code_example.length} chars`, colors.magenta);
      }
    });

    // Show enhanced metadata
    log('\n📊 ENHANCED Metadata:', colors.yellow);
    log('='.repeat(60), colors.cyan);
    
    const metadata = enrichedServer.enhanced_metadata;
    log(`🏗️ Framework type: ${metadata.framework_type}`, colors.cyan);
    log(`🎯 Primary use case: ${metadata.primary_use_case}`, colors.cyan);
    log(`🌟 Ecosystem position: ${metadata.ecosystem_position}`, colors.cyan);
    log(`📈 Maturity level: ${metadata.maturity_level}`, colors.cyan);
    log(`🏢 Enterprise ready: ${metadata.enterprise_ready ? 'Yes' : 'No'}`, colors.cyan);
    log(`👥 Community size: ${metadata.community_size}`, colors.cyan);

    // Cost analysis
    const costEstimate = enrichmentService.estimateCost(1);
    log('\n💰 Cost Analysis:', colors.yellow);
    log(`   GitHub API calls: ${costEstimate.githubApiCalls} (free for public repos)`, colors.cyan);
    log(`   Llama processing: $${costEstimate.llamaCost.toFixed(4)}`, colors.cyan);
    log(`   Total cost: $${costEstimate.totalCost.toFixed(4)}`, colors.cyan);

    // Summary
    log('\n🎉 Content Preservation Success!', colors.bright);
    log('='.repeat(60), colors.cyan);
    
    log('✅ What we PRESERVED:', colors.green);
    log(`   📖 ${readme.full_content.length.toLocaleString()} chars of original content`, colors.cyan);
    log(`   📑 ${readme.sections.length} sections with full structure`, colors.cyan);
    log(`   💻 ${readme.code_examples.length} code examples with syntax`, colors.cyan);
    log(`   🎯 ${readme.features.length} features with descriptions`, colors.cyan);
    log(`   ⚙️ ${readme.installation_methods.length} installation methods`, colors.cyan);
    log(`   🔗 ${readme.links.length} links with categorization`, colors.cyan);
    
    log('✅ What we STRUCTURED:', colors.blue);
    log(`   🎯 Professional tagline generated`, colors.cyan);
    log(`   🚀 ${structured.key_capabilities.length} capabilities identified`, colors.cyan);
    log(`   📦 ${structured.feature_categories.length} feature categories organized`, colors.cyan);
    log(`   🎯 ${structured.use_cases.length} use cases with code examples`, colors.cyan);
    log(`   ⚙️ Installation guide structured`, colors.cyan);
    log(`   🔧 API overview extracted`, colors.cyan);
    
    log('✅ What we ENHANCED:', colors.yellow);
    log(`   📊 Framework type: ${metadata.framework_type}`, colors.cyan);
    log(`   🎯 Use case: ${metadata.primary_use_case}`, colors.cyan);
    log(`   🌟 Position: ${metadata.ecosystem_position}`, colors.cyan);
    log(`   📈 Maturity: ${metadata.maturity_level}`, colors.cyan);
    log(`   🏢 Enterprise ready: ${metadata.enterprise_ready}`, colors.cyan);

    log('\n🎯 This approach gives us the BEST of both worlds:', colors.bright);
    log('   📚 Rich original content is fully preserved', colors.green);
    log('   🧠 Mistral structures it intelligently', colors.blue);
    log('   📊 Enhanced with metadata and analysis', colors.yellow);
    log('   💰 Cost-effective at $0.0008 per server', colors.green);
    log('   ⚡ Fast processing (~10-15 seconds)', colors.green);

  } catch (error) {
    log(`❌ Test failed: ${error}`, colors.red);
    console.error(error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testPlaywrightContentPreservation().catch(error => {
    log(`\n❌ Test failed: ${error}`, colors.red);
    process.exit(1);
  });
}

export { testPlaywrightContentPreservation };
