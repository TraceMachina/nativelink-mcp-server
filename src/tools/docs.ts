import { z } from 'zod';
import { DocsTopic } from '../lib/types.js';
import { truncateResponse } from '../lib/utils.js';
import { NativelinkAPI } from '../lib/api.js';

export const GetNativelinkDocsSchema = z.object({
  topic: DocsTopic,
  context: z.string().optional(),
  maxTokens: z.number().min(1000).default(5000).optional()
});

export type GetNativelinkDocsParams = z.infer<typeof GetNativelinkDocsSchema>;

export async function getNativelinkDocs(
  params: GetNativelinkDocsParams,
  api: NativelinkAPI
): Promise<string> {
  const maxTokens = params.maxTokens || 5000;

  const docs = await api.fetchDocumentation(params.topic, params.context);

  return truncateResponse(docs, maxTokens);
}