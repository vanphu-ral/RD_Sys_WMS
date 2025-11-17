import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AggregatedPartComponent } from './aggregated-part.component';

describe('AggregatedPartComponent', () => {
  let component: AggregatedPartComponent;
  let fixture: ComponentFixture<AggregatedPartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AggregatedPartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AggregatedPartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
