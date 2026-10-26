/**
 * O&G AI Safety & Compliance Pipeline - Core TypeScript Interfaces
 */

export type SeverityLevel = 'HIGH' | 'MODERATE' | 'LOW';

export interface AttackFinding {
  id: string;
  title: string;
  prompt: string;
  severity: SeverityLevel;
  cause: string;
  score: number;
  remediationBefore?: string;
  remediationAfter?: string;
}

export interface PIIEntity {
  type: 'PHONE_NUMBER' | 'EMAIL_ADDRESS' | 'CREDIT_CARD' | 'CUSTOM' | string;
  start: number;
  end: number;
  score: number;
  text: string;
}

export interface PIIProcessResult {
  originalText: string;
  anonymizedText: string;
  detectedEntities: PIIEntity[];
  guardrailBlocked: boolean;
  reason?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp?: string;
  entitiesMasked?: string[];
  latencyMs?: number;
}

export interface GuardrailToggles {
  input: boolean;
  output: boolean;
  raw: boolean;
}

export interface CompliancePillar {
  name: 'GOVERN' | 'MAP' | 'MEASURE' | 'MANAGE' | 'EU AI ACT';
  label: string;
  score: string;
  tone: 'cyan' | 'gold' | 'green' | 'red';
  coverageRatio?: string;
}

export interface ControlEvidence {
  id: string;
  title: string;
  status: 'HIGH / IN PROGRESS' | 'LOW / PASSED' | 'REVIEW REQUIRED' | 'NOT STARTED' | string;
  tone: 'red' | 'green' | 'gold' | 'cyan';
  framework: 'NIST_AI_RMF' | 'EU_AI_ACT';
  pillar: string;
}

export interface ExecutiveDossier {
  readinessIndex: number;
  indexDeltaPercent: number;
  openFindings: number;
  controlCoverage: string;
  humanSignOffs: number;
  passRate: number;
  piiPrecision: number;
  summary: string;
  generatedAt: string;
}
