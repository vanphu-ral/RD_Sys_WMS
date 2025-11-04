import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaoCaoThongKeComponent } from './bao-cao-thong-ke.component';

describe('BaoCaoThongKeComponent', () => {
  let component: BaoCaoThongKeComponent;
  let fixture: ComponentFixture<BaoCaoThongKeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BaoCaoThongKeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BaoCaoThongKeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
