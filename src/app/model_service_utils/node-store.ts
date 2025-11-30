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
  private nodesSubject = new BehaviorSubject<Map<number, NodeDataModel>>(this.nodesMap);
  
  //store the lsit of hidden nodes
  private listOfHiddenNode: number[] = [];

  //pour exposer un BehaviorSubject  uniquement en tant qu’Observable.
  nodes$ = this.nodesSubject.asObservable();
  
  // Add or update a node
  upsertNode(node: NodeDataModel): void {
    //new node isntance to avoid "effets de boards", 
    this.nodesMap.set(node.id, { ...node });
    this.emit();
    //copy the Map reference
  }

  // Update partial fields of a node
  updateNode(id: number, patch: Partial<NodeDataModel>): void {
    const node = this.nodesMap.get(id);
    if (!node) return;
    //{ ...node, ...patch } creates a new object by copying all properties from node and then overwriting or adding properties from patch.
    this.nodesMap.set(id, { ...node, ...patch });
    this.emit();
  }

  // Remove a node by id, optionally removing all children recursively
  /*removeNode(id: number, removeChildren: boolean = false): void {
    if (removeChildren) {
      this.recursiveRemoveNodeAndChildren(id);
    }
    this.nodesMap.delete(id);
    this.emit();
  }*/

  removeNode( id: number): void {
    this.nodesMap.delete(id);
    this.emit();
  }

  // Recursive helper to remove children of a node
  recursiveRemoveNodeAndChildren(parentId: number): void {
    for (const node of this.nodesMap.values()) {
      if (node.parentNodeId === parentId) {
        this.recursiveRemoveNodeAndChildren(node.id);
       // this.nodesMap.delete(node.id);
      }
    }
    this.nodesMap.delete(parentId) 
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
      const children = Array.from(this.nodesMap.values())
        .filter(n => n.parentNodeId === node.id);

      return {
        title: node.title,
        children: children.map(buildRec)
      };
    };

    return buildRec(rootNode);
  }

  // Helper to emit changes (create new Map to trigger change detection)
  private emit(): void {
    this.nodesSubject.next(new Map(this.nodesMap));
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
    for (const node of this.nodesMap.values()) {
      if (node.hiddenTree) {
        this.pushAllChildrenNode(list, node.id);
      }
    }
    
    // Remove duplicates and update
    this.listOfHiddenNode = Array.from(new Set(list));
    this.emit(); // Trigger change detection
  }
  
  /**
   * Recursively add all children IDs of given parent to list
   * @param list - Array to populate
   * @param idParent - Parent node ID
   */
  private pushAllChildrenNode(list: number[], idParent: number): void {
    for (const node of this.nodesMap.values()) {
      if (node.parentNodeId === idParent) {
        this.pushAllChildrenNode(list, node.id);
        list.push(node.id);
      }
    }
  }

  private selectedNodeSubject =new BehaviorSubject<SelectedNodeInfo | null>(null);
  selectedNode$ = this.selectedNodeSubject.asObservable();
  
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
  
}
