import { QueryList, AfterViewInit,HostListener, Component, OnDestroy, ViewChild, ViewChildren, ElementRef  } from '@angular/core';
import { CommonModule} from  '@angular/common';
import { Node } from '../node/node.component';
import { NodeDataModel } from '../model_service_utils/node-data.model';
import { HeaderComponent } from '../header/header.component';
import { Menu } from '../menu/menu';
import { Line } from '../model_service_utils/Line';
import { NodeStoreService } from '../model_service_utils/node-store';
import { CsvHandler } from '../model_service_utils/csvHandler';
import * as CONST from '../model_service_utils/const';

interface TreeNode {
  title: string;
  children: TreeNode[];
}

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [ CommonModule, HeaderComponent, Node, Menu],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
 // nodesMap: Map<number, NodeDataModel> = new Map();
  //nodesMapSev: Map<number, NodeDataModel> = new Map();
  listOfHiddenNode: number[] = [];
  mapContainerCoordXY = { x: 0, y: 0 };
  defaultNodeDim = { w: 100, h: 100 };
  iterationBezier = Array.from({ length: 8 }, (_, i) => i);

  @ViewChild('mapOfNodesContainer') mapOfNodesContainer!: ElementRef;
  @ViewChild('mapHeader', { read: ElementRef }) header!: ElementRef;
  @ViewChild('fileInput', { read: ElementRef }) fileInput!: ElementRef;
  @ViewChild('scalableContainerNode', { read: ElementRef })  scalableContainerNode!: ElementRef;
  @ViewChild('scalableContainerSVGLineAndPath', { read: ElementRef }) scalableSvgGroup!: ElementRef;

  @ViewChildren(Node, { read: ElementRef }) nodeElements!: QueryList<ElementRef>;
  @ViewChildren('colorPicker', { read: ElementRef }) colorPickerElements!: QueryList<ElementRef>;
  // Alt +124  |
  
  clickedDownm = false;
  startX = 0;
  startY = 0;
  translateX = 0;
  translateY = 0;
  scale = 1;

  mapOfNodesContainerNatEl!: HTMLElement; // declare only
  scalableContNode!: HTMLElement; // declare only
  scalableContSVG!: HTMLElement; // declare only

  spaceTakenHeader:number = 45;

  private wheelListener = (event: WheelEvent) => this.onWheel(event);
  private moveListener = (event: MouseEvent) => this.onMove(event);
  private upListener = (event: MouseEvent) => this.onUp(event);
  //todo get this form of notation
  private downListener = (event: MouseEvent) => this.onDown(event);

  menuVisible = false;
  menuRightSide = 0;
  menuY = 0;

  constructor(private nodeStoreService: NodeStoreService) { }
  
  ngOnInit() {
    //origin cree dans le service!
    this.nodeStoreService.createAddAndReturnNewNode({ id: 1, parentNodeId: 0, title: '2222' });
    this.nodeStoreService.createAddAndReturnNewNode({ id: 2, parentNodeId: 0, title: '3333' });

    this.nodeStoreService.nodes$.subscribe(map => {
     // this.nodesMapSev = map; //sound bad to me 
    });
  }

  ngAfterViewInit() {
    this.mapOfNodesContainerNatEl = this.mapOfNodesContainer.nativeElement;
    this.scalableContNode = this.scalableContainerNode.nativeElement;
    this.scalableContSVG = this.scalableSvgGroup.nativeElement;

    const rectHeader = this.header.nativeElement.getBoundingClientRect();
    
    this.spaceTakenHeader = rectHeader.bottom;
    //initialise node  then correct his height after the view is loeaded //need timeout to avoid error
    setTimeout(() => {

      this.nodeStoreService.updateNode(0, { y: 100 });
      this.nodeStoreService.updateNode(1, { y: 100 });
      this.nodeStoreService.updateNode(1, { x: 400 });
      this.nodeStoreService.updateNode(2, { y: 500 });
      this.nodeStoreService.updateNode(2, { x: 400 });

      this.menuY = this.spaceTakenHeader;
      console.log(this.menuRightSide)
    });

    
    //console.log(this.nodeStoreService.nodes$, '.nodes')

    
    const containerRect = this.mapOfNodesContainerNatEl.getBoundingClientRect();
    //just in case the container move
    this.mapContainerCoordXY = { x: containerRect.left, y: containerRect.top };

    this.mapOfNodesContainerNatEl.addEventListener('mousedown', this.downListener);
    window.addEventListener('mousemove', this.moveListener);
    window.addEventListener('mouseup', this.upListener);
    this.mapOfNodesContainerNatEl.addEventListener('wheel', this.wheelListener);

    //this.updateListOfHiddenNode();
    this.nodeStoreService.updateHiddenNodeList();
    //this.listOfHiddenNode = this.nodeStoreService.hiddenNodeIds;
    
    
    //move to the node designed by the inline button in node-text
    window.addEventListener('clickableref-click', (event: any) => {
        const nodetogo = this.nodeStoreService.getNodeSnapshot(event.detail.id)
        //use service TODO

        if(nodetogo){

          this.translateX = -(nodetogo.x - window.innerWidth / 2 + nodetogo.width / 2);
          // Align top of node just under header
          this.translateY = -(nodetogo.y);
          this.scale = 1;
          this.translateScale();
          this.translateX=0;
          this.translateY=0;
        }
        // do whatever you want with the node ID
      });
  }

  translateScale(){
    this.scalableContNode.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    this.scalableContSVG.setAttribute('transform', `translate(${this.translateX} ${this.translateY}) scale(${this.scale})`);
  }

  isEventInsideOneNode(event: MouseEvent): boolean {
    const target = event.target as HTMLElement;
    for (const nodeElem of this.nodeElements) {
      if (nodeElem.nativeElement.contains(target)) {
        return true; // The event target is inside a node
      }
    }
    //if you dont click on  node, no node id selected for next menu
    //this.selectedNodeIdForMenu = null;
    return false;
  }

  writeCsvClicked(){
    const csvHandler = new CsvHandler(this.nodeStoreService);
    csvHandler.writeCsv();
  }

 

  uploadCsvClicked(){
    // the file imput HTML elemt is style="display: none;" so we programmatically click on it when the event occur
    this.fileInput.nativeElement.click();
    //console.log("uploadCsv()")
  }

  showMenu(){
    this.menuVisible = !this.menuVisible;
  }

  onFileSelected(event: Event){ 

    const input = event.target as HTMLInputElement;
    if (!input.files?.length) {
      console.log("No file selected")
      return;
    }

    const file = input.files[0];

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file.');
      return;
    }

    const userConfirmed = confirm('Proceeding will erase and replace the your current work are you sure ?');
    if (userConfirmed) {

      const csvHandler = new CsvHandler(this.nodeStoreService);
      csvHandler.readCsvFile(file);
    } else {
      return
    }
    
  }

 


  get nodesMapToArray(): NodeDataModel[] {
    return this.nodeStoreService.getCurrentNodesArray();
    //return Array.from(this.nodesMap.values());
  }
  getNdCenterXY(node: NodeDataModel) {   
    return {
      x: (node.x - this.mapContainerCoordXY.x) + (node.width)/2,
      y: (node.y - this.mapContainerCoordXY.y) + (node.height)/2,
    };
  }

  private onDown = (event: MouseEvent) => {
    if (this.isEventInsideOneNode(event) || (event.button === 2)) {
      return;
    }
    this.clickedDownm = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.mapOfNodesContainerNatEl.style.cursor = 'move';
  };

  private onMove = (event: MouseEvent) => {
     //onMove fire all the time even without click we need combiantion of both !!!
    if (!this.clickedDownm) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    this.translateX += dx;
    this.translateY += dy;
    //update startcoord bevause onMove will be fired again and again while moving clicked
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.translateScale();
  };

  private onUp = (event: MouseEvent) => {
    if (!this.clickedDownm) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    this.translateX += dx;
    this.translateY += dy;
    this.clickedDownm = false;
    this.mapOfNodesContainerNatEl.style.cursor = 'default';
    this.translateScale();
  };

  private onWheel = (event: WheelEvent) => {   
    event.preventDefault();
    
    const rect = this.mapOfNodesContainerNatEl.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const preZoomX = (offsetX - this.translateX) / this.scale;
    const preZoomY = (offsetY - this.translateY) / this.scale;
    const zoomSpeed = 0.001;
    const delta = event.deltaY;
    if (delta > 0) {
      this.scale = Math.max(0.1, this.scale - zoomSpeed * delta);
    } else {
      this.scale = Math.min(5, this.scale - zoomSpeed * delta);
    }
    this.translateX = offsetX - preZoomX * this.scale;
    this.translateY = offsetY - preZoomY * this.scale;
    this.translateScale();
  };

