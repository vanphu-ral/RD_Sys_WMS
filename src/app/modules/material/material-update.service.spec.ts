import { TestBed } from '@angular/core/testing';

import { MaterialUpdateService } from './material-update.service';

describe('MaterialUpdateService', () => {
  let service: MaterialUpdateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MaterialUpdateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
