import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateSelectedDialogComponent } from './update-selected-dialog.component';

describe('UpdateSelectedDialogComponent', () => {
  let component: UpdateSelectedDialogComponent;
  let fixture: ComponentFixture<UpdateSelectedDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateSelectedDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateSelectedDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
