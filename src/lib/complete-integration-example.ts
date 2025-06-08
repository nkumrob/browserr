// Complete Integration Example - Full PRD Implementation
// Demonstrates the entire MCP.so → GitHub → OpenAI → Database workflow

import { McpDiscoveryService } from './mcp-discovery-service';
import { SupabaseService } from './supabase-service';

// Environment validation
export function validateCompleteEnvironment(): { valid: boolean; missing: string[]; warnings: string[] } {
  const required = ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const optional = ['GITHUB_TOKEN', 'SERPER_API_KEY', 'CRAW4AI_API_KEY'];
  
  const missing = required.filter(key => !process.env[key]);
  const warnings = optional.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:', missing);
    console.log('💡 Add these to your .env.local file:');
    missing.forEach(key => {
      console.log(`${key}=your_${key.toLowerCase()}_here`);
    });
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ Optional environment variables missing:', warnings);
    console.log('💡 These will improve functionality:');
    warnings.forEach(key => {
      console.log(`${key}=your_${key.toLowerCase()}_here`);
    });
  }
  
  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}

// Initialize complete discovery service
export function createCompleteDiscoveryService(): McpDiscoveryService {
  const envCheck = validateCompleteEnvironment();
  if (!envCheck.valid) {
    throw new Error(`Missing required environment variables: ${envCheck.missing.join(', ')}`);
  }

  return new McpDiscoveryService({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    githubToken: process.env.GITHUB_TOKEN,
    serperApiKey: process.env.SERPER_API_KEY,
    craw4aiApiKey: process.env.CRAW4AI_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    batchSize: 5,
    enableChangeDetection: true,
    processingDelay: 2000
  });
}

// Example 1: Complete Discovery Workflow
export async function runCompleteDiscoveryWorkflow() {
  console.log('🎯 Complete MCP Discovery Workflow\n');
  console.log('=' .repeat(60));
  
  try {
    const discoveryService = createCompleteDiscoveryService();
    
    console.log('📋 Step 1: Environment Check');
    const envCheck = validateCompleteEnvironment();
    console.log(`✅ Required vars: ${envCheck.valid ? 'All present' : 'Missing: ' + envCheck.missing.join(', ')}`);
    console.log(`⚠️ Optional vars: ${envCheck.warnings.length === 0 ? 'All present' : 'Missing: ' + envCheck.warnings.join(', ')}`);
    
    console.log('\n🔍 Step 2: Health Check');
    const healthStats = await discoveryService.getDiscoveryStats();
    console.log(`📊 Total servers: ${healthStats.totalServers}`);
    console.log(`📝 Pending jobs: ${healthStats.pendingEnrichmentJobs}`);
    console.log(`💾 Database: ${healthStats.databaseHealthy ? 'Healthy' : 'Error'}`);
    
    console.log('\n🚀 Step 3: Discovery Process');
    const discoveryResult = await discoveryService.discoverAndProcessServers();
    
    if (discoveryResult.success) {
      console.log(`✅ Discovery completed successfully!`);
      console.log(`📦 Total servers found: ${discoveryResult.totalServersFound}`);
      console.log(`➕ New servers added: ${discoveryResult.newServersAdded}`);
      console.log(`🔄 Servers updated: ${discoveryResult.serversUpdated}`);
      console.log(`💰 Estimated cost: $${discoveryResult.estimatedCost.toFixed(3)}`);
      console.log(`⏱️ Processing time: ${discoveryResult.processingTime}ms`);
      
      if (discoveryResult.errors.length > 0) {
        console.log(`⚠️ Errors encountered: ${discoveryResult.errors.length}`);
        discoveryResult.errors.slice(0, 3).forEach(error => {
          console.log(`  - ${error}`);
        });
      }
    } else {
      console.log(`❌ Discovery failed: ${discoveryResult.errors.join(', ')}`);
    }
    
    console.log('\n📝 Step 4: Process Enrichment Queue');
    await discoveryService.processEnrichmentQueue();
    console.log('✅ Enrichment queue processing completed');
    
    console.log('\n📡 Step 5: Generate RSS Feed');
    const rssFeed = await discoveryService.generateRssFeed();
    console.log(`📄 RSS feed generated (${rssFeed.length} characters)`);
    
    console.log('\n🎉 Complete workflow finished successfully!');
    console.log('=' .repeat(60));
    
    return {
      envCheck,
      healthStats,
      discoveryResult,
      rssFeedLength: rssFeed.length
    };
    
  } catch (error) {
    console.error('❌ Complete workflow failed:', error);
    throw error;
  }
}

