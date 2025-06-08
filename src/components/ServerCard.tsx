'use client';

import { McpServer } from '@/lib/semantic-search';
import { Star, Download, ExternalLink, Code, Heart, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface ServerCardProps {
  server: McpServer;
  showMatchReasons?: boolean;
  matchReasons?: string[];
  relevanceScore?: number;
}

// Airbnb-Style Horizontal Card Component
export function AirbnbStyleCard({ server }: { server: McpServer }) {
  const [copied, setCopied] = useState(false);

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'TypeScript': 'bg-blue-100 text-blue-700',
      'JavaScript': 'bg-yellow-100 text-yellow-700',
      'Python': 'bg-green-100 text-green-700',
      'Java': 'bg-red-100 text-red-700',
      'Go': 'bg-cyan-100 text-cyan-700',
    };
    return colors[language] || 'bg-neutral-100 text-neutral-700';
  };

  const handleConnect = async () => {
    await navigator.clipboard.writeText(server.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer min-w-[280px] max-w-[320px]">
      {/* Card Image/Icon Area */}
      <div className="h-32 bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center relative">
        <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center">
          <Code className="w-8 h-8 text-primary-600" />
        </div>
        {/* Language badge in top right */}
        <div className="absolute top-3 right-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLanguageColor(server.language)}`}>
            {server.language}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-neutral-900 text-lg mb-1 group-hover:text-primary-600 transition-colors">
            {server.name}
          </h3>
          <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
            {server.description}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3 text-sm text-neutral-600">
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
              <span>{server.stars.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <ExternalLink className="w-4 h-4 mr-1" />
              <span>View</span>
            </div>
          </div>
        </div>

        {/* Connect Button */}
        <button
          onClick={handleConnect}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          {copied ? 'Copied!' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

export function ServerCard({
  server,
  showMatchReasons = false,
  matchReasons = [],
  relevanceScore
}: ServerCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const getCategoryGradient = (category: string) => {
    const gradients: Record<string, string> = {
      'browser-automation': 'from-purple-500 to-pink-500',
      'data-extraction': 'from-blue-500 to-cyan-500',
      'api-integration': 'from-green-500 to-teal-500',
      'file-processing': 'from-orange-500 to-red-500',
      'web-interaction': 'from-indigo-500 to-purple-500',
      'search': 'from-yellow-500 to-orange-500',
    };
    return gradients[category] || 'from-primary-500 to-secondary-500';
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(server.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Main content */}
      <div className="p-6">
        {/* Header section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center text-xl">
              {getCategoryIcon(server.category)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors leading-tight mb-2">
                {server.name}
              </h3>
              <div className="flex items-center space-x-3">
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getLanguageColor(server.language)}`}>
                  {server.language}
                </span>
                <div className="flex items-center text-neutral-600">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{server.stars.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Like button */}
          <button
            onClick={() => setIsLiked(!isLiked)}
            className="p-2 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isLiked ? 'fill-primary-500 text-primary-500' : 'text-neutral-600 hover:text-primary-500'
              }`}
            />
          </button>
        </div>

        {/* Relevance score */}
        {relevanceScore && (
          <div className="inline-flex items-center px-2 py-1 bg-primary-50 text-primary-700 rounded-md text-xs font-medium mb-3">
            {Math.round(relevanceScore * 100)}% match
          </div>
        )}

        {/* Description */}
        <p className="text-neutral-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {server.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {server.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 text-neutral-600 text-xs"
            >
              {tag}
            </span>
          ))}
          {server.tags.length > 4 && (
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 text-neutral-600 text-xs">
              +{server.tags.length - 4}
            </span>
          )}
        </div>

        {/* Match reasons */}
        {showMatchReasons && matchReasons.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-blue-800 text-xs font-medium mb-2">Why this matches:</p>
            <ul className="text-blue-700 text-xs space-y-1">
              {matchReasons.slice(0, 3).map((reason, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-400 mr-1">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
              <Download className="w-4 h-4 mr-1" />
              Install
            </button>
            <button className="inline-flex items-center px-3 py-2 bg-neutral-100 text-neutral-700 text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors">
              <Code className="w-4 h-4 mr-1" />
              Try
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
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
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
              title="View on GitHub"
            >
              <ExternalLink className="w-4 h-4 text-neutral-600" />
            </a>
          </div>
        </div>

        {/* Install command */}
        <div className="mt-3 p-2 bg-neutral-900 rounded-lg">
          <code className="text-green-400 text-xs font-mono break-all">
            {server.installCommand}
          </code>
        </div>
      </div>
    </div>
  );
}

// Compact card variant like Front interface - smaller with icon
export function CompactServerCard({ server }: { server: McpServer }) {
  const [copied, setCopied] = useState(false);

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      'TypeScript': 'bg-blue-50 text-blue-700',
      'JavaScript': 'bg-yellow-50 text-yellow-700',
      'Python': 'bg-green-50 text-green-700',
      'Java': 'bg-red-50 text-red-700',
      'Go': 'bg-cyan-50 text-cyan-700',
    };
    return colors[language] || 'bg-neutral-50 text-neutral-700';
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

  const handleConnect = async () => {
    await navigator.clipboard.writeText(server.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer w-full max-w-sm">
      {/* Header with icon and language */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center text-lg">
            {getCategoryIcon(server.category)}
          </div>
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${getLanguageColor(server.language)}`}>
            {server.language}
          </span>
        </div>

        <h3 className="font-semibold text-neutral-900 text-base mb-1 group-hover:text-primary-600 transition-colors">
          {server.name}
        </h3>

        <p className="text-sm text-neutral-600 line-clamp-2 leading-relaxed">
          {server.description}
        </p>
      </div>

      {/* Stats and actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center text-sm text-neutral-600">
            <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
            <span>{server.stars.toLocaleString()}</span>
          </div>
          <div className="flex items-center text-sm text-neutral-600">
            <ExternalLink className="w-4 h-4 mr-1" />
            <span>View</span>
          </div>
        </div>

        <button
          onClick={handleConnect}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm"
        >
          {copied ? 'Copied!' : 'Connect'}
        </button>
      </div>
    </div>
  );
}

// Horizontal card variant for featured sections - Airbnb style
export function HorizontalServerCard({ server }: { server: McpServer }) {
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(server.installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-md transition-all duration-200 min-w-[380px] max-w-[380px] cursor-pointer h-[180px] flex flex-col">
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start space-x-3 flex-1">
          {/* Icon */}
          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            {getCategoryIcon(server.category)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Header with title on left, stars and action icons grouped on right */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors leading-tight truncate flex-1 min-w-0 pr-3">
                {server.name}
              </h3>

              {/* Stars and action icons grouped together on the right */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <div className="flex items-center text-neutral-500">
                  <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm">{server.stars.toLocaleString()}</span>
                </div>

                <button
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
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
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4 text-neutral-600" />
                </a>
              </div>
            </div>

            {/* Fixed height description */}
            <p className="text-neutral-600 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
              {server.description}
            </p>

            {/* Bottom section with language and install button */}
            <div className="flex items-center justify-between mt-auto">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${getLanguageColor(server.language)}`}>
                {server.language}
              </span>

              <button className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                <Download className="w-4 h-4 mr-1" />
                Install
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
