// Simple test script for the E2E API
const fetch = require('node-fetch');

async function testAPI() {
  console.log('🚀 Testing E2E Pipeline API...\n');
  
  const testUrl = 'https://github.com/cheeriojs/cheerio';
  
  try {
    console.log(`📡 Testing with: ${testUrl}`);
    console.log('⏳ Processing...\n');
    
    const response = await fetch('http://localhost:3001/api/process-repo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        githubUrl: testUrl
      }),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ SUCCESS! Server processed successfully:\n');
      console.log('📊 Server Details:');
      console.log(`   Name: ${data.server.name}`);
      console.log(`   Description: ${data.server.description}`);
      console.log(`   Category: ${data.server.category}`);
      console.log(`   Language: ${data.server.language}`);
      console.log(`   Stars: ${data.server.stars}`);
      console.log(`   Tags: ${data.server.tags.join(', ')}`);
      console.log(`   Install: ${data.server.installCommand}`);
      console.log(`   Author: ${data.server.author.name}\n`);
      
      console.log('⚡ Processing Metadata:');
      console.log(`   Processing Time: ${data.metadata.processingTime}ms`);
      console.log(`   Tokens Used: ${data.metadata.tokensUsed}`);
      console.log(`   Cache Hit: ${data.metadata.cacheHit}\n`);
      
      console.log('🎉 E2E Pipeline Test PASSED!');
      console.log('🌟 This server would now appear in the featured sections!');
      
    } else {
      console.log('❌ FAILED:', data.error);
    }
    
  } catch (error) {
    console.log('💥 ERROR:', error.message);
  }
}

testAPI();
