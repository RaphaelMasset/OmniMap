import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NodeDataModel } from './node-data.model';
import * as CONST from '../model_service_utils/const';
import { Line } from '../model_service_utils/Line';

@Injectable({ providedIn: 'root' })
export class NodeStoreService {
  private nodesMap = new Map<number, NodeDataModel>();
  //BehaviorSubject Holds current value - Emits new values to all current subscribers when .next() is called. 
  //BehaviorSubject Can be used as both an Observable (to subscribe) and an Observer (to push new data).
  private nodesMapSubject = new BehaviorSubject<Map<number, NodeDataModel>>(this.nodesMap);
  
  public readonly originNode: NodeDataModel = this.createAddAndReturnNewNode({ id: 0, parentNodeId: -1, title: 'origin'});

  //store the lsit of hidden nodes
  private listOfHiddenNode: number[] = [];

  //pour exposer un BehaviorSubject  uniquement en tant qu’Observable.
  nodes$ = this.nodesMapSubject.asObservable();
  private selectedNodeSubject =new BehaviorSubject<CONST.SelectedNodeInfo | null>(null);
  selectedNode$ = this.selectedNodeSubject.asObservable();

  public scale = 1;


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

  assignNewParentToNode(nodeId: number, newParentNodeId: number){
    if (nodeId == newParentNodeId || nodeId == 0) return; // Prevent setting itself as parent
    const nodeToMod = this.nodesMap.get(nodeId);
    if (!nodeToMod) return;
    const actualParent = this.nodesMap.get(nodeToMod.parentNodeId);
    if (!actualParent) return;
    const newParent = this.nodesMap.get(newParentNodeId);
    if (!newParent) return;

    nodeToMod.parentNodeId = newParentNodeId;
    this.emitObservableNodesMap();
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
      nodeMinimized: partial.nodeMinimized ?? false,
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
  


  
  // Call this when a node is clicked or when hidden tree is updated
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
  getSelectedNodeSnapshot(): CONST.SelectedNodeInfo | null {
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
    const siblings = this.getSiblingsByParent(parentNode.id);
    const pos = this.getNewSiblingPosition(parentNode, siblings);
    
    const newNode: NodeDataModel = this.createAddAndReturnNewNode({
      id: newNodeId,
      parentNodeId: parentNode.id,
      x: pos.x,
      y: pos.y,
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

  buildTree(rootId: number, maxDepth: number = 6): CONST.NodeTree | null {
    const rootNode = this.nodesMap.get(rootId);
    if (!rootNode) return null;
  
    const buildRecursively = (nodeId: number, currentDepth: number = 0): CONST.NodeTree => {
      const node = this.nodesMap.get(nodeId)!;
      // Si on atteint le niveau 7 → on tronque
      if (currentDepth >= maxDepth) {
        return {
          id: node.id,  // ID spécial pour tronqué
          title: "...",  // ✅ "..." au lieu du titre
          children: [],  // Pas d'enfants
          isTruncated: true  // Flag pour styler différemment
        };
      }
      
      const childrenNodeIds = Array.from(this.nodesMap.values())
        .filter(n => n.parentNodeId === nodeId)
        .map(n => n.id);
  
      const children = childrenNodeIds.map(childId => 
        buildRecursively(childId, currentDepth + 1)
      );
  
      return {
        id: node.id,
        title: node.title,
        children,
        isTruncated: false
      };
    };
  
    return buildRecursively(rootId, 0);
  }

  getSiblingsByParent(parentId: number): NodeDataModel[] {
    return this.getCurrentNodesArray().filter(node => node.parentNodeId === parentId);
  }

  getNewSiblingPosition(
    parent: NodeDataModel,
    siblings: NodeDataModel[]
  ): { x: number; y: number } {
  
    const cx = parent.x + parent.width / 2;
    const cy = parent.y + parent.height / 2;
  
    // Distance de base : bien dehors du parent
    const baseDist =
      Math.sqrt(parent.width * parent.width + parent.height * parent.height) + 20;
  
    // Angle de base: 45° = bas‑droite
    const baseAngle = 45;
  
    // Chaque sibling prend 18° de plus dans le sens trigo
    const step = 18;
    const index = siblings.length;           // 0 pour le 1er, 1 pour le 2e, etc.
    const angle = (baseAngle + index * step) % 360;
  
    // Distance qui augmente un peu avec le nombre de siblings
    const dist = baseDist * Math.pow(1.02, index); // +2% par sibling
  
    const rad = (angle * Math.PI) / 180;
    const dx = dist * Math.cos(rad);  // x vers la droite
    const dy = dist * Math.sin(rad);  // y vers le bas (sens trigo OK)
  
    const x = cx + dx - parent.width / 2;
    const y = cy + dy - parent.height / 2;
  
    return { x, y };
  }

  /**
   * get all node chain from given to origin
   * @param nodeId 
   * @returns 
   */
  getParentChain(nodeId: number): NodeDataModel[] {
    const chain: NodeDataModel[] = [];
    let current = this.nodesMap.get(nodeId);
  
    while (current) {
      chain.push(current);
      if (current.parentNodeId === -1 || current.parentNodeId === current.id) {
        break; // reached origin or invalid loop
      }
      current = this.nodesMap.get(current.parentNodeId);
    }
  
    return chain; // [child, parent, grandparent, ..., origin]
  }

  getParentTitlesFromId(id: number): { id: number; title: string }[] {
    return this.getParentChain(id).reverse().map(n => ({ id: n.id, title: n.title }));
  }

  getNodeTitlesContaining(query: string): { id: number; title: string }[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];
  
    return this.getCurrentNodesArray()
      .filter(n => n.title.toLowerCase().includes(q))
      .map(n => ({ id: n.id, title: n.title }));
  }

  moveChildrenOfGivenId(nodeId: number,dx: number, dy: number) {
    let nodeParentTree = this.nodesMap.get(nodeId);

    let listOfNodesToMove: NodeDataModel[] = this.getAllChildren(nodeId);
    //listOfNodesToMove.push(nodeParentTree);
    listOfNodesToMove.forEach( node => {

      node.x += dx;
      node.y += dy;
    })

  }

  getAllChildren(parentId: number): NodeDataModel[] {
    const treelist: NodeDataModel[] = [];
    for (const node of this.getCurrentNodesArray()) {
      if (node.parentNodeId === parentId) {
        treelist.push(node);
        treelist.push(...this.getAllChildren(node.id));
      }
    }
    return treelist;
  }
  
  
}
