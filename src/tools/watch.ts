import { z } from 'zod';

export const SetupWatchAndBuildSchema = z.object({
  command: z.enum(['build', 'test', 'both']).default('both'),
  targets: z.string().default('//...'),
  watchPaths: z.array(z.string()).optional(),
  excludePaths: z.array(z.string()).optional(),
  debounceMs: z.number().min(100).max(10000).default(1000),
  useIbazel: z.boolean().default(false)
});

export type SetupWatchAndBuildParams = z.infer<typeof SetupWatchAndBuildSchema>;

export function setupWatchAndBuild(params: SetupWatchAndBuildParams): string {
  const command = params.command || 'both';
  const targets = params.targets || '//...';
  const debounce = params.debounceMs || 1000;
  const useIbazel = params.useIbazel;

  if (useIbazel) {
    return generateIbazelConfig(command, targets);
  }

  const watchPaths = params.watchPaths || ['**/*.rs', '**/*.cc', '**/*.cpp', '**/*.java', '**/*.py', '**/*.go', '**/*.ts', '**/*.js', 'BUILD.bazel', 'WORKSPACE'];
  const excludePaths = params.excludePaths || ['bazel-*', 'node_modules', '.git', 'dist', 'target'];

  return generateWatchConfig(command, targets, watchPaths, excludePaths, debounce);
}

function generateIbazelConfig(command: string, targets: string): string {
  const lines: string[] = [
    '# Automatic Build with iBazel (Recommended)',
    '# iBazel provides intelligent file watching and incremental builds',
    '',
    '## Installation',
    '```bash',
    'npm install -g @bazel/ibazel',
    '# or',
    'go install github.com/bazelbuild/bazel-watcher/cmd/ibazel@latest',
    '```',
    '',
    '## Usage',
    ''
  ];

  switch (command) {
    case 'build':
      lines.push(
        '### Watch and Build',
        '```bash',
        `ibazel build ${targets}`,
        '```'
      );
      break;
    case 'test':
      lines.push(
        '### Watch and Test',
        '```bash',
        `ibazel test ${targets}`,
        '```'
      );
      break;
    case 'both':
      lines.push(
        '### Watch, Build and Test',
        '```bash',
        '# In one terminal:',
        `ibazel build ${targets}`,
        '',
        '# In another terminal:',
        `ibazel test ${targets}`,
        '```',
        '',
        '### Or use a script to run both:',
        '```bash',
        '#!/bin/bash',
        `ibazel build ${targets} &`,
        `ibazel test ${targets} &`,
        'wait',
        '```'
      );
      break;
  }

  lines.push(
    '',
    '## With Nativelink Cloud',
    'iBazel works seamlessly with Nativelink Cloud. Your `.bazelrc` configuration',
    'from app.nativelink.com will be used automatically for:',
    '- Remote caching of build artifacts',
    '- Remote execution of build actions',
    '- Build event streaming to app.nativelink.com',
    '',
    '## Benefits',
    '- ✅ Only rebuilds changed targets',
    '- ✅ Automatic dependency detection',
    '- ✅ Minimal CPU usage when idle',
    '- ✅ Works with all Bazel projects',
    '- ✅ Integrates with Nativelink Cloud cache'
  );

  return lines.join('\n');
}

