import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TreasurerContactComponent } from './treasurer-contact';

describe('TreasurerContactComponent', () => {
  let component: TreasurerContactComponent;
  let fixture: ComponentFixture<TreasurerContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreasurerContactComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TreasurerContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});