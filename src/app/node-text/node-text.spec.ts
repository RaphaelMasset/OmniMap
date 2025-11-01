import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NodeText } from './node-text';

describe('NodeText', () => {
  let component: NodeText;
  let fixture: ComponentFixture<NodeText>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NodeText]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NodeText);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
