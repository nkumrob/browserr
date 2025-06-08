-- MCP Registry Database Schema
-- Based on established McpServer interface and PRD requirements

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Main MCP Servers table (based on McpServer interface from semantic-search.ts)
CREATE TABLE mcp_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    category TEXT NOT NULL,
    language TEXT NOT NULL,
    stars INTEGER DEFAULT 0,
    install_command TEXT NOT NULL,
    github_url TEXT UNIQUE NOT NULL,
    
    -- Author information (nested object in interface)
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    author_github_username TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    
    -- No constraint on category to allow extensibility
    -- Categories will be managed through the server_categories table
);

-- Enriched content table (AI-generated enhancements)
CREATE TABLE enriched_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    
    -- Core enriched data
    summary TEXT,
    use_cases JSONB DEFAULT '[]',
    integration_tips TEXT,
    faqs JSONB DEFAULT '[]',
    rephrased_content TEXT,
    classification_tags TEXT[] DEFAULT '{}',
    
    -- Extended enrichment data
    community_resources JSONB DEFAULT '{}',
    project_info JSONB DEFAULT '{}',
    
    -- Version tracking for change detection
    version_hash TEXT NOT NULL,
    content_hash TEXT,
    
    -- Processing metadata
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    enrichment_source TEXT DEFAULT 'openai',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one enriched content per server (latest)
    UNIQUE(server_id)
);

-- External resources table (tutorials, videos, discussions)
CREATE TABLE external_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    
    -- Resource details
    type TEXT NOT NULL CHECK (type IN (
        'video', 'blog', 'forum', 'tutorial', 'documentation', 'discussion'
    )),
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    source TEXT NOT NULL, -- youtube, dev.to, reddit, etc.
    description TEXT,
    
    -- Metadata
    author TEXT,
    published_date TIMESTAMP WITH TIME ZONE,
    duration TEXT, -- for videos
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Quality metrics
    rank_score DECIMAL(3,2) DEFAULT 0.0,
    verified BOOLEAN DEFAULT FALSE,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate URLs per server
    UNIQUE(server_id, url)
);

-- Enrichment queue for processing jobs
CREATE TABLE enrichment_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID NOT NULL REFERENCES mcp_servers(id) ON DELETE CASCADE,
    
    -- Job details
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'error'
    )),
    trigger_source TEXT NOT NULL CHECK (trigger_source IN (
        'auto', 'manual', 'discovery', 'change_detection'
    )),
    requested_by TEXT NOT NULL,
    
    -- Processing details
    last_processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    processing_metadata JSONB DEFAULT '{}',
    retry_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Discovery runs table (track scraping sessions)
CREATE TABLE discovery_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Run details
    source TEXT NOT NULL, -- 'mcp.so', 'github', 'manual'
    total_found INTEGER DEFAULT 0,
    new_servers INTEGER DEFAULT 0,
    updated_servers INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    processing_time_ms INTEGER DEFAULT 0,
    estimated_cost DECIMAL(10,4) DEFAULT 0.0,
    
    -- Content tracking
    source_hash TEXT,
    errors JSONB DEFAULT '[]',
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status TEXT DEFAULT 'running' CHECK (status IN (
        'running', 'completed', 'failed'
    ))
);

-- Server categories for organization
CREATE TABLE server_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert categories found in the codebase
INSERT INTO server_categories (name, display_name, description, icon, color, sort_order) VALUES
('search', 'Search', 'Search engines, web search APIs, indexing, query processing', '🔍', '#06B6D4', 1),
('browser-automation', 'Browser Automation', 'Control browsers, take screenshots, automate interactions', '🌐', '#3B82F6', 2),
('data-extraction', 'Data Extraction', 'Scrape websites, extract structured data, parse content', '📊', '#10B981', 3),
('file-processing', 'File Processing', 'Parse documents, convert formats, extract content', '📄', '#F59E0B', 4),
('api-integration', 'API Integration', 'Connect to external APIs, wrappers, and services', '🔗', '#8B5CF6', 5),
('web-interaction', 'Web Interaction', 'Form filling, clicking, web manipulation', '🖱️', '#EF4444', 6),
('data-integration', 'Data Integration', 'Database connections, data migration, ETL processes', '🗄️', '#84CC16', 7),
-- Additional categories that may be discovered
('ai-ml', 'AI & Machine Learning', 'AI models, machine learning, natural language processing', '🤖', '#F97316', 8),
('security', 'Security', 'Authentication, encryption, security scanning', '🔒', '#DC2626', 9),
('monitoring', 'Monitoring', 'Logging, metrics, health checks, observability', '📈', '#059669', 10),
('communication', 'Communication', 'Messaging, notifications, chat integrations', '💬', '#7C3AED', 11),
('development', 'Development', 'Code generation, testing, CI/CD, development tools', '⚙️', '#0891B2', 12),
('media', 'Media', 'Image processing, video handling, audio manipulation', '🎨', '#BE185D', 13),
('productivity', 'Productivity', 'Task management, scheduling, workflow automation', '📋', '#65A30D', 14),
('finance', 'Finance', 'Payment processing, financial data, accounting', '💰', '#CA8A04', 15);

