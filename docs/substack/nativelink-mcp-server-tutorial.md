# Nativelink MCP Server: A Practical Guide for Cursor and VS Code

If you build with Bazel and care about fast feedback loops, NativeLink’s MCP server gives your AI assistant real, actionable context: tuned `.bazelrc` snippets, targeted docs, and build‑performance analysis. This guide shows how to wire it up in Cursor and VS Code and put it to work immediately.

## What You Get

- **Bazel config generation** tailored to your project
- **Docs on demand** (setup, migration, optimization, troubleshooting)
- **Build performance analysis** for practical next steps
- **Deployment config generation** for self‑hosting
- **Build/watch automation** hints for faster iteration

## Prerequisites

- Node.js 18+
- A NativeLink Cloud API key
- Cursor or VS Code with MCP support

Set your API key once:

```bash
export NATIVELINK_API_KEY="YOUR_API_KEY"
```

## Option A: Cursor (Recommended)

### 1) One‑Click Install

Use the Cursor install button from the repo README and you’re done.

### 2) Manual Config (if you prefer)

Create or edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "nativelink": {
      "command": "npx",
      "args": ["-y", "@nativelink/mcp-server"]
    }
  }
}
```

Cursor will read `NATIVELINK_API_KEY` from your environment.

## Option B: VS Code

Add this MCP server definition to your VS Code MCP settings:

```json
{
  "servers": {
    "nativelink": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@nativelink/mcp-server"]
    }
  }
}
```

## Local Development (Repo Checkout)

If you’re developing the MCP server itself, build and point your editor at the local binary:

```bash
npm install
npm run build
```

Then configure Cursor or VS Code to run the local server:

```json
{
  "command": "node",
  "args": ["/ABS/PATH/TO/nativelink-mcp-server/dist/index.js"]
}
```

## Example Prompts (Paste These)

```
Generate a Bazel config for my Rust monorepo with remote cache and execution. use nativelink
```

```
My cache hit rate is 45%. How do I improve it? use nativelink
```

```
Set up watch + build for //... with a 1500ms debounce. use nativelink
```

## Tips for Best Results

- Give the assistant a short description of your repo layout.
- Attach a Bazel profile JSON to enable richer analysis.
- Keep your `.bazelrc` in source control and iterate with small diffs.

## Summary

The NativeLink MCP server turns vague questions into concrete, actionable configuration and analysis. If you build on Bazel, it’s one of the fastest wins you can add to your workflow.

If you want deeper integrations (CI pipelines, autoscaling workers, or custom deployment templates), those are available through the same server—just ask.
