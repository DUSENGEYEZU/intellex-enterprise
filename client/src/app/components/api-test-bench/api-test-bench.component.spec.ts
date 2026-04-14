import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiTestBenchComponent } from './api-test-bench.component';

describe('ApiTestBenchComponent', () => {
  let component: ApiTestBenchComponent;
  let fixture: ComponentFixture<ApiTestBenchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiTestBenchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApiTestBenchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
