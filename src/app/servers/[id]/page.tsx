'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MOCK_MCP_SERVERS } from '@/data/mock-servers';
import { Star, Download, ExternalLink, Code, Copy, CheckCircle, Heart, ArrowLeft, Play, Book, Users, Calendar, GitBranch, ChevronDown, ChevronUp, Settings, Zap, Shield, FileText, Terminal, Package, TrendingUp, AlertTriangle, HelpCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';

// Get processed servers from localStorage
function getProcessedServers() {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem('mcp-processed-servers');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load processed servers:', error);
    return [];
  }
}

export default function ServerDetailsPage() {
  const params = useParams();
  const serverId = params.id as string;

  // All useState hooks must be declared before any conditional returns
  const [allServers, setAllServers] = useState([...MOCK_MCP_SERVERS]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSections, setExpandedSections] = useState({
    features: true,
    resources: false,
    examples: false
  });

  // Load processed servers and combine with mock servers
  useEffect(() => {
    const processedServers = getProcessedServers();
    setAllServers([...processedServers, ...MOCK_MCP_SERVERS]);
    setIsLoading(false);
  }, []);

  const server = allServers.find(s => s.id === serverId);

  // Debug: Log server data to console
  if (server) {
    console.log('🔍 Server found:', server.name);
    console.log('📊 Server data:', server);
    console.log('🎯 Has preserved_content:', !!server.preserved_content);
    if (server.preserved_content) {
      console.log('📋 Preserved content keys:', Object.keys(server.preserved_content));
      console.log('🎨 Features structure:', server.preserved_content.features);
    }
  }

  // Show loading state while we check for processed servers
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Loading Server...</h1>
          <p className="text-neutral-600">Checking for processed servers...</p>
        </div>
      </div>
    );
  }

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

  // Safe content renderer for handling both strings and objects
  const renderSafeContent = (content: any): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (typeof content === 'object' && content !== null) {
      // If it's an object, try to extract meaningful content
      if (content.details) return content.details;
      if (content.summary) return content.summary;
      if (content.content) return content.content;
      // If it has nested structure, convert to readable format
      return JSON.stringify(content, null, 2);
    }
    return String(content || '');
  };

  // Enhanced content renderer that formats markdown for human readability
  const renderFormattedContent = (content: any): JSX.Element => {
    const textContent = renderSafeContent(content);

    // Split content into sections
    const sections = textContent.split(/(?=###\s)/g).filter(section => section.trim());

    return (
      <div className="space-y-6">
        {sections.map((section, index) => {
          const lines = section.trim().split('\n');
          const elements: JSX.Element[] = [];
          let currentCodeBlock = '';
          let inCodeBlock = false;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Handle code blocks
            if (line.startsWith('```')) {
              if (inCodeBlock) {
                // End of code block
                elements.push(
                  <div key={`code-${i}`} className="bg-neutral-900 rounded-lg p-4 my-4">
                    <pre className="text-green-400 text-sm font-mono overflow-x-auto">
                      <code>{currentCodeBlock.trim()}</code>
                    </pre>
                  </div>
                );
                currentCodeBlock = '';
                inCodeBlock = false;
              } else {
                // Start of code block
                inCodeBlock = true;
              }
              continue;
            }

            if (inCodeBlock) {
              currentCodeBlock += line + '\n';
              continue;
            }

            // Handle headers
            if (line.startsWith('### Q:') || line.startsWith('### Problem:')) {
              const headerText = line.replace(/^### /, '').replace(/\*\*/g, '');
              elements.push(
                <h3 key={`header-${i}`} className="text-lg font-semibold text-neutral-900 mt-6 mb-3">
                  {headerText}
                </h3>
              );
            } else if (line.startsWith('**Solution:**') || line.startsWith('A:')) {
              const answerText = line.replace(/^\*\*Solution:\*\*\s*/, '').replace(/^A:\s*/, '');
              if (answerText) {
                elements.push(
                  <div key={`answer-${i}`} className="text-neutral-700 mb-3 pl-4 border-l-4 border-blue-200 bg-blue-50 p-3 rounded-r-lg">
                    {answerText}
                  </div>
                );
              }
            } else if (line.startsWith('**Code Example:**')) {
              elements.push(
                <div key={`code-label-${i}`} className="text-sm font-medium text-neutral-600 mt-3 mb-2">
                  Code Example:
                </div>
              );
            } else if (line.match(/^\d+\./)) {
              // Numbered list items
              const listText = line.replace(/^\d+\.\s*/, '');
              elements.push(
                <div key={`list-${i}`} className="text-neutral-700 ml-4 mb-2 flex">
                  <span className="text-blue-600 font-medium mr-2">{line.match(/^\d+/)?.[0]}.</span>
                  <span>{listText}</span>
                </div>
              );
            } else if (line.startsWith('-') || line.startsWith('*')) {
              // Bullet list items
              const listText = line.replace(/^[-*]\s*/, '');
              elements.push(
                <div key={`bullet-${i}`} className="text-neutral-700 ml-4 mb-2 flex">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>{listText}</span>
                </div>
              );
            } else if (line && !line.startsWith('#')) {
              // Regular text
              elements.push(
                <p key={`text-${i}`} className="text-neutral-700 mb-3 leading-relaxed">
                  {line}
                </p>
              );
            }
          }

          return (
            <div key={`section-${index}`} className="border-b border-neutral-100 pb-6 last:border-b-0">
              {elements}
            </div>
          );
        })}
      </div>
    );
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

  // Use preserved original features from README - DIRECT DISPLAY
  const generateRealFeatures = (server: any) => {
    if (!server) return [];

    const preservedContent = server.preserved_content;

    // Use preserved features from README first - DIRECT DISPLAY
    if (preservedContent?.features?.detailed_features) {
      const featuresText = preservedContent.features.detailed_features;

      if (typeof featuresText === 'string' && featuresText.length > 0) {
        const featureLines = featuresText.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•');
        });

        if (featureLines.length > 0) {
          return featureLines.map((line, index) => {
            // Clean up the line and extract meaningful content
            let cleanLine = line.replace(/^[\*\-•]\s*/, '').trim();

            // Extract title and description from markdown links
            const linkMatch = cleanLine.match(/^(.+?)\s*\[([^\]]+)\]\([^)]+\)(.*)$/);
            let title, description;

            if (linkMatch) {
              title = (linkMatch[1] + linkMatch[2] + linkMatch[3]).trim();
              description = 'Feature from Axios documentation';
            } else {
              // Handle special cases like the emoji feature
              if (cleanLine.includes('🆕')) {
                title = cleanLine;
                description = 'New feature in latest version';
              } else {
                title = cleanLine;
                description = 'Core Axios functionality';
              }
            }

            return {
              icon: ['🚀', '⚡', '🔧', '📊', '🎯', '💡', '🔒', '🌐', '✨'][index % 9],
              title: title || `Feature ${index + 1}`,
              description: description || 'Feature from repository documentation'
            };
          });
        }
      }
    }

    // Fallback to category-based features if no preserved features
    const categoryFeatures: Record<string, any[]> = {
      'data-extraction': [
        { title: 'HTML/XML Parsing', description: 'Parse and extract data from HTML and XML documents', icon: '📄' },
        { title: 'CSS Selectors', description: 'Use familiar CSS selectors to target specific elements', icon: '🎯' },
        { title: 'jQuery-like API', description: 'Familiar jQuery-style syntax for easy adoption', icon: '💎' },
        { title: 'Server-side DOM', description: 'Manipulate DOM elements on the server side', icon: '🖥️' }
      ],
      'browser-automation': [
        { title: 'Cross-browser Support', description: 'Works with Chrome, Firefox, Safari, and Edge', icon: '🌐' },
        { title: 'Headless Mode', description: 'Run browsers in headless mode for CI/CD pipelines', icon: '👻' },
        { title: 'Screenshot Capture', description: 'Take screenshots and generate PDFs', icon: '📸' },
        { title: 'Network Interception', description: 'Monitor and modify network requests', icon: '🕸️' }
      ],
      'api-integration': [
        { title: 'RESTful APIs', description: 'Easy integration with REST APIs', icon: '🔗' },
        { title: 'Authentication', description: 'Support for various auth methods', icon: '🔐' },
        { title: 'Rate Limiting', description: 'Built-in rate limiting and retry logic', icon: '⏱️' },
        { title: 'Response Caching', description: 'Intelligent response caching', icon: '💾' }
      ],
      'web-interaction': [
        { title: 'Component-based', description: 'Build reusable UI components', icon: '🧩' },
        { title: 'Virtual DOM', description: 'Efficient DOM updates with virtual DOM', icon: '⚡' },
        { title: 'State Management', description: 'Powerful state management capabilities', icon: '📊' },
        { title: 'Developer Tools', description: 'Excellent debugging and development tools', icon: '🛠️' }
      ],
      'file-processing': [
        { title: 'Type Safety', description: 'Strong typing for better code quality', icon: '🛡️' },
        { title: 'Compilation', description: 'Compile to optimized JavaScript', icon: '⚙️' },
        { title: 'IDE Support', description: 'Excellent IDE integration and autocomplete', icon: '💻' },
        { title: 'Modern Syntax', description: 'Latest JavaScript features and syntax', icon: '✨' }
      ]
    };

    const features = categoryFeatures[server.category] || [
      { title: 'Open Source', description: 'Free and open source software', icon: '🔓' },
      { title: 'Community Driven', description: 'Active community support and contributions', icon: '👥' },
      { title: 'Well Documented', description: 'Comprehensive documentation and examples', icon: '📚' },
      { title: 'Production Ready', description: 'Battle-tested in production environments', icon: '🚀' }
    ];

    return features.slice(0, 4); // Show top 4 features
  };

  // Generate external resources with real extracted links
  const generateExternalResources = (server: any) => {
    if (!server) return [];

    const resources = [];
    const extractedResources = server.extracted_resources;

    // Use real extracted documentation links first
    if (extractedResources?.documentation_links?.length) {
      extractedResources.documentation_links.forEach((url: string, index: number) => {
        resources.push({
          title: `Documentation ${index > 0 ? index + 1 : ''}`.trim(),
          description: 'Official documentation and guides',
          url: url,
          icon: '📚',
          type: 'docs'
        });
      });
    } else {
      // Fallback to GitHub README
      resources.push({
        title: 'Documentation',
        description: 'Official documentation and guides',
        url: `${server.githubUrl}#readme`,
        icon: '📚',
        type: 'docs'
      });
    }

    // Use real extracted tutorial links
    if (extractedResources?.tutorial_links?.length) {
      extractedResources.tutorial_links.forEach((url: string, index: number) => {
        resources.push({
          title: `Tutorial ${index > 0 ? index + 1 : ''}`.trim(),
          description: 'Step-by-step learning guides',
          url: url,
          icon: '🎓',
          type: 'tutorial'
        });
      });
    }

    // Use real extracted example links
    if (extractedResources?.example_links?.length) {
      extractedResources.example_links.forEach((url: string, index: number) => {
        resources.push({
          title: `Examples ${index > 0 ? index + 1 : ''}`.trim(),
          description: 'Real-world usage examples',
          url: url,
          icon: '💡',
          type: 'examples'
        });
      });
    }

    // Use real extracted demo links
    if (extractedResources?.demo_links?.length) {
      extractedResources.demo_links.forEach((url: string, index: number) => {
        resources.push({
          title: `Live Demo ${index > 0 ? index + 1 : ''}`.trim(),
          description: 'Interactive demonstration',
          url: url,
          icon: '🚀',
          type: 'demo'
        });
      });
    }

    // Always include GitHub Repository
    resources.push({
      title: 'GitHub Repository',
      description: 'Source code, issues, and contributions',
      url: server.githubUrl,
      icon: '📁',
      type: 'repository'
    });

    // Issues & Support
    resources.push({
      title: 'Issues & Support',
      description: 'Report bugs and get help',
      url: `${server.githubUrl}/issues`,
      icon: '🐛',
      type: 'support'
    });

    // Add NPM link if it's a JavaScript/TypeScript package
    if (server.language === 'JavaScript' || server.language === 'TypeScript') {
      const packageName = server.name?.toLowerCase() || server.githubUrl?.split('/').pop();
      resources.push({
        title: 'NPM Package',
        description: 'Install via npm or yarn',
        url: `https://www.npmjs.com/package/${packageName}`,
        icon: '📦',
        type: 'package'
      });
    }

    // Add PyPI link if it's a Python package
    if (server.language === 'Python') {
      const packageName = server.name?.toLowerCase() || server.githubUrl?.split('/').pop();
      resources.push({
        title: 'PyPI Package',
        description: 'Install via pip',
        url: `https://pypi.org/project/${packageName}`,
        icon: '🐍',
        type: 'package'
      });
    }

    return resources;
  };

  // Use preserved original content for examples
  const generateRealExamples = (server: any) => {
    if (!server) return [];

    const preservedContent = server.preserved_content;
    const extractedResources = server.extracted_resources;

    // Use preserved usage examples first
    if (preservedContent?.usage_examples) {
      // Parse the preserved usage examples (handling both old and new formats)
      const examples = [];

      // Add installation from preserved content
      if (preservedContent.installation_instructions) {
        let installCode = server.installCommand || `npm install ${server.name?.toLowerCase()}`;

        // Handle structured installation instructions
        if (typeof preservedContent.installation_instructions === 'object') {
          installCode = preservedContent.installation_instructions.package_managers ||
                       preservedContent.installation_instructions.summary ||
                       installCode;
        } else if (typeof preservedContent.installation_instructions === 'string') {
          installCode = preservedContent.installation_instructions;
        }

        examples.push({
          title: 'Installation',
          language: 'bash',
          code: installCode
        });
      }

      // Add usage examples from preserved content
      if (preservedContent.usage_examples) {
        let usageCode = '';

        // Handle structured usage examples
        if (typeof preservedContent.usage_examples === 'object') {
          usageCode = preservedContent.usage_examples.basic_examples ||
                     preservedContent.usage_examples.advanced_examples ||
                     preservedContent.usage_examples.summary ||
                     'No usage examples available';
        } else {
          usageCode = preservedContent.usage_examples;
        }

        examples.push({
          title: 'Usage Example',
          language: server.language?.toLowerCase() || 'javascript',
          code: usageCode
        });
      }

      return examples;
    }

    // Use real extracted code examples if preserved content not available
    if (extractedResources?.code_examples?.length) {
      const realExamples = extractedResources.code_examples.map((example: any) => ({
        title: example.title,
        language: example.language,
        code: example.code
      }));

      // Add installation example if we have real installation section
      if (extractedResources.installation_section) {
        realExamples.unshift({
          title: 'Installation',
          language: 'bash',
          code: server.installCommand || extractedResources.installation_section
        });
      }

      return realExamples;
    }

    // Fallback to category-based examples only if no preserved or extracted content
    const examples: Record<string, any[]> = {
      'cheerio': [
        {
          title: 'Installation',
          language: 'bash',
          code: `npm install cheerio`
        },
        {
          title: 'Basic HTML Parsing',
          language: 'javascript',
          code: `const cheerio = require('cheerio');

// Load HTML
const $ = cheerio.load('<h2 class="title">Hello world</h2>');

// Select elements
$('.title').text(); // "Hello world"
$('.title').addClass('welcome');

// Get the HTML
$.html(); // <h2 class="title welcome">Hello world</h2>`
        },
        {
          title: 'Web Scraping Example',
          language: 'javascript',
          code: `const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeData(url) {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const results = [];
  $('article').each((i, element) => {
    results.push({
      title: $(element).find('h2').text(),
      link: $(element).find('a').attr('href')
    });
  });

  return results;
}`
        }
      ],
      'data-extraction': [
        {
          title: 'Installation',
          language: 'bash',
          code: server.installCommand || `npm install ${server.name?.toLowerCase()}`
        },
        {
          title: 'Basic Usage',
          language: 'javascript',
          code: `const ${server.name?.toLowerCase()} = require('${server.name?.toLowerCase()}');

// Extract data from HTML
const data = ${server.name?.toLowerCase()}.extract(htmlContent);
console.log(data);`
        }
      ],
      'browser-automation': [
        {
          title: 'Installation',
          language: 'bash',
          code: server.installCommand || `npm install ${server.name?.toLowerCase()}`
        },
        {
          title: 'Basic Browser Automation',
          language: 'javascript',
          code: `const { chromium } = require('${server.name?.toLowerCase()}');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://example.com');

  // Take screenshot
  await page.screenshot({ path: 'example.png' });

  await browser.close();
})();`
        }
      ],
      'web-interaction': [
        {
          title: 'Installation',
          language: 'bash',
          code: server.installCommand || `npm install ${server.name?.toLowerCase()}`
        },
        {
          title: 'Basic Component',
          language: 'javascript',
          code: `import ${server.name} from '${server.name?.toLowerCase()}';

function App() {
  return (
    <div>
      <h1>Hello ${server.name}!</h1>
    </div>
  );
}

export default App;`
        }
      ]
    };

    // Use specific examples if available, otherwise use category-based examples
    const serverExamples = examples[server.name?.toLowerCase()] || examples[server.category] || [
      {
        title: 'Installation',
        language: 'bash',
        code: server.installCommand || `npm install ${server.name?.toLowerCase()}`
      },
      {
        title: 'Basic Usage',
        language: server.language?.toLowerCase() === 'typescript' ? 'typescript' : 'javascript',
        code: `// Basic usage example for ${server.name}
import ${server.name} from '${server.name?.toLowerCase()}';

// Initialize and use the library
const instance = new ${server.name}();
console.log(instance);`
      }
    ];

    return serverExamples;
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

  // Use real server data with preserved original content
  const serverDetails = {
    ...server,
    fullDescription: server?.preserved_content?.full_description || server?.description || 'No description available.',
    features: generateRealFeatures(server),
    externalResources: generateExternalResources(server),
    examples: generateRealExamples(server)
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'installation', label: 'Installation', icon: Download },
    { id: 'api', label: 'API', icon: Code },
    { id: 'playground', label: 'Playground', icon: Play },
    { id: 'resources', label: 'Resources', icon: FileText },
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
                  {/* Action icons moved closer to title */}
                  <div className="flex items-center space-x-2 ml-2">
                    <button
                      onClick={() => handleCopy(server.installCommand)}
                      className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                      title="Copy install command"
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-neutral-600" />
                      )}
                    </button>
                    <a
                      href={server.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                      title="View on GitHub"
                    >
                      <ExternalLink className="w-4 h-4 text-neutral-600" />
                    </a>
                  </div>
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

            {/* Install Button */}
            <div className="flex items-center">
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

                    {/* Clean Description */}
                    <div className="space-y-4">
                      <p className="text-neutral-700 leading-relaxed text-lg">
                        {server.description}
                      </p>

                      {/* Show preserved README overview if available */}
                      {server.preserved_content?.overview && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                            <span className="mr-2">📋</span>
                            From Repository README
                          </h4>
                          <div className="text-blue-800 text-sm leading-relaxed">
                            {typeof server.preserved_content.overview === 'string'
                              ? server.preserved_content.overview
                                  .replace(/<[^>]*>/g, '') // Remove HTML tags
                                  .slice(0, 800) + (server.preserved_content.overview.length > 800 ? '...' : '')
                              : 'Repository overview available'
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Key Features */}
                  <CollapsibleSection id="features" title="Key Features" icon={Zap} defaultExpanded={true}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {generateRealFeatures(server).map((feature, index) => (
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



                  {/* Code Examples moved to Installation tab */}


                  {/* FAQ Section */}
                  {server.preserved_content?.faq && (
                    <CollapsibleSection id="faq" title="Frequently Asked Questions" icon={HelpCircle} defaultExpanded={false}>
                      <div className="mt-4 space-y-4">
                        {typeof server.preserved_content.faq === 'object' ? (
                          <>
                            {server.preserved_content.faq.summary && (
                              <p className="text-neutral-700">{server.preserved_content.faq.summary}</p>
                            )}
                            {server.preserved_content.faq.details && (
                              <div className="max-w-none">
                                {renderFormattedContent(server.preserved_content.faq.details)}
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            {renderFormattedContent(server.preserved_content.faq)}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Tutorials Section */}
                  {server.preserved_content?.tutorials && (
                    <CollapsibleSection id="tutorials" title="Tutorials & Guides" icon={BookOpen} defaultExpanded={false}>
                      <div className="mt-4 space-y-4">
                        {typeof server.preserved_content.tutorials === 'object' ? (
                          <>
                            {server.preserved_content.tutorials.summary && (
                              <p className="text-neutral-700">{server.preserved_content.tutorials.summary}</p>
                            )}
                            {server.preserved_content.tutorials.details && (
                              <div className="prose prose-neutral max-w-none">
                                <div className="text-neutral-700 whitespace-pre-wrap">
                                  {renderSafeContent(server.preserved_content.tutorials.details)}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-neutral-700 whitespace-pre-wrap">
                            {renderSafeContent(server.preserved_content.tutorials)}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Troubleshooting Section */}
                  {server.preserved_content?.troubleshooting && (
                    <CollapsibleSection id="troubleshooting" title="Troubleshooting" icon={AlertTriangle} defaultExpanded={false}>
                      <div className="mt-4 space-y-4">
                        {typeof server.preserved_content.troubleshooting === 'object' ? (
                          <>
                            {server.preserved_content.troubleshooting.summary && (
                              <p className="text-neutral-700">{server.preserved_content.troubleshooting.summary}</p>
                            )}
                            {server.preserved_content.troubleshooting.details && (
                              <div className="max-w-none">
                                {renderFormattedContent(server.preserved_content.troubleshooting.details)}
                              </div>
                            )}
                          </>
                        ) : (
                          <div>
                            {renderFormattedContent(server.preserved_content.troubleshooting)}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Performance Section */}
                  {server.preserved_content?.performance && (
                    <CollapsibleSection id="performance" title="Performance & Optimization" icon={Zap} defaultExpanded={false}>
                      <div className="mt-4 space-y-4">
                        {typeof server.preserved_content.performance === 'object' ? (
                          <>
                            {server.preserved_content.performance.summary && (
                              <p className="text-neutral-700">{server.preserved_content.performance.summary}</p>
                            )}
                            {server.preserved_content.performance.details && (
                              <div className="prose prose-neutral max-w-none">
                                <div className="text-neutral-700 whitespace-pre-wrap">
                                  {renderSafeContent(server.preserved_content.performance.details)}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-neutral-700 whitespace-pre-wrap">
                            {renderSafeContent(server.preserved_content.performance)}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Security Section */}
                  {server.preserved_content?.security && (
                    <CollapsibleSection id="security" title="Security & Best Practices" icon={Shield} defaultExpanded={false}>
                      <div className="mt-4 space-y-4">
                        {typeof server.preserved_content.security === 'object' ? (
                          <>
                            {server.preserved_content.security.summary && (
                              <p className="text-neutral-700">{server.preserved_content.security.summary}</p>
                            )}
                            {server.preserved_content.security.details && (
                              <div className="prose prose-neutral max-w-none">
                                <div className="text-neutral-700 whitespace-pre-wrap">
                                  {renderSafeContent(server.preserved_content.security.details)}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-neutral-700 whitespace-pre-wrap">
                            {renderSafeContent(server.preserved_content.security)}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Testing Section */}
                  {server.preserved_content?.testing && (
                    <CollapsibleSection id="testing" title="Testing & Quality" icon={CheckCircle} defaultExpanded={false}>
                      <div className="mt-4 space-y-4">
                        {typeof server.preserved_content.testing === 'object' ? (
                          <>
                            {server.preserved_content.testing.summary && (
                              <p className="text-neutral-700">{server.preserved_content.testing.summary}</p>
                            )}
                            {server.preserved_content.testing.details && (
                              <div className="prose prose-neutral max-w-none">
                                <div className="text-neutral-700 whitespace-pre-wrap">
                                  {renderSafeContent(server.preserved_content.testing.details)}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-neutral-700 whitespace-pre-wrap">
                            {renderSafeContent(server.preserved_content.testing)}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Changelog Section */}
                  {server.preserved_content?.changelog && (
                    <CollapsibleSection id="changelog" title="Changelog & Releases" icon={GitBranch} defaultExpanded={false}>
                      <div className="mt-4 space-y-4">
                        {typeof server.preserved_content.changelog === 'object' ? (
                          <>
                            {server.preserved_content.changelog.summary && (
                              <p className="text-neutral-700">{server.preserved_content.changelog.summary}</p>
                            )}
                            {server.preserved_content.changelog.details && (
                              <div className="prose prose-neutral max-w-none">
                                <div className="text-neutral-700 whitespace-pre-wrap">
                                  {renderSafeContent(server.preserved_content.changelog.details)}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-neutral-700 whitespace-pre-wrap">
                            {renderSafeContent(server.preserved_content.changelog)}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* Contributing Section */}
                  {server.preserved_content?.contributing && (
                    <CollapsibleSection id="contributing" title="Contributing" icon={Users} defaultExpanded={false}>
                      <div className="mt-4 space-y-4">
                        <div className="text-neutral-700 whitespace-pre-wrap">
                          {renderSafeContent(server.preserved_content.contributing)}
                        </div>
                      </div>
                    </CollapsibleSection>
                  )}

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
                  {/* Real Installation Instructions from Preserved Content */}
                  {server.preserved_content?.installation_instructions && (
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                      <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                        <Package className="w-5 h-5 mr-2 text-primary-600" />
                        Installation Instructions
                      </h2>
                      <div className="prose prose-neutral max-w-none">
                        {typeof server.preserved_content.installation_instructions === 'object' ? (
                          <div className="space-y-6">
                            {/* Summary */}
                            {server.preserved_content.installation_instructions.summary && (
                              <p className="text-neutral-700">{server.preserved_content.installation_instructions.summary}</p>
                            )}

                            {/* Package Managers */}
                            {server.preserved_content.installation_instructions.package_managers && (
                              <div>
                                <h3 className="text-lg font-semibold text-neutral-900 mb-3">Package Managers</h3>
                                <div className="bg-neutral-900 rounded-lg p-4 relative">
                                  <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                    {server.preserved_content.installation_instructions.package_managers}
                                  </pre>
                                  <button
                                    onClick={() => handleCopy(server.preserved_content.installation_instructions.package_managers)}
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
                            )}

                            {/* CDN Options */}
                            {server.preserved_content.installation_instructions.cdn_options && (
                              <div>
                                <h3 className="text-lg font-semibold text-neutral-900 mb-3">CDN Options</h3>
                                <div className="bg-neutral-900 rounded-lg p-4 relative">
                                  <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                    {server.preserved_content.installation_instructions.cdn_options}
                                  </pre>
                                  <button
                                    onClick={() => handleCopy(server.preserved_content.installation_instructions.cdn_options)}
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
                            )}
                          </div>
                        ) : (
                          <div className="bg-neutral-900 rounded-lg p-4 relative">
                            <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                              {server.preserved_content.installation_instructions}
                            </pre>
                            <button
                              onClick={() => handleCopy(server.preserved_content.installation_instructions)}
                              className="absolute top-2 right-2 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                            >
                              {copied ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-neutral-300" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quick Install Fallback */}
                  {!server.preserved_content?.installation_instructions && (
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
                  )}

                  {/* Real Usage Examples in Installation Tab */}
                  {server.preserved_content?.usage_examples && (
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                      <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                        <Code className="w-5 h-5 mr-2 text-primary-600" />
                        Usage Examples
                      </h2>
                      <div className="space-y-6">
                        {typeof server.preserved_content.usage_examples === 'object' ? (
                          <div className="space-y-6">
                            {/* Basic Examples */}
                            {server.preserved_content.usage_examples.basic_examples && (
                              <div>
                                <h3 className="text-lg font-semibold text-neutral-900 mb-3">Basic Examples</h3>
                                <div className="bg-neutral-900 rounded-lg p-4 relative">
                                  <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                    {server.preserved_content.usage_examples.basic_examples}
                                  </pre>
                                  <button
                                    onClick={() => handleCopy(server.preserved_content.usage_examples.basic_examples)}
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
                            )}

                            {/* Advanced Examples */}
                            {server.preserved_content.usage_examples.advanced_examples && (
                              <div>
                                <h3 className="text-lg font-semibold text-neutral-900 mb-3">Advanced Examples</h3>
                                <div className="bg-neutral-900 rounded-lg p-4 relative">
                                  <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                                    {server.preserved_content.usage_examples.advanced_examples}
                                  </pre>
                                  <button
                                    onClick={() => handleCopy(server.preserved_content.usage_examples.advanced_examples)}
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
                            )}
                          </div>
                        ) : (
                          <div className="bg-neutral-900 rounded-lg p-4 relative">
                            <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                              {server.preserved_content.usage_examples}
                            </pre>
                            <button
                              onClick={() => handleCopy(server.preserved_content.usage_examples)}
                              className="absolute top-2 right-2 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                            >
                              {copied ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-neutral-300" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* System Requirements - only show if no preserved content */}
                  {!server.preserved_content?.installation_instructions && (
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
                  )}

                  {/* Generic installation content - only show if no preserved content */}
                  {!server.preserved_content?.installation_instructions && (
                    <>
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
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'api' && (
                <div className="space-y-6">
                  {/* API Documentation from Preserved Content */}
                  {server.preserved_content?.api_documentation && (
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                      <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                        <Code className="w-5 h-5 mr-2 text-primary-600" />
                        API Documentation
                      </h2>

                      {/* Summary */}
                      {server.preserved_content.api_documentation.summary && (
                        <div className="mb-6">
                          <p className="text-neutral-700">{server.preserved_content.api_documentation.summary}</p>
                        </div>
                      )}

                      {/* API Methods */}
                      {server.preserved_content.api_documentation.methods && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-neutral-900 mb-4">API Methods</h3>
                          <div className="bg-neutral-900 rounded-lg p-4">
                            <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                              {server.preserved_content.api_documentation.methods}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Endpoints */}
                      {server.preserved_content.api_documentation.endpoints && (
                        <div>
                          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Available Endpoints</h3>
                          <div className="bg-neutral-900 rounded-lg p-4">
                            <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                              {server.preserved_content.api_documentation.endpoints}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Additional API Sections */}
                  {server.preserved_content?.request_config && (
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                      <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                        <Settings className="w-5 h-5 mr-2 text-primary-600" />
                        Request Configuration
                      </h2>
                      <div className="prose prose-neutral max-w-none">
                        <div className="bg-neutral-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                            {typeof server.preserved_content.request_config === 'object'
                              ? server.preserved_content.request_config.details
                              : server.preserved_content.request_config}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {server.preserved_content?.response_schema && (
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                      <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-primary-600" />
                        Response Schema
                      </h2>
                      <div className="prose prose-neutral max-w-none">
                        <div className="bg-neutral-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                            {typeof server.preserved_content.response_schema === 'object'
                              ? server.preserved_content.response_schema.details
                              : server.preserved_content.response_schema}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {server.preserved_content?.interceptors && (
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                      <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-primary-600" />
                        Interceptors
                      </h2>
                      <div className="prose prose-neutral max-w-none">
                        <div className="bg-neutral-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                            {typeof server.preserved_content.interceptors === 'object'
                              ? server.preserved_content.interceptors.details
                              : server.preserved_content.interceptors}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {server.preserved_content?.error_handling && (
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                      <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2 text-primary-600" />
                        Error Handling
                      </h2>
                      <div className="prose prose-neutral max-w-none">
                        <div className="bg-neutral-900 rounded-lg p-4">
                          <pre className="text-green-400 text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                            {typeof server.preserved_content.error_handling === 'object'
                              ? server.preserved_content.error_handling.details
                              : server.preserved_content.error_handling}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Fallback API Documentation */}
                  {!server.preserved_content?.api_documentation && (
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                      <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                        <Code className="w-5 h-5 mr-2 text-primary-600" />
                        API Documentation
                      </h2>
                      <p className="text-neutral-600 mb-4">
                        API documentation is not available in the preserved content. Please refer to the official documentation.
                      </p>
                      <a
                        href={`${server.githubUrl}#api`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View API Documentation
                      </a>
                    </div>
                  )}
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

              {activeTab === 'resources' && (
                <div className="space-y-6">
                  {/* Documentation */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-primary-600" />
                      Documentation & Guides
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <a href={`${server.githubUrl}#readme`} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-3 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Book className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">Getting Started Guide</h3>
                          <p className="text-sm text-neutral-600 mt-1">Complete setup and installation instructions</p>
                        </div>
                      </a>
                      <a href={`${server.githubUrl}#api`} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-3 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Code className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">API Reference</h3>
                          <p className="text-sm text-neutral-600 mt-1">Detailed API documentation with examples</p>
                        </div>
                      </a>
                      <a href={`${server.githubUrl}/wiki`} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-3 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Terminal className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">Wiki & Guides</h3>
                          <p className="text-sm text-neutral-600 mt-1">Community wiki and advanced guides</p>
                        </div>
                      </a>
                      <a href={`${server.githubUrl}/tree/main/examples`} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-3 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-neutral-900">Examples & Tutorials</h3>
                          <p className="text-sm text-neutral-600 mt-1">Real-world examples and step-by-step tutorials</p>
                        </div>
                      </a>
                    </div>
                  </div>

                  {/* Video Resources */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                      <Play className="w-5 h-5 mr-2 text-primary-600" />
                      Video Resources
                    </h2>
                    <div className="space-y-4">
                      {server.extracted_resources?.video_links?.length > 0 ? (
                        // Show real extracted video links
                        server.extracted_resources.video_links.map((videoUrl: string, index: number) => (
                          <a key={index} href={videoUrl} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-4 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                            <div className="w-16 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                              <Play className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-neutral-900">
                                {videoUrl.includes('youtube.com') ? 'YouTube Video' :
                                 videoUrl.includes('vimeo.com') ? 'Vimeo Video' :
                                 'Video Tutorial'} {index > 0 ? index + 1 : ''}
                              </h3>
                              <p className="text-sm text-neutral-600 mt-1">Real video tutorial found in repository documentation</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                                <span className="truncate max-w-xs">{videoUrl}</span>
                                <span>•</span>
                                <span>Direct link</span>
                              </div>
                            </div>
                          </a>
                        ))
                      ) : (
                        // Fallback to search links if no real videos found
                        <>
                          <a href={`https://www.youtube.com/results?search_query=${server.name}+tutorial+getting+started`} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-4 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                            <div className="w-16 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                              <Play className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-neutral-900">Getting Started with {server.name}</h3>
                              <p className="text-sm text-neutral-600 mt-1">Search YouTube for comprehensive tutorials and introductions</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                                <span>YouTube Search</span>
                                <span>•</span>
                                <span>Multiple videos</span>
                                <span>•</span>
                                <span>Various creators</span>
                              </div>
                            </div>
                          </a>
                          <a href={`https://www.youtube.com/results?search_query=${server.name}+advanced+configuration+best+practices`} target="_blank" rel="noopener noreferrer" className="flex items-start space-x-4 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                            <div className="w-16 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                              <Play className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-neutral-900">Advanced Configuration & Best Practices</h3>
                              <p className="text-sm text-neutral-600 mt-1">Learn advanced configuration options and optimization techniques</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                                <span>YouTube Search</span>
                                <span>•</span>
                                <span>Advanced tutorials</span>
                                <span>•</span>
                                <span>Expert guides</span>
                              </div>
                            </div>
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Community Discussions */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2 text-primary-600" />
                      Community Discussions
                    </h2>

                    {/* Latest Discussions */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-neutral-900 mb-3">Latest Discussions</h3>
                      <div className="space-y-3">
                        <a href={`${server.githubUrl}/issues?q=is%3Aissue+is%3Aopen+label%3Aquestion`} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">?</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900">Questions & Help</h4>
                              <p className="text-sm text-neutral-600 mt-1">Browse open questions and get help from the community</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                                <span>GitHub Issues</span>
                                <span>•</span>
                                <span>Community support</span>
                                <span>•</span>
                                <span>Active discussions</span>
                              </div>
                            </div>
                          </div>
                        </a>

                        <a href={`${server.githubUrl}/discussions`} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-green-600 font-semibold text-sm">💬</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900">GitHub Discussions</h4>
                              <p className="text-sm text-neutral-600 mt-1">Join community discussions, share ideas and best practices</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                                <span>GitHub Discussions</span>
                                <span>•</span>
                                <span>Community forum</span>
                                <span>•</span>
                                <span>Ideas & feedback</span>
                              </div>
                            </div>
                          </div>
                        </a>

                        <a href={`${server.githubUrl}/issues?q=is%3Aissue+is%3Aopen+label%3Abug`} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-purple-600 font-semibold text-sm">🐛</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900">Bug Reports & Issues</h4>
                              <p className="text-sm text-neutral-600 mt-1">Report bugs, track issues, and see what's being worked on</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                                <span>GitHub Issues</span>
                                <span>•</span>
                                <span>Bug tracking</span>
                                <span>•</span>
                                <span>Issue resolution</span>
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>

                    {/* Popular Discussions */}
                    <div>
                      <h3 className="text-lg font-semibold text-neutral-900 mb-3">Popular Discussions</h3>
                      <div className="space-y-3">
                        <a href={`${server.githubUrl}#readme`} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                              <span className="text-orange-600 font-semibold text-sm">📖</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900">Complete setup guide for beginners</h4>
                              <p className="text-sm text-neutral-600 mt-1">Step-by-step tutorial for getting started with {server.name}</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                                <span>README.md</span>
                                <span>•</span>
                                <span>Official guide</span>
                                <span>•</span>
                                <span>Getting started</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <Star className="w-3 h-3 mr-1 fill-yellow-400 text-yellow-400" />
                                  <span>Essential</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </a>

                        <a href={`${server.githubUrl}/issues?q=is%3Aissue+label%3Atroubleshooting`} target="_blank" rel="noopener noreferrer" className="block p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-red-600 font-semibold text-sm">🔧</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-neutral-900">Common issues and solutions</h4>
                              <p className="text-sm text-neutral-600 mt-1">Troubleshooting guide for the most frequent problems</p>
                              <div className="flex items-center space-x-4 mt-2 text-xs text-neutral-500">
                                <span>GitHub Issues</span>
                                <span>•</span>
                                <span>Troubleshooting</span>
                                <span>•</span>
                                <span>Solutions</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                                  <span>Popular</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </a>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-200">
                      <a href={`${server.githubUrl}/discussions`} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                        View all discussions →
                      </a>
                    </div>
                  </div>

                  {/* External Resources */}
                  <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center">
                      <ExternalLink className="w-5 h-5 mr-2 text-primary-600" />
                      External Resources
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {serverDetails.externalResources.map((resource, index) => (
                        <a
                          key={index}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start space-x-3 p-4 rounded-lg border border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                            <span className="text-lg">{resource.icon}</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                              {resource.title}
                            </h4>
                            <p className="text-sm text-neutral-600 mt-1">{resource.description}</p>
                            <div className="flex items-center mt-2">
                              <span className="text-xs text-primary-600 font-medium truncate">{resource.url}</span>
                              <ExternalLink className="w-3 h-3 text-primary-600 ml-1 flex-shrink-0" />
                            </div>
                          </div>
                        </a>
                      ))}
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
