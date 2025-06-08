'use client';

import { McpServer } from '@/lib/semantic-search';
import { Star, Download, ExternalLink, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopy();
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  title="Copy install command"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-neutral-600" />
                  )}
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(server.githubUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  title="View on GitHub"
                >
                  <ExternalLink className="w-4 h-4 text-neutral-600" />
                </button>
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
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCopy();
                }}
                className="inline-flex items-center px-3 py-1.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
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
