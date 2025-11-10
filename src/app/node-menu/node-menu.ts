import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NodeDataModel } from '../model_service_utils/node-data.model';

@Component({
  selector: 'app-node-menu',
  standalone: true,
  imports: [],
  templateUrl: './node-menu.html',
  styleUrl: './node-menu.scss'
})
export class NodeMenu {
  @Input() node!: NodeDataModel;

  @Output() evNewChildNode = new EventEmitter<void>();
  @Output() evDeleteNode = new EventEmitter<void>();

  opacity:number = 1;
  titleMinimised = false;
  textMinimised = false;

  onMenuAction(action: string, event: Event) {
    // close menu on action
    console.log('onMenuAction')
    const input = event.target as HTMLInputElement;
    switch (action) 
    {
      case 'newNode':
        this.evNewChildNode.emit();
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

      case 'delete':
        this.evDeleteNode.emit();
        break;

      default:
        console.warn('Unknown action:', action);
    }
  }
}
