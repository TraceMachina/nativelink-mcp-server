export function formatBazelrc(lines: string[]): string {
  return lines.map(line => line.trim()).filter(Boolean).join('\n');
}

export function formatMarkdown(title: string, content: string): string {
  return `# ${title}\n\n${content}`;
}

export function truncateResponse(text: string, maxTokens: number): string {
  const avgCharsPerToken = 4;
  const maxChars = maxTokens * avgCharsPerToken;

  if (text.length <= maxChars) {
    return text;
  }

  return text.substring(0, maxChars) + '\n\n[Response truncated for length]';
}

export function parseApiKey(headers: Record<string, string | string[] | undefined>): string | undefined {
  const headerKeys = [
    'authorization',
    'Authorization',
    'nativelink-api-key',
    'Nativelink-API-Key',
    'NATIVELINK_API_KEY',
    'x-api-key',
    'X-API-Key',
    'X_API_KEY'
  ];

  for (const key of headerKeys) {
    const value = headers[key];
    if (value) {
      const headerValue = Array.isArray(value) ? value[0] : value;

      if (key.toLowerCase() === 'authorization') {
        const match = headerValue.match(/^Bearer\s+(.+)$/i);
        if (match) return match[1];
      } else {
        return headerValue;
      }
    }
  }

  return undefined;
}

export function generateProjectIdentifier(projectType: string): string {
  const timestamp = Date.now();
  return `nativelink_${projectType}_${timestamp}`;
}