// Example 2: Database Operations Demo
export async function demonstrateDatabaseOperations() {
  console.log('\n🎯 Database Operations Demo\n');
  
  try {
    const supabaseService = new SupabaseService({
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });
    
    console.log('🔍 1. Health Check');
    const health = await supabaseService.healthCheck();
    console.log(`Database: ${health.healthy ? '✅ Healthy' : '❌ Error'} - ${health.message}`);
    
    console.log('\n📊 2. Server Statistics');
    const allServers = await supabaseService.getAllMcpServers({ limit: 10 });
    console.log(`Total servers (sample): ${allServers.length}`);
    
    if (allServers.length > 0) {
      const categories = [...new Set(allServers.map(s => s.category))];
      const languages = [...new Set(allServers.map(s => s.language))];
      
      console.log(`Categories: ${categories.join(', ')}`);
      console.log(`Languages: ${languages.join(', ')}`);
      
      console.log('\n📋 3. Sample Servers:');
      allServers.slice(0, 3).forEach(server => {
        console.log(`  - ${server.name} (${server.language}, ${server.stars} ⭐)`);
      });
    }
    
    console.log('\n🔍 4. Search Demo');
    const searchResults = await supabaseService.searchServers('browser', { limit: 3 });
    console.log(`Search "browser": ${searchResults.length} results`);
    searchResults.forEach(server => {
      console.log(`  - ${server.name}: ${server.description}`);
    });
    
    console.log('\n📝 5. Enrichment Queue');
    const pendingJobs = await supabaseService.getPendingEnrichmentJobs(5);
    console.log(`Pending enrichment jobs: ${pendingJobs.length}`);
    
    return {
      health,
      totalServers: allServers.length,
      searchResults: searchResults.length,
      pendingJobs: pendingJobs.length
    };
    
  } catch (error) {
    console.error('❌ Database operations demo failed:', error);
    throw error;
  }
}

// Example 3: API Integration Demo
export async function demonstrateApiIntegration() {
  console.log('\n🎯 API Integration Demo\n');
  
  const baseUrl = 'http://localhost:3000'; // Adjust as needed
  
  try {
    console.log('🔍 1. Discovery Service Health Check');
    const healthResponse = await fetch(`${baseUrl}/api/discovery`);
    const healthData = await healthResponse.json();
    console.log(`Service status: ${healthData.status}`);
    console.log(`Features: ${Object.keys(healthData.features).filter(k => healthData.features[k]).join(', ')}`);
    
    console.log('\n📊 2. Admin Analytics');
    const analyticsResponse = await fetch(`${baseUrl}/api/admin/analytics`);
    const analyticsData = await analyticsResponse.json();
    
    if (analyticsData.success) {
      console.log(`Total servers: ${analyticsData.analytics.overview.totalServers}`);
      console.log(`System health: ${analyticsData.analytics.overview.systemHealth}`);
      console.log(`Pending enrichment: ${analyticsData.analytics.overview.pendingEnrichment}`);
    }
    
    console.log('\n📝 3. Enrichment Queue Status');
    const queueResponse = await fetch(`${baseUrl}/api/admin/enrichment`);
    const queueData = await queueResponse.json();
    
    if (queueData.success) {
      console.log(`Queue statistics:`);
      console.log(`  - Total: ${queueData.statistics.total}`);
      console.log(`  - Pending: ${queueData.statistics.pending}`);
      console.log(`  - Completed: ${queueData.statistics.completed}`);
    }
    
    console.log('\n📡 4. RSS Feed');
    const rssResponse = await fetch(`${baseUrl}/api/feeds/mcpso-page`);
    const rssContent = await rssResponse.text();
    console.log(`RSS feed generated: ${rssContent.length} characters`);
    
    return {
      healthCheck: healthData.status === 'healthy',
      analytics: analyticsData.success,
      queue: queueData.success,
      rssFeed: rssResponse.ok
    };
    
  } catch (error) {
    console.error('❌ API integration demo failed:', error);
    console.log('💡 Make sure the development server is running on localhost:3000');
    throw error;
  }
}

