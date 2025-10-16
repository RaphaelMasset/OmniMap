import { Component, ElementRef, HostListener, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDataModel } from '../models/node-data.model';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CdkDragEnd } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-node',
  standalone: true,
  imports: [CommonModule,DragDropModule],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class Node {

  @Input() node!: NodeDataModel;
  @Input() parentCoords!: { x: number, y: number };

  @Output() sendParendOfNewNode = new EventEmitter<NodeDataModel>();
  @ViewChild('textArea') textArea!: ElementRef;
  //look in template for an element with the template reference variable named #menu.
  @ViewChild('menu') menuElement!: ElementRef;

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
    event.stopPropagation(); // Prevent onRightClickDocument() to get the event if it come from the component

    //event.clientX // Y are Absolute coordinate of the click relatively to the viewport
    console.log('abs click XY'+' x: '+event.clientX+', y: '+event.clientY)

    //const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    //event.clientX // Y are Absolute coordinate of the element i click on relatively to the viewport
    //console.log('onRightClickComponent'+' x: '+rect.left+', y: '+rect.top)
  
    this.menuX = event.clientX-this.parentCoords.x-this.node.x;
    this.menuY = event.clientY-this.parentCoords.y-this.node.y;
    console.log('parent comp XY'+' x: '+this.parentCoords.x +', y: '+this.parentCoords.y)
    console.log('calc meny XY'+' x: '+this.menuX+', y: '+this.menuY)
    
    this.menuVisible = true;

  }

  onColorChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.node.color = input.value; // Save chosen color to the node model
    console.log('Color changed:', this.node.color);
  }

  onMenuAction(action: string) {
    //console.log('Action chosen:', action, 'for', this.node);
    this.menuVisible = false; // close menu on action
    //console.log('onMenuAction-Mvisibility:' + this.menuVisible)

    switch (action) 
    {
      case 'newNode':
        // Handle creating a new child node
        this.sendParendOfNewNode.emit(this.node);
        //console.log('event sent')
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
    // Close menu only if clicked outside the menu itself
    const clickedInsideMenu = this.menuElement?.nativeElement.contains(event.target);
    //console.log('onLeftClickDocument-Mvisibility :' + this.menuVisible)
    if (!clickedInsideMenu && this.menuVisible == true) {    
      this.menuVisible = false;
      //console.log('onLeftClickDocument-Mvisibility :' + this.menuVisible + ' IF')
    }
  }
  
  @HostListener('document:contextmenu', ['$event'])
  onRightClickDocument(event: MouseEvent) {
    const clickedInsideMenu = this.menuElement?.nativeElement.contains(event.target);
    //console.log('onRightClickDocument-Mvisibility :' + this.menuVisible)
    if (!clickedInsideMenu && this.menuVisible == true) {
     // console.log('Right clicked outside menu')
      this.menuVisible = false;
      //console.log('onRightClickDocument-Mvisibility :' + this.menuVisible + 'IF')
    }
  }
  onDragStarted() {
    console.log('Drag started');
  }

  onDragEnded(event: CdkDragEnd) {
    const position = event.source.getFreeDragPosition();
    //console.log('Drag ended at', position);
    console.log('onDragEnded'+' x: '+position.x+', y: '+position.y)
    
    this.node.x = position.x;
    this.node.y = position.y;
    // Use position.x and position.y if needed
  }

  getRGBA(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    console.log(`rgba(${r}, ${g}, ${b}, ${alpha})`)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  tg(){return }
}
