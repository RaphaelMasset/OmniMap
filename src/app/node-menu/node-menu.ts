import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NodeDataModel } from '../model_service_utils/node-data.model';
import { NodeStoreService } from '../model_service_utils/node-store';
import {NodeTree} from '../model_service_utils/const';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-node-menu',
  standalone: true,
  imports: [],
  templateUrl: './node-menu.html',
  styleUrl: './node-menu.scss'
})
export class NodeMenu {
  @Input() node!: NodeDataModel;

  @Output() evNewChildNodeClicked = new EventEmitter<void>();
  @Output() evDeleteNodeClicked = new EventEmitter<void>();
  @Output() evCloseMenuClicked = new EventEmitter<void>();

  titleMinimised = false;
  textMinimised = false;
  treeDisplayDepth = 6;

  showPopupTree = false;
  popupX = 0;
  popupY = 0;
  nodeTree: NodeTree | null = null;

  constructor(private nodeStoreService: NodeStoreService) {}

  private treeSub?: Subscription;
  
  ngOnInit() {
    this.setNodeTree();
    this.treeSub = this.nodeStoreService.nodes$.subscribe(() => {
      if (this.showPopupTree) {
        this.setNodeTree();  // Rebuild tree when nodes change
      }
    });
  }
  
  ngOnDestroy() {
    this.treeSub?.unsubscribe();
  }

  onMenuAction(action: string, event: Event) {
    // close menu on action
    console.log('onMenuAction')
    const input = event.target as HTMLInputElement;
    switch (action) 
    {
      case 'newNode':
        this.evNewChildNodeClicked.emit();
        this.nodeStoreService.addNewChildNode(this.node.id);
        break;

      case 'color':
        this.node.color = input.value;
        break;

      case 'MinMaximiseTitle':
        this.node.titleMinimized = !this.node.titleMinimized;
        break;

      case 'MinMaximiseContent':
        this.node.contentMinimized = !this.node.contentMinimized;
        break;

      case 'deleteNode':
        this.nodeStoreService.tryDeleteNode(this.node.id);
        this.evDeleteNodeClicked.emit();
        break;

      case 'transparent':
        this.node.transparent = !this.node.transparent;
        break;

      case 'readonly':
        this.node.locked = !this.node.locked;
        break;

      case 'closeMenu':
        this.evCloseMenuClicked.emit();
        break;
      
      case 'MinMaximiseChildrenTree':
        this.node.hiddenTree = !this.node.hiddenTree;
        this.nodeStoreService.updateHiddenNodeList();
       // this.evEditHiddenTree.emit();//TODO remove
        break;

      case 'DisplayChildrenTreeResume':
        const mouseEvent = event as MouseEvent; 
        this.popupX = mouseEvent.clientX + 10;
        this.popupY = mouseEvent.clientY;
        this.showPopupTree = true;
        break;

      default:
        console.warn('Unknown action, how did you do that?: ', action);      
    }
    //because we modified a node, he is the selected node
    //we need to update the hidden tree variable
    this.nodeStoreService.setSelectedNode(this.node.id);
  }

  onDepthBlur(event: Event) {
    const input = event.target as HTMLInputElement;
    let pasedTreeDisplayDepth = parseInt(input.value, 10);  
    this.treeDisplayDepth = pasedTreeDisplayDepth;
  }

  setNodeTree() {
    this.nodeTree = this.nodeStoreService.buildTree(this.node.id, this.treeDisplayDepth);
  }

  getTreeHtlm(): string {   
    if(this.nodeTree==null) return '';
    
    let html = `${this.nodeTree.title}\n`;
    
    const buildRecursively = (nodes: NodeTree[], prefix: string = ''): string => {
      let result = '';
      
      for (let i = 0; i < nodes.length; i++) {
        const isLast = i === nodes.length - 1;
        const connector = isLast ? '└──' : '├──';
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        
        result += prefix + connector + `${nodes[i].id}-${nodes[i].title}\n`;
        
        if (nodes[i].children?.length) {
          result += buildRecursively(nodes[i].children, newPrefix);
        }
      }
      return result;
    };
    
    return html + buildRecursively(this.nodeTree.children);
  }
  
  
}
