#!/usr/bin/env node

/**
 * MCP Server for Database Operations
 * Provides tools for managing the MCP Registry database
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SupabaseService } from '../src/lib/supabase-service.js';
import { McpDiscoveryService } from '../src/lib/mcp-discovery-service.js';

// Environment validation
function validateEnvironment() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Initialize services
function createServices() {
  validateEnvironment();
  
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

// Define available tools
const tools: Tool[] = [
  {
    name: 'list_servers',
    description: 'List MCP servers from the database with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category' },
        language: { type: 'string', description: 'Filter by programming language' },
        minStars: { type: 'number', description: 'Minimum GitHub stars' },
        limit: { type: 'number', description: 'Maximum number of results', default: 20 },
        search: { type: 'string', description: 'Search query for name/description' }
      }
    }
  },
  {
    name: 'get_server',
    description: 'Get detailed information about a specific MCP server',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Server ID' },
        githubUrl: { type: 'string', description: 'GitHub URL (alternative to ID)' }
      },
      required: ['id']
    }
  },
  {
    name: 'add_server',
    description: 'Add a new MCP server to the database',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Server name' },
        description: { type: 'string', description: 'Server description' },
        githubUrl: { type: 'string', description: 'GitHub repository URL' },
        category: { type: 'string', description: 'Server category' },
        language: { type: 'string', description: 'Programming language' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags' },
        author: { type: 'string', description: 'Author name' }
      },
      required: ['name', 'description', 'githubUrl']
    }
  },
  {
    name: 'update_server',
    description: 'Update an existing MCP server',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Server ID' },
        name: { type: 'string', description: 'Server name' },
        description: { type: 'string', description: 'Server description' },
        category: { type: 'string', description: 'Server category' },
        language: { type: 'string', description: 'Programming language' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags' }
      },
      required: ['id']
    }
  },
  {
    name: 'search_servers',
    description: 'Search MCP servers using full-text search',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        category: { type: 'string', description: 'Filter by category' },
        language: { type: 'string', description: 'Filter by language' },
        limit: { type: 'number', description: 'Maximum results', default: 10 }
      },
      required: ['query']
    }
  },
  {
    name: 'discover_servers',
    description: 'Run the discovery process to find new MCP servers',
    inputSchema: {
      type: 'object',
      properties: {
        sources: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Sources to scrape (mcp.so, github)',
          default: ['mcp.so', 'github']
        },
        batchSize: { type: 'number', description: 'Batch size for processing', default: 5 }
      }
    }
  },
  {
    name: 'process_enrichment_queue',
    description: 'Process pending enrichment jobs',
    inputSchema: {
      type: 'object',
      properties: {
        maxJobs: { type: 'number', description: 'Maximum jobs to process', default: 5 }
      }
    }
  },
  {
    name: 'get_analytics',
    description: 'Get database and system analytics',
    inputSchema: {
      type: 'object',
      properties: {
        includeDetails: { type: 'boolean', description: 'Include detailed breakdown', default: false }
      }
    }
  },
  {
    name: 'health_check',
    description: 'Check system health and service status',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'get_categories',
    description: 'List all available server categories',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

// Create and configure the server
const server = new Server(
  {
    name: 'mcp-registry-database',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const { supabaseService, discoveryService } = createServices();

    switch (name) {
      case 'list_servers': {
        const servers = await supabaseService.getAllMcpServers({
          category: args.category,
          language: args.language,
          minStars: args.minStars,
          limit: args.limit || 20
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: servers.length,
                servers: servers.map(s => ({
                  id: s.id,
                  name: s.name,
                  description: s.description,
                  category: s.category,
                  language: s.language,
                  stars: s.stars,
                  githubUrl: s.githubUrl,
                  tags: s.tags,
                  updatedAt: s.updated_at
                }))
              }, null, 2)
            }
          ]
        };
      }

      case 'get_server': {
        let server;
        if (args.id) {
          server = await supabaseService.getMcpServer(args.id);
        } else if (args.githubUrl) {
          server = await supabaseService.getMcpServerByGithubUrl(args.githubUrl);
        } else {
          throw new Error('Either id or githubUrl is required');
        }

        if (!server) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: 'Server not found' }, null, 2)
              }
            ]
          };
        }

        // Get enriched content and external resources
        const [enrichedContent, externalResources] = await Promise.all([
          supabaseService.getEnrichedContent(server.id),
          supabaseService.getExternalResources(server.id)
        ]);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                server,
                enrichedContent,
                externalResources
              }, null, 2)
            }
          ]
        };
      }

      case 'add_server': {
        const serverData = {
          name: args.name,
          description: args.description,
          githubUrl: args.githubUrl,
          category: args.category || 'web-interaction',
          language: args.language || 'Unknown',
          tags: args.tags || [],
          author: args.author || 'Unknown'
        };

        const newServer = await supabaseService.insertMcpServer(serverData);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Server added successfully',
                server: newServer
              }, null, 2)
            }
          ]
        };
      }

      case 'update_server': {
        const updates: any = {};
        if (args.name) updates.name = args.name;
        if (args.description) updates.description = args.description;
        if (args.category) updates.category = args.category;
        if (args.language) updates.language = args.language;
        if (args.tags) updates.tags = args.tags;

        const updatedServer = await supabaseService.updateMcpServer(args.id, updates);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Server updated successfully',
                server: updatedServer
              }, null, 2)
            }
          ]
        };
      }

      case 'search_servers': {
        const results = await supabaseService.searchServers(args.query, {
          category: args.category,
          language: args.language,
          limit: args.limit || 10
        });
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                query: args.query,
                count: results.length,
                results
              }, null, 2)
            }
          ]
        };
      }

      case 'discover_servers': {
        const result = await discoveryService.discoverAndProcessServers();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                discoveryResult: result
              }, null, 2)
            }
          ]
        };
      }

      case 'process_enrichment_queue': {
        await discoveryService.processEnrichmentQueue();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Enrichment queue processing started'
              }, null, 2)
            }
          ]
        };
      }

      case 'get_analytics': {
        const stats = await discoveryService.getDiscoveryStats();
        const health = await supabaseService.healthCheck();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                analytics: {
                  totalServers: stats.totalServers,
                  pendingJobs: stats.pendingEnrichmentJobs,
                  databaseHealth: health,
                  services: stats.services,
                  timestamp: new Date().toISOString()
                }
              }, null, 2)
            }
          ]
        };
      }

      case 'health_check': {
        const health = await supabaseService.healthCheck();
        const stats = await discoveryService.getDiscoveryStats();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                health: {
                  database: health,
                  services: stats.services,
                  environment: {
                    openai: !!process.env.OPENAI_API_KEY,
                    github: !!process.env.GITHUB_TOKEN,
                    serper: !!process.env.SERPER_API_KEY,
                    craw4ai: !!process.env.CRAW4AI_API_KEY
                  }
                }
              }, null, 2)
            }
          ]
        };
      }

      case 'get_categories': {
        // For now, return the categories from the codebase
        const categories = [
          'search', 'browser-automation', 'data-extraction', 
          'file-processing', 'api-integration', 'web-interaction', 
          'data-integration'
        ];
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                categories
              }, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }, null, 2)
        }
      ],
      isError: true
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Registry Database Server running on stdio');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Server error:', error);
    process.exit(1);
  });
}

export { server };