// Example 4: Production Deployment Checklist
export function getProductionChecklist() {
  console.log('\n🎯 Production Deployment Checklist\n');
  
  const checklist = [
    {
      item: 'Environment Variables',
      required: ['OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
      optional: ['GITHUB_TOKEN', 'SERPER_API_KEY', 'CRAW4AI_API_KEY'],
      status: 'check_env'
    },
    {
      item: 'Database Schema',
      description: 'Supabase tables: mcp_servers, enriched_content, external_resources, enrichment_queue',
      status: 'manual_setup'
    },
    {
      item: 'API Rate Limits',
      description: 'Configure rate limiting for OpenAI, GitHub, and Serper APIs',
      status: 'configure'
    },
    {
      item: 'Cron Jobs',
      description: 'Set up automated discovery and enrichment processing',
      status: 'setup_automation'
    },
    {
      item: 'Monitoring',
      description: 'Set up error tracking, performance monitoring, and alerts',
      status: 'setup_monitoring'
    },
    {
      item: 'Caching',
      description: 'Configure Redis or similar for improved performance',
      status: 'optional'
    },
    {
      item: 'Security',
      description: 'API authentication, input validation, rate limiting',
      status: 'implement'
    }
  ];
  
  checklist.forEach((item, index) => {
    console.log(`${index + 1}. ${item.item}`);
    if (item.required) {
      console.log(`   Required: ${item.required.join(', ')}`);
    }
    if (item.optional) {
      console.log(`   Optional: ${item.optional.join(', ')}`);
    }
    if (item.description) {
      console.log(`   ${item.description}`);
    }
    console.log(`   Status: ${item.status}\n`);
  });
  
  return checklist;
}

// Complete integration usage instructions
export const COMPLETE_INTEGRATION_USAGE = `
🚀 Complete MCP Registry Integration

## Quick Start
1. Set up environment variables in .env.local
2. Run: npm run dev
3. Test: POST /api/discovery with {"action": "discover"}

## Environment Variables
Required:
- OPENAI_API_KEY=sk-...
- SUPABASE_URL=https://...
- SUPABASE_SERVICE_ROLE_KEY=...

Optional (improves functionality):
- GITHUB_TOKEN=ghp_...
- SERPER_API_KEY=...
- CRAW4AI_API_KEY=...

## API Endpoints
- POST /api/discovery - Run discovery process
- GET /api/admin/servers - Manage servers
- GET /api/admin/enrichment - Enrichment queue
- GET /api/admin/analytics - System analytics
- GET /api/feeds/mcpso-page - RSS feed

## Features Implemented
✅ MCP.so scraping with Craw4AI
✅ GitHub data extraction
✅ OpenAI enrichment with web search
✅ External resources with real URLs
✅ Supabase database integration
✅ Change detection system
✅ Admin console APIs
✅ RSS feed generation
✅ Automated processing pipeline
✅ Cost optimization and caching

## Usage Examples
import { runCompleteDiscoveryWorkflow } from './complete-integration-example';
await runCompleteDiscoveryWorkflow();
`;
