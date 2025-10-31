import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NodeDataModel } from '../models/node-data.model';

@Component({
  selector: 'app-node-menu',
  standalone: true,
  imports: [],
  templateUrl: './node-menu.html',
  styleUrl: './node-menu.scss'
})
export class NodeMenu {
  @Input() node!: NodeDataModel;

  @Output() setColor = new EventEmitter<string>();
  @Output() newChildNode = new EventEmitter<void>();
  @Output() delateCurretnNode = new EventEmitter<void>();
  @Output() minimise = new EventEmitter<void>();

  onMenuAction(action: string, event: Event) {
     // close menu on action
    console.log('onMenuAction')
    const input = event.target as HTMLInputElement;
    switch (action) 
    {
      case 'newNode':
        this.newChildNode.emit();
        break;

      case 'color':
        this.setColor.emit(input.value);
        break;

      case 'MinMaximiseNode':
        this.minimise.emit();
        break;

      case 'delete':
        this.delateCurretnNode.emit();
        break;

      default:
        console.warn('Unknown action:', action);
    }
  }

}
