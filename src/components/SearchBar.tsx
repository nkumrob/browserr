'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { generateSearchSuggestions, EXAMPLE_QUERIES } from '@/lib/semantic-search';

interface SearchBarProps {
  onSearch: (query: string, filters?: SearchFilters) => void;
  placeholder?: string;
  showExamples?: boolean;
}

interface SearchFilters {
  category?: string;
  language?: string;
  minStars?: number;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Describe what you're looking for...",
  showExamples = true 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Generate suggestions as user types
  useEffect(() => {
    if (query.length > 2) {
      const newSuggestions = generateSearchSuggestions(query);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      onSearch(finalQuery, filters);
      setShowSuggestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearFilters = () => {
    setFilters({});
    onSearch(query, {});
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '');

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main search bar */}
      <div className="relative">
        <div className="relative bg-white rounded-xl border border-neutral-300 shadow-sm hover:shadow-md transition-all duration-200">
          <div className="flex items-center">
            {/* Search input section */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-600 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className="w-full pl-12 pr-4 py-4 text-base text-neutral-700 placeholder-neutral-600 bg-transparent border-none focus:outline-none"
              />
            </div>

            {/* Filters button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-4 text-sm font-medium transition-colors ${
                showFilters || hasActiveFilters
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                )}
              </div>
            </button>

            {/* Search button */}
            <button
              onClick={() => handleSearch()}
              className="px-6 py-4 bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors rounded-r-xl"
            >
              Search
            </button>
          </div>
        </div>

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="absolute top-full mt-4 left-0 flex items-center space-x-3">
            <span className="text-sm font-medium text-neutral-600">Active filters:</span>
            {filters.category && (
              <span className="inline-flex items-center px-3 py-1.5 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                {filters.category}
                <button
                  onClick={() => setFilters({ ...filters, category: undefined })}
                  className="ml-2 text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.language && (
              <span className="inline-flex items-center px-3 py-1.5 bg-secondary-100 text-secondary-800 rounded-full text-sm font-medium">
                {filters.language}
                <button
                  onClick={() => setFilters({ ...filters, language: undefined })}
                  className="ml-2 text-secondary-600 hover:text-secondary-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.minStars && (
              <span className="inline-flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {filters.minStars}+ stars
                <button
                  onClick={() => setFilters({ ...filters, minStars: undefined })}
                  className="ml-2 text-yellow-600 hover:text-yellow-800 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-sm text-neutral-500 hover:text-neutral-700 underline font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-neutral-200 rounded-xl shadow-lg p-4 z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
              <select
                value={filters.category || ''}
                onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
              >
                <option value="">All categories</option>
                <option value="browser-automation">Browser Automation</option>
                <option value="data-extraction">Data Extraction</option>
                <option value="api-integration">API Integration</option>
                <option value="file-processing">File Processing</option>
                <option value="web-interaction">Web Interaction</option>
                <option value="search">Search</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Language</label>
              <select
                value={filters.language || ''}
                onChange={(e) => setFilters({ ...filters, language: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
              >
                <option value="">All languages</option>
                <option value="TypeScript">TypeScript</option>
                <option value="JavaScript">JavaScript</option>
                <option value="Python">Python</option>
                <option value="Java">Java</option>
                <option value="Go">Go</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Minimum Stars</label>
              <select
                value={filters.minStars || ''}
                onChange={(e) => setFilters({ ...filters, minStars: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors bg-white"
              >
                <option value="">Any</option>
                <option value="100">100+ stars</option>
                <option value="500">500+ stars</option>
                <option value="1000">1000+ stars</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-neutral-200 rounded-xl shadow-lg z-20">
          <div className="p-2">
            <p className="text-sm font-medium text-neutral-600 px-3 py-2">Suggestions</p>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Example queries */}
      {showExamples && !query && (
        <div className="mt-6">
          <p className="text-sm font-medium text-neutral-600 mb-3">Try these examples:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.slice(0, 4).map((example, index) => (
              <button
                key={index}
                onClick={() => selectSuggestion(example)}
                className="px-3 py-2 text-sm bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
