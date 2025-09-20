# Contributing to Nativelink MCP Server

We love your input! We want to make contributing to this project as easy and transparent as possible.

## Development Setup

1. Fork the repo and create your branch from `main`
2. Install dependencies: `npm install`
3. Make your changes
4. Build the project: `npm run build`
5. Test your changes: `node dist/index.js --help`

## Code Style

- Use TypeScript for all new code
- Follow existing code patterns
- Keep functions focused and small
- Add JSDoc comments for public APIs

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the package.json version following SemVer
3. Create a Pull Request with a clear description

## Testing

Run the test script:
```bash
node test.js
```

Test with MCP Inspector:
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Adding New Tools

To add a new tool:

1. Create a new file in `src/tools/`
2. Define the schema using Zod
3. Implement the tool function
4. Add the tool to `index.ts`
5. Update README with documentation

## Reporting Bugs

Use GitHub Issues to report bugs. Include:
- Version of the MCP server
- Steps to reproduce
- Expected behavior
- Actual behavior
- Logs if available

## License

By contributing, you agree that your contributions will be licensed under the Functional Source License v1.1 (FSL-1.1-Apache-2.0), which will convert to Apache 2.0 two years after release.