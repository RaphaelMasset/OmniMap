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

  @Output() evSetColor = new EventEmitter<string>();
  @Output() evNewChildNode = new EventEmitter<void>();
  @Output() evDeleteNode = new EventEmitter<void>();
  @Output() evMinimise = new EventEmitter<void>();

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
        this.evSetColor.emit(input.value);
        break;

      case 'MinMaximiseNode':
        this.evMinimise.emit();
        break;

      case 'delete':
        this.evDeleteNode.emit();
        break;

      default:
        console.warn('Unknown action:', action);
    }
  }
}