-- Create indexes for performance
CREATE INDEX idx_mcp_servers_category ON mcp_servers(category);
CREATE INDEX idx_mcp_servers_language ON mcp_servers(language);
CREATE INDEX idx_mcp_servers_stars ON mcp_servers(stars DESC);
CREATE INDEX idx_mcp_servers_updated_at ON mcp_servers(updated_at DESC);
CREATE INDEX idx_mcp_servers_github_url ON mcp_servers(github_url);

-- Full-text search indexes
CREATE INDEX idx_mcp_servers_search ON mcp_servers USING GIN (
    to_tsvector('english', name || ' ' || description || ' ' || array_to_string(tags, ' '))
);

CREATE INDEX idx_enriched_content_search ON enriched_content USING GIN (
    to_tsvector('english', summary || ' ' || rephrased_content)
);

-- External resources indexes
CREATE INDEX idx_external_resources_server_id ON external_resources(server_id);
CREATE INDEX idx_external_resources_type ON external_resources(type);
CREATE INDEX idx_external_resources_rank_score ON external_resources(rank_score DESC);
CREATE INDEX idx_external_resources_verified ON external_resources(verified);

-- Enrichment queue indexes
CREATE INDEX idx_enrichment_queue_status ON enrichment_queue(status);
CREATE INDEX idx_enrichment_queue_server_id ON enrichment_queue(server_id);
CREATE INDEX idx_enrichment_queue_created_at ON enrichment_queue(created_at DESC);

-- Discovery runs indexes
CREATE INDEX idx_discovery_runs_started_at ON discovery_runs(started_at DESC);
CREATE INDEX idx_discovery_runs_source ON discovery_runs(source);
CREATE INDEX idx_discovery_runs_status ON discovery_runs(status);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mcp_servers_updated_at 
    BEFORE UPDATE ON mcp_servers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enriched_content_updated_at 
    BEFORE UPDATE ON enriched_content 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_resources_updated_at 
    BEFORE UPDATE ON external_resources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrichment_queue_updated_at 
    BEFORE UPDATE ON enrichment_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW server_stats AS
SELECT 
    category,
    language,
    COUNT(*) as server_count,
    AVG(stars) as avg_stars,
    SUM(stars) as total_stars,
    MAX(updated_at) as last_updated
FROM mcp_servers 
GROUP BY category, language;

CREATE VIEW enrichment_stats AS
SELECT 
    status,
    COUNT(*) as job_count,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_processing_time_seconds
FROM enrichment_queue 
GROUP BY status;

-- Sample data insertion function
CREATE OR REPLACE FUNCTION insert_sample_server(
    p_name TEXT,
    p_description TEXT,
    p_github_url TEXT,
    p_category TEXT DEFAULT 'web-interaction',
    p_language TEXT DEFAULT 'TypeScript',
    p_stars INTEGER DEFAULT 0,
    p_tags TEXT[] DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    server_id UUID;
    server_slug TEXT;
BEGIN
    -- Generate slug
    server_slug := lower(regexp_replace(p_name, '[^a-zA-Z0-9]+', '-', 'g'));
    server_slug := trim(both '-' from server_slug);
    
    -- Insert server
    INSERT INTO mcp_servers (
        slug, name, description, github_url, category, language, stars, tags,
        install_command, author_name, author_github_username
    ) VALUES (
        server_slug, p_name, p_description, p_github_url, p_category, p_language, p_stars, p_tags,
        'npm install ' || server_slug,
        'Unknown',
        'unknown'
    ) RETURNING id INTO server_id;
    
    -- Add to enrichment queue
    INSERT INTO enrichment_queue (server_id, trigger_source, requested_by)
    VALUES (server_id, 'manual', 'database_setup');
    
    RETURN server_id;
END;
$$ LANGUAGE plpgsql;
