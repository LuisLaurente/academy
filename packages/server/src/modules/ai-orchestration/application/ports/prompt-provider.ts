import type { PromptVersion } from '../../domain/value-objects/prompt-version.js';

export interface PromptTemplateResult {
  readonly template: string;
  readonly version: PromptVersion;
}

export interface PromptProvider {
  getPromptTemplate(requestType: string, version?: PromptVersion): Promise<PromptTemplateResult>;
}