/**
 * return input node if no parent
 * @param pChildNode 
 * @returns 
 */
  getParentNode(pChildNode: NodeDataModel){
    return this.nodeStoreService.getParentNode(pChildNode);
  }

  nodeLineInter(node: NodeDataModel){

    const parentNd = this.nodeStoreService.getParentNode(node);
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
    const parentNode = this.nodeStoreService.getParentNode(node);
    if (!parentNode) return [];
    //lets substract 4 pixels so the node cover the line edges
    const adjust = 3;
    ///// GET starting coordinates parent
    const parentCorners = this.getRectangleVertices(
      this.getNdCenterXY(parentNode).x,
      this.getNdCenterXY(parentNode).y,
      parentNode.width-adjust,
      parentNode.height-adjust
    );
    ///// GET starting coordinates child
    const childCorners = this.getRectangleVertices(
      this.getNdCenterXY(node).x,
      this.getNdCenterXY(node).y,
      node.width-adjust,
      node.height-adjust
    );
    ///// GET VISIBLE SEGMENT INFO
    const lineCoord = this.nodeLineInter(node);
    const line = new Line(lineCoord.c1.x, lineCoord.c1.y, lineCoord.c2.x, lineCoord.c2.y);
    const lineLen = line.getLength();

    //// RATIOS & Distances for animation control points
    const ratio = 0.5;
    const endDist = this.sigmoidLmaxOrigine(lineLen,200*ratio);
    const centreBigRect = this.sigmoidLmaxOrigine(lineLen,10*ratio);
    const centreLittleRect = this.sigmoidLmaxOrigine(lineLen,20*ratio);
    const widthBigRect = this.sigmoidLmaxOrigine(lineLen,10*ratio);
    const widthLittleRect = this.sigmoidLmaxOrigine(lineLen,5*ratio);

    ////GET PATH ENDING COORDINATES
    let pEndChild = line.getPointAtDistance(endDist);
    let pEndParent = line.getPointAtDistance(lineLen-endDist);
    
    ////GET PATHS CONTROL POINTS

    let ctrPtiRectCh = line.getPointAtDistance(centreLittleRect);
    let ctrGrdRectCh = line.getPointAtDistance(centreBigRect);
    let ctrPtiRectPa = line.getPointAtDistance(lineLen-centreLittleRect);
    let ctrGrdRectPa = line.getPointAtDistance(lineLen-centreBigRect);

    let controlChildren = this.getRectangleVertices(ctrPtiRectCh.x, ctrPtiRectCh.y, widthLittleRect, widthLittleRect)
                  .concat(this.getRectangleVertices(ctrGrdRectCh.x, ctrPtiRectCh.y, widthBigRect, widthBigRect));

    let controlParents = this.getRectangleVertices(ctrGrdRectPa.x, ctrGrdRectPa.y, widthBigRect,widthBigRect)
                 .concat(this.getRectangleVertices(ctrPtiRectPa.x, ctrPtiRectPa.y, widthLittleRect,widthLittleRect));

    ////FILL PATH COORD ARRAY
    let paths: string[] = [];
    //parent paths
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

    //child paths
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
       // 4 courbes partant de l'enfant → vers 70 %
    /*for (let i = 0; i < 2; i++) {
      const start = childCorners[i];
      const ctrl1 = controlChildren2[i];
      const ctrl2 = controlChildren2[i + 4];
      const midPt = pEndChild2;
      const ctrl3 = controlChildren2[i+2];
      const ctrl4 = controlChildren2[i + 6];
      const end = childCorners[i+2];
      paths.push(`M ${start.x},${start.y} C ${ctrl1.x},${ctrl1.y} ${ctrl2.x},${ctrl2.y} ${midPt.x},${midPt.y} C ${ctrl4.x},${ctrl4.y} ${ctrl3.x},${ctrl3.y} ${end.x},${end.y} Z`);
    }*/

    return paths;
  }

