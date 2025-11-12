import { Node as TiptapNode, mergeAttributes, nodeInputRule } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
//import { InputRule } from 'prosemirror-inputrules';

export const ClickableRef = TiptapNode.create({
  name: 'clickableref',  // internal name of this custom tiptap node type - Used in JSON output, and when referring to this node programmatically (e.g. schema.nodes.clickableref)
  group: 'inline', //allow to exist inside paragraphs
  inline: true, //for rendering and editing
  atom: true, //un-editable solid piece

  //Defines tiptap node custom attributes
  //<span data-clickable="42" style="color: blue; cursor: pointer;">Node 42</span>
  // can access like node.attrs.id and node.attrs.label
  addAttributes() { 
    return {
      id: { default: null },
      label: { default: 'See node X' },
    };
  },
  //data-* attributes are standard HTML5 custom attributes that store metadata.

//how to converts HTML back into Tiptap nodes
  parseHTML() {  
    return [{ tag: 'span[data-clickable]' }];  
  },
//Controls how to convert this node into HTML.
  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-clickable': node.attrs['id'],
        style: 'color: blue; cursor: pointer;',
      }),
      node.attrs['label'], //allow the label in addInputRules() to appear
    ];
  },
  //auto-conversion rules, what Tiptap should interpret as this node.
  //[[id:42]]
  addInputRules() {
    const regex = /((#node)(\d+)) $/;
    return [
      nodeInputRule({
        find: regex,       // matches [[id:42]]
        type: this.type,
        getAttributes: match => ({
          id: match[3],
          label: `See node ${match[3]}`,  // friendly display
        }),
      }),
    ];
  },

  //preuve que les llm sont null pour trouver des solution innovantes tout les models restaient bloque sur uen solution qui quand j'ecris #node42 replace par #nodeSee node 42
  /*
  addInputRules() {
    return [
      nodeInputRule({
        find: /\[\[id:(\d+)\]\]/,
        type: this.type,
        getAttributes: (match) => ({
          id: match[1],
          label: `See node ${match[1]}`,
        }),
      }),
    ];
    */
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleClick: (view, pos, event) => {
            const target = event.target as HTMLElement;
            if (target && target.dataset['clickable']) {
              const id = target.dataset['clickable'];
              window.dispatchEvent(new CustomEvent('clickableref-click', { detail: { id } }));
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});
