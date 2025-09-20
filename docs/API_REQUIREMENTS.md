# Nativelink API Requirements for MCP Server

## Overview

This document outlines the API endpoints that Nativelink needs to implement to fully support the MCP server's capabilities. The MCP server currently includes offline fallbacks for all functionality, but implementing these APIs will provide real-time, dynamic responses.

## Required API Endpoints

### 1. Documentation API

**Endpoint:** `GET /api/docs`

**Purpose:** Provide up-to-date, context-aware documentation

**Request Parameters:**
```typescript
{
  topic: 'setup' | 'migration' | 'optimization' | 'troubleshooting' | 'api',
  context?: string,  // Optional context for more specific responses
  version?: string   // Optional version specifier
}
```

**Example Request:**
```http
GET https://app.nativelink.com/api/docs?topic=optimization&context=rust_project
Authorization: Bearer YOUR_API_KEY
```

**Expected Response:**
```json
{
  "content": "# Nativelink Optimization for Rust\n\nDetailed markdown documentation...",
  "version": "1.0.0",
  "lastUpdated": "2024-01-01T00:00:00Z"
}
```

**Topics to Cover:**
- `setup`: Installation, initial configuration, getting started
- `migration`: Migrating from other build systems or caches
- `optimization`: Performance tuning, cost optimization
- `troubleshooting`: Common issues, debug techniques
- `api`: API reference, configuration options

### 2. Performance Analysis API

**Endpoint:** `POST /api/analyze`

**Purpose:** Analyze build metrics and provide AI-powered recommendations

**Request Body:**
```json
{
  "metrics": {
    "totalTime": 300,
    "cacheHitRate": 0.65,
    "remoteExecutionTime": 180,
    "localExecutionTime": 120,
    "networkTransferSize": 1048576000,
    "failedActions": 5,
    "totalActions": 100
  },
  "projectInfo": {
    "language": "rust",
    "size": "large",
    "teamSize": 50
  },
  "targetOptimization": "speed" | "cost" | "balanced"
}
```

**Expected Response:**
```json
{
  "analysis": "## Performance Analysis\n\n### Key Findings\n- Cache hit rate is below optimal (65%)\n- Network transfers are high\n\n### Recommendations\n1. Enable compression\n2. ...",
  "score": {
    "overall": 72,
    "cacheEfficiency": 65,
    "networkUsage": 55,
    "parallelization": 85
  },
  "suggestedConfig": {
    "flags": ["--remote_download_minimal", "--experimental_remote_cache_compression"],
    "settings": {}
  }
}
```

### 3. Configuration Validation API (Optional but Recommended)

**Endpoint:** `POST /api/validate-config`

**Purpose:** Validate Bazel configuration for correctness and optimization

**Request Body:**
```json
{
  "bazelrc": "# Content of .bazelrc file",
  "projectType": "rust",
  "features": ["remote_cache", "remote_execution"]
}
```

**Expected Response:**
```json
{
  "valid": true,
  "issues": [],
  "suggestions": [
    {
      "type": "optimization",
      "message": "Consider adding --remote_download_minimal for faster builds",
      "line": 10
    }
  ]
}
```

### 4. Metrics Submission API (Optional)

**Endpoint:** `POST /api/metrics`

**Purpose:** Allow users to submit anonymous build metrics for analysis

**Request Body:**
```json
{
  "sessionId": "uuid",
  "timestamp": "2024-01-01T00:00:00Z",
  "metrics": {
    "buildTime": 300,
    "cacheHits": 650,
    "cacheMisses": 350,
    "bytesDownloaded": 1048576000,
    "bytesUploaded": 524288000
  }
}
```

## Authentication

All API endpoints should support multiple authentication methods:

1. **Bearer Token** (Preferred)
   ```
   Authorization: Bearer YOUR_API_KEY
   ```

2. **Custom Headers** (Alternative)
   ```
   X-Nativelink-API-Key: YOUR_API_KEY
   X-API-Key: YOUR_API_KEY
   ```

## Rate Limiting

Suggested rate limits:
- **Free tier**: 100 requests/hour
- **Paid tier**: 1000 requests/hour
- **Enterprise**: Unlimited

Return standard rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## Error Responses

Use standard HTTP status codes and consistent error format:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded. Please try again later.",
    "details": {
      "limit": 100,
      "reset": 1640995200
    }
  }
}
```

## AI Integration

For the performance analysis endpoint, if AI-powered analysis is requested:

**Headers to Support:**
```
X-AI-Provider: anthropic | gemini | openai
X-AI-Key: YOUR_AI_API_KEY
```

This allows users to bring their own AI API keys for enhanced analysis.

## Implementation Priority

1. **High Priority**: Documentation API - Essential for providing up-to-date information
2. **Medium Priority**: Performance Analysis API - Adds significant value
3. **Low Priority**: Validation and Metrics APIs - Nice to have

## Testing Endpoints

Provide a test/sandbox environment:
- Base URL: `https://sandbox.nativelink.com/api`
- Test API Key: `test_key_123`
- Returns sample data for development

## Versioning

Support API versioning through:
1. URL path: `/api/v1/docs`
2. Header: `X-API-Version: 1`

## CORS Support

Enable CORS for browser-based MCP clients:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, X-Nativelink-API-Key, Content-Type
```

## Contact for Questions

For questions about this API specification:
- GitHub Issues: Create an issue in the MCP server repository
- Email: [Suggested contact email]

## Example Implementation (Node.js/Express)

```javascript
app.get('/api/docs', authenticate, async (req, res) => {
  const { topic, context, version } = req.query;

  const docs = await getDocumentation(topic, context, version);

  res.json({
    content: docs,
    version: '1.0.0',
    lastUpdated: new Date().toISOString()
  });
});

app.post('/api/analyze', authenticate, async (req, res) => {
  const { metrics, projectInfo, targetOptimization } = req.body;
  const aiProvider = req.headers['x-ai-provider'];
  const aiKey = req.headers['x-ai-key'];

  const analysis = await analyzeMetrics(metrics, {
    projectInfo,
    targetOptimization,
    aiProvider,
    aiKey
  });

  res.json({ analysis });
});
```