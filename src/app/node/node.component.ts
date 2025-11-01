import { Component, ElementRef, HostListener, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDataModel } from '../models/node-data.model';
import { NodeMenu } from '../node-menu/node-menu';
import { NodeText } from '../node-text/node-text';

@Component({
  selector: 'app-node',
  standalone: true,
  imports: [CommonModule,NodeMenu,NodeText],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class Node { 
  @Input() node!: NodeDataModel;
  @Input() scale!: number;
  
  @ViewChild('nodeContainer', { read: ElementRef }) nodeContainer!: ElementRef;

  @Output() createChildNode = new EventEmitter<number>();

  @ViewChild('titleArea') titleArea!: ElementRef;
  @ViewChild('textArea', { read: ElementRef }) textArea!: ElementRef;  // { read: ElementRef } when is an angular component, necessary for certain calls of methods
  @ViewChild('resizinghandle') resizinghandle!: ElementRef;
  @ViewChild('menu',{ read: ElementRef }) menuElement!: ElementRef;



  menuVisible = false;
  menuX = 0;
  menuY = 0;

  private moving = false;
  private resizing = false;
  
  private lastX = 0;
  private lastY = 0;

  maxHeightTextArea = 1000;



  onSetColor(newColor: string) {
    this.node.color = newColor;
   // this.menuVisible = false;
  }

  onNewChildNode() {
    this.createChildNode.emit(this.node.id);
    this.menuVisible = false;
  }

  onDeleteCurrentNode() {
    // À implémenter plus tard
    console.log('delateCurretnNode event received');
    this.menuVisible = false;
  }

  onMinimise() {
    // À implémenter plus tard
    console.log('minimise event received');
    this.menuVisible = false;
  }

  @HostListener('document:mousedown', ['$event'])
  onClickDocument(event: MouseEvent) {

    if (this.menuVisible && this.menuElement.nativeElement) {
      if (!this.menuElement.nativeElement.contains(event.target)) {
        this.menuVisible = false;
      }
    }
  
  }

  @HostListener('document:contextmenu', ['$event'])
  onRightClickDocument(event: MouseEvent) {
    const nodeContainerNativeEl = this.nodeContainer.nativeElement;
    const rect = nodeContainerNativeEl.getBoundingClientRect();
    const clickedInsideNode = nodeContainerNativeEl.contains(event.target);
    const clickedInsideMenu = this.menuElement.nativeElement.contains(event.target);

    if (clickedInsideNode && !clickedInsideMenu) {
      event.preventDefault();  // Empêche menu natif
      this.menuX = (event.clientX - rect.left)/this.scale;
      this.menuY = (event.clientY - rect.top)/this.scale;
      this.menuVisible = true;
    } else if (clickedInsideMenu) {
      event.preventDefault();
    } else {
      this.menuVisible = false;
    }
  }

  updateTitle(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    this.node.title = input.value;
  }


  onMouseDown(event: MouseEvent) {
    console.log('node mouse down');
    window.dispatchEvent(new CustomEvent('nodeClicked', { detail: this.node.title }));
    const clickedElement = event.target as HTMLElement;
    if (this.titleArea.nativeElement.contains(clickedElement) || this.textArea.nativeElement.contains(clickedElement)){return}
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
    const dx = (event.clientX - this.lastX)/this.scale;
    const dy = (event.clientY - this.lastY)/this.scale;

    if (this.moving){   
      this.node.x += dx;
      this.node.y += dy;
      //console.log('Dragging - dx: '+dx+' dy: '+dy)
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
    const handleWidth = rect.width;
    const handleHeight = rect.height;

    const xOk = event.clientX >= rect.right - handleWidth && event.clientX <= rect.right;
    const yOk = event.clientY >= rect.bottom - handleHeight && event.clientY <= rect.bottom;
    //console.log(xOk && yOk)
    return xOk && yOk
  }
}
