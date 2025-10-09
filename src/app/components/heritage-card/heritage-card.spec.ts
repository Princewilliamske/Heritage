import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeritageCard } from './heritage-card';

describe('HeritageCard', () => {
  let component: HeritageCard;
  let fixture: ComponentFixture<HeritageCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeritageCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeritageCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
