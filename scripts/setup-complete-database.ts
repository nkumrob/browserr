#!/usr/bin/env tsx

/**
 * Complete Database Setup Script
 * Sets up the MCP Registry database with sample data and validation
 */

import { SupabaseService } from '../src/lib/supabase-service';
import { McpDiscoveryService } from '../src/lib/mcp-discovery-service';
import { MOCK_MCP_SERVERS } from '../src/data/mock-servers';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log('❌ Missing required environment variables:', colors.red);
    missing.forEach(key => log(`   - ${key}`, colors.red));
    log('\n💡 Add these to your .env.local file:', colors.yellow);
    missing.forEach(key => {
      log(`   ${key}=your_${key.toLowerCase()}_here`, colors.yellow);
    });
  }
  
  return { valid: missing.length === 0, missing };
}

async function setupDatabase() {
  log('\n🚀 MCP Registry Database Setup', colors.bright);
  log('=' .repeat(50), colors.cyan);
  
  // Step 1: Environment validation
  log('\n📋 Step 1: Environment Validation', colors.blue);
  const envCheck = validateEnvironment();
  
  if (!envCheck.valid) {
    log('❌ Environment validation failed', colors.red);
    process.exit(1);
  }
  
  log('✅ All required environment variables present', colors.green);
  
  // Step 2: Database connection test
  log('\n🔌 Step 2: Database Connection Test', colors.blue);
  
  try {
    const supabaseService = new SupabaseService({
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });
    
    const health = await supabaseService.healthCheck();
    
    if (health.healthy) {
      log('✅ Database connection successful', colors.green);
    } else {
      log(`❌ Database connection failed: ${health.message}`, colors.red);
      log('\n💡 Make sure you have run the Supabase migration:', colors.yellow);
      log('   1. Open Supabase SQL Editor', colors.yellow);
      log('   2. Copy contents of database/supabase-migration.sql', colors.yellow);
      log('   3. Run the migration', colors.yellow);
      process.exit(1);
    }
  } catch (error) {
    log(`❌ Database connection error: ${error}`, colors.red);
    process.exit(1);
  }
  
  // Step 3: Check if tables exist and have data
  log('\n📊 Step 3: Database Schema Validation', colors.blue);
  
  try {
    const supabaseService = new SupabaseService({
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });
    
    const servers = await supabaseService.getAllMcpServers({ limit: 1 });
    log(`✅ Database schema valid (found ${servers.length} existing servers)`, colors.green);
    
    if (servers.length === 0) {
      log('\n📦 Step 4: Adding Sample Data', colors.blue);
      await addSampleData(supabaseService);
    } else {
      log('\n📦 Step 4: Sample Data Already Present', colors.blue);
      log('✅ Skipping sample data insertion', colors.green);
    }
    
  } catch (error) {
    log(`❌ Schema validation failed: ${error}`, colors.red);
    log('\n💡 Please run the Supabase migration first:', colors.yellow);
    log('   database/supabase-migration.sql', colors.yellow);
    process.exit(1);
  }
  
  // Step 5: Discovery service test
  log('\n🔍 Step 5: Discovery Service Test', colors.blue);
  
  try {
    const discoveryService = new McpDiscoveryService({
      openaiApiKey: process.env.OPENAI_API_KEY!,
      githubToken: process.env.GITHUB_TOKEN,
      serperApiKey: process.env.SERPER_API_KEY,
      craw4aiApiKey: process.env.CRAW4AI_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
    });
    
    const stats = await discoveryService.getDiscoveryStats();
    log('✅ Discovery service initialized successfully', colors.green);
    log(`   - Total servers: ${stats.totalServers}`, colors.cyan);
    log(`   - Pending jobs: ${stats.pendingEnrichmentJobs}`, colors.cyan);
    log(`   - Database healthy: ${stats.databaseHealthy}`, colors.cyan);
    
  } catch (error) {
    log(`⚠️ Discovery service warning: ${error}`, colors.yellow);
    log('   This may be due to missing optional API keys', colors.yellow);
  }
  
  // Step 6: API endpoints test
  log('\n🌐 Step 6: API Endpoints Test', colors.blue);
  await testApiEndpoints();
  
  // Step 7: MCP Server setup
  log('\n🔧 Step 7: MCP Server Setup', colors.blue);
  await setupMcpServer();
  
  // Final summary
  log('\n🎉 Setup Complete!', colors.bright + colors.green);
  log('=' .repeat(50), colors.cyan);
  
  log('\n📋 Next Steps:', colors.blue);
  log('1. Start your development server: npm run dev', colors.cyan);
  log('2. Test the admin console: http://localhost:3000/api/admin/analytics', colors.cyan);
  log('3. Run discovery: POST /api/discovery with {"action": "discover"}', colors.cyan);
  log('4. Use the MCP server: node mcp-server/database-mcp-server.ts', colors.cyan);
  
  log('\n📚 Documentation:', colors.blue);
  log('- Database setup: database/setup-database.md', colors.cyan);
  log('- API documentation: Check /api/discovery endpoint', colors.cyan);
  log('- MCP server tools: See mcp-server/database-mcp-server.ts', colors.cyan);
}

