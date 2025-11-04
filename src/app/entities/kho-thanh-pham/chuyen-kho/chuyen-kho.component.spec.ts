import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChuyenKhoComponent } from './chuyen-kho.component';

describe('ChuyenKhoComponent', () => {
  let component: ChuyenKhoComponent;
  let fixture: ComponentFixture<ChuyenKhoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChuyenKhoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChuyenKhoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
