import { fetch } from 'undici';
import type { NativelinkConfig } from './types.js';

export class NativelinkAPI {
  private config: NativelinkConfig;
  private baseUrl: string;

  constructor(config: NativelinkConfig) {
    this.config = config;
    this.baseUrl = config.nativelinkUrl || 'https://api.nativelink.com';
  }

  async fetchDocumentation(topic: string, context?: string): Promise<string> {
    try {
      const params = new URLSearchParams({
        topic,
        ...(context && { context })
      });

      const response = await fetch(`${this.baseUrl}/docs?${params}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return this.getOfflineDocumentation(topic, context);
        }
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json() as { content: string };
      return data.content;
    } catch (error) {
      console.error('Error fetching documentation:', error);
      return this.getOfflineDocumentation(topic, context);
    }
  }

  private getOfflineDocumentation(topic: string, context?: string): string {
    const docs: Record<string, string> = {
      setup: `# Nativelink Cloud Setup Guide

## Quick Start with Nativelink Cloud

1. **Sign up at [app.nativelink.com](https://app.nativelink.com)**
   - Create your free account
   - Get your API keys and personalized configuration

2. **Get your .bazelrc configuration**:
   After signing up, you'll receive a personalized configuration like:
   \`\`\`
   build --remote_cache=grpcs://cas-tracemachina-shared.build-faster.nativelink.net
   build --remote_header=x-nativelink-api-key=YOUR_API_KEY
   build --bes_backend=grpcs://bes-tracemachina-shared.build-faster.nativelink.net
   build --bes_header=x-nativelink-api-key=YOUR_BES_API_KEY
   build --bes_results_url=https://app.nativelink.com/a/YOUR_BUILD_ID/build
   build --remote_timeout=600
   build --remote_executor=grpcs://scheduler-tracemachina-shared.build-faster.nativelink.net:443
   \`\`\`

3. **Add to your project**:
   - Append the configuration to your \`.bazelrc\`
   - Or create a \`.bazelrc.user\` file (gitignored)

4. **Run your build**:
   \`\`\`bash
   bazel build //...
   \`\`\`

   Your builds will now use Nativelink Cloud for caching and remote execution!

## Features
- ⚡ Instant cache hits across your team
- 🚀 Remote execution on powerful cloud machines
- 📊 Build analytics and insights at app.nativelink.com
- 🔒 Secure, isolated build environments`,

      migration: `# Migration to Nativelink Cloud

## From Local Builds

1. **Sign up at [app.nativelink.com](https://app.nativelink.com)**

2. **Baseline your current performance**:
   \`\`\`bash
   bazel build --profile=baseline.prof //...
   \`\`\`

3. **Add your Nativelink Cloud configuration**:
   Get your personalized config from the dashboard and add to \`.bazelrc\`:
   \`\`\`
   # From app.nativelink.com dashboard
   build --remote_cache=grpcs://cas-tracemachina-shared.build-faster.nativelink.net
   build --remote_header=x-nativelink-api-key=YOUR_API_KEY
   build --bes_backend=grpcs://bes-tracemachina-shared.build-faster.nativelink.net
   build --bes_header=x-nativelink-api-key=YOUR_BES_API_KEY
   \`\`\`

4. **Test with read-only cache first**:
   \`\`\`
   build --remote_upload_local_results=false
   \`\`\`

5. **Enable full caching and remote execution**:
   \`\`\`
   build --remote_upload_local_results=true
   build --remote_executor=grpcs://scheduler-tracemachina-shared.build-faster.nativelink.net:443
   \`\`\`

## From Other Remote Caches

Nativelink Cloud is compatible with standard Remote Execution API:
1. Replace your cache endpoints with Nativelink Cloud URLs
2. Update authentication to use Nativelink API keys
3. No changes needed to BUILD files or rules`,

      optimization: `# Nativelink Performance Optimization

## Cache Optimization

1. **Increase cache hit rate**:
   - Use \`--experimental_strict_action_env\` for reproducible builds
   - Set \`--incompatible_strict_action_env=true\`
   - Configure proper toolchains

2. **Network optimization**:
   \`\`\`
   build --remote_timeout=60
   build --remote_retries=3
   build --remote_max_connections=200
   \`\`\`

3. **Parallel execution**:
   \`\`\`
   build --jobs=auto
   build --remote_executor=grpc://executor.nativelink.com:443
   \`\`\`

## Cost Optimization

- Use \`--remote_download_minimal\` to reduce bandwidth
- Enable compression: \`--experimental_remote_cache_compression\`
- Set appropriate \`--remote_instance_name\` for isolation`,

      troubleshooting: `# Nativelink Troubleshooting

## Common Issues

### Authentication Errors
- Verify API key is set correctly
- Check network connectivity
- Ensure firewall allows gRPC traffic (port 443/50051)

### Cache Misses
- Check for non-hermetic actions
- Verify toolchain configuration
- Review \`--execution_log_json_file\` output

### Slow Builds
- Monitor with \`--experimental_remote_grpc_log\`
- Check network latency to cache
- Optimize large artifact handling

### Debug Commands
\`\`\`bash
# Enable verbose logging
bazel build --remote_grpc_log=grpc.log //...

# Profile build performance
bazel build --profile=profile.json --generate_json_trace_profile //...

# Check cache status
grpcurl -H "x-nativelink-api-key: YOUR_KEY" cache.nativelink.com:443 list
\`\`\``,

      api: `# Nativelink Cloud API Reference

## Getting Your Configuration

1. **Sign up at [app.nativelink.com](https://app.nativelink.com)**
2. **Navigate to Dashboard > API Keys**
3. **Copy your personalized .bazelrc configuration**

## Your Personalized Configuration

Your configuration from app.nativelink.com includes:

### Cache Service
\`\`\`
build --remote_cache=grpcs://cas-tracemachina-shared.build-faster.nativelink.net
build --remote_header=x-nativelink-api-key=YOUR_CACHE_API_KEY
\`\`\`

### Build Event Service (BES)
\`\`\`
build --bes_backend=grpcs://bes-tracemachina-shared.build-faster.nativelink.net
build --bes_header=x-nativelink-api-key=YOUR_BES_API_KEY
build --bes_results_url=https://app.nativelink.com/a/YOUR_BUILD_ID/build
\`\`\`

### Remote Execution
\`\`\`
build --remote_executor=grpcs://scheduler-tracemachina-shared.build-faster.nativelink.net:443
build --remote_timeout=600
\`\`\`

## Optional Optimizations

Add these for better performance:
\`\`\`
build --remote_download_minimal
build --experimental_remote_cache_compression
build --jobs=200
\`\`\`

## Monitoring

View your builds at: https://app.nativelink.com/builds`
    };

    return docs[topic] || docs.setup;
  }

  async analyzePerformance(metrics: any): Promise<string> {
    if (this.config.anthropicKey || this.config.geminiKey) {
      try {
        const aiProvider = this.config.anthropicKey ? 'anthropic' : 'gemini';
        const response = await fetch(`${this.baseUrl}/analyze`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'X-AI-Provider': aiProvider,
            'X-AI-Key': this.config.anthropicKey || this.config.geminiKey || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ metrics })
        });

        if (response.ok) {
          const data = await response.json() as { analysis: string };
          return data.analysis;
        }
      } catch (error) {
        console.error('Error analyzing performance:', error);
      }
    }

