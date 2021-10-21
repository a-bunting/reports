import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBugReportsComponent } from './admin-bug-reports.component';

describe('AdminBugReportsComponent', () => {
  let component: AdminBugReportsComponent;
  let fixture: ComponentFixture<AdminBugReportsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminBugReportsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminBugReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
