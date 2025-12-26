import { Component, ElementRef, HostListener, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDataModel } from '../model_service_utils/node-data.model';
import { NodeMenu } from '../node-menu/node-menu';
import { NodeText } from '../node-text/node-text';
import { NodeStoreService } from '../model_service_utils/node-store';
import * as CONST from '../model_service_utils/const';

@Component({
  selector: 'app-node',
  standalone: true,
  imports: [CommonModule, NodeMenu, NodeText],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class Node { 
  @Input() node!: NodeDataModel;
  @Input() scale!: number;
  
  @ViewChild('nodeContainer', { read: ElementRef }) nodeContainer!: ElementRef;

  @ViewChild('titleArea') titleArea!: ElementRef;
  @ViewChild('textArea', { read: ElementRef }) textArea!: ElementRef;  // { read: ElementRef } when is an angular component, necessary for certain calls of methods
  @ViewChild('resizinghandle') resizinghandle!: ElementRef;
  @ViewChild('movetreehandle') movetreehandle!: ElementRef;
  @ViewChild('menu',{ read: ElementRef }) menuElement!: ElementRef;

  menuVisible = false;
  menuX = 0;
  menuY = 0;

  private moving = false;
  private resizing = false;
  private movingWholeTree = false;
  
  private lastX = 0;
  private lastY = 0;

  constructor(private nodeStoreService: NodeStoreService) {}

  newChildNodeClicked() {
    this.hideMenu()
  }

  deleteCurrentNodeClicked() {
    this.hideMenu()
  }
  closeMenuClicked() {
    this.hideMenu()
  }

  hideMenu(){this.menuVisible = false;}
  
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
      this.nodeStoreService.scale= this.scale;
      
      this.menuX = (event.clientX - rect.left)/this.scale;
      this.menuY = (event.clientY - rect.top)/this.scale;
      console.log(this.menuX.toFixed(0) +' '+this.menuY.toFixed(0))
      this.menuVisible = true;
    } else if (clickedInsideMenu) {
      event.preventDefault();
    } else {
      this.menuVisible = false;
    }
  }

  getColor(){return this.node.transparent? "rgba(0, 0, 0, 0)" :this.node.color}

  updateTitle(event: Event) {
    const input = event.target as HTMLInputElement;
    this.node.title = input.value;
    this.nodeStoreService.setSelectedNode(this.node.id);
  }

  onMouseDown(event: MouseEvent) {
    //send clicked node title to
    this.nodeStoreService.setSelectedNode(this.node.id);
    const clickedElement = event.target as HTMLElement;
    //dont drag or resize if title or textArea or Menu clicked
    if (this.titleArea.nativeElement.contains(clickedElement) ||
      this.textArea.nativeElement.contains(clickedElement) ||
      this.menuElement.nativeElement.contains(clickedElement) 
      ){return}
      
    if (this.clickIsOnResizingHandle(event)){
      this.moving = false;
      this.resizing = true;
      this.movingWholeTree = false;
    }else if (this.clickIsOnMoveTreeHandle(event)){
      this.moving = true;
      this.resizing = false;
      this.movingWholeTree = true;
    }else{ 
      this.moving = true;
      this.resizing = false;
      this.movingWholeTree = false;
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
    } else if (this.resizing){
      const rect = this.nodeContainer.nativeElement.getBoundingClientRect();
      //16 pixel min node size so the handle is clearly vissible and we can click, do a global var
      if ((this.node.width + dx) > CONST.DEFAULT_MIN_NODE_SIZE){this.node.width += dx;} 
      if ((this.node.height + dy)> CONST.DEFAULT_MIN_NODE_SIZE){this.node.height += dy;}
    }
    if (this.movingWholeTree){
      this.nodeStoreService.moveChildrenOfGivenId(this.node.id, dx, dy);
    }
    this.lastX = event.clientX;
    this.lastY = event.clientY; 
  };

  onMouseUp = (event: MouseEvent) => {
    this.moving = false;
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  };

  clickIsOnResizingHandle(event: MouseEvent) {
    const rect = this.resizinghandle.nativeElement.getBoundingClientRect();
    const handleWidth = rect.width;
    const handleHeight = rect.height;

    const xOk = event.clientX >= rect.right - handleWidth && event.clientX <= rect.right;
    const yOk = event.clientY >= rect.bottom - handleHeight && event.clientY <= rect.bottom;
    return xOk && yOk
  }

  clickIsOnMoveTreeHandle(event: MouseEvent) {
    const rect = this.movetreehandle.nativeElement.getBoundingClientRect();
    const handleWidth = rect.width;
    const handleHeight = rect.height;
  
    const xOk = event.clientX >= rect.right - handleWidth && event.clientX <= rect.right;
    const yOk = event.clientY >= rect.bottom - handleHeight && event.clientY <= rect.bottom;

    return xOk && yOk
  }

  getNodeContainer(): ElementRef | null {
    return this.nodeContainer;
  }
  
}
