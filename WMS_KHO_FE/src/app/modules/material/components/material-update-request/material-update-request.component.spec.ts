import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaterialUpdateRequestComponent } from './material-update-request.component';

describe('MaterialUpdateRequestComponent', () => {
  let component: MaterialUpdateRequestComponent;
  let fixture: ComponentFixture<MaterialUpdateRequestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MaterialUpdateRequestComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MaterialUpdateRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
