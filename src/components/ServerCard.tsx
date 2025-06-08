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

// Horizontal card variant for featured sections - Airbnb style
export function HorizontalServerCard({ server }: { server: McpServer }) {
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <div className="group bg-white rounded-xl border border-neutral-200 hover:border-neutral-300 shadow-sm hover:shadow-md transition-all duration-200 min-w-[320px] cursor-pointer">
      <div className="p-5">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center text-lg flex-shrink-0">
            {getCategoryIcon(server.category)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors leading-tight">
                {server.name}
              </h3>
              <div className="flex items-center text-neutral-500 ml-2">
                <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                <span className="text-sm">{server.stars.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-neutral-600 text-sm leading-relaxed mb-3 line-clamp-2">
              {server.description}
            </p>

            <div className="flex items-center justify-between">
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
