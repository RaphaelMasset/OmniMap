export const DEFAULT_MIN_NODE_SIZE = 16;
export const NODE_LINE_TEXT_MARGIN = 60;

export interface NodeTree {
  id: number;
  title: string;
  children: NodeTree[];
  isTruncated?: boolean;  // if depth is > 6
}



export interface SelectedNodeInfo {
  id: number;
  title: string;
  hiddenTree: boolean;
}