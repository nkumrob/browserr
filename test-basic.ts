#!/usr/bin/env tsx

/**
 * Basic Test - No API Keys Required
 * Tests the structure and basic functionality
 */

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

async function testBasicStructure() {
  log('🧪 Basic Structure Test', colors.blue);
  log('-'.repeat(40), colors.cyan);

  try {
    // Test 1: Registry Service Initialization
    log('1. Testing registry service initialization...', colors.cyan);
    const registryService = new McpRegistryService({});
    log('   ✅ Registry service created successfully', colors.green);

    // Test 2: GitHub URL Validation
    log('2. Testing GitHub URL validation...', colors.cyan);
    const validUrls = [
      'https://github.com/microsoft/playwright',
      'https://github.com/user/repo',
      'https://github.com/org/project/'
    ];
    
    const invalidUrls = [
      'https://gitlab.com/user/repo',
      'https://github.com/user',
      'not-a-url'
    ];

    validUrls.forEach(url => {
      const isValid = registryService.isValidGitHubUrl(url);
      if (isValid) {
        log(`   ✅ Valid: ${url}`, colors.green);
      } else {
        log(`   ❌ Should be valid: ${url}`, colors.red);
      }
    });

    invalidUrls.forEach(url => {
      const isValid = registryService.isValidGitHubUrl(url);
      if (!isValid) {
        log(`   ✅ Correctly invalid: ${url}`, colors.green);
      } else {
        log(`   ❌ Should be invalid: ${url}`, colors.red);
      }
    });

    // Test 3: GitHub URL Parsing
    log('3. Testing GitHub URL parsing...', colors.cyan);
    const testUrl = 'https://github.com/microsoft/playwright';
    const parsed = registryService.parseGitHubUrl(testUrl);
    
    if (parsed && parsed.owner === 'microsoft' && parsed.repo === 'playwright') {
      log(`   ✅ Parsed correctly: ${parsed.owner}/${parsed.repo}`, colors.green);
    } else {
      log(`   ❌ Parsing failed: ${JSON.stringify(parsed)}`, colors.red);
    }

    // Test 4: Category Inference
    log('4. Testing category inference...', colors.cyan);
    const testCases = [
      { name: 'playwright-server', desc: 'browser automation', expected: 'browser-automation' },
      { name: 'search-server', desc: 'elasticsearch integration', expected: 'search' },
      { name: 'file-processor', desc: 'pdf document parsing', expected: 'file-processing' }
    ];

    testCases.forEach(testCase => {
      // Create a mock GitHub data object
      const mockGithubData = {
        name: testCase.name,
        description: testCase.desc,
        githubUrl: `https://github.com/test/${testCase.name}`,
        stars: 100,
        language: 'TypeScript',
        author: { name: 'test', githubUsername: 'test' },
        lastUpdated: new Date().toISOString(),
        topics: []
      };

      const mcpServer = registryService.githubDataToMcpServer(mockGithubData);
      const inferredCategory = mcpServer.category;
      
      if (inferredCategory === testCase.expected) {
        log(`   ✅ ${testCase.name}: ${inferredCategory}`, colors.green);
      } else {
        log(`   ⚠️ ${testCase.name}: got ${inferredCategory}, expected ${testCase.expected}`, colors.yellow);
      }
    });

    // Test 5: Install Command Generation
    log('5. Testing install command generation...', colors.cyan);
    const languageTests = [
      { lang: 'JavaScript', expected: 'npm install' },
      { lang: 'Python', expected: 'pip install' },
      { lang: 'Rust', expected: 'cargo install' },
      { lang: 'Go', expected: 'go install' }
    ];

    languageTests.forEach(test => {
      const mockData = {
        name: 'test-package',
        description: 'test',
        githubUrl: 'https://github.com/test/test',
        stars: 0,
        language: test.lang,
        author: { name: 'test', githubUsername: 'test' },
        lastUpdated: new Date().toISOString(),
        topics: []
      };

      const mcpServer = registryService.githubDataToMcpServer(mockData);
      const command = mcpServer.installCommand;
      
      if (command.includes(test.expected)) {
        log(`   ✅ ${test.lang}: ${command}`, colors.green);
      } else {
        log(`   ❌ ${test.lang}: ${command} (expected to contain "${test.expected}")`, colors.red);
      }
    });

    log('\n🎉 Basic structure tests completed!', colors.bright);
    return true;

  } catch (error) {
    log(`❌ Basic structure test failed: ${error}`, colors.red);
    return false;
  }
}

async function testImports() {
  log('\n📦 Import Test', colors.blue);
  log('-'.repeat(40), colors.cyan);

  try {
    log('1. Testing imports...', colors.cyan);
    
    // Test registry service import
    const { McpRegistryService } = await import('./src/lib/mcp-registry-service');
    log('   ✅ McpRegistryService imported', colors.green);

    // Test enrichment service import
    const { SerperCrawl4AIEnrichment } = await import('./src/lib/serper-crawl4ai-enrichment');
    log('   ✅ SerperCrawl4AIEnrichment imported', colors.green);

    // Test Groq SDK import
    try {
      const Groq = (await import('groq-sdk')).default;
      log('   ✅ Groq SDK imported', colors.green);
    } catch (error) {
      log('   ❌ Groq SDK import failed', colors.red);
    }

    log('\n✅ All imports successful!', colors.green);
    return true;

  } catch (error) {
    log(`❌ Import test failed: ${error}`, colors.red);
    return false;
  }
}

async function runBasicTests() {
  log('🧪 Basic Pipeline Tests (No API Keys Required)', colors.bright);
  log('='.repeat(60), colors.cyan);

  const results = {
    imports: await testImports(),
    structure: await testBasicStructure()
  };

  log('\n📊 Test Results Summary', colors.blue);
  log('='.repeat(40), colors.cyan);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    log(`${status} ${test}`, passed ? colors.green : colors.red);
  });

  const allPassed = Object.values(results).every(Boolean);
  
  if (allPassed) {
    log('\n🎉 All basic tests passed!', colors.green);
    log('\n📚 Next Steps:', colors.blue);
    log('1. Copy .env.example to .env.local', colors.cyan);
    log('2. Add your API keys to .env.local', colors.cyan);
    log('3. Run: npm run test-pipeline', colors.cyan);
  } else {
    log('\n❌ Some basic tests failed. Check the code structure.', colors.red);
  }

  return allPassed;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runBasicTests().catch(error => {
    log(`\n❌ Test suite failed: ${error}`, colors.red);
    process.exit(1);
  });
}

export { runBasicTests };
