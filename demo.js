#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Nativelink MCP Server Demo\n');
console.log('This demo shows the MCP server responding to tool requests.\n');

// Start the server
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let requestId = 1;

function sendRequest(request) {
  return new Promise((resolve) => {
    const jsonRequest = JSON.stringify({
      jsonrpc: '2.0',
      ...request,
      id: requestId++
    }) + '\n';

    server.stdin.write(jsonRequest);

    const handler = (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.id === requestId - 1) {
              server.stdout.removeListener('data', handler);
              resolve(response);
            }
          } catch (e) {
            // Continue collecting
          }
        }
      }
    };

    server.stdout.on('data', handler);
  });
}

async function demo() {
  console.log('1️⃣ Listing available tools...\n');

  const toolsList = await sendRequest({
    method: 'tools/list'
  });

  console.log('Available tools:');
  toolsList.result.tools.forEach(tool => {
    console.log(`  • ${tool.name}: ${tool.description}`);
  });

  console.log('\n2️⃣ Generating Bazel config for a Rust project...\n');

  const bazelConfig = await sendRequest({
    method: 'tools/call',
    params: {
      name: 'get-bazel-config',
      arguments: {
        projectType: 'rust',
        features: ['remote_cache', 'remote_execution']
      }
    }
  });

  console.log('Generated Bazel configuration:');
  console.log('---');
  console.log(bazelConfig.result.content[0].text.substring(0, 500) + '...');
  console.log('---');

  console.log('\n3️⃣ Getting Nativelink setup documentation...\n');

  const docs = await sendRequest({
    method: 'tools/call',
    params: {
      name: 'get-nativelink-docs',
      arguments: {
        topic: 'setup',
        maxTokens: 2000
      }
    }
  });

  console.log('Documentation excerpt:');
  console.log('---');
  console.log(docs.result.content[0].text.substring(0, 400) + '...');
  console.log('---');

  console.log('\n4️⃣ Analyzing build performance...\n');

  const analysis = await sendRequest({
    method: 'tools/call',
    params: {
      name: 'analyze-build-performance',
      arguments: {
        metrics: {
          cacheHitRate: 0.45,
          totalTime: 600,
          networkTransferSize: 1024 * 1024 * 500
        },
        targetOptimization: 'speed'
      }
    }
  });

  console.log('Performance analysis:');
  console.log('---');
  console.log(analysis.result.content[0].text.substring(0, 400) + '...');
  console.log('---');

  console.log('\n5️⃣ Generating Kubernetes deployment config...\n');

  const deployment = await sendRequest({
    method: 'tools/call',
    params: {
      name: 'generate-deployment-config',
      arguments: {
        platform: 'kubernetes',
        scale: 'medium',
        features: ['monitoring', 'autoscaling']
      }
    }
  });

  console.log('Kubernetes deployment (excerpt):');
  console.log('---');
  console.log(deployment.result.content[0].text.substring(0, 400) + '...');
  console.log('---');

  console.log('\n✅ Demo completed successfully!');
  console.log('\nTo use this MCP server with Cursor or Claude Code:');
  console.log('1. Install: npm install -g @nativelink/mcp-server');
  console.log('2. Add to your MCP configuration');
  console.log('3. Use "use nativelink" in your prompts\n');

  server.kill();
  process.exit(0);
}

// Handle errors
server.on('error', (error) => {
  console.error('Error:', error);
  process.exit(1);
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Run demo
console.log('Starting MCP server...\n');
setTimeout(demo, 1000);