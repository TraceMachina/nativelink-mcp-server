#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { program } from 'commander';
import { createServer } from 'http';

import { NativelinkAPI } from './lib/api.js';
import { parseApiKey } from './lib/utils.js';
import type { NativelinkConfig } from './lib/types.js';

import { generateBazelConfig, GetBazelConfigSchema } from './tools/config.js';
import { getNativelinkDocs, GetNativelinkDocsSchema } from './tools/docs.js';
import { analyzeBuildPerformance, AnalyzeBuildPerformanceSchema } from './tools/performance.js';
import { generateDeploymentConfig, GenerateDeploymentConfigSchema } from './tools/deployment.js';
import { setupWatchAndBuild, SetupWatchAndBuildSchema } from './tools/watch.js';

const CONFIG: NativelinkConfig = {
  apiKey: process.env.NATIVELINK_API_KEY,
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  geminiKey: process.env.GEMINI_API_KEY,
  nativelinkUrl: process.env.NATIVELINK_URL,
  debug: process.env.DEBUG === 'true'
};

program
  .version('1.0.0')
  .description('Nativelink MCP Server - High-performance build cache and remote execution')
  .option('--transport <type>', 'Transport type (stdio or http)', 'stdio')
  .option('--port <number>', 'Port for HTTP transport', '3000')
  .option('--api-key <key>', 'Nativelink API key')
  .option('--anthropic-key <key>', 'Anthropic API key for enhanced features')
  .option('--gemini-key <key>', 'Gemini API key for enhanced features')
  .option('--nativelink-url <url>', 'Nativelink API URL')
  .action((options) => {
    if (options.apiKey) CONFIG.apiKey = options.apiKey;
    if (options.anthropicKey) CONFIG.anthropicKey = options.anthropicKey;
    if (options.geminiKey) CONFIG.geminiKey = options.geminiKey;
    if (options.nativelinkUrl) CONFIG.nativelinkUrl = options.nativelinkUrl;
  });

program.parse();

const options = program.opts();

