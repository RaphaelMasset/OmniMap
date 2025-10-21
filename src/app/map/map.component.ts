import { AfterViewInit, Component, ViewChild,ElementRef  } from '@angular/core';
import { CommonModule, NgFor} from  '@angular/common';
import { Node } from '../node/node.component';
import { NodeDataModel } from '../models/node-data.model';
import { HeaderComponent } from '../header/header.component';

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
  numbers = Array.from({ length: 100 }, (_, i) => i);

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
      x:parentNode.x+parentNode.width-10,
      y:parentNode.y+parentNode.height-10,
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
      x: partial.x ?? 100,  //very dangerous hardcoded ratio -> getLineCoordinates()
      y: partial.y ?? 100,
      width: partial.width ?? 100,
      height: partial.height ?? 100,
      title: partial.title ?? '',
      text: partial.text ?? '',
      color: partial.color ?? '#007bff'
    };
  }

  get nodesMapToArray(): NodeDataModel[] {
    return Array.from(this.nodesMap.values());
  }

  getLineCoordinates(node: NodeDataModel) {
    const parent = this.nodesMap.get(node.parentNodeId);
    if (!parent) return { xchild: -1, ychild: -1, xparent: -1, yparent: -1 };
    //node xy coord are in viewport coordinate syst 
    //svg xy coord are parent component coordinate syst because he is in the map container
    //console.log(this.mapContainerCoordXY.x+' '+this.mapContainerCoordXY.y)
    return {
      xchild: (node.x - this.mapContainerCoordXY.x) + (node.width)/2,
      ychild: (node.y - this.mapContainerCoordXY.y) + (node.height)/2,
      xparent: (parent.x - this.mapContainerCoordXY.x) + (parent.width)/2,
      yparent: (parent.y - this.mapContainerCoordXY.y) + (parent.height)/2
    };
  }
  getBezierPath(node: NodeDataModel)
  {
    const parent = this.nodesMap.get(node.parentNodeId);
    // coordiante of the centres of parent and child
    const xlineChild = this.getLineCoordinates(node).xchild;
    const yLineChild = this.getLineCoordinates(node).ychild;
    const xLineParent = this.getLineCoordinates(node).xparent;
    const yLineParent = this.getLineCoordinates(node).yparent;
    console.log(`Centers of 2 divs are ${xlineChild},${xLineParent} and ${xLineParent},${yLineParent}`);
    //the bezier curve is calculated via 4 point "M x1,y1 C c1x,c1y c2x,c2y x2,y2"
    //we need 4 curve for the animation
    //for the animation we use an ellipse that intersect the edges of the current node
    //the points needed for 2 curve (8 points) of one node are all contained as cornes of 4 squares with sides equal to the center of the ellipse to the intersection of the line and the ellipse
    //the sqares follow the line inclination

    //we can use the intersection between the line and the ellipse at 0 pi/2 and -pi/2 rotation

    const lineSlope = ((xLineParent-yLineParent)/(xlineChild-xLineParent))
    console.log(`Slope is ${lineSlope}`)
    // y = slope*x
    //console.log(this.ellipseLineIntersection(node.height,node.width,lineSlope))
    const intersections = this.ellipseLineIntersection(node.height,node.width,lineSlope);
    const intersectionsMPI = this.ellipseLineIntersection(node.height,node.width,this.rotateSlope90Degrees(lineSlope).minus90);
    const intersectionsPPI = this.ellipseLineIntersection(node.height,node.width,this.rotateSlope90Degrees(lineSlope).plus90);
    const x1 = intersectionsMPI[0].x  
    const y1 = intersectionsMPI[0].y 

    //const xc1 = intersections[0].x-intersectionsMPI[0].x
    //const yc1 = intersections[0].y

    const xc2 = intersections[0].x + xlineChild
    const yc2 = intersections[0].y +xLineParent

    const x2 = lineSlope * yc2 *2 + xlineChild
    const y2 = lineSlope * xc2 *2 +xLineParent
    //console.log(`M ${x1},${y1} C ${0},${0} ${xc2},${yc2} ${x2},${y2}`)
    console.log(`M ${x1},${y1}  ${xlineChild}`)
    //return  `M ${x1},${y1} C ${x1*v},${y1*v} ${x2*v},${y2*v} ${x2},${y2}`
    /*//then we find the coord where the rect intersect the ellipse 
    const x1 = this.calculateEllipseX(node.width/2,node.height/2,(node.height/2))
    const y1 = this.calculateEllipseY(node.width/2,node.height/2,(node.width/2))

    const x2 = node.width/2 + node.x
    const y2 = node.height/2 + node.y*/

    /*const c1x =
    const c1y =
    const c2x =
    const c2y =*/
/*
    if (!x1 || !y1 || !x2 || !y2 ) return `M ${x1},${y1} C ${x1},${y1} ${x2},${y2} ${x2},${y2}`;
    const v=1.3
    return  `M ${x1},${y1} C ${x1*v},${y1*v} ${x2*v},${y2*v} ${x2},${y2}`
    //d="M 20,100 C 100,0 200,200 280,100"
    //d="M x1,y1 C c1x,c1y c2x,c2y x2,y2"*/
  }

  calculateEllipseX(w: number, h: number, y: number): number {
    return Math.sqrt(w * w - (y * y * w * w) / (h * h));
  }

  calculateEllipseY(w: number, h: number, x: number): number {
    return Math.sqrt(h * h - (x * x * h * h) / (w * w));
  }

  ellipseLineIntersection(a: number, b: number, m: number): { x: number; y: number }[] {
    // a is semi-major axis
    // b is semi-minor axis
    const denominator = b*b + m*m*a*a;
    const x = Math.sqrt(a*a * b*b / denominator);
    const y = m * x;

    return [
      // Access first intersection point
      { x: x, y: y },
      { x: -x, y: -y }
    ];
  }

  rotateSlope90Degrees(m: number ): { plus90: number , minus90: number  } {
    if (m === 0) {
      // horizontal line -> rotated slopes vertical (undefined)
      return { plus90: 0, minus90: 0 };
    }
    if (m === undefined) {
      // vertical line -> rotated slopes horizontal (0)
      return { plus90: 0, minus90: 0 };
    }
    const rotatedSlope = -1 / m;
    return { plus90: rotatedSlope, minus90: rotatedSlope };
  }

}

