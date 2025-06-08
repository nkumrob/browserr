'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/SearchBar';
import { HorizontalServerCard } from '@/components/HorizontalServerCard';
import { budgetSemanticSearch, SearchResult } from '@/lib/semantic-search';
import { MOCK_MCP_SERVERS } from '@/data/mock-servers';
import { Sparkles, TrendingUp, Star, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Scroll functions for carousels
  const scrollCarousel = (containerId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = 320; // Width of one card plus gap
      const newScrollLeft = direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

      container.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

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
    setSelectedLanguage('');
    setSelectedCategory('');
  };

  // Get unique languages and categories for filters
  const languages = [...new Set(MOCK_MCP_SERVERS.map(s => s.language))].sort();
  const categories = [...new Set(MOCK_MCP_SERVERS.map(s => s.category))].sort();

  // Filter servers based on selected filters
  const getFilteredServers = (servers: any[]) => {
    return servers.filter(server => {
      const languageMatch = !selectedLanguage || server.language === selectedLanguage;
      const categoryMatch = !selectedCategory || server.category === selectedCategory;
      return languageMatch && categoryMatch;
    });
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

      {/* Developer-Focused Sections */}
      {searchResults.length === 0 && !isSearching && (
        <>
          {/* Most Popular */}
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-yellow-500" />
                    Most Popular
                  </h3>
                  <p className="text-neutral-600 mt-1">Top-rated servers by the community</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => scrollCarousel('popular-carousel', 'left')}
                      className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button
                      onClick={() => scrollCarousel('popular-carousel', 'right')}
                      className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                  <Link href="/servers?sort=popular" className="text-primary-600 hover:text-primary-700 font-medium">
                    View all →
                  </Link>
                </div>
              </div>

              {/* Horizontal scrolling cards */}
              <div id="popular-carousel" className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
                {getFilteredServers(MOCK_MCP_SERVERS.sort((a, b) => b.stars - a.stars)).slice(0, 8).map((server) => (
                  <Link key={server.id} href={`/servers/${server.id}`}>
                    <HorizontalServerCard server={server} />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Browser Automation */}
          <section className="py-12 bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 flex items-center">
                    <span className="mr-2">🤖</span>
                    Browser Automation
                  </h3>
                  <p className="text-neutral-600 mt-1">Automate browsers, testing, and web scraping</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => scrollCarousel('automation-carousel', 'left')}
                      className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button
                      onClick={() => scrollCarousel('automation-carousel', 'right')}
                      className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                  <Link href="/servers?category=browser-automation" className="text-primary-600 hover:text-primary-700 font-medium">
                    View all →
                  </Link>
                </div>
              </div>

              {/* Horizontal scrolling cards */}
              <div id="automation-carousel" className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
                {getFilteredServers(MOCK_MCP_SERVERS.filter(s => s.category === 'browser-automation' || s.category === 'web-interaction')).map((server) => (
                  <Link key={server.id} href={`/servers/${server.id}`}>
                    <HorizontalServerCard server={server} />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* API Integration */}
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 flex items-center">
                    <span className="mr-2">🔗</span>
                    API Integration
                  </h3>
                  <p className="text-neutral-600 mt-1">Connect with external APIs and services</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => scrollCarousel('api-carousel', 'left')}
                      className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button
                      onClick={() => scrollCarousel('api-carousel', 'right')}
                      className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                  <Link href="/servers?category=api-integration" className="text-primary-600 hover:text-primary-700 font-medium">
                    View all →
                  </Link>
                </div>
              </div>

              {/* Horizontal scrolling cards */}
              <div id="api-carousel" className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
                {getFilteredServers(MOCK_MCP_SERVERS.filter(s => s.category === 'api-integration' || s.category === 'search')).map((server) => (
                  <Link key={server.id} href={`/servers/${server.id}`}>
                    <HorizontalServerCard server={server} />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Data Processing */}
          <section className="py-12 bg-neutral-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 flex items-center">
                    <span className="mr-2">📊</span>
                    Data Processing
                  </h3>
                  <p className="text-neutral-600 mt-1">Extract, transform, and process data</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => scrollCarousel('data-carousel', 'left')}
                      className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                      aria-label="Scroll left"
                    >
                      <ChevronLeft className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button
                      onClick={() => scrollCarousel('data-carousel', 'right')}
                      className="p-2 rounded-lg border border-neutral-300 hover:bg-neutral-50 transition-colors"
                      aria-label="Scroll right"
                    >
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </button>
                  </div>
                  <Link href="/servers?category=data-processing" className="text-primary-600 hover:text-primary-700 font-medium">
                    View all →
                  </Link>
                </div>
              </div>

              {/* Horizontal scrolling cards */}
              <div id="data-carousel" className="flex space-x-3 overflow-x-auto pb-4 scrollbar-hide">
                {getFilteredServers(MOCK_MCP_SERVERS.filter(s => s.category === 'data-extraction' || s.category === 'file-processing' || s.category === 'data-integration')).map((server) => (
                  <Link key={server.id} href={`/servers/${server.id}`}>
                    <HorizontalServerCard server={server} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Search Results */}
      {(searchResults.length > 0 || isSearching) && (
        <section className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
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
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-3 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <Filter className="w-4 h-4 text-neutral-600" />
                  <span className="text-neutral-600">Filters</span>
                </button>
                <button
                  onClick={clearSearch}
                  className="text-neutral-600 hover:text-neutral-800 underline"
                >
                  Clear search
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Language</label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">All Languages</option>
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {isSearching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl border border-neutral-200 h-[180px] animate-pulse">
                    <div className="p-5">
                      <div className="flex items-start space-x-3">
                        <div className="w-12 h-12 bg-neutral-200 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                            <div className="h-4 bg-neutral-200 rounded w-12"></div>
                          </div>
                          <div className="space-y-2 mb-3">
                            <div className="h-3 bg-neutral-200 rounded"></div>
                            <div className="h-3 bg-neutral-200 rounded w-4/5"></div>
                          </div>
                          <div className="flex items-center justify-between mt-auto">
                            <div className="h-6 bg-neutral-200 rounded w-16"></div>
                            <div className="flex space-x-1">
                              <div className="h-6 w-6 bg-neutral-200 rounded"></div>
                              <div className="h-6 w-6 bg-neutral-200 rounded"></div>
                              <div className="h-6 bg-neutral-200 rounded w-16"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {getFilteredServers(searchResults).map((result) => (
                  <Link key={result.id} href={`/servers/${result.id}`}>
                    <HorizontalServerCard server={result} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
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
