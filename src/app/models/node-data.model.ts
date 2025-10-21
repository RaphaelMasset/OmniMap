export interface NodeDataModel {
  id: number;
  parentNodeId: number;
  x:number;
  y:number;
  width:number;
  height:number;

  title?: string;
  text?: string;
  color?: string;
}