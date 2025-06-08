'use client';

import { useState } from 'react';
import { MOCK_MCP_SERVERS } from '@/data/mock-servers';
import { HorizontalServerCard } from '@/components/HorizontalServerCard';
import { SearchBar } from '@/components/SearchBar';
import { Grid, List, Filter, SortAsc } from 'lucide-react';
import Link from 'next/link';

export default function ServersPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('popularity');
  const [filters, setFilters] = useState({
    category: '',
    language: '',
    minStars: undefined as number | undefined
  });
  const [searchResults, setSearchResults] = useState(MOCK_MCP_SERVERS);

  const handleSearch = (query: string, searchFilters: any) => {
    // Simple search implementation
    let filtered = MOCK_MCP_SERVERS;
    
    if (query) {
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(query.toLowerCase()) ||
        server.description.toLowerCase().includes(query.toLowerCase()) ||
        server.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }
    
    if (searchFilters.category) {
      filtered = filtered.filter(server => server.category === searchFilters.category);
    }
    
    if (searchFilters.language) {
      filtered = filtered.filter(server => server.language === searchFilters.language);
    }
    
    if (searchFilters.minStars) {
      filtered = filtered.filter(server => server.stars >= searchFilters.minStars);
    }
    
    // Sort results
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => b.stars - a.stars);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'recent':
        // Mock recent sorting
        filtered.sort(() => Math.random() - 0.5);
        break;
    }
    
    setSearchResults(filtered);
  };

  const sortOptions = [
    { value: 'popularity', label: 'Most Popular' },
    { value: 'name', label: 'Alphabetical' },
    { value: 'recent', label: 'Recently Added' },
  ];

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

      {/* Hero Section */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">All MCP Servers</h2>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Browse our complete collection of Model Context Protocol servers. Find the perfect tools for your AI applications.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <SearchBar 
              onSearch={handleSearch}
              placeholder="Search all servers..."
              showExamples={false}
            />
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-neutral-700">
                {searchResults.length} server{searchResults.length !== 1 ? 's' : ''}
              </span>
              
              {/* View Mode Toggle */}
              <div className="flex items-center border border-neutral-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${
                    viewMode === 'grid'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  } transition-colors rounded-l-lg`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${
                    viewMode === 'list'
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:text-neutral-900'
                  } transition-colors rounded-r-lg`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <SortAsc className="w-4 h-4 text-neutral-600" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Filter Button */}
              <button className="inline-flex items-center px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchResults.length > 0 ? (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((server) => (
                    <Link key={server.id} href={`/servers/${server.id}`}>
                      <HorizontalServerCard server={server} />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {searchResults.map((server) => (
                    <Link key={server.id} href={`/servers/${server.id}`}>
                      <HorizontalServerCard server={server} />
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-8 h-8 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No servers found</h3>
              <p className="text-neutral-600 mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <button
                onClick={() => {
                  setSearchResults(MOCK_MCP_SERVERS);
                  setFilters({ category: '', language: '', minStars: undefined });
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
