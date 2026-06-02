import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePalletSlipComponent } from './create-pallet-slip.component';

describe('CreatePalletSlipComponent', () => {
  let component: CreatePalletSlipComponent;
  let fixture: ComponentFixture<CreatePalletSlipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePalletSlipComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePalletSlipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