function generateWatchConfig(
  command: string,
  targets: string,
  watchPaths: string[],
  excludePaths: string[],
  debounce: number
): string {
  const lines: string[] = [
    '# File Watcher Configuration for Bazel + Nativelink',
    '',
    '## Option 1: Using watchexec (Recommended)',
    '```bash',
    '# Install watchexec',
    'brew install watchexec  # macOS',
    '# or',
    'cargo install watchexec-cli  # Cross-platform',
    '```',
    ''
  ];

  const bazelCommands: string[] = [];
  if (command === 'build' || command === 'both') {
    bazelCommands.push(`bazel build ${targets}`);
  }
  if (command === 'test' || command === 'both') {
    bazelCommands.push(`bazel test ${targets}`);
  }

  const watchexecCommand = `watchexec \\
  --debounce ${debounce} \\
  ${excludePaths.map(p => `--ignore '${p}'`).join(' \\\n  ')} \\
  ${watchPaths.map(p => `--watch '${p}'`).join(' \\\n  ')} \\
  --clear \\
  -- "${bazelCommands.join(' && ')}"`;

  lines.push(
    '### Run with watchexec:',
    '```bash',
    watchexecCommand,
    '```',
    ''
  );

  lines.push(
    '## Option 2: Using entr',
    '```bash',
    '# Install entr',
    'brew install entr  # macOS',
    'apt-get install entr  # Linux',
    '```',
    '',
    '### Run with entr:',
    '```bash',
    `find . -name "*.rs" -o -name "*.cc" -o -name "*.java" -o -name "BUILD.bazel" | \\`,
    `  grep -v bazel- | \\`,
    `  entr -c bash -c "${bazelCommands.join(' && ')}"`,
    '```',
    ''
  );

  lines.push(
    '## Option 3: Using nodemon (Node.js)',
    '```bash',
    'npm install -g nodemon',
    '```',
    '',
    '### Create nodemon.json:',
    '```json',
    JSON.stringify({
      watch: watchPaths,
      ignore: excludePaths,
      exec: bazelCommands.join(' && '),
      delay: debounce,
      ext: 'rs,cc,cpp,java,py,go,ts,js,bazel'
    }, null, 2),
    '```',
    '',
    '### Run with nodemon:',
    '```bash',
    'nodemon',
    '```',
    ''
  );

  lines.push(
    '## Option 4: Custom Watch Script',
    '```bash',
    '#!/bin/bash',
    '# Save as watch-build.sh',
    '',
    'TARGETS="' + targets + '"',
    'DEBOUNCE_SECONDS=' + (debounce / 1000),
    '',
    'echo "Watching for changes..."',
    'echo "Initial build..."',
    bazelCommands.join('\n'),
    '',
    'while true; do',
    '  # Use fswatch on macOS or inotifywait on Linux',
    '  if command -v fswatch > /dev/null; then',
    '    fswatch -1 -e "bazel-*" -e "node_modules" .',
    '  else',
    '    inotifywait -r -e modify,create,delete \\',
    '      --exclude "bazel-|node_modules" .',
    '  fi',
    '  ',
    '  echo "Changes detected, waiting ${DEBOUNCE_SECONDS}s..."',
    '  sleep $DEBOUNCE_SECONDS',
    '  ',
    '  echo "Building..."',
    '  ' + bazelCommands.join('\n  '),
    'done',
    '```',
    '',
    '### Make executable and run:',
    '```bash',
    'chmod +x watch-build.sh',
    './watch-build.sh',
    '```',
    ''
  );

  lines.push(
    '## Integration with Nativelink Cloud',
    '',
    'All watch commands will use your Nativelink Cloud configuration from `.bazelrc`:',
    '- 🚀 Instant cache hits for unchanged files',
    '- ⚡ Remote execution for faster builds',
    '- 📊 Build results visible at app.nativelink.com',
    '',
    '## VS Code Task Configuration',
    '',
    'Add to `.vscode/tasks.json`:',
    '```json',
    JSON.stringify({
      version: '2.0.0',
      tasks: [{
        label: 'Watch and Build with Bazel',
        type: 'shell',
        command: bazelCommands.join(' && '),
        problemMatcher: [],
        isBackground: true,
        runOptions: {
          runOn: 'folderOpen'
        },
        presentation: {
          reveal: 'always',
          panel: 'dedicated'
        }
      }]
    }, null, 2),
    '```',
    '',
    '## Best Practices',
    '',
    '1. **Use iBazel for best performance** - It only rebuilds changed targets',
    '2. **Configure proper ignore patterns** - Exclude bazel-* directories',
    '3. **Set appropriate debounce** - ' + debounce + 'ms prevents rapid rebuilds',
    '4. **Use target patterns** - Be specific with targets for faster builds',
    '5. **Monitor app.nativelink.com** - View build performance and cache hits'
  );

  return lines.join('\n');
}