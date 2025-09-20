import { z } from 'zod';
import { OptimizationTarget, type BuildMetrics } from '../lib/types.js';
import { NativelinkAPI } from '../lib/api.js';

export const AnalyzeBuildPerformanceSchema = z.object({
  profileData: z.string().optional(),
  metrics: z.object({
    totalTime: z.number().optional(),
    cacheHitRate: z.number().min(0).max(1).optional(),
    remoteExecutionTime: z.number().optional(),
    localExecutionTime: z.number().optional(),
    networkTransferSize: z.number().optional()
  }).optional(),
  targetOptimization: OptimizationTarget.optional()
});

export type AnalyzeBuildPerformanceParams = z.infer<typeof AnalyzeBuildPerformanceSchema>;

export async function analyzeBuildPerformance(
  params: AnalyzeBuildPerformanceParams,
  api: NativelinkAPI
): Promise<string> {
  const target = params.targetOptimization || 'balanced';

  let analysis = await api.analyzePerformance(params.metrics || {});

  analysis += '\n\n## Optimization Recommendations\n\n';

  if (target === 'speed') {
    analysis += getSpeedOptimizations(params.metrics);
  } else if (target === 'cost') {
    analysis += getCostOptimizations(params.metrics);
  } else {
    analysis += getBalancedOptimizations(params.metrics);
  }

  if (params.profileData) {
    analysis += '\n\n## Profile Analysis\n\n';
    analysis += analyzeProfileData(params.profileData);
  }

  return analysis;
}

function getSpeedOptimizations(metrics?: Partial<BuildMetrics>): string {
  const recommendations: string[] = [
    '### Speed Optimizations\n'
  ];

  recommendations.push('**Maximize Parallelization:**');
  recommendations.push('```');
  recommendations.push('build --jobs=auto');
  recommendations.push('build --remote_executor=grpc://executor.nativelink.com:443');
  recommendations.push('build --remote_download_outputs=toplevel');
  recommendations.push('```\n');

  recommendations.push('**Optimize Network:**');
  recommendations.push('```');
  recommendations.push('build --remote_max_connections=500');
  recommendations.push('build --remote_timeout=30');
  recommendations.push('build --experimental_remote_cache_async');
  recommendations.push('```\n');

  if (metrics?.cacheHitRate && metrics.cacheHitRate < 0.7) {
    recommendations.push('**Improve Cache Hit Rate:**');
    recommendations.push('- Enable strict action environment');
    recommendations.push('- Use deterministic toolchains');
    recommendations.push('- Configure proper platform settings\n');
  }

  recommendations.push('**Use Local Execution for Small Targets:**');
  recommendations.push('```');
  recommendations.push('build --modify_execution_info=.*-pkg.*=+no-remote');
  recommendations.push('```');

  return recommendations.join('\n');
}

function getCostOptimizations(metrics?: Partial<BuildMetrics>): string {
  const recommendations: string[] = [
    '### Cost Optimizations\n'
  ];

  recommendations.push('**Minimize Data Transfer:**');
  recommendations.push('```');
  recommendations.push('build --remote_download_minimal');
  recommendations.push('build --experimental_remote_cache_compression');
  recommendations.push('build --experimental_remote_build_event_upload=minimal');
  recommendations.push('```\n');

  recommendations.push('**Optimize Resource Usage:**');
  recommendations.push('```');
  recommendations.push('build --jobs=50  # Limit parallel jobs');
  recommendations.push('build --local_cpu_resources=4');
  recommendations.push('build --local_ram_resources=8192');
  recommendations.push('```\n');

  if (metrics?.networkTransferSize && metrics.networkTransferSize > 1024 * 1024 * 500) {
    recommendations.push('**Large Transfer Detected:**');
    recommendations.push('- Consider using --remote_download_minimal');
    recommendations.push('- Enable build without bytes for CI');
    recommendations.push('- Use remote asset API for large files\n');
  }

  recommendations.push('**Cache Strategy:**');
  recommendations.push('```');
  recommendations.push('build --remote_cache_priority=1');
  recommendations.push('build --remote_execution_priority=0');
  recommendations.push('```');

  return recommendations.join('\n');
}

function getBalancedOptimizations(metrics?: Partial<BuildMetrics>): string {
  const recommendations: string[] = [
    '### Balanced Optimizations\n'
  ];

  recommendations.push('**Recommended Configuration:**');
  recommendations.push('```');
  recommendations.push('build --jobs=100');
  recommendations.push('build --remote_download_outputs=minimal');
  recommendations.push('build --experimental_remote_cache_compression');
  recommendations.push('build --remote_timeout=60');
  recommendations.push('build --remote_retries=2');
  recommendations.push('```\n');

  recommendations.push('**Smart Caching:**');
  recommendations.push('```');
  recommendations.push('build --remote_cache=grpc://cache.nativelink.com:443');
  recommendations.push('build --remote_upload_local_results=true');
  recommendations.push('build --remote_local_fallback=true');
  recommendations.push('```\n');

  if (metrics?.totalTime && metrics.totalTime > 600) {
    recommendations.push('**Long Build Detected:**');
    recommendations.push('- Consider splitting into smaller targets');
    recommendations.push('- Use target-level parallelism');
    recommendations.push('- Enable incremental builds\n');
  }

  return recommendations.join('\n');
}

function analyzeProfileData(profileData: string): string {
  try {
    const lines = profileData.split('\n').slice(0, 10);

    return `Profile data detected (${profileData.length} bytes).

Consider using:
- \`bazel analyze-profile profile.json\` for detailed analysis
- Upload to https://app.nativelink.com/profile for visualization
- Key metrics to review:
  - Critical path duration
  - Action execution time
  - Remote vs local execution ratio`;
  } catch (error) {
    return 'Unable to parse profile data. Ensure it\'s in JSON format.';
  }
}