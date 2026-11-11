/**
 * Optional future AI provider. The core app never depends on this.
 * No implementation ships in v1.0 — Assistant is a placeholder.
 */

export type AiMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type AiCompletionRequest = {
  messages: AiMessage[];
  /** Local context only — never sent anywhere in v1.0 */
  localContext?: {
    overdueCount?: number;
    dueTodayCount?: number;
  };
};

export type AiCompletionResult = {
  text: string;
};

export interface AiProvider {
  readonly id: string;
  readonly requiresNetwork: boolean;
  isAvailable(): Promise<boolean>;
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}

/** Null provider — used so the app compiles without any AI backend. */
export class UnavailableAiProvider implements AiProvider {
  readonly id = 'unavailable';
  readonly requiresNetwork = false;
  async isAvailable(): Promise<boolean> {
    return false;
  }
  async complete(): Promise<AiCompletionResult> {
    throw new Error('AI is not enabled in this build');
  }
}

export function getAiProvider(): AiProvider {
  return new UnavailableAiProvider();
}
