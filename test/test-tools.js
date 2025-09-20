#!/usr/bin/env node

import { generateBazelConfig } from '../dist/tools/config.js';
import { generateDeploymentConfig } from '../dist/tools/deployment.js';
import { analyzeBuildPerformance } from '../dist/tools/performance.js';
import { NativelinkAPI } from '../dist/lib/api.js';

console.log('Testing Nativelink MCP Server Tools...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// Test Bazel config generation
test('Generate Bazel config for Rust project', () => {
  const config = generateBazelConfig({
    projectType: 'rust',
    features: ['remote_cache', 'remote_execution']
  });

  if (!config.includes('build --remote_cache=')) {
    throw new Error('Missing remote cache configuration');
  }
  if (!config.includes('rust/settings')) {
    throw new Error('Missing Rust-specific settings');
  }
});

test('Generate Bazel config for Python project', () => {
  const config = generateBazelConfig({
    projectType: 'python',
    features: ['remote_cache']
  });

  if (!config.includes('PYTHONDONTWRITEBYTECODE')) {
    throw new Error('Missing Python-specific settings');
  }
});

// Test deployment config generation
test('Generate Kubernetes deployment', () => {
  const config = generateDeploymentConfig({
    platform: 'kubernetes',
    scale: 'medium',
    features: ['monitoring', 'autoscaling']
  });

  if (!config.includes('kind: Deployment')) {
    throw new Error('Missing Kubernetes deployment');
  }
  if (!config.includes('HorizontalPodAutoscaler')) {
    throw new Error('Missing autoscaling configuration');
  }
});

test('Generate Docker Compose config', () => {
  const config = generateDeploymentConfig({
    platform: 'docker',
    scale: 'small',
    features: []
  });

  if (!config.includes('version:')) {
    throw new Error('Missing Docker Compose version');
  }
  if (!config.includes('nativelink:')) {
    throw new Error('Missing service definition');
  }
});

// Test performance analysis
test('Analyze build performance with low cache hit rate', async () => {
  const api = new NativelinkAPI({});
  const analysis = await analyzeBuildPerformance({
    metrics: {
      cacheHitRate: 0.3,
      totalTime: 300
    },
    targetOptimization: 'speed'
  }, api);

  if (!analysis.includes('Low cache hit rate')) {
    throw new Error('Should detect low cache hit rate');
  }
});

test('Generate cost-optimized recommendations', async () => {
  const api = new NativelinkAPI({});
  const analysis = await analyzeBuildPerformance({
    metrics: {
      networkTransferSize: 1024 * 1024 * 1000
    },
    targetOptimization: 'cost'
  }, api);

  if (!analysis.includes('Cost Optimization')) {
    throw new Error('Should provide cost optimization recommendations');
  }
});

// Test API fallback
test('API returns offline docs on failure', async () => {
  const api = new NativelinkAPI({});
  const docs = await api.fetchDocumentation('setup');

  if (!docs.includes('Nativelink Setup Guide')) {
    throw new Error('Should return offline documentation');
  }
});

// Summary
console.log('\n========================================');
console.log(`Tests Passed: ${passed}`);
console.log(`Tests Failed: ${failed}`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
}