import { z } from 'zod';

export const ProjectType = z.enum(['rust', 'cpp', 'java', 'python', 'go', 'mixed']);
export type ProjectType = z.infer<typeof ProjectType>;

export const DocsTopic = z.enum(['setup', 'migration', 'optimization', 'troubleshooting', 'api']);
export type DocsTopic = z.infer<typeof DocsTopic>;

export const Platform = z.enum(['kubernetes', 'docker', 'aws', 'gcp', 'azure']);
export type Platform = z.infer<typeof Platform>;

export const Scale = z.enum(['small', 'medium', 'large', 'enterprise']);
export type Scale = z.infer<typeof Scale>;

export const OptimizationTarget = z.enum(['speed', 'cost', 'balanced']);
export type OptimizationTarget = z.infer<typeof OptimizationTarget>;

export interface NativelinkConfig {
  apiKey?: string;
  anthropicKey?: string;
  geminiKey?: string;
  nativelinkUrl?: string;
  debug?: boolean;
}

export interface BazelConfig {
  projectType: ProjectType;
  remoteCache: boolean;
  remoteExecution: boolean;
  nativelinkUrl: string;
  additionalFlags?: string[];
}

export interface BuildMetrics {
  totalTime?: number;
  cacheHitRate?: number;
  remoteExecutionTime?: number;
  localExecutionTime?: number;
  networkTransferSize?: number;
}

export interface DeploymentConfig {
  platform: Platform;
  scale: Scale;
  highAvailability: boolean;
  monitoring: boolean;
  autoscaling: boolean;
}