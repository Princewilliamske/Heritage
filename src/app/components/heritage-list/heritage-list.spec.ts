import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeritageList } from './heritage-list';

describe('HeritageList', () => {
  let component: HeritageList;
  let fixture: ComponentFixture<HeritageList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeritageList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeritageList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
