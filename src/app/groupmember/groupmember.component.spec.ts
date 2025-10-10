import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupmemberComponent } from './groupmember.component';

describe('GroupmemberComponent', () => {
  let component: GroupmemberComponent;
  let fixture: ComponentFixture<GroupmemberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupmemberComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GroupmemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