/*
  getLineCoordinatesTest() {
    return { x1:0, y1: 100, x2: document.documentElement.clientWidth, y2: 100,
       xw1:0, yw1: 110, xw2: window.innerWidth, yw2: 110
     };
  }

<line         
    [attr.x1]="getLineCoordinatesTest().x1"
    [attr.y1]="getLineCoordinatesTest().y1"
    [attr.x2]="getLineCoordinatesTest().x2"
    [attr.y2]="getLineCoordinatesTest().y2"
    stroke="black" 
    stroke-width="3" />

    <line         
    [attr.x1]="getLineCoordinatesTest().xw1"
    [attr.y1]="getLineCoordinatesTest().yw1"
    [attr.x2]="getLineCoordinatesTest().xw2"
    [attr.y2]="getLineCoordinatesTest().yw2"
    stroke="black" 
    stroke-width="3" />

    <line         
    x1="50"
    y1="50"
    x2="100"
    y2="100"
    stroke="black" 
    stroke-width="3" />

           <line         
                [attr.x1]="0"
                [attr.y1]="nodesMapToArray[0].y"
                [attr.x2]="nodesMapToArray[0].x"
                [attr.y2]="nodesMapToArray[0].y"
                stroke="black" 
                stroke-width="3" />
            <line         
                [attr.x1]="nodesMapToArray[0].x"
                [attr.y1]="0"
                [attr.x2]="nodesMapToArray[0].x"
                [attr.y2]="nodesMapToArray[0].y"
                stroke="black" 
                stroke-width="3" />


                 <div style="position:fixed;top:300px;left:300px;border:1px solid black;width:100px;height: 100px;"></div>
    <div style="position:fixed;top:400px;left:800px;border:1px solid black;width:100px;height: 100px;"></div>


    <div style="position:fixed;left:300px;top:500px;border:1px solid black;width:200px;height: 200px;"></div>
    <div style="position:fixed;left:800px;top:600px;border:1px solid black;width:200px;height: 200px;"></div>


        <path 
            [attr.d]="`M 500,500 C 500,600 800,700 800,600`"  
            stroke="Blue" 
            stroke-width="3" 
            fill="transparent"/>
        <path 
            [attr.d]="`M 500,700 C 500,600 800,700 800,800`" 
            stroke="cyan" 
            stroke-width="3" 
            fill="transparent"/>

        <path 
            [attr.d]="`M 400,100 C 400,150 400,150 500,150`"  
            stroke="red" 
            stroke-width="3" 
            fill="transparent"/>


            https://www.desmos.com/calculator/rfdr5ffbxd
*/