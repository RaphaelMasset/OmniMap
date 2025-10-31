import { Component, ElementRef, HostListener, ViewChild, Input, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeDataModel } from '../models/node-data.model';
import { NodeMenu } from '../node-menu/node-menu';

declare var marked: any;
@Component({
  selector: 'app-node',
  standalone: true,
  imports: [CommonModule,NodeMenu],
  templateUrl: './node.component.html',
  styleUrls: ['./node.component.scss']
})
export class Node { 
  @Input() node!: NodeDataModel;
  @Input() tranfo!: {tx: number, ty: number, scale: number};
  
  @ViewChild('nodeContainer', { read: ElementRef }) nodeContainer!: ElementRef;

  @Output() createChildNode = new EventEmitter<number>();

  @ViewChild('titleArea') titleArea!: ElementRef;
  @ViewChild('textArea') textArea!: ElementRef;
  @ViewChild('resizinghandle') resizinghandle!: ElementRef;
  @ViewChild('menu',{ read: ElementRef }) menuElement!: ElementRef;

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

    if (this.textArea && !this.nodeMinimised) {
      const div = this.textArea.nativeElement as HTMLDivElement;
    }
    console.log(this.node.text)
    this.textArea.nativeElement.innerText = this.node.text;
  }

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
      this.menuX = (event.clientX - rect.left)/this.tranfo.scale;
      this.menuY = (event.clientY - rect.top)/this.tranfo.scale;
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

  adjustTextAreaHeight() {
    if (!this.textArea) return; 
    const ta = this.textArea.nativeElement as HTMLTextAreaElement;
    ta.style.height = 'auto'; // reset avant recalcul
    ta.style.height = Math.min(ta.scrollHeight, this.maxHeightTextArea) + 'px'; // limite à maxHeight
    ta.style.overflowY = (ta.scrollHeight > this.maxHeightTextArea) ? 'scroll' : 'hidden'; // scrollbar si débordement
  }

  updateTextArea(event: Event) {
    const div = event.target as HTMLDivElement;
    this.node.text = div.innerText; // C'est tout !
  }


  onMouseDown(event: MouseEvent) {
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
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    if (this.moving){   
      this.node.x += dx/this.tranfo.scale;
      this.node.y += dy/this.tranfo.scale;
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
    const handlesize = 10; // pixels

    const xOk = event.clientX > rect.right - handlesize && event.clientX < rect.right;
    const yOk = event.clientY > rect.bottom - handlesize && event.clientY < rect.bottom;
    //console.log(xOk && yOk)
    return xOk && yOk
  }
}
