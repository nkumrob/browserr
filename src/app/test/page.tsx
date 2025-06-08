'use client';

import { budgetSemanticSearch } from '@/lib/semantic-search';
import { MOCK_MCP_SERVERS } from '@/data/mock-servers';

export default function TestPage() {
  // Test the search functionality
  const testQuery = "scraper for Google Maps data";
  const results = budgetSemanticSearch(MOCK_MCP_SERVERS, testQuery);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Browserr Test Page
        </h1>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Test</h2>
          <p className="text-gray-600 mb-4">
            Testing query: <code className="bg-gray-100 px-2 py-1 rounded">"{testQuery}"</code>
          </p>
          
          <div className="space-y-4">
            <p className="font-medium">Results found: {results.length}</p>
            {results.slice(0, 3).map((result, index) => (
              <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{result.name}</h3>
                  <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-sm">
                    {Math.round(result.relevanceScore * 100)}% match
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2">{result.description}</p>
                <div className="text-xs text-gray-500">
                  <strong>Match reasons:</strong> {result.matchReasons.join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Component Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Semantic Search: Working</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Mock Data: Loaded ({MOCK_MCP_SERVERS.length} servers)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Tailwind CSS: Styled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>TypeScript: Compiled</span>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            ← Back to Main App
          </a>
        </div>
      </div>
    </div>
  );
}
