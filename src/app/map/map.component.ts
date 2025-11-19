import { QueryList, AfterViewInit,HostListener, Component, OnDestroy, ViewChild, ViewChildren, ElementRef  } from '@angular/core';
import { CommonModule} from  '@angular/common';
import { Node } from '../node/node.component';
import { NodeDataModel } from '../model_service_utils/node-data.model';
import { HeaderComponent } from '../header/header.component';
import { Line } from '../model_service_utils/Line';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [ CommonModule, HeaderComponent, Node],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit, OnDestroy {
  nodesMap: Map<number, NodeDataModel> = new Map();
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

  mapOfNodescontainerNatEl!: HTMLElement; // declare only
  scalableContNode!: HTMLElement; // declare only
  scalableContSVG!: HTMLElement; // declare only

  spaceTakenHeader:number = 45;

  private wheelListener = (event: WheelEvent) => this.onWheel(event);
  private moveListener = (event: MouseEvent) => this.onMove(event);
  private upListener = (event: MouseEvent) => this.onUp(event);
  //todo get this form of notation
  private downListener = (event: MouseEvent) => this.onDown(event);
  
  constructor() {
    const initialNode: NodeDataModel = this.createNode({id:0,parentNodeId:-1,title:'origin'})
    const node2 = this.createNode({id:1,parentNodeId:0,title:'2222'})
    const node3 = this.createNode({id:2,parentNodeId:0,title:'3333'})
    this.nodesMap.set(initialNode.id, initialNode); // Push inside constructor
    this.nodesMap.set(node2.id, node2); // Push inside constructor
    this.nodesMap.set(node3.id, node3); // Push inside constructor
  }
  ngAfterViewInit() {
    this.mapOfNodescontainerNatEl = this.mapOfNodesContainer.nativeElement;
    this.scalableContNode = this.scalableContainerNode.nativeElement;
    this.scalableContSVG = this.scalableSvgGroup.nativeElement;
    //const rect = this.mapOfNodescontainerNatEl.getBoundingClientRect();
    const rectheader = this.header.nativeElement.getBoundingClientRect();
    
    this.spaceTakenHeader = rectheader.bottom;
    //initialise node  then correct his height after the view is loeaded //need timeout to avoid error
    setTimeout(() => {
      this.nodesMap.get(0)!.y = this.spaceTakenHeader + 10;
      this.nodesMap.get(1)!.y = this.spaceTakenHeader + 10;
      this.nodesMap.get(1)!.x = 400;

      this.nodesMap.get(2)!.y = this.spaceTakenHeader + 10+400;
      this.nodesMap.get(2)!.x = 400;
    });
    
    //this.mapContainerCoordXY = { x: rect.left, y: rect.top };
   // console.log('Header height: '+this.spaceTakenHeader)
    
    const containerRect = this.mapOfNodescontainerNatEl.getBoundingClientRect();
    this.mapContainerCoordXY = { x: containerRect.left, y: containerRect.top };

    this.mapOfNodescontainerNatEl.addEventListener('mousedown', this.downListener);
    window.addEventListener('mousemove', this.moveListener);
    window.addEventListener('mouseup', this.upListener);
    this.mapOfNodescontainerNatEl.addEventListener('wheel', this.wheelListener);

    this.updateListOfHiddenNode()
    
    window.addEventListener('clickableref-click', (event: any) => {
        const nodetogo = this.nodesMap.get(+event.detail.id)
        //console.log(this.nodesMap)
        if(nodetogo){
          //console.log('Clicked on a ref to node:', event.detail.id, 'found it in map');
          //console.log('we are at', this.translateX, this.translateY, ' -- we go to: ',nodetogo?.x,nodetogo?.y,'-- diff is',nodetogo?.x - this.translateX,nodetogo?.y - this.translateY );
          // Center horizontally
          this.translateX = -(nodetogo.x - window.innerWidth / 2 + nodetogo.width / 2);
          // Align top of node just under header
          this.translateY = -(nodetogo.y - this.spaceTakenHeader);
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

  updateListOfHiddenNode(){
    let list:number[] = [];
    for (const node of this.nodesMap.values()) 
    {
      if (node.hiddenTree) 
      {
        this.pushAllChildrenNode(list,node.id);
      }
    }
    //remove duplicate
    this.listOfHiddenNode = Array.from(new Set(list));
  }


  /**
   * create a lsit containing  all children id of given id
   * @param list 
   * @param idParent 
   * @returns 
   */
  pushAllChildrenNode(list:number[],idParent:number){
    //input parent node id
    //if some node have this idParent defined as parent ndoe id
    //recursiv Search for child
    //add this id to the list
    for (const node of this.nodesMap.values()) {
      if (node.parentNodeId == idParent) {
        this.pushAllChildrenNode(list,node.id)
        list.push(node.id)
      }
    }
  }
  /**
   * Use node map to write a CSV file and trigger download
   */
  writeCsv(){
    //create a list of header by getting the keys of hte node object
    //this.nodesMap.get(0) → returns the NodeDataModel object stored under key 0 in the map.
    const headers = Object.keys(this.nodesMap.get(0) || {});
    //conver teh map of objet to a list of object
    const nodeArray = this.nodesMapToArray;
    /*
    {\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\n",\n"text\":\n"qqqq\"}]}]}
    */
      const csvRows = [
      headers.join(','), // ligne d'entête
      ...nodeArray.map(node =>
        headers.map(header =>{         
          if(header==='text'){
            //console.log(node[header] ?? '');
            //console.log(btoa(unescape(encodeURIComponent(node[header] ?? ''))))
            //console.log(decodeURIComponent(escape(atob(btoa(unescape(encodeURIComponent(node[header] ?? '')))))))
            return btoa(unescape(encodeURIComponent(node[header] ?? ''))); //encoding base 64 eviter prb avec les escape char a la lecture 
          }else{
            return JSON.stringify(node[header] ?? '')
          }
          
        }).join(',') // ligne de données pour chaque noeud
      )
    ];
    //id,parentNodeId,x,y,width,height,title,color,text
    csvRows.forEach(e=> console.log(e))

    const csvString = csvRows.join('\n');
    //console.log(nodeArray)
    
    // Création d'un Blob contenant le CSV
    const blob = new Blob([csvString], { type: 'text/csv' });

    // Création d'une URL pour ce Blob
    const url = URL.createObjectURL(blob);
    //creation NOM DE FICHIER
    // Récupère la date actuelle
    const now = new Date();

    // Formate la date yyyy-MM-dd
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // mois de 0 à 11
    const day = String(now.getDate()).padStart(2, '0');

    // Formate l'heureMinute hhmm
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    //console.log('writeCsv - minutes: '+minutes)

    // Compose le nom du fichier (sans caractères interdits comme /)
    const fileName = `OmniMap_${year}-${month}-${day}_${hours}:${minutes}.csv`;
    //FIN CREA NOM FICHIER
    // Création d'un lien pour le téléchargement
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', fileName);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  uploadCsv(){
    // the file imput HTML elemt is style="display: none;" so we programmatically click on it when the event occur
    this.fileInput.nativeElement.click();
    //console.log("uploadCsv()")
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
      this.readCsvFile(file);
    } else {
      return
    }
    
  }

  readCsvFile(file: File) {
    const reader = new FileReader();
    //console.log('readCsvFile before .onload')
    reader.onload = () => {
      //console.log('readCsvFile inside .onload')
      const csvText = reader.result as string;
      const lines = csvText.split('\n');  //CSV text string into an array of lines
      this.nodesMap = this.csvToMapWithHeader(lines)
    }
    reader.readAsText(file);
    reader.onerror = () => console.error('File reading error', reader.error);
    reader.onabort = () => console.warn('File reading aborted');
  }

  csvToMapWithHeader(lines: string[]): Map<number, NodeDataModel> {
    const nodeMap = new Map<number, NodeDataModel>();

    if (lines.length === 0){console.log('csvToMapWithHeader - no lines'); return nodeMap;};
    const header = lines[0].split(','); // Get column names from first line

    //get header index and return the string at this index for the given line
    function getValue(columns: string[], name: string): string | undefined {
      const index = header.indexOf(name);
      //console.log(columns[index])
      if (index === -1) return undefined;
      //if (name === 'text')console.log('getValue',stripQuotes(columns[index]))
      return stripQuotes(columns[index]);
    }

    function stripQuotes(value: string): string {
      if (!value) return value;
      if (value.startsWith('"') && value.endsWith('"')) {
        return value.slice(1, -1);
      }     
      return value;
    }

    for (let i = 1; i < lines.length; i++) {
      const nodeIValues = lines[i].split(',');

      const idStr = getValue(nodeIValues, 'id');
      if (!idStr){
        //console.log('line '+i+' id is invalid-skip')
        continue;
      }  // Skip invalid lines
      //console.log(nodeIValues)
      //console.log(getValue(nodeIValues, 'text'))
      const nodeI: NodeDataModel = this.createNode({
        id: Number(idStr),
        parentNodeId: Number(getValue(nodeIValues, 'parentNodeId')),
        x: Number(getValue(nodeIValues, 'x')),
        y: Number(getValue(nodeIValues, 'y')),
        width: Number(getValue(nodeIValues, 'width')),
        height: Number(getValue(nodeIValues, 'height')),
        title: getValue(nodeIValues, 'title') || '',
        color: getValue(nodeIValues, 'color') || '',
        text: decodeURIComponent(escape(atob(getValue(nodeIValues, 'text') || ''))),
        //text: atob(getValue(nodeIValues, 'text') || ''),
      })
      console.log('node.text apres lecture csv',nodeI.text)
      nodeMap.set(nodeI.id, nodeI);
    }
    return nodeMap;
  }

  addNewChildNodeToNodeMap(parentId: number){
    const parentNode = this.nodesMap.get(parentId);
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
      x: partial.x ?? 10, 
      y: partial.y ?? 0,
      width: partial.width ?? this.defaultNodeDim.w,
      height: partial.height ?? this.defaultNodeDim.h,
      title: partial.title ?? '', 
      color: partial.color ?? '#007bff',
      opacity: partial.opacity ?? 1,
      transparent: partial.transparent ?? false,
      titleMinimize: partial.titleMinimized ?? false,
      contentMinimized: partial.contentMinimized ?? false,
      locked: partial.locked ?? false,
      hiddenTree: partial.hiddenTree ?? false,
      text: partial.text ?? '',
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

  onNewChildNode(nodeId: number) {
    this.addNewChildNodeToNodeMap(nodeId);
  }

  onDeleteNode(nodeId: number) {
    
    //prevent user from delating the last node if there is only one
    if (nodeId == 0){
      alert('You need at least one node to create new ones');
      return
    }

    if (!this.nodesMap.has(nodeId)) {
      // if the node dont exist we return an error
      alert('Indexation error, this nodeId does not exist');
      return;
    }

    const nodeToDelete = this.nodesMap.get(nodeId)!;
    let userConfirmedNdAndChildDel = false;
    //check if this node exist 
    const hasChildren = [...this.nodesMap.values()].some(node => node.parentNodeId === nodeToDelete.id);
    const userConfirmedNdDel = confirm('Proceeding will erase the current node are you sure ?');
    if (userConfirmedNdDel) {
      //check if the node have children, if yes ask if you want to delate them
      if (hasChildren){
        userConfirmedNdAndChildDel = confirm('Do you also want to delete children of this node ?');
        //only loop if the node have children
        for (const node of this.nodesMap.values()) {
          //if we find children we replace their parent node id with the delated node parent node id or we delate them
          if (node.parentNodeId == nodeId) {
            if (userConfirmedNdAndChildDel){
              this.recursivDeletion(node.id)
            }
            else{
              node.parentNodeId = nodeToDelete.parentNodeId;
            }
          }
        }
      }
      //then we delate the targeted node
      this.nodesMap.delete(nodeId)
    //if the user refuse to delate we return null
    } else {
      return
    }
  }

  onEditHiddenTree(nodeId: number) {
    this.updateListOfHiddenNode()
    console.log(this.listOfHiddenNode)
  }

 /* getParentIdList(){
    const ids: number[] = Array.from(this.nodesMap.values(), v => v.id);
    return ids
  }*/

  recursivDeletion(id:number){
    for (const node of this.nodesMap.values()) {
      if (node.parentNodeId == id) {
        this.recursivDeletion(node.id)
      }
    }  //on envoi 1 -> on toruve le node 2 et trois qui on 1 en parent et on recurse// sur 2 et trois on trouve pas d'enfant alors on les delate et ensuite on delate 1
    this.nodesMap.delete(id) 
  }

  private onDown = (event: MouseEvent) => {
    if (this.isEventInsideOneNode(event) || (event.button === 2)) {
      return;
    }
    this.clickedDownm = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.mapOfNodescontainerNatEl.style.cursor = 'move';
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
    this.mapOfNodescontainerNatEl.style.cursor = 'default';
    this.translateScale();
  };

  private onWheel = (event: WheelEvent) => {   
    event.preventDefault();
    
    const rect = this.mapOfNodescontainerNatEl.getBoundingClientRect();
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
    const parent = this.nodesMap.get(pChildNode.parentNodeId);
    if(!parent) {return pChildNode}
    return parent;
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
    this.mapOfNodescontainerNatEl.removeEventListener('mousedown', this.downListener);
    window.removeEventListener('mousemove', this.moveListener);
    window.removeEventListener('mouseup', this.upListener);

    this.mapOfNodescontainerNatEl.removeEventListener('wheel', this.wheelListener);
  } 
}
