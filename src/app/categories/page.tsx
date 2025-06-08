'use client';

import { useState } from 'react';
import { MOCK_MCP_SERVERS } from '@/data/mock-servers';
import { HorizontalServerCard } from '@/components/HorizontalServerCard';
import { Search, Filter } from 'lucide-react';
import Link from 'next/link';

export default function CategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All Categories', icon: '📁', count: MOCK_MCP_SERVERS.length },
    { id: 'browser-automation', name: 'Browser Automation', icon: '🤖', count: MOCK_MCP_SERVERS.filter(s => s.category === 'browser-automation').length },
    { id: 'data-extraction', name: 'Data Extraction', icon: '📊', count: MOCK_MCP_SERVERS.filter(s => s.category === 'data-extraction').length },
    { id: 'api-integration', name: 'API Integration', icon: '🔗', count: MOCK_MCP_SERVERS.filter(s => s.category === 'api-integration').length },
    { id: 'file-processing', name: 'File Processing', icon: '📄', count: MOCK_MCP_SERVERS.filter(s => s.category === 'file-processing').length },
    { id: 'web-interaction', name: 'Web Interaction', icon: '🌐', count: MOCK_MCP_SERVERS.filter(s => s.category === 'web-interaction').length },
    { id: 'search', name: 'Search', icon: '🔍', count: MOCK_MCP_SERVERS.filter(s => s.category === 'search').length },
  ];

  const filteredServers = MOCK_MCP_SERVERS.filter(server => {
    const matchesCategory = selectedCategory === 'all' || server.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

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
              <Link href="/categories" className="text-primary-600 font-medium">Categories</Link>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Browse by Category</h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            Explore MCP servers organized by functionality. Find the perfect tools for your specific use case.
          </p>
          
          {/* Search */}
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-600 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search servers..."
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
            />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 sticky top-24">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-50 text-primary-700 border border-primary-200'
                        : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{category.icon}</span>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      selectedCategory === category.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-neutral-900">
                  {selectedCategory === 'all' 
                    ? 'All Servers' 
                    : categories.find(c => c.id === selectedCategory)?.name
                  }
                </h3>
                <p className="text-neutral-600 mt-1">
                  {filteredServers.length} server{filteredServers.length !== 1 ? 's' : ''} found
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="inline-flex items-center px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </button>
                <select className="px-3 py-2 border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors">
                  <option>Most Popular</option>
                  <option>Recently Added</option>
                  <option>Most Stars</option>
                  <option>Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Results Grid */}
            {filteredServers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredServers.map((server) => (
                  <Link key={server.id} href={`/servers/${server.id}`}>
                    <HorizontalServerCard server={server} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-neutral-600" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">No servers found</h3>
                <p className="text-neutral-600 mb-4">
                  {searchQuery 
                    ? `No servers match your search for "${searchQuery}"`
                    : 'No servers in this category yet'
                  }
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
