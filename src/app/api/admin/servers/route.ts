// Admin API Route - Server Management
// GET /api/admin/servers - List all servers with admin controls
// POST /api/admin/servers - Add new server manually
// PUT /api/admin/servers/[id] - Update server
// DELETE /api/admin/servers/[id] - Delete server

import { NextRequest, NextResponse } from 'next/server';
import { SupabaseService } from '@/lib/supabase-service';

function createSupabaseService() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase configuration');
  }

  return new SupabaseService({
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  });
}

// GET - List all servers with admin metadata
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const search = searchParams.get('search');

    const supabase = createSupabaseService();
    
    let servers;
    if (search) {
      servers = await supabase.searchServers(search, {
        category: category || undefined,
        language: language || undefined,
        limit
      });
    } else {
      servers = await supabase.getAllMcpServers({
        category: category || undefined,
        language: language || undefined,
        limit,
        offset: (page - 1) * limit
      });
    }

    // Get enriched content and external resources for each server
    const enrichedServers = await Promise.all(
      servers.map(async (server) => {
        const [enrichedContent, externalResources] = await Promise.all([
          supabase.getEnrichedContent(server.id),
          supabase.getExternalResources(server.id)
        ]);

        return {
          ...server,
          enrichedContent,
          externalResources,
          externalResourceCount: externalResources.length,
          hasEnrichedContent: !!enrichedContent
        };
      })
    );

    return NextResponse.json({
      success: true,
      servers: enrichedServers,
      pagination: {
        page,
        limit,
        total: enrichedServers.length,
        hasMore: enrichedServers.length === limit
      },
      metadata: {
        totalServers: enrichedServers.length,
        categories: [...new Set(enrichedServers.map(s => s.category))],
        languages: [...new Set(enrichedServers.map(s => s.language))],
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Admin servers GET error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Add new server manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { githubUrl, name, description, category, tags, language, author } = body;

    // Validate required fields
    if (!githubUrl || !name) {
      return NextResponse.json(
        { success: false, error: 'GitHub URL and name are required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseService();

    // Check if server already exists
    const existingServer = await supabase.getMcpServerByGithubUrl(githubUrl);
    if (existingServer) {
      return NextResponse.json(
        { success: false, error: 'Server with this GitHub URL already exists' },
        { status: 409 }
      );
    }

    // Create server entry
    const serverData = {
      name,
      description: description || '',
      githubUrl,
      author: author || 'Unknown',
      tags: tags || [],
      category: category || 'web-interaction',
      language: language || 'Unknown'
    };

    const newServer = await supabase.insertMcpServer(serverData);

    // Add to enrichment queue for processing
    await supabase.addToEnrichmentQueue(newServer.id, 'manual', 'admin');

    return NextResponse.json({
      success: true,
      server: newServer,
      message: 'Server added successfully and queued for enrichment'
    });

  } catch (error) {
    console.error('❌ Admin servers POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update server
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description, category, tags, language } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Server ID is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseService();

    // Check if server exists
    const existingServer = await supabase.getMcpServer(id);
    if (!existingServer) {
      return NextResponse.json(
        { success: false, error: 'Server not found' },
        { status: 404 }
      );
    }

    // Update server
    const updates: any = {};
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (category) updates.category = category;
    if (tags) updates.tags = tags;
    if (language) updates.language = language;

    const updatedServer = await supabase.updateMcpServer(id, updates);

    // Add to enrichment queue if significant changes
    if (description || category || tags) {
      await supabase.addToEnrichmentQueue(id, 'manual', 'admin');
    }

    return NextResponse.json({
      success: true,
      server: updatedServer,
      message: 'Server updated successfully'
    });

  } catch (error) {
    console.error('❌ Admin servers PUT error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete server
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Server ID is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseService();

    // Check if server exists
    const existingServer = await supabase.getMcpServer(id);
    if (!existingServer) {
      return NextResponse.json(
        { success: false, error: 'Server not found' },
        { status: 404 }
      );
    }

    // Note: In a real implementation, you'd want to soft delete or archive
    // For now, we'll just return a message since we don't have a delete method
    return NextResponse.json({
      success: false,
      error: 'Delete functionality not implemented - use archive instead'
    }, { status: 501 });

  } catch (error) {
    console.error('❌ Admin servers DELETE error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
