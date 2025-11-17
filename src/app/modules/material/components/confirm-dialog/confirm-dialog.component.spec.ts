import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogContentExampleDialog } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let component: DialogContentExampleDialog;
  let fixture: ComponentFixture<DialogContentExampleDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogContentExampleDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DialogContentExampleDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
