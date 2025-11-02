import { Component, ElementRef, Input, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { NodeDataModel } from '../models/node-data.model';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Node as ProsemirrorNode } from 'prosemirror-model';

@Component({
  selector: 'app-node-text',
  imports: [],
  template: `<div #editor class="text-area og-text-area"></div>`,
  styleUrl: './node-text.scss',
  standalone: true
})
export class NodeText implements OnInit, OnDestroy {
  @Input() node!: NodeDataModel;
  @ViewChild('editor') editorElement!: ElementRef;
  
  editor!: Editor; // Added ! to indicate definite assignment

  ngOnInit() {
    setTimeout(() => {
      this.initEditor();
    });
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
        Placeholder.configure({
          placeholder: 'Start writing...'
        })
      ],
      content: this.node.text || '',
      editorProps: {
        attributes: {
          class: 'text-area',
        },
      },
      onUpdate: ({ editor }) => {
        const markdown = this.getMarkdown(editor);
        this.node.text = markdown;
        console.log('Updated markdown:', markdown);
      }
    });
  }

  private getMarkdown(editor: Editor): string {
    const json = editor.getJSON();
    return (json.content || []).map((node: any) => {
      if (node.type === 'heading' && node.attrs?.level) {
        const headingText = node.content?.[0]?.text || '';
        return '#'.repeat(node.attrs.level) + ' ' + headingText;
      }
      if (node.type === 'paragraph') {
        return (node.content || [])
          .map((content: any) => content.text || '')
          .join('') || '';
      }
      return '';
    }).join('\n');
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
}