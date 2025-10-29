export interface NodeDataModel {
  id: number;
  parentNodeId: number;
  x:number;
  y:number;
  width:number;
  height:number;
  title: string; 
  color: string;
  text?: string;
  [key: string]: number | string | undefined; // Allow indexing by string keys
}