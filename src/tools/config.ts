import { z } from 'zod';
import { ProjectType, type BazelConfig } from '../lib/types.js';
import { formatBazelrc } from '../lib/utils.js';

export const GetBazelConfigSchema = z.object({
  projectType: ProjectType,
  nativelinkUrl: z.string().optional(),
  features: z.array(z.string()).optional()
});

export type GetBazelConfigParams = z.infer<typeof GetBazelConfigSchema>;

export function generateBazelConfig(params: GetBazelConfigParams): string {
  const features = params.features || ['remote_cache', 'remote_execution', 'bes'];

  const lines: string[] = [
    '# Nativelink Cloud Configuration',
    `# Generated for ${params.projectType} project`,
    `# ${new Date().toISOString()}`,
    '',
    '# IMPORTANT: Get your personalized configuration from https://app.nativelink.com',
    '# The configuration below is a template - replace with your actual values from the dashboard',
    '',
    '# Remote Cache Configuration'
  ];

  if (features.includes('remote_cache')) {
    lines.push(
      'build --remote_cache=grpcs://cas-tracemachina-shared.build-faster.nativelink.net',
      'build --remote_header=x-nativelink-api-key=YOUR_API_KEY_FROM_APP_NATIVELINK_COM',
      ''
    );
  }

  if (features.includes('bes')) {
    lines.push(
      '# Build Event Service (BES) Configuration',
      'build --bes_backend=grpcs://bes-tracemachina-shared.build-faster.nativelink.net',
      'build --bes_header=x-nativelink-api-key=YOUR_BES_API_KEY_FROM_APP_NATIVELINK_COM',
      'build --bes_results_url=https://app.nativelink.com/a/YOUR_BUILD_ID/build',
      ''
    );
  }

  if (features.includes('remote_execution')) {
    lines.push(
      '# Remote Execution Configuration',
      'build --remote_executor=grpcs://scheduler-tracemachina-shared.build-faster.nativelink.net:443',
      'build --remote_timeout=600',
      'build --jobs=200',
      'build --remote_download_outputs=minimal',
      ''
    );
  }

  lines.push(
    '# Performance Optimizations',
    'build --experimental_remote_cache_compression',
    'build --experimental_remote_cache_async',
    'build --remote_max_connections=200',
    ''
  );

  const projectSpecific = getProjectSpecificConfig(params.projectType);
  if (projectSpecific.length > 0) {
    lines.push(
      `# ${params.projectType} Specific Configuration`,
      ...projectSpecific,
      ''
    );
  }

  lines.push(
    '# Build Reproducibility',
    'build --incompatible_strict_action_env',
    'build --action_env=BAZEL_DO_NOT_DETECT_CPP_TOOLCHAIN=1',
    ''
  );

  if (features.includes('metrics')) {
    lines.push(
      '# Metrics and Monitoring',
      'build --experimental_remote_grpc_log=grpc.log',
      'build --generate_json_trace_profile',
      'build --experimental_profile_include_primary_output',
      ''
    );
  }

  lines.push(
    '# Test Configuration',
    'test --test_output=errors',
    'test --test_summary=detailed',
    ''
  );

  return formatBazelrc(lines);
}

function getProjectSpecificConfig(projectType: string): string[] {
  const configs: Record<string, string[]> = {
    rust: [
      'build --@rules_rust//rust/settings:pipelined_compilation=True',
      'build --@rules_rust//rust/settings:rustfmt_toml=//:rustfmt.toml'
    ],
    cpp: [
      'build --cxxopt=-std=c++17',
      'build --host_cxxopt=-std=c++17',
      'build --copt=-fPIC'
    ],
    java: [
      'build --java_language_version=11',
      'build --java_runtime_version=remotejdk_11',
      'build --tool_java_language_version=11',
      'build --tool_java_runtime_version=remotejdk_11'
    ],
    python: [
      'build --action_env=PYTHONDONTWRITEBYTECODE=1',
      'test --test_env=PYTHONDONTWRITEBYTECODE=1'
    ],
    go: [
      'build --@io_bazel_rules_go//go/config:race=false',
      'test --@io_bazel_rules_go//go/config:race=true'
    ],
    mixed: [
      '# Configure based on your primary language',
      '# See language-specific configurations above'
    ]
  };

  return configs[projectType] || [];
}