import { AfterViewInit, Component, ViewChild,ElementRef  } from '@angular/core';
import { CommonModule} from  '@angular/common';
import { Node } from '../node/node.component';
import { NodeDataModel } from '../models/node-data.model';

@Component({
  selector: 'app-map',
  imports: [Node, CommonModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class Map implements AfterViewInit {
  nodes: NodeDataModel[] = [];
  parentCoords = { x: 0, y: 0 };
  initialNode: NodeDataModel = this.createNode(1, 0, 0, 0, 'origin')

  @ViewChild('parentContainer') parentContainer!: ElementRef;
  
  constructor() {
    this.nodes.push(this.initialNode); // Push inside constructor
  }

  ngAfterViewInit() {
    const rect = this.parentContainer.nativeElement.getBoundingClientRect();
    this.parentCoords = { x: rect.left, y: rect.top };
  }

  addChildNode(parentNode: NodeDataModel){
    const newNodeId = parentNode.id + 1;
    console.log('event received')
    // this wont workk... parentNode.id +1,
    // Check if node with newNodeId already exists
    const exists = this.nodes.some(node => node.id === newNodeId);

    if (exists) {
      console.log('Node with id', newNodeId, 'already exists. Skipping addition.');
      return; // Don't add duplicate
    }

    const newNode: NodeDataModel = this.createNode(parentNode.id +1, parentNode.id,parentNode.x+20,parentNode.y+20)
    this.nodes.push(newNode);
  }

  createNode(id: number, parentNodeId: number, x:number, y:number,title: string = '', text: string = ''): NodeDataModel {
    // Create the node object with passed parameters
    const node: NodeDataModel = {
      id,
      parentNodeId,
      x,
      y,
      title,
      text

    };
    return node;
  }
}
