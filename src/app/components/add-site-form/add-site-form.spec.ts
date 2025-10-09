import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSiteForm } from './add-site-form';

describe('AddSiteForm', () => {
  let component: AddSiteForm;
  let fixture: ComponentFixture<AddSiteForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSiteForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddSiteForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
