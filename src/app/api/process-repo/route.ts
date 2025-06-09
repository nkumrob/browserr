import { NextRequest, NextResponse } from 'next/server';
import { GitHubService } from '@/lib/github-service';
import { MistralEnrichmentService } from '@/lib/mistral-enrichment-service';

export async function POST(request: NextRequest) {
  try {
    const { githubUrl, forceRefresh = false } = await request.json();

    if (!githubUrl) {
      return NextResponse.json(
        { success: false, error: 'GitHub URL is required' },
        { status: 400 }
      );
    }

    // Validate GitHub URL format
    const githubUrlPattern = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/?$/;
    if (!githubUrlPattern.test(githubUrl)) {
      return NextResponse.json(
        { success: false, error: 'Invalid GitHub URL format' },
        { status: 400 }
      );
    }

    // Check if we have required environment variables
    if (!process.env.MISTRAL_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'MISTRAL_API_KEY not configured' },
        { status: 500 }
      );
    }

    const startTime = Date.now();

    // Initialize services
    const githubService = new GitHubService({
      token: process.env.GITHUB_TOKEN,
      scrapingDogApiKey: process.env.SCRAPINGDOG_API_KEY
    });

    const enrichmentService = new MistralEnrichmentService({
      apiKey: process.env.MISTRAL_API_KEY!,
      scrapingDogApiKey: process.env.SCRAPINGDOG_API_KEY
    });

    // Extract repository data from GitHub
    console.log('Extracting repository data from:', githubUrl);
    const repoData = await githubService.extractRepositoryData(githubUrl);

    if (!repoData.success) {
      return NextResponse.json(
        { success: false, error: repoData.error },
        { status: 400 }
      );
    }

    console.log('Repository data extracted:', repoData.data?.name);

    // Enrich data with AI
    console.log('Enriching data with Groq AI...');
    const enrichedData = await enrichmentService.enrichServerData(repoData.data);

    if (!enrichedData.success) {
      return NextResponse.json(
        { success: false, error: enrichedData.error },
        { status: 500 }
      );
    }

    console.log('Data enriched successfully');

    // Generate unique ID
    const newId = Date.now().toString();

    // Create new server object (ensure our ID overwrites any existing ID)
    const newServer = {
      ...enrichedData.server,
      id: newId,  // Put ID after spread to ensure it's not overwritten
      githubUrl,
      createdAt: new Date().toISOString()
    };

    const processingTime = Date.now() - startTime;

    console.log('Server processed successfully!');

    return NextResponse.json({
      success: true,
      server: newServer,
      metadata: {
        processingTime,
        tokensUsed: enrichedData.tokensUsed || 0,
        cacheHit: false
      }
    });

  } catch (error) {
    console.error('Error processing repository:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
