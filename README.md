# Nativelink MCP Server

[![License](https://img.shields.io/badge/License-FSL--1.1--Apache--2.0-blue.svg)](./LICENSE)
[![NPM Version](https://img.shields.io/npm/v/%40nativelink%2Fmcp-server)](https://www.npmjs.com/package/@nativelink/mcp-server)

MCP (Model Context Protocol) server for [Nativelink Cloud](https://app.nativelink.com) - High-performance cloud build cache and remote execution system that accelerates Bazel builds. Sign up at [app.nativelink.com](https://app.nativelink.com) to get your personalized configuration.

## Features

- 🚀 **Generate optimized Bazel configurations** using Nativelink Cloud endpoints
- 📚 **Access Nativelink Cloud setup and migration guides** directly in your AI assistant
- 📊 **Analyze build performance** with AI-powered recommendations
- 🏗️ **Generate deployment configurations** for self-hosted Nativelink instances
- 🔐 **Integration with app.nativelink.com** for personalized configurations
- 💡 **Smart recommendations** based on your project's specific needs

## Installation

### Quick Install (Cursor)

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=nativelink&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsIkBuYXRpdmVsaW5rL21jcC1zZXJ2ZXIiXX0%3D)

Or manually add to your Cursor configuration (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "nativelink": {
      "command": "npx",
      "args": ["-y", "@nativelink/mcp-server", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add nativelink -- npx -y @nativelink/mcp-server --api-key YOUR_API_KEY
```

### VS Code

Add to your VS Code settings:

```json
"mcp": {
  "servers": {
    "nativelink": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@nativelink/mcp-server", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```


## Getting Started with Nativelink Cloud

### 1. Sign up at [app.nativelink.com](https://app.nativelink.com)
- Create your free account
- Get instant access to cloud build cache and remote execution

### 2. Get Your Personalized Configuration
After signing up, you'll receive a personalized `.bazelrc` configuration:
```bash
build --remote_cache=grpcs://cas-tracemachina-shared.build-faster.nativelink.net
build --remote_header=x-nativelink-api-key=YOUR_API_KEY
build --bes_backend=grpcs://bes-tracemachina-shared.build-faster.nativelink.net
build --bes_header=x-nativelink-api-key=YOUR_BES_API_KEY
build --bes_results_url=https://app.nativelink.com/a/YOUR_BUILD_ID/build
build --remote_executor=grpcs://scheduler-tracemachina-shared.build-faster.nativelink.net:443
```

### 3. Add to Your Project
Append the configuration to your `.bazelrc` file and start building!

### AI Provider Keys (Optional)
For enhanced AI-powered features:
- **Anthropic**: Get from [console.anthropic.com](https://console.anthropic.com)
- **Gemini**: Get from [makersuite.google.com](https://makersuite.google.com)

## Usage

Simply add `use nativelink` to your prompts:

```
Set up Nativelink remote cache for my Rust project. use nativelink
```

```
Debug why my Bazel builds are slow. use nativelink
```

```
Generate Kubernetes deployment for Nativelink. use nativelink
```

## Available Tools

### 1. `get-bazel-config`
Generates optimized Bazel configuration for your project.

**Parameters:**
- `projectType` (required): rust, cpp, java, python, go, or mixed
- `nativelinkUrl` (optional): Custom Nativelink server URL
- `features` (optional): Array of features to enable

**Example:**
```
Generate a Bazel config for my Rust project with remote cache and execution. use nativelink
```

### 2. `get-nativelink-docs`
Fetches relevant Nativelink documentation.

**Parameters:**
- `topic` (required): setup, migration, optimization, troubleshooting, or api
- `context` (optional): Additional context for the query
- `maxTokens` (optional): Maximum response length

**Example:**
```
How do I migrate from local builds to Nativelink cloud? use nativelink
```

### 3. `analyze-build-performance`
Analyzes build metrics and provides optimization recommendations.

**Parameters:**
- `profileData` (optional): Bazel profile JSON
- `metrics` (optional): Build performance metrics
- `targetOptimization` (optional): speed, cost, or balanced

**Example:**
```
My cache hit rate is 40%. How can I improve it? use nativelink
```

### 4. `generate-deployment-config`
Generates deployment configurations for various platforms.

**Parameters:**
- `platform` (required): kubernetes, docker, aws, gcp, or azure
- `scale` (required): small, medium, large, or enterprise
- `features` (optional): monitoring, autoscaling, high_availability

**Example:**
```
Generate a Kubernetes deployment for Nativelink with autoscaling. use nativelink
```

## Configuration

### Environment Variables

```bash
export NATIVELINK_API_KEY=your_api_key
export ANTHROPIC_API_KEY=your_anthropic_key  # Optional
export GEMINI_API_KEY=your_gemini_key        # Optional
export NATIVELINK_URL=https://custom.url     # Optional
```

### Command Line Arguments

```bash
npx @nativelink/mcp-server \
  --api-key YOUR_API_KEY \
  --anthropic-key YOUR_ANTHROPIC_KEY \
  --transport http \
  --port 8080
```

## Pro Tips

### Add a Rule
To avoid typing `use nativelink` every time, add this rule to your AI assistant:

**Cursor**: Add to `Settings > Rules`
**Claude Code**: Add to `CLAUDE.md`

```
Always use nativelink when I ask about:
- Bazel configuration or optimization
- Build cache setup
- Remote execution
- Build performance issues
```

### Project-Specific Configuration

Create `.bazelrc.nativelink` in your project:

```bash
# Generated by Nativelink MCP
build --remote_cache=grpc://cache.nativelink.com:443
build --remote_cache_header=x-nativelink-api-key=YOUR_KEY
build --remote_download_minimal
build --experimental_remote_cache_compression
```

Then import in your main `.bazelrc`:

```bash
try-import .bazelrc.nativelink
```

## Development

### Building from Source

```bash
git clone https://github.com/nativelink/mcp-server-nativelink.git
cd mcp-server-nativelink
npm install
npm run build
```

### Running Locally

```bash
# Stdio transport (for testing)
npm run dev

# HTTP transport
npm run dev -- --transport http --port 3000
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx @nativelink/mcp-server
```

## Troubleshooting

### Authentication Errors
- Verify API key is set correctly
- Check network connectivity
- Ensure firewall allows outbound HTTPS

### Tool Not Working
- Update to latest version: `npm update @nativelink/mcp-server`
- Check logs with `DEBUG=true` environment variable
- Verify MCP client configuration

### Performance Issues
- Use `--remote_download_minimal` for large artifacts
- Enable compression with `--experimental_remote_cache_compression`
- Check network latency to cache server

## Support

- 📚 [Nativelink Documentation](https://nativelink.com/docs)
- 💬 [Slack Community](https://forms.gle/LtaWSixEC6bYi5xF7)
- 🐛 [GitHub Issues](https://github.com/TraceMachina/mcp-server-nativelink/issues)
- 📧 Enterprise Support: support@nativelink.com

## License

FSL-1.1-Apache-2.0 - Functional Source License v1.1 with Apache 2.0 future license.

This software is licensed under the Functional Source License (FSL) v1.1 and will automatically convert to Apache 2.0 license two years after each release. See [LICENSE](LICENSE) file for full details.

**Key Points:**
- ✅ Free for internal use, education, and research
- ✅ Free for providing professional services to users of the software
- ⚠️ Cannot be used to create competing MCP servers or services
- 🔄 Converts to Apache 2.0 after 2 years

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Acknowledgments

Inspired by the excellent [Context7 MCP Server](https://github.com/upstash/context7) architecture.