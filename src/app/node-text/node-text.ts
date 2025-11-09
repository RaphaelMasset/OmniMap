import { Component, ElementRef, Input, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { NodeDataModel } from '../model_service_utils/node-data.model';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Markdown } from '@tiptap/markdown'
import { Plugin } from 'prosemirror-state';

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

  markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;

  //<img src="https://placehold.co/600x400" alt="exemple" />
  //![image](bezier-anim-controlpoints.jpg)
  //![image](https://placehold.co/600x400)
  
  editor!: Editor; // Added ! to indicate definite assignment

  ngOnInit() {
    setTimeout(() => {
      this.initEditor();
    });
  }
  //changement externe ex chargement CSV
  ngOnChanges(changes: SimpleChanges) {
    if (changes['node']) {
      const nodeChange = changes['node'];
      if (nodeChange.previousValue && nodeChange.currentValue) {
        if (nodeChange.previousValue.text !== nodeChange.currentValue.text) {

          const jsonObject = this.node.text ? JSON.parse(this.node.text) : '';
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
        Markdown,
        Placeholder.configure({
          placeholder: 'Start writing...'
        })
      ], 
      //set a l.initialisaiton
      content: this.node.text ? JSON.parse(this.node.text) : '',
      editorProps: {
        attributes: {
          class: 'text-area',
        },
      },/// EL-318-LH   
      onUpdate: ({ editor }) => {
        this.node.text = JSON.stringify(editor.getJSON());
        //this.JSONtester(editor);
        console.log('editor.getJSON() this',this.editor.getJSON())
      }
    });

    this.editor.registerPlugin(
      new Plugin({
        props: {
          handleTextInput(view, from, to, text) {
            if (text === ')') {
              const fullText = view.state.doc.textBetween(0, view.state.doc.content.size, '\n');
              const match = fullText.match(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/);
              if (match) {
                const [, alt, src] = match;
                // Supprime le texte Markdown
                view.dispatch(view.state.tr.delete(from - match[0].length, from));
                // Insère l'image
                view.dispatch(view.state.tr.replaceSelectionWith(
                  view.state.schema.nodes['image'].create({ src, alt })
                ));
                return true; // empêche le texte Markdown d’être inséré
              }
            }
            return false; // sinon Tiptap insère le texte normalement
          },
        },
      })
    );
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
}

/*
  //console.log('MD this',this.editor.getMarkdown())
  //const md = this.editor.getMarkdown();
  //const matches = Array.from(md.matchAll(this.markdownImageRegex), m => m[0]);
  //console.log(matches.length)
  //
  //this.editor.commands.setContent(editor.getJSON());
  //console.log('node.text apres modification du node',this.node.text)
}// ![image](https://placehold.co/600x400)

    //console.log('node.text changed from:', nodeChange.previousValue.text);
    //console.log('node.text changed to:', nodeChange.currentValue.text);
//console.log('node.text parsed',this.node.text ? JSON.parse(this.node.text) : 'this.node.text est nullish')


*/