//David - prenom
  sigmoidLmax(x: number, max:number = 200, slope:number = 0.02): number {
    //https://www.desmos.com/calculator/khgcbg8xx6
    const inflexionPoint = 4/slope; // Point d'inflexion fucntion de la pente pour que l'origine reste ~ 0
    const exponent = -slope * (x - inflexionPoint);
    const logisticPart = max / (1 + Math.exp(exponent));

    const xZeroCorrection = max / (1+ Math.exp(4));
    return logisticPart - xZeroCorrection;
  }

  sigmoidLmaxOrigine(
    x: number,
    max: number = 200,
    pente: number = 0.02,
    inflex: number = 20
  ): number {
    //sigmoid corrige pour passer par l'origine
    //https://www.desmos.com/calculator/khgcbg8xx6
    const logisticPart = 1 / (1 + Math.exp(-pente * (x - inflex)));
    const logisticAtZero = 1 / (1 + Math.exp(pente * inflex));
    const corrected = (logisticPart - logisticAtZero) / (1 - logisticAtZero);
    return max * corrected;
  }

  ngOnDestroy() {
    this.mapOfNodesContainerNatEl.removeEventListener('mousedown', this.downListener);
    window.removeEventListener('mousemove', this.moveListener);
    window.removeEventListener('mouseup', this.upListener);

    this.mapOfNodesContainerNatEl.removeEventListener('wheel', this.wheelListener);
  } 

  /**
   * return the lenght, unit direciton and normal of the given line
   * @param line 
   * @returns v direction unitaire /  n normal perpendiculaire unitaire /  L  length
   */
  geomFromLine(line: Line) {
    const vx = line.x2 - line.x1;
    const vy = line.y2 - line.y1;
  
    const L = Math.hypot(vx, vy);
    const v = { x: vx / L, y: vy / L };       // direction unitaire
    const n = { x: -v.y, y: v.x };            // normal perpendiculaire unitaire
  
    return { v, n, L };
  }

  triangleCoordsAtTip(line: Line, side: number, tip: {x:number,y:number}) {
    const { v, n } = this.geomFromLine(line);
  
    const h = (Math.sqrt(3) / 2) * side;     // hauteur
    const M = { x: tip.x - v.x * h, y: tip.y - v.y * h };
  
    const half = side / 2;
    const B = { x: M.x + n.x * half, y: M.y + n.y * half };
    const C = { x: M.x - n.x * half, y: M.y - n.y * half };
  
    return { tip, B, C, baseMid: M, normal: n , vunit: v};
  }

  textPosAlongLine(line: Line, dist: number, offset: number) {
    const { v, n } = this.geomFromLine(line);
  
    // point à distance dist depuis x1,y1
    const P = {
      x: line.x1 + v.x * dist,
      y: line.y1 + v.y * dist
    };
  
    return {
      x: P.x + n.x * offset,
      y: P.y + n.y * offset
    };
  }

  getLineFromGivenNodeToParent(childNode: NodeDataModel):Line{
    const parentNode = this.nodeStoreService.getParentNode(childNode);
    const ctrParent = this.getNdCenterXY(parentNode);
    const ctrChild = this.getNdCenterXY(childNode);
    const line = new Line(ctrParent.x, ctrParent.y, ctrChild.x, ctrChild.y);
    return line;
  }

  getHalfDiagOfNode(node: NodeDataModel){
    return Math.sqrt(node.width**2 + node.height**2)/2;
  }

  isLineLongEnoughToDisplayNodesTitles(childNode: NodeDataModel){
    const line = this.getLineFromGivenNodeToParent(childNode);
    const linelen = line.getLength();
    const parentNode = this.nodeStoreService.getParentNode(childNode);
    //check that the line is long enough so that its hard to see the paretn and that its longeur than the node diagonals length plus a margin
    return linelen > 500 && (linelen > CONST.NODE_LINE_TEXT_MARGIN + this.getHalfDiagOfNode(childNode) + this.getHalfDiagOfNode(parentNode)) ;
  }

  getTriAndTitles(childNode: NodeDataModel, side = 10) {
    const parentNode = this.nodeStoreService.getParentNode(childNode);
    if (!parentNode) return null;
    
    const line = this.getLineFromGivenNodeToParent(childNode);
    const lineLen = line.getLength();
    
    // Distance du sommet du triangle depuis le centre de l'enfant
    const distTriangleFromChildCntr = this.getHalfDiagOfNode(childNode) + CONST.NODE_LINE_TEXT_MARGIN;
    const distTriangleFromParentCntr = this.getHalfDiagOfNode(parentNode) + CONST.NODE_LINE_TEXT_MARGIN;
    
    // Vérifie si le triangle peut être affiché
    if (distTriangleFromChildCntr + distTriangleFromParentCntr > lineLen) return null;
    
    // Point sommet du triangle vers l'enfant
    const tip = line.getPointAtDistance(lineLen - distTriangleFromChildCntr);

    //const tri = this.gettriangleCoord(line,side,tip)

    const tri = this.triangleCoordsAtTip(line, side, tip);
    const triPath = `M ${tri.tip.x} ${tri.tip.y} L ${tri.B.x} ${tri.B.y} L ${tri.C.x} ${tri.C.y} Z`;
    
    const titleChXY = {
      x: tri.baseMid.x - tri.vunit.x * 5,
      y: tri.baseMid.y - tri.vunit.y * 5
    };

    const titlePaXY = line.getPointAtDistance(distTriangleFromParentCntr);
    const angle = line.lineAngle();
    const rotCh = `rotate(${angle} ${titleChXY.x} ${titleChXY.y})`;
    const rotPa = `rotate(${angle} ${titlePaXY.x} ${titlePaXY.y})`;
    
    return {triPath, titleChXY, titlePaXY, rotCh, rotPa };
  }

  get hiddenNodeIds(): number[] {
    return this.nodeStoreService.hiddenNodeIds;;
  }

  truncateSvgText(
    textEl: HTMLElement, // the <text> element to measure
    node: NodeDataModel,
    isChild: boolean      // original string
  ) :string {

    const line = this.getLineFromGivenNodeToParent(node);
    const lineLen = line.getLength();
    const parentNode = this.getParentNode(node);
    let text = isChild ? node.title : parentNode.title;

    //const el = document.querySelector('text'); // your SVG text element
    const style = getComputedStyle(textEl as Element);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

    const maxPx = (lineLen - CONST.NODE_LINE_TEXT_MARGIN*2 - this.getHalfDiagOfNode(node) - this.getHalfDiagOfNode(parentNode))/2;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.font = font;

    if (ctx.measureText(text).width <= maxPx) return text;

    while (text.length > 1) {
      text = text.slice(0, -1);          // remove last char
      const textEllipsis = text + '…';// add ellipsis
      if (ctx.measureText(textEllipsis).width <= maxPx) {
        text = textEllipsis;
        break;   
      };
    }

    return text;
  }
}
