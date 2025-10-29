import { Component, ElementRef, HostListener, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDataModel } from '../models/node-data.model';
import { T } from '@angular/cdk/keycodes';
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

  @Output() currentNodeIdForNewChildNode = new EventEmitter<number>();

  @ViewChild('textArea') textArea!: ElementRef;
  @ViewChild('menu') menuElement!: ElementRef;
  @ViewChild('nodeContainer') nodeContainer!: ElementRef;
  @ViewChild('nodeContainer') resizinghandle!: ElementRef;
  @ViewChild('colorPicker') colorPicker!: ElementRef;


  nodeMinimised = false;
  menuVisible = false;
  menuX = 0;
  menuY = 0;

  private moving = false;
  private resizing = false;
  
  private lastX = 0;
  private lastY = 0;

  maxHeightTextArea = 1000;


  ngAfterViewInit() 
  {
    //console.log(this.node.color)
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

  onMenuAction(action: string, event: Event) {
     // close menu on action
    const input = event.target as HTMLInputElement;
    switch (action) 
    {
      case 'newNode':
        // Handle creating a new child node
        this.currentNodeIdForNewChildNode.emit(this.node.id);
        this.menuVisible = false;
        break;

      case 'color':
        this.node.color = input.value;
        break;

      case 'MinMaximiseNode':
        this.nodeMinimised = !this.nodeMinimised;

        if (!this.nodeMinimised) {
          setTimeout(() => {
            this.adjustTextAreaHeight();
          });
        }
        this.menuVisible = false;
        break;

      case 'delete':
        this.menuVisible = false;
        break;

      default:
        console.warn('Unknown action:', action);
    }
  }

  //fort he left click
  @HostListener('document:mousedown', ['$event'])
  onLeftClickDocument(event: MouseEvent) {
    this.closeMenuIfOut(event)
    if(event.button == 2)
    {
      //cant prevent default context menu here because contextmenu event will be fired after
    }  
  }

  @HostListener('document:contextmenu', ['$event'])
  onRightClickDocument(event: MouseEvent) {
    const clickedInsideNode = this.nodeContainer?.nativeElement.contains(event.target);
    this.closeMenuIfOut(event)

    //if the right click is inside the node prevent default and display menu
    if (clickedInsideNode)
    {
      event.preventDefault();  // Prevent the browser default context menu
      // event.stopPropagation(); 
      this.menuX = event.clientX;
      this.menuY = event.clientY;
      this.menuVisible = true;

    }
  }

  closeMenuIfOut(event:Event)
  {
    const clickedInsideMenu = this.menuElement?.nativeElement.contains(event.target); 
    const clickedInsideColorPicker = this.colorPicker?.nativeElement.contains(event.target);

    if (!clickedInsideMenu && !clickedInsideColorPicker && this.menuVisible == true) 
    {
      this.menuVisible = false;
    }
  }

  onMouseDown(event: MouseEvent) {
    window.dispatchEvent(new CustomEvent('nodeClicked', { detail: this.node.title }));
    const clickedElement = event.target as HTMLElement;
    if (clickedElement.tagName === 'INPUT' || clickedElement.tagName === 'TEXTAREA'){return}
    if (this.clickIsOnHandle(event)){
      this.moving = false;
      this.resizing = true;
    }else{ 
      this.moving = true;
      this.resizing = false;
    }
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
  }

  onMouseMove = (event: MouseEvent) => {
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    if (this.moving){   
      this.node.x += dx;
      this.node.y += dy;
    } else if (this.resizing){
      const rect = this.nodeContainer.nativeElement.getBoundingClientRect();
      if ((this.node.width + dx) >0 && (this.node.height + dy)>0)
      {
        this.node.width += dx;
        this.node.height += dy;
      }
    }
    this.lastX = event.clientX;
    this.lastY = event.clientY; 
  };

  onMouseUp = (event: MouseEvent) => {
    this.moving = false;
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  };

  clickIsOnHandle(event: MouseEvent) {
    const rect = this.resizinghandle.nativeElement.getBoundingClientRect();
    const handlesize = 10; // pixels

    const xOk = event.clientX > rect.right - handlesize && event.clientX < rect.right;
    const yOk = event.clientY > rect.bottom - handlesize && event.clientY < rect.bottom;
    //console.log(xOk && yOk)
    return xOk && yOk
  }
}
