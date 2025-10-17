import { AfterViewInit, Component, ViewChild,ElementRef  } from '@angular/core';
import { CommonModule, NgFor} from  '@angular/common';
import { Node } from '../node/node.component';
import { NodeDataModel } from '../models/node-data.model';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [ CommonModule, Node],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  nodesMap: Map<number, NodeDataModel> = new Map();
  mapContainerCoordXY = { x: 0, y: 0 };

  @ViewChild('parentContainer') parentContainer!: ElementRef;
  
  constructor() {
    const initialNode: NodeDataModel = this.createNode(1, 0, 100, 100, 'origin')
    this.nodesMap.set(1, initialNode); // Push inside constructor
  }

  ngAfterViewInit() {
    const rect = this.parentContainer.nativeElement.getBoundingClientRect();
    this.mapContainerCoordXY = { x: rect.left, y: rect.top };
  }

  addChildNode(parentNode: NodeDataModel){
    let highestId = 0;
    for (const key of this.nodesMap.keys()) {
      if (key > highestId) {
        highestId = key;
      }
    }
    
    const newNodeId = highestId+1;

    console.log(newNodeId+' '+parentNode.id)
    const newNode: NodeDataModel = this.createNode(newNodeId, parentNode.id, parentNode.x+20,parentNode.y+20)
    this.nodesMap.set(newNodeId, newNode);
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
  get nodesMapToArray(): NodeDataModel[] {
    return Array.from(this.nodesMap.values());
  }
  getParentX(node :NodeDataModel){return this.nodesMap.get(node.parentNodeId)?.x}
  getParentY(node :NodeDataModel){
    //console.log('Y asked by svg'+this.nodesMap.get(node.parentNodeId)?.y)
    return this.nodesMap.get(node.parentNodeId)?.y
  }
  
  updateNodeCoordinates(event: { id: number; x: number; y: number }) {
    const node = this.nodesMap.get(event.id);
    if (node) {
        node.x = event.x;
        node.y = event.y;
      }
    //console.log('Map got coord: '+event.x+','+event.y+'for node n:'+event.id)
      // Optionally, trigger change detection if update comes asynchronously
  }

}


/*  

  
  */