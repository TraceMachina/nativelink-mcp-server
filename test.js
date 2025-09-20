#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('Testing Nativelink MCP Server...\n');

// Start the server in stdio mode
const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Send a tools/list request
const listRequest = JSON.stringify({
  jsonrpc: '2.0',
  method: 'tools/list',
  id: 1
}) + '\n';

console.log('Sending tools/list request...');
server.stdin.write(listRequest);

// Collect output
let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();

  // Try to parse each line as JSON
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log('Response received:', JSON.stringify(response, null, 2));

        // If we got a successful tools list, test calling a tool
        if (response.result && response.result.tools) {
          console.log('\nTesting get-bazel-config tool...');
          const callRequest = JSON.stringify({
            jsonrpc: '2.0',
            method: 'tools/call',
            params: {
              name: 'get-bazel-config',
              arguments: {
                projectType: 'rust',
                features: ['remote_cache', 'remote_execution']
              }
            },
            id: 2
          }) + '\n';

          setTimeout(() => {
            server.stdin.write(callRequest);
          }, 100);
        }

        // If we got the tool response, exit
        if (response.id === 2) {
          console.log('\nTest completed successfully!');
          server.kill();
          process.exit(0);
        }
      } catch (e) {
        // Not valid JSON yet, continue collecting
      }
    }
  }
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('Test timed out');
  server.kill();
  process.exit(1);
}, 5000);