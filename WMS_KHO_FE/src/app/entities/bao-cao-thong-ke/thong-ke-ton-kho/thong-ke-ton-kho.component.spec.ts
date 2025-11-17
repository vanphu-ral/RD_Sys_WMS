import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThongKeTonKhoComponent } from './thong-ke-ton-kho.component';

describe('BaoCaoThongKeComponent', () => {
  let component: ThongKeTonKhoComponent;
  let fixture: ComponentFixture<ThongKeTonKhoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThongKeTonKhoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThongKeTonKhoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
