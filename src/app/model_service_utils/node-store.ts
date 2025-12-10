import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NodeDataModel } from './node-data.model';

interface TreeNode {
  title: string;
  children: TreeNode[];
}

export interface SelectedNodeInfo {
  id: number;
  title: string;
  hiddenTree: boolean;
}

@Injectable({ providedIn: 'root' })
export class NodeStoreService {
  private nodesMap = new Map<number, NodeDataModel>();
  //BehaviorSubject Holds current value - Emits new values to all current subscribers when .next() is called. 
  //BehaviorSubject Can be used as both an Observable (to subscribe) and an Observer (to push new data).
  private nodesMapSubject = new BehaviorSubject<Map<number, NodeDataModel>>(this.nodesMap);
  
  private originNode: NodeDataModel = this.createAddAndReturnNewNode({ id: 0, parentNodeId: -1, title: 'origin' });

  //store the lsit of hidden nodes
  private listOfHiddenNode: number[] = [];

  //pour exposer un BehaviorSubject  uniquement en tant qu’Observable.
  nodes$ = this.nodesMapSubject.asObservable();
  private selectedNodeSubject =new BehaviorSubject<SelectedNodeInfo | null>(null);
  selectedNode$ = this.selectedNodeSubject.asObservable();


  // Add or update a node
  upsertNode(node: NodeDataModel): void {
    //new node isntance to avoid "effets de boards", 
    this.nodesMap.set(node.id, { ...node });
    this.emitObservableNodesMap();
    //copy the Map reference
  }

  // Update partial fields of a node
  updateNode(id: number, patch: Partial<NodeDataModel>): void {
    const node = this.nodesMap.get(id);
    if (!node) return;
    //{ ...node, ...patch } creates a new object by copying all properties from node and then overwriting or adding properties from patch.
    this.nodesMap.set(id, { ...node, ...patch });
    this.emitObservableNodesMap();
  }

  // Get a node snapshot (non-reactive)
  getNodeSnapshot(id: number): NodeDataModel | undefined {
    const node = this.nodesMap.get(id);
    return node ? { ...node } : undefined;
  }

  // Observable of a node by ID, emits updates on changes
  node$(id: number): Observable<NodeDataModel | undefined> {
    return this.nodes$.pipe(
      map(mapState => {
        const node = mapState.get(id);
        return node ? { ...node } : undefined;
      })
    );
  }

  getCurrentMap(): Map<number, NodeDataModel> {
    return this.nodesMap;
  }

  getCurrentNodesArray(): NodeDataModel[] {
    const array = Array.from(this.nodesMap.values());
    return array.length > 0 ? array : [this.originNode];
  }

  // Observable of all nodes with hiddenTree = true
  hiddenNodes$(): Observable<NodeDataModel[]> {
    return this.nodes$.pipe(
      map(mapState => 
        Array.from(mapState.values()).filter(node => node.hiddenTree)
      )
    );
  }

  // Build hierarchical tree of nodes under rootId
  buildTree(rootId: number): TreeNode | null {
    const rootNode = this.nodesMap.get(rootId);
    if (!rootNode) return null;
    const buildRec = (node: NodeDataModel): TreeNode => {
      const nodesArray = this.getCurrentNodesArray()
        .filter(n => n.parentNodeId === node.id);
      return {
        title: node.title,
        children: nodesArray.map(buildRec)
      };
    };
    return buildRec(rootNode);
  }

  // Helper to emit changes (create new Map to trigger change detection)
  private emitObservableNodesMap(): void {
    this.nodesMapSubject.next(new Map(this.nodesMap));
  }

  generateNewId():number{
    let highestId = 0;
    for (const key of this.nodesMap.keys()) {
      if (key > highestId) {
        highestId = key;
      }
    }
    const newNodeId = highestId+1;
    return newNodeId
  }

