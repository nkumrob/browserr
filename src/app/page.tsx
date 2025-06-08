'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { ServerCard, HorizontalServerCard } from '@/components/ServerCard';
import { budgetSemanticSearch, SearchResult } from '@/lib/semantic-search';
import { MOCK_MCP_SERVERS, FEATURED_CATEGORIES } from '@/data/mock-servers';
import { Sparkles, TrendingUp, Star } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string, filters?: any) => {
    setIsSearching(true);
    setSearchQuery(query);

    // Simulate search delay for better UX
    setTimeout(() => {
      const results = budgetSemanticSearch(MOCK_MCP_SERVERS, query, filters);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };

  const clearSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
    setIsSearching(false);
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
              <Link href="/servers" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">Browse</Link>
              <Link href="/categories" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">Categories</Link>
              <Link href="/submit" className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors">Submit</Link>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                Sign In
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-neutral-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">
              Discover MCP Servers with
              <span className="text-primary-600"> Smart Search</span>
            </h2>
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              Find the perfect Model Context Protocol servers for your AI applications.
              Search using natural language and get intelligent recommendations.
            </p>

            {/* Search Bar */}
            <div className="mb-8">
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center space-x-8 text-sm text-neutral-600">
              <div className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-primary-500" />
                {MOCK_MCP_SERVERS.length} Servers
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-secondary-500" />
                $0 Monthly Cost
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                Smart Search
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {(searchResults.length > 0 || isSearching) && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900">
                  {isSearching ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Searching...</span>
                    </div>
                  ) : (
                    `Search Results for "${searchQuery}"`
                  )}
                </h3>
                {!isSearching && (
                  <p className="text-neutral-600 mt-1">
                    Found {searchResults.length} relevant servers
                  </p>
                )}
              </div>
              <button
                onClick={clearSearch}
                className="text-neutral-600 hover:text-neutral-800 underline"
              >
                Clear search
              </button>
            </div>

            {isSearching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6 animate-pulse">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-neutral-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                        <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-3 bg-neutral-200 rounded"></div>
                      <div className="h-3 bg-neutral-200 rounded"></div>
                      <div className="h-3 bg-neutral-200 rounded w-3/4"></div>
                    </div>
                    <div className="flex space-x-2 mb-4">
                      <div className="h-5 w-12 bg-neutral-200 rounded"></div>
                      <div className="h-5 w-16 bg-neutral-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((result) => (
                  <Link key={result.id} href={`/servers/${result.id}`}>
                    <ServerCard
                      server={result}
                      showMatchReasons={true}
                      matchReasons={result.matchReasons}
                      relevanceScore={result.relevanceScore}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured Sections - Only show when not searching */}
      {searchResults.length === 0 && !isSearching && (
        <>
          {FEATURED_CATEGORIES.map((category, categoryIndex) => (
            <section key={categoryIndex} className={`py-12 ${categoryIndex % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}`}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-neutral-900 flex items-center">
                    {categoryIndex === 0 && <Star className="w-6 h-6 mr-2 text-yellow-500" />}
                    {categoryIndex === 1 && <span className="mr-2">🤖</span>}
                    {categoryIndex === 2 && <span className="mr-2">📊</span>}
                    {categoryIndex === 3 && <span className="mr-2">🔗</span>}
                    {category.title}
                  </h3>
                  <button className="text-primary-600 hover:text-primary-700 font-medium">
                    View all →
                  </button>
                </div>

                {/* Horizontal scrolling cards */}
                <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                  {category.servers.map((server) => (
                    <Link key={server.id} href={`/servers/${server.id}`}>
                      <HorizontalServerCard server={server} />
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">B</span>
                </div>
                <span className="text-lg font-bold text-neutral-900">Browserr</span>
              </div>
              <p className="text-neutral-600 text-sm">
                The comprehensive directory for Model Context Protocol servers.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Browse</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link href="/servers" className="hover:text-neutral-900">All Servers</Link></li>
                <li><Link href="/categories" className="hover:text-neutral-900">Categories</Link></li>
                <li><Link href="/servers?sort=popularity" className="hover:text-neutral-900">Most Popular</Link></li>
                <li><Link href="/servers?sort=recent" className="hover:text-neutral-900">Recently Added</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Developers</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><Link href="/submit" className="hover:text-neutral-900">Submit Server</Link></li>
                <li><a href="#" className="hover:text-neutral-900">API Docs</a></li>
                <li><a href="#" className="hover:text-neutral-900">Guidelines</a></li>
                <li><a href="#" className="hover:text-neutral-900">GitHub</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-neutral-900 mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li><a href="#" className="hover:text-neutral-900">Help Center</a></li>
                <li><a href="#" className="hover:text-neutral-900">Contact</a></li>
                <li><a href="#" className="hover:text-neutral-900">Privacy</a></li>
                <li><a href="#" className="hover:text-neutral-900">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-200 mt-8 pt-8 text-center text-sm text-neutral-600">
            <p>&copy; 2024 Browserr. Built with budget-friendly semantic search.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
