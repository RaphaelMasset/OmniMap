import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NodeDataModel } from '../model_service_utils/node-data.model';
import { NodeStoreService } from '../model_service_utils/node-store';

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
 // @Output() evEditHiddenTree = new EventEmitter<void>();

  opacity:number = 1;
  titleMinimised = false;
  textMinimised = false;

  constructor(private nodeStoreService: NodeStoreService) {}

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

      default:
        console.warn('Unknown action:', action);
    }
  }
}
