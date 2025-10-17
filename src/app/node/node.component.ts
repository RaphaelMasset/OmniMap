import { Component, ElementRef, HostListener, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDataModel } from '../models/node-data.model';
//import { DragDropModule,CdkDragEnd,CdkDragMove } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-node',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class Node {

  @Input() node!: NodeDataModel;
  @Input() mapContainerCoordXY!: { x: number, y: number };
  @Output() nodeMoved = new EventEmitter<{ id: number, x: number, y: number }>();

  @Output() sendParendOfNewNode = new EventEmitter<NodeDataModel>();
  @ViewChild('textArea') textArea!: ElementRef;
  //look in template for an element with the template reference variable named #menu.
  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('nodeContainer') nodeContainer!: ElementRef;

  nodeMinimised = false;
  menuVisible = false;
  menuX = 0;
  menuY = 0;

  maxHeightTextArea = 1000;

  get title() {
    return this.node.title;
  }

  ngAfterViewInit() 
  {
    this.nodeMinimised ? null : this.adjustTextAreaHeight();
  }

  adjustTextAreaHeight() {
    if (!this.textArea) return; 
    const ta = this.textArea.nativeElement as HTMLTextAreaElement;
    ta.style.height = 'auto'; // reset avant recalcul
    ta.style.height = Math.min(ta.scrollHeight, this.maxHeightTextArea) + 'px'; // limite à maxHeight
    ta.style.overflowY = (ta.scrollHeight > this.maxHeightTextArea) ? 'scroll' : 'hidden'; // scrollbar si débordement
  }

  updateTitle(event: FocusEvent) { }

  updateTextArea(event: Event) {
    const input = event.target as HTMLInputElement;
    this.node.text = input.value;
    this.nodeMinimised ? null : this.adjustTextAreaHeight();
  }

  onRightClickComponent(event: MouseEvent) {
    event.preventDefault();  // Prevent the browser default context menu
   // event.stopPropagation(); // Prevent onRightClickDocument() to get the event if it come from the component
    this.menuX = event.clientX;
    this.menuY = event.clientY;
    this.menuVisible = true;
  }

  onColorChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.node.color = input.value; // Save chosen color to the node model
  }

  onMenuAction(action: string) {
    this.menuVisible = false; // close menu on action

    switch (action) 
    {
      case 'newNode':
        // Handle creating a new child node
        this.sendParendOfNewNode.emit(this.node);
        break;

      case 'child':
        // Handle setting color
      // this.setColorForNode();
        break;

      case 'MinMaximiseNode':
        this.nodeMinimised = !this.nodeMinimised;

        //il faut mettre a jour le DOM plus tard sinon 
        //@ViewChild('textArea') ne retorune pas une valeur a jour
        if (!this.nodeMinimised) {
          setTimeout(() => {
            this.adjustTextAreaHeight();
          });
        }// Adrien // Luc // 
        break;

      case 'delete':
        // Handle deleting the node
        //this.deleteNode();
        break;

      default:
        console.warn('Unknown action:', action);
    }
  }

  //fort he left click
  @HostListener('document:click', ['$event'])
  onLeftClickDocument(event: MouseEvent) {
    this.onRightClickDocument(event)
  }
  
  @HostListener('document:contextmenu', ['$event'])
  onRightClickDocument(event: MouseEvent) {
    const clickedInsideMenu = this.menuElement?.nativeElement.contains(event.target);
    const clickedInsideNode = this.nodeContainer?.nativeElement.contains(event.target);
    if (!clickedInsideMenu && !clickedInsideNode && this.menuVisible == true) {
      this.menuVisible = false;
    }
  }
  
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  onMouseDown(event: MouseEvent) {
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.tagName === 'INPUT' || clickedElement.tagName === 'TEXTAREA'){return}
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseMove = (event: MouseEvent) => {
    if (!this.dragging) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.node.x += dx;
    this.node.y += dy;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.nodeMoved.emit({ id: this.node.id, x: this.node.x, y: this.node.y });
  };

  onMouseUp = (event: MouseEvent) => {
    this.dragging = false;
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  };
 
}
