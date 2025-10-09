import { TestBed } from '@angular/core/testing';

import { PromptLoggerService } from './prompt-logger.service';

describe('PromptLoggerService', () => {
  let service: PromptLoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PromptLoggerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