async function createNativelinkServer(config: NativelinkConfig) {
  const server = new Server(
    {
      name: 'nativelink-mcp',
      version: '1.0.0'
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  const api = new NativelinkAPI(config);

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'get-bazel-config',
        description: 'Generate optimal Bazel configuration for Nativelink',
        inputSchema: {
          type: 'object',
          properties: {
            projectType: {
              type: 'string',
              enum: ['rust', 'cpp', 'java', 'python', 'go', 'mixed'],
              description: 'Type of project'
            },
            nativelinkUrl: {
              type: 'string',
              description: 'Nativelink server URL (defaults to cloud)'
            },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'Features to enable: remote_cache, remote_execution, metrics'
            }
          },
          required: ['projectType']
        }
      },
      {
        name: 'get-nativelink-docs',
        description: 'Fetch Nativelink documentation and best practices',
        inputSchema: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              enum: ['setup', 'migration', 'optimization', 'troubleshooting', 'api'],
              description: 'Documentation topic'
            },
            context: {
              type: 'string',
              description: 'Additional context or specific question'
            },
            maxTokens: {
              type: 'number',
              description: 'Maximum tokens to return (min 1000, default 5000)'
            }
          },
          required: ['topic']
        }
      },
      {
        name: 'analyze-build-performance',
        description: 'Analyze build performance and provide optimization recommendations',
        inputSchema: {
          type: 'object',
          properties: {
            profileData: {
              type: 'string',
              description: 'Bazel profile JSON data'
            },
            metrics: {
              type: 'object',
              properties: {
                totalTime: { type: 'number', description: 'Total build time in seconds' },
                cacheHitRate: { type: 'number', description: 'Cache hit rate (0-1)' },
                remoteExecutionTime: { type: 'number', description: 'Remote execution time in seconds' },
                localExecutionTime: { type: 'number', description: 'Local execution time in seconds' },
                networkTransferSize: { type: 'number', description: 'Network transfer size in bytes' }
              },
              description: 'Build metrics'
            },
            targetOptimization: {
              type: 'string',
              enum: ['speed', 'cost', 'balanced'],
              description: 'Optimization target'
            }
          }
        }
      },
      {
        name: 'generate-deployment-config',
        description: 'Generate deployment configuration for Nativelink',
        inputSchema: {
          type: 'object',
          properties: {
            platform: {
              type: 'string',
              enum: ['kubernetes', 'docker', 'aws', 'gcp', 'azure'],
              description: 'Deployment platform'
            },
            scale: {
              type: 'string',
              enum: ['small', 'medium', 'large', 'enterprise'],
              description: 'Deployment scale'
            },
            features: {
              type: 'array',
              items: { type: 'string' },
              description: 'Features to enable: monitoring, autoscaling, high_availability'
            }
          },
          required: ['platform', 'scale']
        }
      },
      {
        name: 'setup-watch-and-build',
        description: 'Set up automatic Bazel builds and tests on file changes with Nativelink',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              enum: ['build', 'test', 'both'],
              description: 'What to run on file changes (default: both)'
            },
            targets: {
              type: 'string',
              description: 'Bazel targets to build/test (default: //...)'
            },
            watchPaths: {
              type: 'array',
              items: { type: 'string' },
              description: 'Paths/patterns to watch for changes'
            },
            excludePaths: {
              type: 'array',
              items: { type: 'string' },
              description: 'Paths/patterns to exclude from watching'
            },
            debounceMs: {
              type: 'number',
              description: 'Milliseconds to wait before rebuilding (100-10000, default: 1000)'
            },
            useIbazel: {
              type: 'boolean',
              description: 'Use iBazel for intelligent watching (recommended)'
            }
          }
        }
      }
    ]
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'get-bazel-config': {
          const params = GetBazelConfigSchema.parse(args);
          const config = generateBazelConfig(params);
          return {
            content: [{
              type: 'text',
              text: config
            }]
          };
        }

        case 'get-nativelink-docs': {
          const params = GetNativelinkDocsSchema.parse(args);
          const docs = await getNativelinkDocs(params, api);
          return {
            content: [{
              type: 'text',
              text: docs
            }]
          };
        }

        case 'analyze-build-performance': {
          const params = AnalyzeBuildPerformanceSchema.parse(args);
          const analysis = await analyzeBuildPerformance(params, api);
          return {
            content: [{
              type: 'text',
              text: analysis
            }]
          };
        }

        case 'generate-deployment-config': {
          const params = GenerateDeploymentConfigSchema.parse(args);
          const deployment = generateDeploymentConfig(params);
          return {
            content: [{
              type: 'text',
              text: deployment
            }]
          };
        }

        case 'setup-watch-and-build': {
          const params = SetupWatchAndBuildSchema.parse(args);
          const watchConfig = setupWatchAndBuild(params);
          return {
            content: [{
              type: 'text',
              text: watchConfig
            }]
          };
        }

        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Tool not found: ${name}`
          );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        );
      }
      throw error;
    }
  });

  return server;
}

async function startStdioServer() {
  const server = await createNativelinkServer(CONFIG);
  const transport = new StdioServerTransport();

  await server.connect(transport);

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
}

async function startHttpServer() {
  const port = parseInt(options.port) || 3000;

  // Create a single server instance
  const server = await createNativelinkServer(CONFIG);

  const httpServer = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.url === '/ping') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('pong');
      return;
    }

    if (req.url === '/mcp' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', async () => {
        try {
          const request = JSON.parse(body);

          // Simple direct handling for the HTTP transport
          let response: any = {};

          if (request.method === 'tools/list') {
            // Return the tools list directly
            response = {
              tools: [
                {
                  name: 'get-bazel-config',
                  description: 'Generate optimal Bazel configuration for Nativelink',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      projectType: {
                        type: 'string',
                        enum: ['rust', 'cpp', 'java', 'python', 'go', 'mixed'],
                        description: 'Type of project'
                      },
                      nativelinkUrl: {
                        type: 'string',
                        description: 'Nativelink server URL (defaults to cloud)'
                      },
                      features: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Features to enable: remote_cache, remote_execution, metrics'
                      }
                    },
                    required: ['projectType']
                  }
                },
                {
                  name: 'get-nativelink-docs',
                  description: 'Fetch Nativelink documentation and best practices',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      topic: {
                        type: 'string',
                        enum: ['setup', 'migration', 'optimization', 'troubleshooting', 'api'],
                        description: 'Documentation topic'
                      },
                      context: {
                        type: 'string',
                        description: 'Additional context or specific question'
                      },
                      maxTokens: {
                        type: 'number',
                        description: 'Maximum tokens to return (min 1000, default 5000)'
                      }
                    },
                    required: ['topic']
                  }
                },
                {
                  name: 'analyze-build-performance',
                  description: 'Analyze build performance and provide optimization recommendations',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      profileData: {
                        type: 'string',
                        description: 'Bazel profile JSON data'
                      },
                      metrics: {
                        type: 'object',
                        properties: {
                          totalTime: { type: 'number', description: 'Total build time in seconds' },
                          cacheHitRate: { type: 'number', description: 'Cache hit rate (0-1)' },
                          remoteExecutionTime: { type: 'number', description: 'Remote execution time in seconds' },
                          localExecutionTime: { type: 'number', description: 'Local execution time in seconds' },
                          networkTransferSize: { type: 'number', description: 'Network transfer size in bytes' }
                        },
                        description: 'Build metrics'
                      },
                      targetOptimization: {
                        type: 'string',
                        enum: ['speed', 'cost', 'balanced'],
                        description: 'Optimization target'
                      }
                    }
                  }
                },
                {
                  name: 'generate-deployment-config',
                  description: 'Generate deployment configuration for Nativelink',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      platform: {
                        type: 'string',
                        enum: ['kubernetes', 'docker', 'aws', 'gcp', 'azure'],
                        description: 'Deployment platform'
                      },
                      scale: {
                        type: 'string',
                        enum: ['small', 'medium', 'large', 'enterprise'],
                        description: 'Deployment scale'
                      },
                      features: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Features to enable: monitoring, autoscaling, high_availability'
                      }
                    },
                    required: ['platform', 'scale']
                  }
                },
                {
                  name: 'setup-watch-and-build',
                  description: 'Set up automatic Bazel builds and tests on file changes with Nativelink',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      command: {
                        type: 'string',
                        enum: ['build', 'test', 'both'],
                        description: 'What to run on file changes (default: both)'
                      },
                      targets: {
                        type: 'string',
                        description: 'Bazel targets to build/test (default: //...)'
                      },
                      watchPaths: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Paths/patterns to watch for changes'
                      },
                      excludePaths: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Paths/patterns to exclude from watching'
                      },
                      debounceMs: {
                        type: 'number',
                        description: 'Milliseconds to wait before rebuilding (100-10000, default: 1000)'
                      },
                      useIbazel: {
                        type: 'boolean',
                        description: 'Use iBazel for intelligent watching (recommended)'
                      }
                    }
                  }
                }
              ]
            };
          } else if (request.method === 'tools/call') {
            // Parse the API key from headers if provided
            const apiKey = parseApiKey(req.headers as Record<string, string | string[] | undefined>);
            const api = new NativelinkAPI({ ...CONFIG, apiKey: apiKey || CONFIG.apiKey });

            const toolName = request.params?.name;
            const args = request.params?.arguments || {};

            try {
              let content: string = '';

              switch (toolName) {
                case 'get-bazel-config': {
                  const params = GetBazelConfigSchema.parse(args);
                  content = generateBazelConfig(params);
                  break;
                }
                case 'get-nativelink-docs': {
                  const params = GetNativelinkDocsSchema.parse(args);
                  content = await getNativelinkDocs(params, api);
                  break;
                }
                case 'analyze-build-performance': {
                  const params = AnalyzeBuildPerformanceSchema.parse(args);
                  content = await analyzeBuildPerformance(params, api);
                  break;
                }
                case 'generate-deployment-config': {
                  const params = GenerateDeploymentConfigSchema.parse(args);
                  content = generateDeploymentConfig(params);
                  break;
                }
                case 'setup-watch-and-build': {
                  const params = SetupWatchAndBuildSchema.parse(args);
                  content = setupWatchAndBuild(params);
                  break;
                }
                default:
                  throw new Error(`Unknown tool: ${toolName}`);
              }

              response = {
                content: [{
                  type: 'text',
                  text: content
                }]
              };
            } catch (error) {
              if (error instanceof z.ZodError) {
                response = {
                  error: {
                    code: 'InvalidParams',
                    message: `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
                  }
                };
              } else {
                response = {
                  error: {
                    code: 'InternalError',
                    message: error instanceof Error ? error.message : 'Unknown error'
                  }
                };
              }
            }
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Method not found' }));
            return;
          }

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } catch (error) {
          console.error('Error handling request:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  });

  httpServer.listen(port, () => {
    console.log(`Nativelink MCP server listening on port ${port}`);
    console.log(`Endpoint: http://localhost:${port}/mcp`);
  });

  process.on('SIGINT', () => {
    httpServer.close();
    process.exit(0);
  });
}

if (options.transport === 'http') {
  startHttpServer().catch(console.error);
} else {
  startStdioServer().catch(console.error);
}