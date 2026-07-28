export interface ExecutionEventPublisher {
  publishStarted(executionId: string): Promise<void>;
  publishFinished(executionId: string): Promise<void>;
  publishFailed(executionId: string, failureCode: string): Promise<void>;
}

export const EXECUTION_EVENT_PUBLISHER = Symbol("EXECUTION_EVENT_PUBLISHER");
