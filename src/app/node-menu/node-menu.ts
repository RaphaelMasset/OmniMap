import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { NodeDataModel } from '../model_service_utils/node-data.model';
import { NodeStoreService } from '../model_service_utils/node-store';
import {NodeTree} from '../model_service_utils/const';
import { Subscription } from 'rxjs';
import { NODE_MENU_WIDTH } from '../model_service_utils/const';

@Component({
  selector: 'app-node-menu',
  standalone: true,
  imports: [],
  templateUrl: './node-menu.html',
  styleUrl: './node-menu.scss'
})
export class NodeMenu {
  @Input() nodeId!: number;
  @Output() evNewChildNodeClicked = new EventEmitter<void>();
  @Output() evDeleteNodeClicked = new EventEmitter<void>();
  @Output() evCloseMenuClicked = new EventEmitter<void>();

  @ViewChild('menuContainer', { read: ElementRef }) menuContainer!: ElementRef;
  @ViewChild('nodeVisibilityButton') nodeVisibilityButton!: ElementRef;
  @ViewChild('nodeChildrenTreeResumeButton') nodeChildrenTreeResumeButton!: ElementRef;

  node! : NodeDataModel;
  public readonly NODE_MENU_WIDTH = NODE_MENU_WIDTH;

  titleMinimised = false;
  textMinimised = false;
  subMenuVisible = false;
  treeDisplayDepth = 6;
  newParentID :number = -1;

  showPopupTree = false;
  popupX = 0;
  popupY = 0;
  nodeTree: NodeTree | null = null;

  menuLeft = 0;
  menuTop = 0;

  constructor(private nodeStoreService: NodeStoreService) {}

  private treeSub?: Subscription;
  private nodeSub?: Subscription;
  
  ngOnInit() {   
    this.nodeSub = this.nodeStoreService.node$(this.nodeId).subscribe((node) => {     
      if (node) {  
        this.node=node;
      }
    });
    if (this.node){
      this.setNodeTree();
      this.treeSub = this.nodeStoreService.nodes$.subscribe(() => {
        if (this.showPopupTree) {
          this.setNodeTree();  // Rebuild tree when nodes change
        }
      });
    }
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
        this.nodeStoreService.updateNode(this.nodeId, { color: input.value });
        break;

      case 'MinMaximiseTitle':
        //this.node.titleMinimized = !this.node.titleMinimized;
        this.nodeStoreService.updateNode(this.nodeId, { titleMinimized: !this.node.titleMinimized });
        break;

      case 'MinMaximiseContent':
        //this.node.contentMinimized = !this.node.contentMinimized;
        this.nodeStoreService.updateNode(this.nodeId, { contentMinimized: !this.node.contentMinimized });
        break;       
      
     /* case 'MinMaximiseNode':
        console.log('MinMaximiseNode clicked',
          this.nodeStoreService.getNodeMinSize(this.nodeId).minWidth,
          this.nodeStoreService.getNodeMinSize(this.nodeId).minHeight);

        this.nodeStoreService.updateNode(this.nodeId, { /*nodeMinimized: !this.node.nodeMinimized,*//*
          width: this.nodeStoreService.getNodeMinSize(this.nodeId).minWidth,
          height: this.nodeStoreService.getNodeMinSize(this.nodeId).minHeight 
        });
        break; */ 

      case 'deleteNode':
        this.nodeStoreService.tryDeleteNode(this.node.id);
        this.evDeleteNodeClicked.emit();
        break;

      case 'transparent':
        //this.node.transparent = !this.node.transparent;
        this.nodeStoreService.updateNode(this.nodeId, { transparent: !this.node.transparent });

        break;

      case 'readonly':
        //this.node.locked = !this.node.locked;
        this.nodeStoreService.updateNode(this.nodeId, { locked: !this.node.locked });
        break;

      case 'closeMenu':
        this.evCloseMenuClicked.emit();
        break;
      
      case 'MinMaximiseChildrenTree':
        //this.node.hiddenTree = !this.node.hiddenTree;
        this.nodeStoreService.updateNode(this.nodeId, { hiddenTree: !this.node.hiddenTree });
        this.nodeStoreService.updateHiddenNodeList();
       // this.evEditHiddenTree.emit();//TODO remove
        break;

      case 'DisplayChildrenTreeResume':
        const mouseEvent = event as MouseEvent; 
        this.setNodeTree();
        this.setNodeTreeCoordinates()

        this.showPopupTree = !this.showPopupTree;
        break;

      case 'newParent':
        if(this.newParentID>=0 && this.newParentID!=this.node.parentNodeId){
          console.log('current '+this.node.parentNodeId+' - new parent'+this.newParentID)
          this.nodeStoreService.assignNewParentToNode(this.node.id, this.newParentID);
          //this.node.parentNodeId = this.newParentID;
        }
        break;

      default:
        console.warn('Unknown action, how did you do that?: ', action);      
    }
    //because we modified a node, he is the selected node
    //we need to update the hidden tree variable
    this.nodeStoreService.setSelectedNode(this.node.id);
  }

  onDepthChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let parsedTreeDisplayDepth = parseInt(input.value, 10);  
    this.treeDisplayDepth = parsedTreeDisplayDepth;
  }

  onNewParentChange(event: Event) {
    const input = event.target as HTMLInputElement;
    let parsedNewParentID = parseInt(input.value, 10); 
    console.log('onNewParentChange parsedNewParentID=',parsedNewParentID); 
    this.newParentID = parsedNewParentID;
  }

  setNodeTree() {
    this.nodeTree = this.nodeStoreService.buildTree(this.node.id, this.treeDisplayDepth);
  }

  setNodeTreeCoordinates(){

    const coord = this.getCoordOfref('nodeChildrenTreeResumeButton');
    const menuContainerNativeEl = this.menuContainer.nativeElement;
    const rect = menuContainerNativeEl.getBoundingClientRect();
    
    this.popupX = (NODE_MENU_WIDTH);
    this.popupY = (coord.y-rect.y)/this.getScale();


    
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

  // Une SEULE méthode pour TOUS les éléments
  getCoordOfref(refName: string): { x: number; y: number } {
    const elem = (this as any)[refName]?.nativeElement as HTMLElement;
    if (!elem) return { x: 0, y: 0 };
    const rect = elem.getBoundingClientRect();

    return { x: rect.left, y: rect.top };
  }

  getScale(){
    return this.nodeStoreService.scale;
   }

  onNodeVisibilityButtonHover() {
    // Calcule UNE SEULE FOIS au hover
    const coord = this.getCoordOfref('nodeVisibilityButton');
    const menuContainerNativeEl = this.menuContainer.nativeElement;
    const rect = menuContainerNativeEl.getBoundingClientRect();

    this.menuLeft = (NODE_MENU_WIDTH);
    this.menuTop = (coord.y-rect.y)/this.getScale();

    this.subMenuVisible = true;
  }  
  onNodeVisibilityButtonLeave() {this.subMenuVisible=false;}
  onSubMenuForNodeVisibilityHover() {this.onNodeVisibilityButtonHover();}
  onSubMenuForNodeVisibilityLeave() {this.onNodeVisibilityButtonLeave();}
  
}
