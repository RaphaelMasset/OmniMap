import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { DUMMY_NODES } from '../dummy-nodes';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'map-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class Node {
  selectedNode = DUMMY_NODES[0];

  menuVisible = false;
  menuX = 0;
  menuY = 0;

  //look in template for an element with the template reference variable named #menu.
  @ViewChild('menu') menuElement!: ElementRef;

  get title() {
    return this.selectedNode.title;
  }

  updateTitle(event: FocusEvent) {
    console.log('blur - unselected');
    // const input = event.target as HTMLInputElement;
    // this.selectedNode.title = input.value;
  }

  onRightClick(event: MouseEvent) {
    event.preventDefault();  // Prevent the browser default context menu
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.menuVisible = true;
  }

  onMenuAction(action: string) {
    console.log('Action chosen:', action);
    this.menuVisible = false; // close menu on action
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    // Close menu only if clicked outside the menu itself
    const clickedInsideMenu = this.menuElement?.nativeElement.contains(event.target);
    if (!clickedInsideMenu) {
      this.menuVisible = false;
    }
  }
}
