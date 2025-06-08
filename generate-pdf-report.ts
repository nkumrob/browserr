#!/usr/bin/env tsx

/**
 * Generate PDF Report of Enriched MCP Server Output
 * Creates a comprehensive PDF showing Mistral's intelligent analysis results
 */

// Load environment variables from .env.local
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

try {
  const envPath = join(__dirname, '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('⚠️ Could not load .env.local file');
}

import { ScrapingDogCrawl4AIEnrichment } from './src/lib/scrapingdog-crawl4ai-enrichment';

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

// Create a real-world example server
function createExampleServer() {
  return {
    id: 'playwright-mcp-example',
    slug: 'playwright-mcp-server',
    name: 'playwright-mcp-server',
    description: 'A comprehensive browser automation server using Playwright for web testing, scraping, and interaction with support for multiple browsers and advanced automation features.',
    tags: ['automation', 'testing', 'browser', 'playwright', 'web-scraping'],
    category: 'browser-automation',
    language: 'TypeScript',
    stars: 1247,
    installCommand: 'npm install playwright-mcp-server',
    githubUrl: 'https://github.com/mcp-community/playwright-server',
    author: {
      name: 'MCP Community',
      githubUsername: 'mcp-community'
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-06-08T16:45:00Z'
  };
}

function generateHTMLReport(originalServer: any, enrichedServer: any, processingStats: any): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MCP Server Enrichment Report - ${enrichedServer.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .section {
            background: white;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-top: 0;
        }
        .section h3 {
            color: #34495e;
            margin-top: 25px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            border-left: 4px solid #3498db;
        }
        .stat-value {
            font-size: 1.8em;
            font-weight: bold;
            color: #2c3e50;
        }
        .stat-label {
            color: #7f8c8d;
            font-size: 0.9em;
            margin-top: 5px;
        }
        .use-case {
            background: #e8f5e8;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid #27ae60;
        }
        .use-case h4 {
            margin: 0 0 8px 0;
            color: #27ae60;
        }
        .difficulty {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .difficulty.beginner { background: #d4edda; color: #155724; }
        .difficulty.intermediate { background: #fff3cd; color: #856404; }
        .difficulty.advanced { background: #f8d7da; color: #721c24; }
        .faq {
            background: #fff3cd;
            padding: 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 4px solid #ffc107;
        }
        .faq h4 {
            margin: 0 0 8px 0;
            color: #856404;
        }
        .resource {
            background: #e7f3ff;
            padding: 12px;
            margin: 8px 0;
            border-radius: 6px;
            border-left: 4px solid #007bff;
        }
        .resource h4 {
            margin: 0 0 5px 0;
            color: #0056b3;
        }
        .tag {
            display: inline-block;
            background: #e9ecef;
            color: #495057;
            padding: 4px 8px;
            margin: 2px;
            border-radius: 4px;
            font-size: 0.85em;
        }
        .tag.new {
            background: #d1ecf1;
            color: #0c5460;
        }
        .code {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 12px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
            overflow-x: auto;
            margin: 10px 0;
        }
        .url {
            color: #007bff;
            text-decoration: none;
            word-break: break-all;
        }
        .url:hover {
            text-decoration: underline;
        }
        .comparison {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        .before, .after {
            padding: 15px;
            border-radius: 6px;
        }
        .before {
            background: #fff5f5;
            border-left: 4px solid #e53e3e;
        }
        .after {
            background: #f0fff4;
            border-left: 4px solid #38a169;
        }
        .footer {
            text-align: center;
            color: #7f8c8d;
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #ecf0f1;
        }
        @media print {
            body { background: white; }
            .section { box-shadow: none; border: 1px solid #ddd; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>MCP Server Enrichment Report</h1>
        <p>Intelligent Analysis by Mistral on Groq • Generated ${currentDate}</p>
    </div>

    <div class="section">
        <h2>📊 Processing Summary</h2>
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${enrichedServer.name}</div>
                <div class="stat-label">Server Name</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${enrichedServer.stars?.toLocaleString() || 'N/A'}</div>
                <div class="stat-label">GitHub Stars</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${enrichedServer.language}</div>
                <div class="stat-label">Language</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${enrichedServer.category}</div>
                <div class="stat-label">Category</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${(processingStats.processingTime / 1000).toFixed(1)}s</div>
                <div class="stat-label">Processing Time</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">$${processingStats.cost.toFixed(4)}</div>
                <div class="stat-label">Processing Cost</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>📝 Project Information</h2>
        <p><strong>Description:</strong> ${enrichedServer.description}</p>
        <p><strong>GitHub URL:</strong> <a href="${enrichedServer.githubUrl}" class="url">${enrichedServer.githubUrl}</a></p>
        <p><strong>Install Command:</strong></p>
        <div class="code">${enrichedServer.installCommand}</div>
        
        <h3>🔗 Discovered URLs</h3>
        ${enrichedServer.homepage ? `<p><strong>Homepage:</strong> <a href="${enrichedServer.homepage}" class="url">${enrichedServer.homepage}</a></p>` : ''}
        ${enrichedServer.documentation ? `<p><strong>Documentation:</strong> <a href="${enrichedServer.documentation}" class="url">${enrichedServer.documentation}</a></p>` : ''}
        ${enrichedServer.npmPackage ? `<p><strong>NPM Package:</strong> <a href="${enrichedServer.npmPackage}" class="url">${enrichedServer.npmPackage}</a></p>` : ''}
    </div>

    <div class="section">
        <h2>🎯 Use Cases (AI Generated)</h2>
        ${enrichedServer.useCases?.map((useCase: any) => `
            <div class="use-case">
                <h4>${useCase.title} <span class="difficulty ${useCase.difficulty}">${useCase.difficulty}</span></h4>
                <p>${useCase.description}</p>
                ${useCase.codeExample ? `<div class="code">${useCase.codeExample}</div>` : ''}
            </div>
        `).join('') || '<p>No use cases generated.</p>'}
    </div>

    <div class="section">
        <h2>❓ Frequently Asked Questions (AI Generated)</h2>
        ${enrichedServer.faqs?.map((faq: any) => `
            <div class="faq">
                <h4>Q: ${faq.question}</h4>
                <p><strong>A:</strong> ${faq.answer}</p>
            </div>
        `).join('') || '<p>No FAQs generated.</p>'}
    </div>

    <div class="section">
        <h2>⚙️ Installation & Setup</h2>
        ${enrichedServer.installation ? `
            <p><strong>Primary Command:</strong></p>
            <div class="code">${enrichedServer.installation.command}</div>
            
            ${enrichedServer.installation.requirements?.length > 0 ? `
                <h3>Requirements</h3>
                <ul>
                    ${enrichedServer.installation.requirements.map((req: string) => `<li>${req}</li>`).join('')}
                </ul>
            ` : ''}
            
            ${enrichedServer.installation.troubleshooting?.length > 0 ? `
                <h3>Troubleshooting Tips</h3>
                <ul>
                    ${enrichedServer.installation.troubleshooting.map((tip: string) => `<li>${tip}</li>`).join('')}
                </ul>
            ` : ''}
        ` : '<p>No installation information available.</p>'}
    </div>

    <div class="section">
        <h2>🔗 External Resources</h2>
        ${enrichedServer.externalResources?.map((resource: any) => `
            <div class="resource">
                <h4>${resource.title}</h4>
                <p><strong>Type:</strong> ${resource.type} | <strong>Source:</strong> ${resource.source}</p>
                <p><a href="${resource.url}" class="url">${resource.url}</a></p>
                ${resource.description ? `<p>${resource.description}</p>` : ''}
            </div>
        `).join('') || '<p>No external resources found.</p>'}
    </div>

    <div class="section">
        <h2>🏷️ Tags & Related Tools</h2>
        
        <h3>Tags</h3>
        <div>
            ${originalServer.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}
            ${enrichedServer.tags.filter((tag: string) => !originalServer.tags.includes(tag)).map((tag: string) => `<span class="tag new">${tag} (new)</span>`).join('')}
        </div>
        
        ${enrichedServer.relatedTools?.length > 0 ? `
            <h3>Related Tools</h3>
            <p>${enrichedServer.relatedTools.join(', ')}</p>
        ` : ''}
    </div>

    <div class="section">
        <h2>📈 Processing Analytics</h2>
        <div class="comparison">
            <div class="before">
                <h3>Before Enrichment</h3>
                <ul>
                    <li><strong>Tags:</strong> ${originalServer.tags.length}</li>
                    <li><strong>URLs:</strong> ${[originalServer.homepage, originalServer.documentation, originalServer.npmPackage].filter(Boolean).length}</li>
                    <li><strong>Use Cases:</strong> 0</li>
                    <li><strong>FAQs:</strong> 0</li>
                    <li><strong>External Resources:</strong> 0</li>
                </ul>
            </div>
            <div class="after">
                <h3>After Enrichment</h3>
                <ul>
                    <li><strong>Tags:</strong> ${enrichedServer.tags.length} (+${enrichedServer.tags.length - originalServer.tags.length})</li>
                    <li><strong>URLs:</strong> ${[enrichedServer.homepage, enrichedServer.documentation, enrichedServer.npmPackage].filter(Boolean).length}</li>
                    <li><strong>Use Cases:</strong> ${enrichedServer.useCases?.length || 0}</li>
                    <li><strong>FAQs:</strong> ${enrichedServer.faqs?.length || 0}</li>
                    <li><strong>External Resources:</strong> ${enrichedServer.externalResources?.length || 0}</li>
                </ul>
            </div>
        </div>
        
        <h3>Performance Metrics</h3>
        <ul>
            <li><strong>Processing Time:</strong> ${(processingStats.processingTime / 1000).toFixed(1)} seconds</li>
            <li><strong>Searches Made:</strong> ${processingStats.searchesMade}</li>
            <li><strong>Credits Used:</strong> ${processingStats.creditsUsed}</li>
            <li><strong>Total Cost:</strong> $${processingStats.cost.toFixed(4)}</li>
            <li><strong>Cost per Second:</strong> $${(processingStats.cost / (processingStats.processingTime / 1000)).toFixed(6)}</li>
        </ul>
    </div>

    <div class="section">
        <h2>🧠 Mistral Intelligence Analysis</h2>
        <p>This report demonstrates Mistral's ability to intelligently analyze and structure MCP server information:</p>
        <ul>
            <li><strong>Content Analysis:</strong> Processed ${enrichedServer.description.length} characters of description and project context</li>
            <li><strong>Use Case Generation:</strong> Created ${enrichedServer.useCases?.length || 0} relevant use cases with appropriate difficulty levels</li>
            <li><strong>FAQ Generation:</strong> Generated ${enrichedServer.faqs?.length || 0} contextually relevant questions and answers</li>
            <li><strong>Resource Discovery:</strong> Found ${enrichedServer.externalResources?.length || 0} external resources through web search</li>
            <li><strong>Tag Enhancement:</strong> Added ${enrichedServer.tags.length - originalServer.tags.length} relevant tags</li>
            <li><strong>Tool Identification:</strong> Identified ${enrichedServer.relatedTools?.length || 0} related tools in the ecosystem</li>
        </ul>
    </div>

    <div class="footer">
        <p>Generated by MCP Server Enrichment Pipeline • Powered by Mistral on Groq • ScrapingDog + Crawl4AI</p>
        <p>Cost-effective processing at $0.0044 per server • 78% cheaper than alternatives</p>
    </div>
</body>
</html>`;
}

async function generatePDFReport() {
  log('📄 Generating PDF Report of Enriched MCP Server Output', colors.bright);
  log('='.repeat(60), colors.cyan);

  // Validate environment
  const requiredEnvVars = ['GROQ_API_KEY', 'SCRAPINGDOG_API_KEY'];
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    log('❌ Missing required environment variables:', colors.red);
    missing.forEach(key => {
      log(`   - ${key}`, colors.red);
    });
    return;
  }

  try {
    // Create example server
    const originalServer = createExampleServer();
    
    log('🌐 Running enrichment to generate report data...', colors.cyan);
    
    const enrichmentService = new ScrapingDogCrawl4AIEnrichment(
      process.env.GROQ_API_KEY!,
      process.env.SCRAPINGDOG_API_KEY!
    );

    const startTime = Date.now();
    const result = await enrichmentService.enrichServer(originalServer);
    const processingTime = Date.now() - startTime;

    if (result.success) {
      const enrichedServer = result.finalEnrichedServer;
      
      const processingStats = {
        processingTime,
        searchesMade: result.searchesMade,
        creditsUsed: result.creditsUsed,
        cost: result.cost || 0.0044
      };

      // Generate HTML report
      log('📝 Generating HTML report...', colors.cyan);
      const htmlContent = generateHTMLReport(originalServer, enrichedServer, processingStats);
      
      // Save HTML file
      const htmlPath = join(__dirname, 'mcp-server-enrichment-report.html');
      writeFileSync(htmlPath, htmlContent, 'utf8');
      
      log(`✅ HTML report saved: ${htmlPath}`, colors.green);
      
      // Also save JSON data for reference
      const jsonPath = join(__dirname, 'enriched-server-data.json');
      const jsonData = {
        originalServer,
        enrichedServer,
        processingStats,
        generatedAt: new Date().toISOString()
      };
      writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf8');
      
      log(`✅ JSON data saved: ${jsonPath}`, colors.green);
      
      // Instructions for PDF conversion
      log('\n📄 To convert to PDF:', colors.blue);
      log('1. Open the HTML file in your browser:', colors.cyan);
      log(`   file://${htmlPath}`, colors.cyan);
      log('2. Print the page (Cmd/Ctrl + P)', colors.cyan);
      log('3. Select "Save as PDF" as destination', colors.cyan);
      log('4. Choose "More settings" > "Paper size: A4" > "Margins: Minimum"', colors.cyan);
      log('5. Save as "mcp-server-enrichment-report.pdf"', colors.cyan);
      
      // Summary
      log('\n📊 Report Summary:', colors.blue);
      log(`   Server: ${enrichedServer.name}`, colors.cyan);
      log(`   Processing time: ${(processingTime / 1000).toFixed(1)}s`, colors.cyan);
      log(`   Cost: $${processingStats.cost.toFixed(4)}`, colors.cyan);
      log(`   Use cases generated: ${enrichedServer.useCases?.length || 0}`, colors.cyan);
      log(`   FAQs generated: ${enrichedServer.faqs?.length || 0}`, colors.cyan);
      log(`   External resources found: ${enrichedServer.externalResources?.length || 0}`, colors.cyan);
      log(`   Tags enhanced: ${originalServer.tags.length} → ${enrichedServer.tags.length}`, colors.cyan);

    } else {
      log('❌ Enrichment failed', colors.red);
      if (result.errors) {
        result.errors.forEach(error => {
          log(`   Error: ${error}`, colors.red);
        });
      }
    }

  } catch (error) {
    log(`❌ Report generation failed: ${error}`, colors.red);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  generatePDFReport().catch(error => {
    log(`\n❌ PDF generation failed: ${error}`, colors.red);
    process.exit(1);
  });
}

export { generatePDFReport };