  /*
  This mehod allow centralizing default parameters assignment
   */
  createAddAndReturnNewNode(partial: Partial<NodeDataModel>): NodeDataModel {
    const newNode: NodeDataModel =  {
      id: partial.id ?? this.generateNewId(),
      parentNodeId: partial.parentNodeId ?? 0,
      x: partial.x ?? 10, 
      y: partial.y ?? 0,
      width: partial.width ?? 100,
      height: partial.height ?? 100,
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
    this.upsertNode(newNode);
    
    return newNode;
  }

  // Getter to return the list (property-like access)
  get hiddenNodeIds(): number[] {
    return this.listOfHiddenNode;
  }

  // Public method to trigger list update
  updateHiddenNodeList(): void {
    const list: number[] = [];
    
    // Find hidden tree roots and collect all their children
    for (const node of this.getCurrentNodesArray()) {
      if (node.hiddenTree) {
        this.pushAllChildrenNodeinGivenList(list, node.id);
      }
    }
    
    // Remove duplicates and update
    this.listOfHiddenNode = Array.from(new Set(list));
    this.emitObservableNodesMap(); // Trigger change detection
  }
  
  /**
   * Recursively add all children IDs of given parent to list
   * @param list - Array to populate
   * @param idParent - Parent node ID
   */
  private pushAllChildrenNodeinGivenList(list: number[], idParent: number): void {
    for (const node of this.getCurrentNodesArray()) {
      if (node.parentNodeId === idParent) {
        this.pushAllChildrenNodeinGivenList(list, node.id);
        list.push(node.id);
      }
    }
  }


  
  // Call this when a node is clicked
  setSelectedNode(id: number): void {
    const node = this.nodesMap.get(id);
    if (!node) {
      this.selectedNodeSubject.next(null);
      return;
    }
  
    this.selectedNodeSubject.next({
      id: node.id,
      title: node.title,
      hiddenTree: node.hiddenTree,
    });
  }
  
  // Optional getter if you need sync access
  getSelectedNodeSnapshot(): SelectedNodeInfo | null {
    return this.selectedNodeSubject.value;
  }

  replaceAll(nodesMap: Map<number, NodeDataModel>): void {
    this.nodesMap = nodesMap;
    this.emitObservableNodesMap(); // notify all subscribers
  }

  clearAll(): void {
    this.nodesMap.clear();
    this.emitObservableNodesMap();
  }

  // Add to NodeStoreService
  addNewChildNode(parentId: number): NodeDataModel {
    const parentNode = this.nodesMap.get(parentId);
    if (!parentNode) return null!;
    
    const newNodeId = this.generateNewId();
    
    const newNode: NodeDataModel = this.createAddAndReturnNewNode({
      id: newNodeId,
      parentNodeId: parentNode.id,
      x: parentNode.x + parentNode.width + 20,
      y: parentNode.y + parentNode.height + 20,
      title: `Node nb ${newNodeId}`,
      color: parentNode.color
    });
    
    return newNode;
  }

  hasChildren(parentId: number): boolean {
    return this.getCurrentNodesArray().some(node => node.parentNodeId === parentId);
  }

  getParentNode(childNode: NodeDataModel): NodeDataModel {
    const parent = this.nodesMap.get(childNode.parentNodeId);
    return parent || childNode;
  }
  

  tryDeleteNode(nodeId: number) { 
    //prevent user from delating the last node if there is only one
    if (nodeId == 0){
      alert('The original node is needed to create new nodes');
      return
    }

    const nodeToDelete = this.getNodeSnapshot(nodeId)!;
  
    if (!nodeToDelete) {
      // if the node dont exist we return an error
      alert('Indexation error, this nodeId does not exist');
      return;
    }

    let userConfirmedNdAndChildDel = false;
    //check if this node exist 
    const hasChildren = this.hasChildren(nodeToDelete.id);
    const userConfirmedNdDel = confirm('Proceeding will erase the current node are you sure ?');
    if (userConfirmedNdDel) {
      //check if the node have children, if yes ask if you want to delate them
      if (hasChildren){
        userConfirmedNdAndChildDel = confirm('Do you also want to delete children of this node ?');
        //only loop if the node have children
        for (const node of this.getCurrentNodesArray()) {
          //if we find children we replace their parent node id with the delated node parent node id or we delate them
          if (node.parentNodeId == nodeId){
            if (userConfirmedNdAndChildDel){
              //this.recursivDeletion(node.id)
              this.recursiveRemoveNodeAndChildren(node.id)
            }
            else{
              this.updateNode(node.id, { 
                parentNodeId: nodeToDelete.parentNodeId 
              });
            }
          }
        }
      }
      //then we delate the targeted node
      this.removeNode(nodeId)
      //this.nodesMap.delete(nodeId)
    //if the user refuse to delate we return null
    } else {
      return
    }
  }

  removeNode( id: number): void {
    this.nodesMap.delete(id);
    this.emitObservableNodesMap();
  }
  
  // Recursive helper to remove children of a node
  recursiveRemoveNodeAndChildren(parentId: number): void {
    for (const node of this.getCurrentNodesArray()) {
      if (node.parentNodeId === parentId) {
        this.recursiveRemoveNodeAndChildren(node.id);
       // this.nodesMap.delete(node.id);
      }
    }
    this.nodesMap.delete(parentId) 
  }
}
