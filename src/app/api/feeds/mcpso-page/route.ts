// RSS Feed API Route - MCP.so Page Updates
// GET /api/feeds/mcpso-page - RSS feed for MCP.so page changes

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase-service';
import { McpDiscoveryService } from '@/lib/mcp-discovery-service';

function createServices() {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];
  
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  const supabaseService = new SupabaseService({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  });

  const discoveryService = new McpDiscoveryService({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    githubToken: process.env.GITHUB_TOKEN,
    serperApiKey: process.env.SERPER_API_KEY,
    craw4aiApiKey: process.env.CRAW4AI_API_KEY,
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!
  });

  return { supabaseService, discoveryService };
}

// GET - Generate RSS feed for MCP.so page updates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type') || 'all'; // all, new, updated

    const { discoveryService } = createServices();

    // Generate RSS feed
    const rssFeed = await discoveryService.generateRssFeed();

    // Set appropriate headers for RSS
    const headers = new Headers();
    headers.set('Content-Type', 'application/rss+xml; charset=utf-8');
    headers.set('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    return new NextResponse(rssFeed, { headers });

  } catch (error) {
    console.error('❌ RSS feed generation error:', error);
    
    // Return error as RSS feed
    const errorFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>MCP Registry - Error</title>
    <description>Error generating RSS feed</description>
    <link>https://your-domain.com</link>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <item>
      <title>RSS Feed Error</title>
      <description>Failed to generate RSS feed: ${error instanceof Error ? error.message : 'Unknown error'}</description>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  </channel>
</rss>`;

    const headers = new Headers();
    headers.set('Content-Type', 'application/rss+xml; charset=utf-8');
    
    return new NextResponse(errorFeed, { 
      status: 500,
      headers 
    });
  }
}
