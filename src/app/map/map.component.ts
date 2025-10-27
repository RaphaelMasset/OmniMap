import { AfterViewInit, Component, ViewChild,ElementRef  } from '@angular/core';
import { CommonModule, NgFor} from  '@angular/common';
import { Node } from '../node/node.component';
import { NodeDataModel } from '../models/node-data.model';
import { HeaderComponent } from '../header/header.component';
import { Line } from './Line';


@Component({
  selector: 'app-map',
  standalone: true,
  imports: [ CommonModule, HeaderComponent, Node],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  nodesMap: Map<number, NodeDataModel> = new Map();
  mapContainerCoordXY = { x: 0, y: 0 };
  defaultNodeDim = { w: 100, h: 100 };
  //numbers = Array.from({ length: 100 }, (_, i) => i); //to create a background grid
  iterationBezier = Array.from({ length: 8 }, (_, i) => i);

  ratios = [
    { rx: 0.1, ry: 0.1 },
    { rx: 0.2, ry: 0.05 },
    { rx: 0.8, ry: 0.05 },
    { rx: 0.9, ry: 0.1 },
  ];

  @ViewChild('mapOfNodesContainer') mapOfNodesContainer!: ElementRef;
  
  constructor() {
    const initialNode: NodeDataModel = this.createNode({id:1,parentNodeId:0,title:'origin'})
    this.nodesMap.set(1, initialNode); // Push inside constructor
  }
  ngAfterViewInit() {
    const rect = this.mapOfNodesContainer.nativeElement.getBoundingClientRect();
    this.mapContainerCoordXY = { x: rect.left, y: rect.top };
  }

  addChildNode(ParentId: number){
    const parentNode = this.nodesMap.get(ParentId);
    if (!parentNode) return
    let highestId = 0;
    for (const key of this.nodesMap.keys()) {
      if (key > highestId) {
        highestId = key;
      }
    }
    const newNodeId = highestId+1;

    const newNode: NodeDataModel = this.createNode({
      id:newNodeId,
      parentNodeId:parentNode.id,
      x:parentNode.x+parentNode.width+20,
      y:parentNode.y+parentNode.height+20,
      title:`Node nb ${newNodeId}`,
      color:parentNode.color
    })
    this.nodesMap.set(newNodeId, newNode);
  }

  /*
  This mehod allow centralizing default parameters assignment
   */
  createNode(partial: Partial<NodeDataModel>): NodeDataModel {
    return {
      id: partial.id ?? 0,
      parentNodeId: partial.parentNodeId ?? 0,
      x: partial.x ?? 50,  //very dangerous hardcoded ratio -> getLineCoordinates()
      y: partial.y ?? 50,
      width: partial.width ?? 100,
      height: partial.height ?? 200,
      title: partial.title ?? '',
      text: partial.text ?? '',
      color: partial.color ?? '#007bff'
    };
  }

  get nodesMapToArray(): NodeDataModel[] {
    return Array.from(this.nodesMap.values());
  }

  getNdCenterXY(node: NodeDataModel) {   
    return {
      x: (node.x - this.mapContainerCoordXY.x) + (node.width)/2,
      y: (node.y - this.mapContainerCoordXY.y) + (node.height)/2,
    };
  }

/**
 * return input node if no parent
 * @param pChildNode 
 * @returns 
 */
  getParentNode(pChildNode: NodeDataModel){
    const parent = this.nodesMap.get(pChildNode.parentNodeId);
    if(!parent) {return pChildNode}
    return parent;
  }

  rect4Vertex(node: NodeDataModel, ctr: {x:number,y:number},ratioRect: number)
  {
    const parentNd = this.getParentNode(node)
    const ctrPaNd = this.getNdCenterXY(parentNd)
    const ctrNd = this.getNdCenterXY(node)

    const lineInterNd = this.nodeLineInter(node)
    const line = new Line(lineInterNd.c1.x,lineInterNd.c1.y,lineInterNd.c2.x,lineInterNd.c2.y)

    //console.log(parentNd.x,parentNd.y,node.x,node.y)
    //const line = new Line(ctrPaNd.x,ctrPaNd.y,ctrNd.x,ctrNd.y)
    //const ctr = line.getPointAtRatio(ratioLine)
    return this.getRectangleVertices(ctr.x,ctr.y,node.width*ratioRect,node.height*ratioRect)
  }

  nodeLineInter(node: NodeDataModel){

    const parentNd = this.getParentNode(node)
    const ctrPaNd = this.getNdCenterXY(parentNd)
    const ctrNd = this.getNdCenterXY(node)

    return {
      c1: this.rectangleLineIntersection(ctrNd.x, ctrNd.y,
                                          node.width, node.height, 
                                          ctrNd.x, ctrNd.y,
                                          ctrPaNd.x,ctrPaNd.y),
      c2: this.rectangleLineIntersection(ctrPaNd.x, ctrPaNd.y,
                                          parentNd.width, parentNd.height, 
                                          ctrPaNd.x,ctrPaNd.y,
                                          ctrNd.x, ctrNd.y)
    }
  }
  getRectangleVertices(
    xc: number,
    yc: number,
    width: number,
    height: number
  ): { x: number; y: number }[] {
    const w2 = width / 2;
    const h2 = height / 2;

    return [
      { x: xc - w2, y: yc - h2 }, // top-left
      { x: xc + w2, y: yc - h2 }, // top-right
      { x: xc + w2, y: yc + h2 }, // bottom-right
      { x: xc - w2, y: yc + h2 }  // bottom-left
    ];
  }
  rectangleLineIntersection(
    centerX: number,
    centerY: number,
    width: number,
    height: number,
    x1: number, y1: number,
    x2: number, y2: number
  ): {x: number, y: number} {

    const left = centerX - width / 2;
    const right = centerX + width / 2;
    const top = centerY - height / 2;
    const bottom = centerY + height / 2;

    const dx = x2 - x1;
    const dy = y2 - y1;

    const tValues: number[] = [];

    // éviter division par 0
    if (dx !== 0) {
      tValues.push((left - x1) / dx);
      tValues.push((right - x1) / dx);
    }
    if (dy !== 0) {
      tValues.push((top - y1) / dy);
      tValues.push((bottom - y1) / dy);
    }

    // filtrer t > 0
    const tExit = tValues.filter(t => t > 0).sort((a,b)=>a-b)[0];

    if (tExit === undefined) return {x:0,y:0};

    return {
      x: x1 + tExit * dx,
      y: y1 + tExit * dy
    };
  }
  generateBezierPaths(node: NodeDataModel): string[] {
    const parentNode = this.getParentNode(node);
    if (!parentNode) return [];

    const parentCorners = this.getRectangleVertices(
      this.getNdCenterXY(parentNode).x,
      this.getNdCenterXY(parentNode).y,
      parentNode.width,
      parentNode.height
    );

    const childCorners = this.getRectangleVertices(
      this.getNdCenterXY(node).x,
      this.getNdCenterXY(node).y,
      node.width,
      node.height
    );
    const lineCoord = this.nodeLineInter(node);
    const line = new Line(lineCoord.c1.x, lineCoord.c1.y, lineCoord.c2.x, lineCoord.c2.y);
    
    //node, distance sur la ligne des 4 poitns d'accroche, taille du rectangle d'accroche
    const ratioGrandRect = 0.08;
    const ratioPetitRect = 0.045;
    const ratioDistGrandRect = 0.05;
    const ratioDistPetitRect = 0.01;
    const ratioFinPath = 0.4;
    const distanceMaxAnim = 200;
    //distance max accroche sur le segment
    let pEndChild =  line.getPointAtRatio(ratioFinPath);
    let pEndParent = line.getPointAtRatio(1-ratioFinPath);

    let controlChildren = this.rect4Vertex(node, line.getPointAtRatio(ratioDistGrandRect), ratioGrandRect)
      .concat(this.rect4Vertex(node, line.getPointAtRatio(ratioDistPetitRect), ratioPetitRect));

    let controlParents= this.rect4Vertex(node, line.getPointAtRatio(1-ratioDistPetitRect), ratioPetitRect)
      .concat(this.rect4Vertex(node, line.getPointAtRatio(1-ratioDistGrandRect), ratioGrandRect));

    if (line.getLength() >= distanceMaxAnim)
    {
      //distance max accroche sur le segment
      pEndChild = line.getPointAtDistance(ratioFinPath*distanceMaxAnim) ;
      pEndParent = line.getPointAtDistance(line.getLength()-ratioFinPath*distanceMaxAnim);

      controlChildren = this.rect4Vertex(node, line.getPointAtDistance(distanceMaxAnim*ratioDistGrandRect), ratioGrandRect)
        .concat(this.rect4Vertex(node, line.getPointAtDistance(distanceMaxAnim*ratioDistPetitRect), ratioPetitRect));

      controlParents= this.rect4Vertex(node, line.getPointAtDistance(line.getLength()-distanceMaxAnim*ratioDistPetitRect), ratioPetitRect)
        .concat(this.rect4Vertex(node, line.getPointAtDistance(line.getLength()-distanceMaxAnim*ratioDistGrandRect ), ratioGrandRect));
    }
    console.log(controlParents.length)



    let paths: string[] = [];

    // 4 courbes partant du parent → vers 30 %
    for (let i = 0; i < 2; i++) {
      const start = parentCorners[i];
      const ctrl1 = controlParents[i];
      const ctrl2 = controlParents[i + 4];
      const midPt = pEndParent;
      const ctrl3 = controlParents[i + 2];
      const ctrl4 = controlParents[i + 6];
      const end = parentCorners[i + 2];
      paths.push(`M ${start.x},${start.y} C ${ctrl1.x},${ctrl1.y} ${ctrl2.x},${ctrl2.y} ${midPt.x},${midPt.y} C ${ctrl4.x},${ctrl4.y} ${ctrl3.x},${ctrl3.y} ${end.x},${end.y} Z`);
    }

    // 4 courbes partant de l'enfant → vers 70 %
    for (let i = 0; i < 2; i++) {
      const start = childCorners[i];
      const ctrl1 = controlChildren[i];
      const ctrl2 = controlChildren[i + 4];
      const midPt = pEndChild;
      const ctrl3 = controlChildren[i+2];
      const ctrl4 = controlChildren[i + 6];
      const end = childCorners[i+2];
      paths.push(`M ${start.x},${start.y} C ${ctrl1.x},${ctrl1.y} ${ctrl2.x},${ctrl2.y} ${midPt.x},${midPt.y} C ${ctrl4.x},${ctrl4.y} ${ctrl3.x},${ctrl3.y} ${end.x},${end.y} Z`);
    }

    return paths;
  }

}