import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialApprovalHistoryComponent } from './material-approval-history.component';

describe('MaterialApprovalHistoryComponent', () => {
  let component: MaterialApprovalHistoryComponent;
  let fixture: ComponentFixture<MaterialApprovalHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialApprovalHistoryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MaterialApprovalHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
