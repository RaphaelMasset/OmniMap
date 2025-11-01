import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { NodeDataModel } from '../models/node-data.model';

@Component({
  selector: 'app-node-text',
  imports: [],
  templateUrl: './node-text.html',
  styleUrl: './node-text.scss'
})
export class NodeText {
  @Input() node!: NodeDataModel;
  @ViewChild('textArea') textArea!: ElementRef;
  ngAfterViewInit() 
  {
    //console.log(this.node.color)
    //this.node.minimised ? null : this.adjustTextAreaHeight();

    if (this.textArea && !this.node.minimised) {
      const div = this.textArea.nativeElement as HTMLDivElement;
    }
    console.log(this.node.text)
    this.textArea.nativeElement.innerText = this.node.text;
  }
  updateTextArea(event: Event) {
    const div = event.target as HTMLDivElement;
    this.node.text = div.innerText; // C'est tout !
  }



}


/*
  adjustTextAreaHeight() {
    if (!this.textArea) return; 
    const ta = this.textArea.nativeElement as HTMLTextAreaElement;
    ta.style.height = 'auto'; // reset avant recalcul
    ta.style.height = Math.min(ta.scrollHeight, this.maxHeightTextArea) + 'px'; // limite à maxHeight
    ta.style.overflowY = (ta.scrollHeight > this.maxHeightTextArea) ? 'scroll' : 'hidden'; // scrollbar si débordement
  }

*/