async function addSampleData(supabaseService: SupabaseService) {
  log('   Adding sample servers from mock data...', colors.cyan);
  
  let addedCount = 0;
  
  for (const mockServer of MOCK_MCP_SERVERS.slice(0, 5)) { // Add first 5 servers
    try {
      const serverData = {
        name: mockServer.name,
        description: mockServer.description,
        githubUrl: mockServer.githubUrl,
        category: mockServer.category,
        language: mockServer.language,
        tags: mockServer.tags,
        author: mockServer.author.name,
        stars: mockServer.stars
      };
      
      await supabaseService.insertMcpServer(serverData);
      addedCount++;
      log(`   ✅ Added: ${mockServer.name}`, colors.green);
      
    } catch (error) {
      log(`   ⚠️ Skipped ${mockServer.name}: ${error}`, colors.yellow);
    }
  }
  
  log(`✅ Added ${addedCount} sample servers`, colors.green);
}

async function testApiEndpoints() {
  const endpoints = [
    { path: '/api/discovery', method: 'GET', description: 'Discovery service status' },
    { path: '/api/admin/analytics', method: 'GET', description: 'System analytics' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`http://localhost:3000${endpoint.path}`);
      if (response.ok) {
        log(`   ✅ ${endpoint.method} ${endpoint.path} - ${endpoint.description}`, colors.green);
      } else {
        log(`   ⚠️ ${endpoint.method} ${endpoint.path} - Status ${response.status}`, colors.yellow);
      }
    } catch (error) {
      log(`   ❌ ${endpoint.method} ${endpoint.path} - Connection failed`, colors.red);
      log('      Make sure your development server is running', colors.yellow);
    }
  }
}

async function setupMcpServer() {
  log('   Setting up MCP server dependencies...', colors.cyan);
  
  try {
    // Check if MCP server directory exists
    const fs = await import('fs');
    const path = await import('path');
    
    const mcpServerPath = path.join(process.cwd(), 'mcp-server');
    
    if (fs.existsSync(mcpServerPath)) {
      log('   ✅ MCP server directory found', colors.green);
      log('   📦 Install dependencies: cd mcp-server && npm install', colors.cyan);
      log('   🚀 Run MCP server: node database-mcp-server.ts', colors.cyan);
    } else {
      log('   ⚠️ MCP server directory not found', colors.yellow);
    }
    
  } catch (error) {
    log(`   ⚠️ MCP server setup warning: ${error}`, colors.yellow);
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase().catch((error) => {
    log(`\n❌ Setup failed: ${error}`, colors.red);
    process.exit(1);
  });
}

export { setupDatabase };
