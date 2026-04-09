export type Language = 'zh' | 'en';

export interface Entity {
  id: string;
  key: string;
  value: string;
  description: string;
}

export interface WorkflowResults {
  webSearchSummary?: string;
  comprehensiveSummary?: string;
  dataset?: Entity[];
  reviewReport?: string;
  skillMd?: string;
  followUpQuestions?: string[];
}

export type AgentStep = 0 | 1 | 2 | 3 | 4 | 5;

export interface AppState {
  submissionSummary: string;
  reviewNotes: string;
  reviewGuidance: string;
  reportTemplate: string;
  language: Language;
  agentStep: AgentStep;
  results: WorkflowResults;
  isProcessing: boolean;
  styleId: string;
}
