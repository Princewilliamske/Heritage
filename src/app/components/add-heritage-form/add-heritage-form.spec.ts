import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddHeritageForm } from './add-heritage-form';

describe('AddHeritageForm', () => {
  let component: AddHeritageForm;
  let fixture: ComponentFixture<AddHeritageForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddHeritageForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddHeritageForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
