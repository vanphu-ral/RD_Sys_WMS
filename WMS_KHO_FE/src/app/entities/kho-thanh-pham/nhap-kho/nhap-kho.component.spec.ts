import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NhapKhoComponent } from './nhap-kho.component';

describe('NhapKhoComponent', () => {
  let component: NhapKhoComponent;
  let fixture: ComponentFixture<NhapKhoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NhapKhoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NhapKhoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
