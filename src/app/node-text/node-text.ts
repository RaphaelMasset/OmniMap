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
  template: `<div #editor class="text-area" [class.locked]="node.locked"></div>`, //add class locked to gray the textarea
  styleUrl: './node-text.scss',
  standalone: true
})
export class NodeText implements OnInit, OnDestroy, OnChanges {
  @Input() node!: NodeDataModel;
  @Input() scale!: number;
  @Input() contentLocked!: boolean; //TODO Useless
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
    //tres moooooche
    /*setInterval(() => {
        if (!this.node) return;
          this.editor.setEditable(!this.node.locked);
        
      }, 100); // toutes les 100ms*/

  }
  //changement externe ex chargement CSV
  ngOnChanges(changes: SimpleChanges) {
    /*if (changes['contentLocked'] && !changes['contentLocked'].firstChange && this.editor) {
      const prev = changes['contentLocked'].previousValue;
      const curr = changes['contentLocked'].currentValue;
    
      // Seulement si la valeur a vraiment changé
      if (prev !== curr) {
        const editable = !curr; // locked = false -> editable = true
        if (this.editor.isEditable !== editable) {
          //this.editor.setEditable(editable);
          //console.log(`📝 contentLocked changed: ${prev} → ${curr} (editable: ${editable})`);
        }
      }
    }*/
  }

  private initEditor() { 
    this.editor = new Editor({
      element: this.editorElement.nativeElement,
      //editable: !this.node.locked,
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
        //prevent modification if locked but allow copy past
        handleKeyDown: (view, event: KeyboardEvent) => {
          if (!this.node.locked) return false; // editable
        
          // Allow copy/paste/select-all
          if ((event.ctrlKey || event.metaKey)
            && (event.key.toLowerCase() === 'c' || event.key.toLowerCase() === 'a')) return false;
        
          // Block regular typing
          const nonEditingKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab','Shift','Alt'];
          if (nonEditingKeys.includes(event.key)) return false;
        
          return true; // block letters/numbers
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