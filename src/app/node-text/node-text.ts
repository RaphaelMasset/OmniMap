import { Component, ElementRef, Input, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { NodeDataModel } from '../models/node-data.model';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';

@Component({
  selector: 'app-node-text',
  imports: [],
  template: `<div #editor class="text-area og-text-area"></div>`,
  styleUrl: './node-text.scss',
  standalone: true
})
export class NodeText implements OnInit, OnDestroy, OnChanges {
  @Input() node!: NodeDataModel;
  @Input() scale!: number;
  @ViewChild('editor') editorElement!: ElementRef;
  
  editor!: Editor; // Added ! to indicate definite assignment

  ngOnInit() {
    setTimeout(() => {
      this.initEditor();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['node']) {
      const nodeChange = changes['node'];
      if (nodeChange.previousValue && nodeChange.currentValue) {
        if (nodeChange.previousValue.text !== nodeChange.currentValue.text) {
          //console.log('node.text changed from:', nodeChange.previousValue.text);
          //console.log('node.text changed to:', nodeChange.currentValue.text);
      
          const jsonObject = this.node.text ? JSON.parse(this.node.text) : '';
          console.log('node.text parsed',this.node.text ? JSON.parse(this.node.text) : 'this.node.text est nullish')
          this.editor.commands.setContent(jsonObject);
        }
      }
    }
  }

  private initEditor() { 
    this.editor = new Editor({
      element: this.editorElement.nativeElement,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3]
          }
        }),
        Image,
        Placeholder.configure({
          placeholder: 'Start writing...'
        })
      ], 
      content: this.node.text ? JSON.parse(this.node.text) : '', //CSV read do a first parsing but we need to do a second one
      editorProps: {
        attributes: {
          class: 'text-area',
        },
      },
      onUpdate: ({ editor }) => {
        //this.JSONtester(editor);

        this.node.text = JSON.stringify(editor.getJSON());
        console.log('node.text apres modification du node',this.node.text)
      }
    });

  }
  JSONtester(txt: any){
    if (!txt ) {
      txt = ' ';
    }
    console.log('JSONstringify:', JSON.stringify(txt));  
    console.log('JSONstringify X 2:', JSON.stringify(JSON.stringify(txt)));   
    console.log('JSON.parse', JSON.parse(txt));
    console.log('JSON.parse X 2', JSON.parse(JSON.parse(txt)));
  }


  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
}