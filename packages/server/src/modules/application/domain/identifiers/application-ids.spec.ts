import { describe, expect, it } from 'vitest';
import { CryptoUuidService } from '../../../../core/identifiers/uuid-service.js';
import { ApplicationFlowId, WorkflowExecutionId, WorkflowResultId } from './application-ids.js';

const uuidService = new CryptoUuidService();

describe('Application Flow identifiers', () => {
  it('creates ApplicationFlowId and tests equality', () => {
    const raw = uuidService.generate();
    const id1 = ApplicationFlowId.create(raw);
    const id2 = ApplicationFlowId.create(raw);
    const id3 = ApplicationFlowId.create(uuidService.generate());

    expect(id1.value).toBe(raw);
    expect(id1.toString()).toBe(raw);
    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(id3)).toBe(false);
  });

  it('creates WorkflowExecutionId and WorkflowResultId', () => {
    const raw1 = uuidService.generate();
    const raw2 = uuidService.generate();

    const execId = WorkflowExecutionId.create(raw1);
    const resultId = WorkflowResultId.create(raw2);

    expect(execId.value).toBe(raw1);
    expect(resultId.value).toBe(raw2);
  });
});
