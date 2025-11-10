export interface NodeDataModel {
  id: number;
  parentNodeId: number;
  x:number;
  y:number;
  width:number;
  height:number;
  title: string; 
  color: string;
  opacity?: number;
  titleMinimized?: boolean;
  contentMinimized?: boolean;
  locked?: boolean;
  text?: string ;
  [key: string]: number | string | undefined | boolean; // Allow indexing by string keys
}