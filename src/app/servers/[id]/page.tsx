'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { MOCK_MCP_SERVERS } from '@/data/mock-servers';
import { Star, Download, ExternalLink, Code, Copy, CheckCircle, Heart, ArrowLeft, Play, Book, Users, Calendar, GitBranch, ChevronDown, ChevronUp, Settings, Zap, Shield, FileText, Terminal, Package } from 'lucide-react';
import Link from 'next/link';

export default function ServerDetailsPage() {
  const params = useParams();
  const serverId = params.id as string;
  const server = MOCK_MCP_SERVERS.find(s => s.id === serverId);
  
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    features: true,
    configuration: false,
    examples: false,
    api: false,
    troubleshooting: false
  });

  if (!server) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Server Not Found</h1>
          <p className="text-neutral-600 mb-4">The server you're looking for doesn't exist.</p>
          <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof prev]
    }));
  };

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'TypeScript': 'bg-blue-50 text-blue-700 border-blue-200',
      'JavaScript': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Python': 'bg-green-50 text-green-700 border-green-200',
      'Java': 'bg-red-50 text-red-700 border-red-200',
      'Go': 'bg-cyan-50 text-cyan-700 border-cyan-200',
    };
    return colors[language] || 'bg-neutral-50 text-neutral-700 border-neutral-200';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'browser-automation': '🤖',
      'data-extraction': '📊',
      'api-integration': '🔗',
      'file-processing': '📄',
      'web-interaction': '🌐',
      'search': '🔍',
    };
    return icons[category] || '⚡';
  };

  // Smart related servers algorithm
  const getRelatedServers = (currentServer: any) => {
    if (!currentServer) return [];

    return MOCK_MCP_SERVERS
      .filter(s => s.id !== currentServer.id)
      .map(s => {
        let score = 0;

        // Same category gets highest score
        if (s.category === currentServer.category) score += 10;

        // Same language gets medium score
        if (s.language === currentServer.language) score += 5;

        // Shared tags get points
        const sharedTags = s.tags.filter(tag =>
          currentServer.tags.some((currentTag: string) =>
            currentTag.toLowerCase().includes(tag.toLowerCase()) ||
            tag.toLowerCase().includes(currentTag.toLowerCase())
          )
        );
        score += sharedTags.length * 2;

        // Similar star count (within 50% range) gets small bonus
        const starRatio = Math.min(s.stars, currentServer.stars) / Math.max(s.stars, currentServer.stars);
        if (starRatio > 0.5) score += 1;

        return { ...s, relevanceScore: score };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);
  };

  // Enhanced mock data for the server
  const serverDetails = {
    ...server,
    fullDescription: `${server?.description} This comprehensive MCP server provides enterprise-grade functionality with extensive customization options, robust error handling, and seamless integration capabilities. Built with modern best practices and designed for scalability.`,
    features: [
      {
        title: 'High-Performance Processing',
        description: 'Optimized algorithms ensure fast response times even with large datasets',
        icon: '⚡'
      },
      {
        title: 'Comprehensive Error Handling',
        description: 'Robust error detection and recovery mechanisms with detailed logging',
        icon: '🛡️'
      },
      {
        title: 'Extensive API Documentation',
        description: 'Complete API reference with interactive examples and code samples',
        icon: '📚'
      },
      {
        title: 'Cross-Platform Compatibility',
        description: 'Works seamlessly across Windows, macOS, and Linux environments',
        icon: '🌐'
      },
      {
        title: 'Active Community Support',
        description: 'Regular updates, community contributions, and responsive support',
        icon: '👥'
      },
      {
        title: 'Enterprise Security',
        description: 'Built-in security features and compliance with industry standards',
        icon: '🔒'
      }
    ],
    configuration: {
      environment: [
        { key: 'MCP_SERVER_PORT', value: '3000', description: 'Port for the MCP server to listen on' },
        { key: 'MCP_LOG_LEVEL', value: 'info', description: 'Logging level (debug, info, warn, error)' },
        { key: 'MCP_TIMEOUT', value: '30000', description: 'Request timeout in milliseconds' },
        { key: 'MCP_MAX_CONNECTIONS', value: '100', description: 'Maximum concurrent connections' }
      ],
      options: [
        { name: 'enableCaching', type: 'boolean', default: 'true', description: 'Enable response caching for better performance' },
        { name: 'retryAttempts', type: 'number', default: '3', description: 'Number of retry attempts for failed requests' },
        { name: 'batchSize', type: 'number', default: '50', description: 'Batch size for bulk operations' }
      ]
    },
    examples: [
      {
        title: 'Basic Usage',
        language: 'javascript',
        code: `import { MCPClient } from '@mcp/${server?.name}';

const client = new MCPClient({
  endpoint: 'http://localhost:3000',
  timeout: 30000
});

// Connect to the server
await client.connect();

// Execute a basic operation
const result = await client.execute({
  action: 'process',
  data: { input: 'Hello World' }
});

console.log(result);`
      },
      {
        title: 'Advanced Configuration',
        language: 'javascript',
        code: `const client = new MCPClient({
  endpoint: 'http://localhost:3000',
  options: {
    enableCaching: true,
    retryAttempts: 5,
    batchSize: 100
  },
  auth: {
    apiKey: process.env.MCP_API_KEY
  }
});

// Batch processing
const results = await client.batch([
  { action: 'process', data: { input: 'Item 1' } },
  { action: 'process', data: { input: 'Item 2' } },
  { action: 'process', data: { input: 'Item 3' } }
]);`
      }
    ],
    api: {
      endpoints: [
        {
          method: 'POST',
          path: '/api/process',
          description: 'Process input data and return results',
          parameters: [
            { name: 'input', type: 'string', required: true, description: 'Input data to process' },
            { name: 'options', type: 'object', required: false, description: 'Processing options' }
          ],
          response: {
            type: 'object',
            properties: {
              success: 'boolean',
              data: 'any',
              timestamp: 'string'
            }
          }
        },
        {
          method: 'GET',
          path: '/api/status',
          description: 'Get server status and health information',
          parameters: [],
          response: {
            type: 'object',
            properties: {
              status: 'string',
              uptime: 'number',
              connections: 'number'
            }
          }
        }
      ]
    },
    troubleshooting: [
      {
        issue: 'Connection timeout errors',
        solution: 'Increase the timeout value in your configuration or check network connectivity',
        code: 'MCP_TIMEOUT=60000'
      },
      {
        issue: 'High memory usage',
        solution: 'Reduce batch size or enable streaming for large datasets',
        code: 'batchSize: 25, enableStreaming: true'
      },
      {
        issue: 'Authentication failures',
        solution: 'Verify your API key is correctly set in environment variables',
        code: 'export MCP_API_KEY=your_api_key_here'
      }
    ]
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'installation', label: 'Installation', icon: Download },
    { id: 'playground', label: 'Playground', icon: Play },
    { id: 'community', label: 'Community', icon: Users },
  ];

  // Collapsible Section Component
  const CollapsibleSection = ({
    id,
    title,
    icon: Icon,
    children,
    defaultExpanded = false
  }: {
    id: string;
    title: string;
    icon: any;
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections[id as keyof typeof expandedSections] ?? defaultExpanded;

    return (
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-6 hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Icon className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-bold text-neutral-900">{title}</h3>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-600" />
          )}
        </button>
        {isExpanded && (
          <div className="px-6 pb-6 border-t border-neutral-100">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Browserr</h1>
                <p className="text-sm text-neutral-600">MCP Server Directory</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">Browse</Link>
              <Link href="/categories" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">Categories</Link>
              <Link href="/submit" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">Submit</Link>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                Sign In
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center space-x-2 text-sm">
            <Link href="/" className="text-neutral-600 hover:text-neutral-800">Home</Link>
            <span className="text-neutral-600">/</span>
            <Link href="/servers" className="text-neutral-600 hover:text-neutral-800">Servers</Link>
            <span className="text-neutral-600">/</span>
            <span className="text-neutral-900 font-medium">{server.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-6">
              <div className="w-20 h-20 bg-neutral-100 rounded-xl flex items-center justify-center text-3xl">
                {getCategoryIcon(server.category)}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-neutral-900">{server.name}</h1>
                  <span className={`px-3 py-1 rounded-md text-sm font-medium border ${getLanguageColor(server.language)}`}>
                    {server.language}
                  </span>
                </div>
                <p className="text-lg text-neutral-600 mb-4 max-w-3xl">{server.description}</p>
                <div className="flex items-center space-x-6 text-sm text-neutral-600">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{server.stars.toLocaleString()} stars</span>
                  </div>
                  <div className="flex items-center">
                    <GitBranch className="w-4 h-4 mr-1 text-neutral-600" />
                    <span>MIT License</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1 text-neutral-600" />
                    <span>Updated 2 days ago</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Server Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleCopy(server.installCommand)}
                className="p-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                title="Copy install command"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Copy className="w-5 h-5 text-neutral-600" />
                )}
              </button>
              <a
                href={server.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                title="View on GitHub"
              >
                <ExternalLink className="w-5 h-5 text-neutral-600" />
              </a>
              <button className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                <Download className="w-5 h-5 mr-2" />
                Install
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${
                    activeTab === tab.id
                      ? 'text-primary-600'
                      : 'text-neutral-600'
                  }`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* About */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4">About</h2>
                    <p className="text-neutral-700 leading-relaxed">
                      {serverDetails.fullDescription}
                    </p>
                  </div>

                  {/* Key Features */}
                  <CollapsibleSection id="features" title="Key Features" icon={Zap} defaultExpanded={true}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {serverDetails.features.map((feature, index) => (
                        <div key={index} className="flex items-start space-x-3 p-4 bg-neutral-50 rounded-lg">
                          <span className="text-2xl">{feature.icon}</span>
                          <div>
                            <h4 className="font-semibold text-neutral-900 mb-1">{feature.title}</h4>
                            <p className="text-sm text-neutral-600">{feature.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Configuration */}
                  <CollapsibleSection id="configuration" title="Configuration" icon={Settings}>
                    <div className="mt-4 space-y-6">
                      <div>
                        <h4 className="font-semibold text-neutral-900 mb-3">Environment Variables</h4>
                        <div className="space-y-3">
                          {serverDetails.configuration.environment.map((env, index) => (
                            <div key={index} className="flex items-start justify-between p-3 bg-neutral-50 rounded-lg">
                              <div className="flex-1">
                                <code className="text-sm font-mono text-primary-600">{env.key}</code>
                                <p className="text-sm text-neutral-600 mt-1">{env.description}</p>
                              </div>
                              <code className="text-sm font-mono bg-neutral-200 px-2 py-1 rounded text-neutral-900">{env.value}</code>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-neutral-900 mb-3">Configuration Options</h4>
                        <div className="space-y-3">
                          {serverDetails.configuration.options.map((option, index) => (
                            <div key={index} className="flex items-start justify-between p-3 bg-neutral-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <code className="text-sm font-mono text-primary-600">{option.name}</code>
                                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{option.type}</span>
                                </div>
                                <p className="text-sm text-neutral-600 mt-1">{option.description}</p>
                              </div>
                              <code className="text-sm font-mono bg-neutral-200 px-2 py-1 rounded text-neutral-900">{option.default}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CollapsibleSection>

                  {/* Code Examples */}
                  <CollapsibleSection id="examples" title="Code Examples" icon={Code}>
                    <div className="mt-4 space-y-6">
                      {serverDetails.examples.map((example, index) => (
                        <div key={index}>
                          <h4 className="font-semibold text-neutral-900 mb-3">{example.title}</h4>
                          <div className="bg-neutral-900 rounded-lg p-4 relative">
                            <pre className="text-green-400 text-sm font-mono overflow-x-auto">
                              <code>{example.code}</code>
                            </pre>
                            <button
                              onClick={() => handleCopy(example.code)}
                              className="absolute top-2 right-2 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                            >
                              {copied ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-neutral-300" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* API Reference */}
                  <CollapsibleSection id="api" title="API Reference" icon={FileText}>
                    <div className="mt-4 space-y-4">
                      {serverDetails.api.endpoints.map((endpoint, index) => (
                        <div key={index} className="border border-neutral-200 rounded-lg p-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                              endpoint.method === 'GET' ? 'bg-green-100 text-green-700' :
                              endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {endpoint.method}
                            </span>
                            <code className="font-mono text-sm text-neutral-900">{endpoint.path}</code>
                          </div>
                          <p className="text-neutral-600 mb-3">{endpoint.description}</p>

                          {endpoint.parameters.length > 0 && (
                            <div className="mb-3">
                              <h5 className="font-medium text-neutral-900 mb-2">Parameters</h5>
                              <div className="space-y-2">
                                {endpoint.parameters.map((param, paramIndex) => (
                                  <div key={paramIndex} className="flex items-start space-x-3 text-sm">
                                    <code className="font-mono text-primary-600">{param.name}</code>
                                    <span className="text-xs bg-neutral-100 px-2 py-1 rounded">{param.type}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${param.required ? 'bg-red-100 text-red-700' : 'bg-neutral-100 text-neutral-600'}`}>
                                      {param.required ? 'required' : 'optional'}
                                    </span>
                                    <span className="text-neutral-600">{param.description}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div>
                            <h5 className="font-medium text-neutral-900 mb-2">Response</h5>
                            <div className="bg-neutral-50 rounded p-3">
                              <code className="text-sm font-mono text-neutral-900">
                                {JSON.stringify(endpoint.response, null, 2)}
                              </code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Troubleshooting */}
                  <CollapsibleSection id="troubleshooting" title="Troubleshooting" icon={Shield}>
                    <div className="mt-4 space-y-4">
                      {serverDetails.troubleshooting.map((item, index) => (
                        <div key={index} className="border border-neutral-200 rounded-lg p-4">
                          <h4 className="font-semibold text-neutral-900 mb-2">{item.issue}</h4>
                          <p className="text-neutral-600 mb-3">{item.solution}</p>
                          <div className="bg-neutral-900 rounded p-3">
                            <code className="text-green-400 text-sm font-mono">{item.code}</code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Tags */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4">Tags</h2>
                    <div className="flex flex-wrap gap-2">
                      {server.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-md bg-neutral-100 text-neutral-700 text-sm hover:bg-neutral-200 transition-colors cursor-pointer"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'installation' && (
                <div className="space-y-6">
                  {/* Quick Install */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                      <Package className="w-5 h-5 mr-2 text-primary-600" />
                      Quick Install
                    </h2>
                    <div className="bg-neutral-900 rounded-lg p-4 relative">
                      <code className="text-green-400 text-sm font-mono">{server.installCommand}</code>
                      <button
                        onClick={() => handleCopy(server.installCommand)}
                        className="absolute top-2 right-2 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-neutral-300" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* System Requirements */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">System Requirements</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-3">Minimum Requirements</h4>
                        <ul className="space-y-2 text-neutral-700">
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                            Node.js 16+ or Python 3.8+
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                            512MB RAM minimum
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                            100MB disk space
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-primary-500 rounded-full mr-3"></span>
                            Network access for API calls
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-3">Recommended</h4>
                        <ul className="space-y-2 text-neutral-700">
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                            Node.js 18+ or Python 3.10+
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                            2GB RAM for optimal performance
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                            SSD storage
                          </li>
                          <li className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                            Stable internet connection
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Installation Steps */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Step-by-Step Installation</h3>
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-900 mb-2">Install the package</h4>
                          <div className="bg-neutral-900 rounded-lg p-3">
                            <code className="text-green-400 text-sm font-mono">{server.installCommand}</code>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-900 mb-2">Configure environment variables</h4>
                          <div className="bg-neutral-900 rounded-lg p-3">
                            <code className="text-green-400 text-sm font-mono">
                              export MCP_SERVER_PORT=3000<br/>
                              export MCP_LOG_LEVEL=info<br/>
                              export MCP_API_KEY=your_api_key_here
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-900 mb-2">Start the server</h4>
                          <div className="bg-neutral-900 rounded-lg p-3">
                            <code className="text-green-400 text-sm font-mono">
                              {server.language === 'TypeScript' || server.language === 'JavaScript'
                                ? 'npm start'
                                : 'python -m mcp_server'}
                            </code>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-neutral-900 mb-2">Verify installation</h4>
                          <div className="bg-neutral-900 rounded-lg p-3">
                            <code className="text-green-400 text-sm font-mono">curl http://localhost:3000/api/status</code>
                          </div>
                          <p className="text-sm text-neutral-600 mt-2">
                            You should receive a JSON response with server status information.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Docker Installation */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Docker Installation</h3>
                    <p className="text-neutral-600 mb-4">
                      For containerized deployment, use our official Docker image:
                    </p>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Pull the image</h4>
                        <div className="bg-neutral-900 rounded-lg p-3">
                          <code className="text-green-400 text-sm font-mono">
                            docker pull mcp/{server.name}:latest
                          </code>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">Run the container</h4>
                        <div className="bg-neutral-900 rounded-lg p-3">
                          <code className="text-green-400 text-sm font-mono">
                            docker run -d -p 3000:3000 \<br/>
                            &nbsp;&nbsp;-e MCP_API_KEY=your_key \<br/>
                            &nbsp;&nbsp;--name mcp-{server.name} \<br/>
                            &nbsp;&nbsp;mcp/{server.name}:latest
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Troubleshooting */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Installation Troubleshooting</h3>
                    <div className="space-y-4">
                      <div className="border-l-4 border-yellow-400 pl-4">
                        <h4 className="font-medium text-neutral-900">Permission denied errors</h4>
                        <p className="text-sm text-neutral-600 mt-1">
                          Try running with sudo or use a Node version manager like nvm.
                        </p>
                      </div>
                      <div className="border-l-4 border-red-400 pl-4">
                        <h4 className="font-medium text-neutral-900">Port already in use</h4>
                        <p className="text-sm text-neutral-600 mt-1">
                          Change the port using MCP_SERVER_PORT environment variable.
                        </p>
                      </div>
                      <div className="border-l-4 border-blue-400 pl-4">
                        <h4 className="font-medium text-neutral-900">Network connectivity issues</h4>
                        <p className="text-sm text-neutral-600 mt-1">
                          Check firewall settings and ensure the required ports are open.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'playground' && (
                <div className="space-y-6">
                  {/* API Tester */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                      <Play className="w-5 h-5 mr-2 text-primary-600" />
                      API Playground
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Request Panel */}
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-3">Request</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-neutral-900 mb-2">Endpoint</label>
                            <select className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                              <option>POST /api/process</option>
                              <option>GET /api/status</option>
                              <option>GET /api/health</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-neutral-900 mb-2">Request Body</label>
                            <textarea
                              rows={8}
                              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                              placeholder={`{
  "input": "Hello World",
  "options": {
    "format": "json",
    "timeout": 30000
  }
}`}
                            />
                          </div>

                          <button className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                            Send Request
                          </button>
                        </div>
                      </div>

                      {/* Response Panel */}
                      <div>
                        <h3 className="font-semibold text-neutral-900 mb-3">Response</h3>
                        <div className="bg-neutral-900 rounded-lg p-4 h-80 overflow-auto">
                          <pre className="text-green-400 text-sm font-mono">
{`{
  "success": true,
  "data": {
    "processed": "Hello World",
    "timestamp": "2024-01-15T10:30:00Z",
    "processingTime": 125
  },
  "metadata": {
    "version": "1.0.0",
    "requestId": "req_123456"
  }
}`}
                          </pre>
                        </div>
                        <div className="mt-2 text-sm text-neutral-600">
                          Status: <span className="text-green-600 font-medium">200 OK</span> |
                          Time: <span className="font-medium">125ms</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Examples */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Examples</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button className="p-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-left">
                        <h4 className="font-medium text-neutral-900 mb-2">Basic Processing</h4>
                        <p className="text-sm text-neutral-600">Simple text processing example</p>
                        <code className="text-xs text-primary-600 mt-2 block">POST /api/process</code>
                      </button>

                      <button className="p-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-left">
                        <h4 className="font-medium text-neutral-900 mb-2">Batch Operation</h4>
                        <p className="text-sm text-neutral-600">Process multiple items at once</p>
                        <code className="text-xs text-primary-600 mt-2 block">POST /api/batch</code>
                      </button>

                      <button className="p-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-left">
                        <h4 className="font-medium text-neutral-900 mb-2">Health Check</h4>
                        <p className="text-sm text-neutral-600">Check server status and health</p>
                        <code className="text-xs text-primary-600 mt-2 block">GET /api/health</code>
                      </button>

                      <button className="p-4 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors text-left">
                        <h4 className="font-medium text-neutral-900 mb-2">Configuration</h4>
                        <p className="text-sm text-neutral-600">Get current server configuration</p>
                        <code className="text-xs text-primary-600 mt-2 block">GET /api/config</code>
                      </button>
                    </div>
                  </div>

                  {/* SDK Examples */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">SDK Examples</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-neutral-900">JavaScript/TypeScript</h4>
                          <button className="text-sm text-primary-600 hover:text-primary-700">Copy</button>
                        </div>
                        <div className="bg-neutral-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm font-mono overflow-x-auto">
{`import { MCPClient } from '@mcp/${server.name}';

const client = new MCPClient('http://localhost:3000');
const result = await client.process('Hello World');
console.log(result);`}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-neutral-900">Python</h4>
                          <button className="text-sm text-primary-600 hover:text-primary-700">Copy</button>
                        </div>
                        <div className="bg-neutral-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm font-mono overflow-x-auto">
{`from mcp_client import MCPClient

client = MCPClient('http://localhost:3000')
result = client.process('Hello World')
print(result)`}
                          </pre>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-neutral-900">cURL</h4>
                          <button className="text-sm text-primary-600 hover:text-primary-700">Copy</button>
                        </div>
                        <div className="bg-neutral-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm font-mono overflow-x-auto">
{`curl -X POST http://localhost:3000/api/process \\
  -H "Content-Type: application/json" \\
  -d '{"input": "Hello World"}'`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'community' && (
                <div className="space-y-6">
                  {/* GitHub Repository */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-primary-600" />
                      Community & Development
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                          <div>
                            <h3 className="font-semibold text-neutral-900">GitHub Repository</h3>
                            <p className="text-sm text-neutral-600">Source code, issues, and contributions</p>
                          </div>
                          <a
                            href={server.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            GitHub
                          </a>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                          <div>
                            <h3 className="font-semibold text-neutral-900">Documentation</h3>
                            <p className="text-sm text-neutral-600">Complete guides and API reference</p>
                          </div>
                          <a
                            href="#"
                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Book className="w-4 h-4 mr-1" />
                            Docs
                          </a>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                          <div>
                            <h3 className="font-semibold text-neutral-900">Discord Community</h3>
                            <p className="text-sm text-neutral-600">Chat with users and developers</p>
                          </div>
                          <a
                            href="#"
                            className="inline-flex items-center px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Discord
                          </a>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 border border-neutral-200 rounded-lg">
                          <h3 className="font-semibold text-neutral-900 mb-3">Repository Stats</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-neutral-600">Stars</span>
                              <span className="font-medium">{server.stars.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600">Forks</span>
                              <span className="font-medium">{Math.floor(server.stars / 10)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600">Issues</span>
                              <span className="font-medium">{Math.floor(server.stars / 50)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-neutral-600">Contributors</span>
                              <span className="font-medium">{Math.floor(server.stars / 100) + 1}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 border border-neutral-200 rounded-lg">
                          <h3 className="font-semibold text-neutral-900 mb-3">Recent Activity</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-neutral-600">Bug fix in v1.2.3</span>
                              <span className="text-neutral-600">2d ago</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-neutral-600">New feature added</span>
                              <span className="text-neutral-600">5d ago</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-neutral-600">Documentation update</span>
                              <span className="text-neutral-600">1w ago</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contributing */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Contributing</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-4 border border-neutral-200 rounded-lg">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Code className="w-6 h-6 text-green-600" />
                        </div>
                        <h4 className="font-medium text-neutral-900 mb-2">Code Contributions</h4>
                        <p className="text-sm text-neutral-600 mb-3">
                          Submit pull requests with bug fixes or new features
                        </p>
                        <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          Contribution Guide →
                        </a>
                      </div>

                      <div className="text-center p-4 border border-neutral-200 rounded-lg">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <h4 className="font-medium text-neutral-900 mb-2">Documentation</h4>
                        <p className="text-sm text-neutral-600 mb-3">
                          Help improve guides, examples, and API documentation
                        </p>
                        <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          Edit Docs →
                        </a>
                      </div>

                      <div className="text-center p-4 border border-neutral-200 rounded-lg">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Shield className="w-6 h-6 text-orange-600" />
                        </div>
                        <h4 className="font-medium text-neutral-900 mb-2">Report Issues</h4>
                        <p className="text-sm text-neutral-600 mb-3">
                          Found a bug or have a feature request? Let us know
                        </p>
                        <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          Report Issue →
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Maintainers */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">Maintainers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white font-bold">
                          JD
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-900">John Doe</h4>
                          <p className="text-sm text-neutral-600">Lead Maintainer</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          AS
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-900">Alice Smith</h4>
                          <p className="text-sm text-neutral-600">Core Developer</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                          BJ
                        </div>
                        <div>
                          <h4 className="font-medium text-neutral-900">Bob Johnson</h4>
                          <p className="text-sm text-neutral-600">Documentation</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* License */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-4">License</h3>
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-neutral-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-neutral-900 mb-2">MIT License</h4>
                        <p className="text-neutral-600 text-sm mb-3">
                          This project is licensed under the MIT License - see the LICENSE file for details.
                          You are free to use, modify, and distribute this software.
                        </p>
                        <a
                          href="#"
                          className="inline-flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View License
                        </a>
                      </div>
                    </div>
                  </div>
              </div>
            )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => handleCopy(server.installCommand)}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install Now
                  </button>
                  <button
                    onClick={() => setActiveTab('playground')}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-lg hover:bg-neutral-200 transition-colors"
                  >
                    <Code className="w-4 h-4 mr-2 text-neutral-700" />
                    Try in Playground
                  </button>
                  <a
                    href={server.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2 text-neutral-700" />
                    View Source
                  </a>
                </div>
              </div>

              {/* Server Statistics */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">GitHub Stars</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-neutral-900">{server.stars.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Weekly Downloads</span>
                    <span className="font-medium text-neutral-900">{(server.stars * 0.8).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Downloads</span>
                    <span className="font-medium text-neutral-900">{(server.stars * 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Last Updated</span>
                    <span className="font-medium text-neutral-900">2 days ago</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">License</span>
                    <span className="font-medium text-neutral-900">MIT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Language</span>
                    <span className="font-medium text-neutral-900">{server.language}</span>
                  </div>
                </div>
              </div>

              {/* Version Information */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Version Info</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Current Version</span>
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-mono">v2.1.3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Release Date</span>
                    <span className="text-neutral-900 text-sm">Dec 15, 2024</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-neutral-600">Release Notes:</span>
                    <ul className="mt-2 space-y-1 text-neutral-700">
                      <li>• Bug fixes and performance improvements</li>
                      <li>• Enhanced error handling</li>
                      <li>• New API endpoints</li>
                    </ul>
                  </div>
                  <a href="#" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View all releases →
                  </a>
                </div>
              </div>

              {/* Dependencies */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Dependencies</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Runtime</span>
                    <span className="text-neutral-900 text-sm">Node.js 16+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-600">Package Manager</span>
                    <span className="text-neutral-900 text-sm">npm, yarn, pnpm</span>
                  </div>
                  <div>
                    <span className="text-neutral-600 text-sm">Key Dependencies:</span>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <code className="text-primary-600">playwright</code>
                        <span className="text-neutral-700">^1.40.0</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <code className="text-primary-600">express</code>
                        <span className="text-neutral-700">^4.18.0</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <code className="text-primary-600">winston</code>
                        <span className="text-neutral-700">^3.8.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Related Servers */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Related Servers</h3>
                <div className="space-y-3">
                  {getRelatedServers(server).map((relatedServer) => (
                    <Link key={relatedServer.id} href={`/servers/${relatedServer.id}`}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer">
                        <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-sm">
                          {getCategoryIcon(relatedServer.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">{relatedServer.name}</p>
                          <p className="text-xs text-neutral-600 truncate">{relatedServer.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{relatedServer.language}</span>
                            <span className="text-xs text-neutral-700">{relatedServer.stars.toLocaleString()} ⭐</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Support & Community */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Support & Community</h3>
                <div className="space-y-3">
                  <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Documentation</p>
                      <p className="text-xs text-neutral-600">Complete guides & API reference</p>
                    </div>
                  </a>
                  <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Discord Community</p>
                      <p className="text-xs text-neutral-600">Chat with 2.5K+ developers</p>
                    </div>
                  </a>
                  <a href="#" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Report Issues</p>
                      <p className="text-xs text-neutral-600">Bug reports & feature requests</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