    return this.generateBasicAnalysis(metrics);
  }

  private generateBasicAnalysis(metrics: any): string {
    const analysis: string[] = [];

    if (metrics.cacheHitRate !== undefined) {
      if (metrics.cacheHitRate < 0.5) {
        analysis.push('⚠️ Low cache hit rate detected. Consider:');
        analysis.push('  - Enabling strict action environment');
        analysis.push('  - Checking for non-hermetic build rules');
        analysis.push('  - Reviewing toolchain configuration');
      } else if (metrics.cacheHitRate > 0.8) {
        analysis.push('✅ Excellent cache hit rate!');
      }
    }

    if (metrics.totalTime && metrics.remoteExecutionTime) {
      const remotePercent = (metrics.remoteExecutionTime / metrics.totalTime) * 100;
      if (remotePercent > 70) {
        analysis.push('📊 Most execution happening remotely - good parallelization');
      }
    }

    if (metrics.networkTransferSize && metrics.networkTransferSize > 1024 * 1024 * 100) {
      analysis.push('🌐 Large network transfers detected. Consider:');
      analysis.push('  - Using --remote_download_minimal');
      analysis.push('  - Enabling compression');
    }

    return analysis.join('\n') || 'Build metrics look normal. No specific optimizations recommended.';
  }
}