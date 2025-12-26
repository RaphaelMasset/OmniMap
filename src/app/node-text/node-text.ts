import { Component, ElementRef, Input, ViewChild, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { NodeDataModel } from '../model_service_utils/node-data.model';
import { Link } from '@tiptap/extension-link';
import { Editor,markInputRule,nodeInputRule  } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import { Markdown } from '@tiptap/markdown'
import { Plugin } from 'prosemirror-state';
import { ClickableRef } from './inline-refToNode'; // adjust path
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from '@tiptap/extension-mathematics';
import { migrateMathStrings } from '@tiptap/extension-mathematics';

// after editor is created and has content:




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
  @ViewChild('editor') editorElement!: ElementRef;

  markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  
  editor!: Editor; // Added ! to indicate definite assignment

  ngOnInit() {
    setTimeout(() => {
      this.initEditor();
    });
  }
  //changement externe ex chargement CSV
  ngOnChanges(changes: SimpleChanges) {
    if (!this.editor) return;

    if (changes['node'] && changes['node'].currentValue) {
      const newText = changes['node'].currentValue.text;
      if (newText) {
        this.editor.commands.setContent(JSON.parse(newText));
      } else {
        this.editor.commands.clearContent();
      }
    }
  }


  MarkdownImage = Image.extend({
    addInputRules() {
      return [
        nodeInputRule({
          // ✅ URL s'arrête AVANT "="
          find: /!\[([^\]]*)\]\s*\(\s*(https?:\/\/[^=\s]+)(?:\s*[=x*]\s*(\d+)(?:[x*]\s*(\d+))?)?\s*\)(?:\s|$)/,
          type: this.type,
          getAttributes: (match) => {
            const width = match[3] ? parseInt(match[3]) : null;
            const height = match[4] ? parseInt(match[4]) : null;
            return {
              src: match[2],     // ✅ URL propre: "image.jpg"
              alt: match[1] || null,
              width, height
            };
          }
        })
      ];
    },
    
    addAttributes() {
      return {
        src: { default: null },
        alt: { default: null },
        width: { 
          default: null, 
          parseHTML: el => el.style.width?.replace('px', ''),
          renderHTML: attrs => attrs['width'] ? { style: `width: ${attrs['width']}px` } : {}
        },
        height: { 
          default: null,
          parseHTML: el => el.style.height?.replace('px', ''),
          renderHTML: attrs => attrs['height'] ? { style: `height: ${attrs['height']}px` } : {}
        }
      };
    }
    });
  

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
        Image.configure({
          inline: true,           // ✅ Dans le flux texte
          allowBase64: false,
        }),
        Markdown,
        Placeholder.configure({
          placeholder: 'Start writing...'
        }),
        ClickableRef,
        InlineMath.configure({
            katexOptions: { throwOnError: false },
          }),
          BlockMath.configure({
            katexOptions: { throwOnError: false },
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
        migrateMathStrings(editor);
        this.node.text = JSON.stringify(editor.getJSON());
      }
    });
    /** 
     * auto-conversion of Markdown image syntax to actual <img> nodes when typing the closing ) or space after a link.
     */
    /*this.editor.registerPlugin(
      new Plugin({
        props: {
          handleTextInput(view, from, to, text) {
            if (text === ')' || text === ' ') {
              console.log('typed ) or space')
              const fullText = view.state.doc.textBetween(0, view.state.doc.content.size, '\n');
              const match = fullText.match(/!\[([^\]]*)\]\((https?:\/\/[^\)]+)\)/);
              if (match) {
                console.log('link match')
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
    );*/
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.destroy();
    }
  }
}
