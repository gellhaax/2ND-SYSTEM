import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreasurerDashboard } from './treasurer-dashboard';

describe('TreasurerDashboard', () => {
  let component: TreasurerDashboard;
  let fixture: ComponentFixture<TreasurerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreasurerDashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(TreasurerDashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
