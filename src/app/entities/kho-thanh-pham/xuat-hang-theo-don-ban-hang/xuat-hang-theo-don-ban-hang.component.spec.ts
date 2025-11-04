import { ComponentFixture, TestBed } from '@angular/core/testing';

import { XuatHangTheoDonBanHangComponent } from './xuat-hang-theo-don-ban-hang.component';

describe('XuatHangTheoDonBanHangComponent', () => {
  let component: XuatHangTheoDonBanHangComponent;
  let fixture: ComponentFixture<XuatHangTheoDonBanHangComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [XuatHangTheoDonBanHangComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(XuatHangTheoDonBanHangComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
