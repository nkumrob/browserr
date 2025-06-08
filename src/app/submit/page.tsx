'use client';

import { useState } from 'react';
import { Upload, Github, Package, Tag, FileText, Send, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SubmitPage() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    githubUrl: '',
    category: '',
    language: '',
    tags: '',
    installCommand: '',
    documentation: '',
    email: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: 'browser-automation', name: 'Browser Automation', icon: '🤖' },
    { id: 'data-extraction', name: 'Data Extraction', icon: '📊' },
    { id: 'api-integration', name: 'API Integration', icon: '🔗' },
    { id: 'file-processing', name: 'File Processing', icon: '📄' },
    { id: 'web-interaction', name: 'Web Interaction', icon: '🌐' },
    { id: 'search', name: 'Search', icon: '🔍' },
  ];

  const languages = ['TypeScript', 'JavaScript', 'Python', 'Java', 'Go', 'Rust', 'C++', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('Submitting:', formData);
    setSubmitted(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200">
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
                <Link href="/submit" className="text-primary-600 font-medium">Submit</Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Success Message */}
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Submission Received!</h2>
            <p className="text-neutral-600 mb-6">
              Thank you for submitting your MCP server. Our team will review it and get back to you within 2-3 business days.
            </p>
            <div className="space-y-3">
              <Link
                href="/"
                className="block w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Back to Home
              </Link>
              <button
                onClick={() => setSubmitted(false)}
                className="block w-full px-4 py-2 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Submit Another
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
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
              <Link href="/submit" className="text-primary-600 font-medium">Submit</Link>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                Sign In
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Submit Your MCP Server</h2>
          <p className="text-lg text-neutral-600 mb-8">
            Share your Model Context Protocol server with the community. Help others discover and use your tools.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-8">
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Server Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="my-awesome-server"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Language *
                    </label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    >
                      <option value="">Select language</option>
                      {languages.map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="Describe what your server does and its key features..."
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Category *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.category === category.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.id}
                        checked={formData.category === category.id}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <span className="text-lg mr-2">{category.icon}</span>
                      <span className="text-sm font-medium">{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Technical Details */}
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center">
                  <Github className="w-5 h-5 mr-2" />
                  Technical Details
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      GitHub Repository URL *
                    </label>
                    <input
                      type="url"
                      name="githubUrl"
                      value={formData.githubUrl}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Install Command *
                    </label>
                    <input
                      type="text"
                      name="installCommand"
                      value={formData.installCommand}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      placeholder="npm install @mcp/my-server"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="automation, scraping, api (comma-separated)"
                />
                <p className="text-sm text-neutral-600 mt-1">Separate tags with commas</p>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-lg font-bold text-neutral-900 mb-4">Contact Information</h3>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    placeholder="your@email.com"
                  />
                  <p className="text-sm text-neutral-600 mt-1">We'll use this to contact you about your submission</p>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6 border-t border-neutral-200">
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Submit Server
                </button>
                <p className="text-sm text-neutral-600 text-center mt-3">
                  By submitting, you agree to our terms of service and community guidelines.
                </p>
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
