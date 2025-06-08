# Web Search APIs Explained

## 🤔 Why Do We Need Web Search?

The MCP Registry doesn't just store basic GitHub information - it enriches each server with **external resources** like tutorials, videos, discussions, and documentation found across the web.

### **What External Resources Are Found:**
- 📺 **YouTube tutorials** - "How to use mcp-server-playwright"
- 📝 **Dev.to articles** - "Building browser automation with MCP"
- 💬 **Reddit discussions** - Community Q&A and troubleshooting
- 📚 **Documentation** - Official guides and API references
- 🔧 **Stack Overflow** - Common issues and solutions

### **How It Works:**
1. **Discovery**: Find a new MCP server on GitHub
2. **Search**: Look for related content across the web
3. **Enrich**: Add real URLs to tutorials, videos, discussions
4. **Store**: Save these resources in the database
5. **Display**: Show users comprehensive information

## 🔍 Web Search Provider Options

### **Option 1: No Web Search (Simplest)**
```bash
# Only set required variables
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

**What you get:**
- ✅ Basic server information from GitHub
- ✅ AI-generated descriptions and use cases
- ❌ No external tutorials or videos
- ❌ No community discussions

**Cost:** Free (except OpenAI usage)

### **Option 2: Free Providers Only**
```bash
# Add free search capabilities
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
# No additional API keys needed - uses free APIs
```

**What you get:**
- ✅ Everything from Option 1
- ✅ Reddit discussions (free API)
- ✅ Dev.to articles (free API)
- ✅ DuckDuckGo search results (limited)
- ⚠️ Limited search quality

**Cost:** Free

### **Option 3: Freemium Providers**
```bash
# Add better search with free tiers
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
GOOGLE_API_KEY=your-google-key
GOOGLE_CX=your-custom-search-engine-id
YOUTUBE_API_KEY=your-youtube-key
BING_API_KEY=your-bing-key
```

**What you get:**
- ✅ Everything from Option 2
- ✅ High-quality Google search results (100/day free)
- ✅ YouTube video tutorials (quota limits)
- ✅ Bing search results (1000/month free)
- ✅ Better resource discovery

**Cost:** Free within limits, then pay-per-use

### **Option 4: Premium with Serper**
```bash
# Best search quality
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
SERPER_API_KEY=your-serper-key
```

**What you get:**
- ✅ Everything from previous options
- ✅ Highest quality search results
- ✅ Fast, reliable API
- ✅ No rate limiting issues
- ✅ Best external resource discovery

**Cost:** $50/month for 100k searches

## 🎯 Recommendations

### **For Development/Testing**
Use **Option 2 (Free Providers)** - gives you a feel for the system without any costs.

### **For Small Projects**
Use **Option 3 (Freemium)** - Google's 100 queries/day is often enough for small registries.

### **For Production**
Use **Option 4 (Serper)** - reliable, fast, and worth the cost for serious applications.

## 🔧 How to Set Up Each Option

### **Option 1: No Web Search**
1. Just set the required environment variables
2. The system will work with GitHub data only
3. External resources will be limited to known patterns

### **Option 2: Free Providers**
1. No additional setup needed
2. The system automatically uses free APIs
3. Reddit, Dev.to, and DuckDuckGo work out of the box

### **Option 3: Freemium Setup**

#### **Google Custom Search**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Custom Search API"
3. Create API key
4. Set up [Custom Search Engine](https://cse.google.com/)
5. Get your CX (Custom Search Engine ID)

#### **YouTube API**
1. Same Google Cloud project
2. Enable "YouTube Data API v3"
3. Use the same API key

#### **Bing Search**
1. Go to [Azure Portal](https://portal.azure.com/)
2. Create "Bing Search v7" resource
3. Get your API key

### **Option 4: Serper Setup**
1. Go to [Serper.dev](https://serper.dev/)
2. Sign up and get API key
3. Choose your plan (starts at $50/month)

## 📊 Feature Comparison

| Feature | No Search | Free | Freemium | Serper |
|---------|-----------|------|----------|--------|
| GitHub data | ✅ | ✅ | ✅ | ✅ |
| AI enrichment | ✅ | ✅ | ✅ | ✅ |
| Reddit discussions | ❌ | ✅ | ✅ | ✅ |
| Dev.to articles | ❌ | ✅ | ✅ | ✅ |
| YouTube videos | ❌ | ❌ | ✅ | ✅ |
| High-quality search | ❌ | ❌ | ✅ | ✅ |
| No rate limits | ✅ | ❌ | ❌ | ✅ |
| Production ready | ⚠️ | ⚠️ | ✅ | ✅ |

## 🚀 Getting Started

1. **Start simple**: Begin with Option 1 or 2 to test the system
2. **Add providers gradually**: Add API keys as you need better search
3. **Monitor usage**: Check your API quotas and costs
4. **Upgrade when needed**: Move to Serper for production workloads

The system is designed to work well at any level - you can always start free and upgrade later!

## 🔍 Example External Resources Found

With web search enabled, each MCP server gets enriched with resources like:

```json
{
  "external_resources": [
    {
      "title": "Playwright Automation Tutorial",
      "url": "https://youtube.com/watch?v=abc123",
      "type": "video",
      "source": "youtube",
      "duration": "15:30"
    },
    {
      "title": "Building MCP Servers with Playwright",
      "url": "https://dev.to/author/playwright-mcp",
      "type": "blog",
      "source": "devto"
    },
    {
      "title": "MCP Playwright Server Discussion",
      "url": "https://reddit.com/r/programming/comments/...",
      "type": "discussion",
      "source": "reddit"
    }
  ]
}
```

This makes the registry much more valuable for users who want to learn how to use each MCP server!
