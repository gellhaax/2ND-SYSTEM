import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreasurerNotifications } from './treasurer-notifications';

describe('TreasurerNotifications', () => {
  let component: TreasurerNotifications;
  let fixture: ComponentFixture<TreasurerNotifications>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreasurerNotifications]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TreasurerNotifications);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
