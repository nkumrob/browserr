'use client';

import { useState } from 'react';
import { ArrowLeft, Github, Sparkles, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';

// Simple function to add processed server to localStorage
function addProcessedServer(server: any): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = JSON.parse(localStorage.getItem('mcp-processed-servers') || '[]');

    // Check if server already exists (by GitHub URL)
    const existingIndex = existing.findIndex((s: any) => s.githubUrl === server.githubUrl);

    if (existingIndex >= 0) {
      // Update existing server
      existing[existingIndex] = server;
    } else {
      // Add new server to the beginning
      existing.unshift(server);
    }

    // Keep only the last 20 servers
    const limited = existing.slice(0, 20);

    localStorage.setItem('mcp-processed-servers', JSON.stringify(limited));

    // Trigger a custom event to notify components
    window.dispatchEvent(new CustomEvent('processedServersUpdated'));
  } catch (error) {
    console.warn('Failed to save processed server:', error);
  }
}

export default function TestE2EPage() {
  const [githubUrl, setGithubUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!githubUrl.trim()) {
      setError('Please enter a GitHub URL');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/process-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          githubUrl: githubUrl.trim()
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);

        // Store the processed server in localStorage for homepage display
        addProcessedServer(data.server);

        console.log('Server added to processed servers list!');
      } else {
        setError(data.error || 'Failed to process repository');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const testUrls = [
    'https://github.com/modelcontextprotocol/servers',
    'https://github.com/microsoft/playwright',
    'https://github.com/cheeriojs/cheerio',
    'https://github.com/axios/axios'
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <Link href="/" className="text-neutral-600 hover:text-neutral-900">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">E2E Pipeline Test</h1>
              <p className="text-sm text-neutral-600">Test the GitHub → AI Enrichment → Featured Section flow</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Test Form */}
        <div className="bg-white rounded-xl border border-neutral-200 p-8 mb-8 shadow-lg">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-neutral-900 mb-2 flex items-center justify-center">
              <Github className="w-6 h-6 mr-3" />
              🧪 Test E2E Pipeline
            </h2>
            <p className="text-neutral-600">
              Enter a GitHub URL to test our MCP.so → GitHub → AI Enrichment → Featured Section flow
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                GitHub Repository URL
              </label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                disabled={isProcessing}
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !githubUrl.trim()}
              className="w-full flex items-center justify-center px-6 py-4 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                  Processing Repository...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  🚀 Process Repository
                </>
              )}
            </button>
          </form>

          {/* Quick Test URLs */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-base font-semibold text-blue-900 mb-3">🎯 Quick Test URLs (Click to use):</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {testUrls.map((url) => (
                <button
                  key={url}
                  onClick={() => setGithubUrl(url)}
                  className="text-left text-sm text-blue-700 hover:text-blue-900 p-3 rounded-lg border border-blue-300 hover:border-blue-500 bg-white hover:bg-blue-50 transition-all duration-200 font-medium"
                  disabled={isProcessing}
                >
                  📦 {url.replace('https://github.com/', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 font-medium">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Success Result */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Successfully Processed!</span>
              </div>
              <Link
                href="/"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                🏠 View on Homepage
              </Link>
            </div>

            <div className="bg-green-100 border border-green-300 rounded-lg p-3 mb-4">
              <p className="text-green-800 text-sm">
                ✅ <strong>Server added to homepage!</strong> Check the "Recently Added" section to see your processed server.
              </p>
            </div>
            
            <div className="space-y-4">
              {/* Server Info */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h3 className="font-bold text-neutral-900 mb-2">{result.server.name}</h3>
                <p className="text-neutral-700 mb-3">{result.server.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-neutral-600">Category:</span>
                    <p className="text-neutral-900">{result.server.category}</p>
                  </div>
                  <div>
                    <span className="font-medium text-neutral-600">Language:</span>
                    <p className="text-neutral-900">{result.server.language}</p>
                  </div>
                  <div>
                    <span className="font-medium text-neutral-600">Stars:</span>
                    <p className="text-neutral-900">{result.server.stars}</p>
                  </div>
                  <div>
                    <span className="font-medium text-neutral-600">Author:</span>
                    <p className="text-neutral-900">{result.server.author.name}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="font-medium text-neutral-600">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.server.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-1 bg-neutral-100 text-neutral-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <span className="font-medium text-neutral-600">Install Command:</span>
                  <code className="block mt-1 p-2 bg-neutral-100 text-neutral-800 text-sm rounded">
                    {result.server.installCommand}
                  </code>
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-neutral-900 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Processing Metadata
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-neutral-600">Processing Time:</span>
                    <p className="text-neutral-900">{result.metadata.processingTime}ms</p>
                  </div>
                  <div>
                    <span className="font-medium text-neutral-600">Tokens Used:</span>
                    <p className="text-neutral-900">{result.metadata.tokensUsed}</p>
                  </div>
                  <div>
                    <span className="font-medium text-neutral-600">Cache Hit:</span>
                    <p className="text-neutral-900">{result.metadata.cacheHit ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">How it works:</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-800">
            <li>Enter a GitHub repository URL (from MCP.so or any MCP server)</li>
            <li>Our system extracts repository data using GitHub API</li>
            <li>Groq AI (Mixtral) enriches the data with better descriptions and metadata</li>
            <li>The enriched server data is returned (in real app, would be added to featured sections)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
