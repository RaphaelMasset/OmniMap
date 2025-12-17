import { Component,AfterViewInit, Input } from '@angular/core'
import { NodeStoreService } from '../model_service_utils/node-store';

@Component({
  selector: 'app-menu',
  imports: [],
  templateUrl: './menu.html',
  styleUrl: './menu.scss'
})
export class Menu  {
  @Input() menuDim!: {
    top: number,
    right: number,
    width: number,
    height:number
  } ;

  serachTitleList : string[] = [];
  showPopUp = false;
  popupRight = 0;
  popupTop = 0;
  searchText = '';
  searchId = 0;
  popUpText = '';
  constructor(private nodeStoreService: NodeStoreService) {}

  onMenuAction(action: string, event: Event) {
    // close menu on action
    console.log('onMenuAction')
    const input = event.target as HTMLInputElement;
    switch (action) 
    {
      case 'nodeSearch':
        this.tooglePopUp();
        this.popUpText = this.getPopUpTextForNodeSearch();
        break;
      
        case 'treeSearch':
        this.tooglePopUp();
        this.popUpText = this.getPopUpTextForTreeSearch(this.searchId);
        break;
    
        default:
          console.warn('Unknown action, how did you do that?: ', action);      
    }
  }

  tooglePopUp(){
    this.popupRight = this.menuDim.right +5;
    this.popupTop = this.menuDim.height +5;
    this.showPopUp = true;
  }

  onNodeSearchInputChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchText = input.value;
  }

  onTreeSearchInputChange(event: Event) {
    const inputId = event.target as HTMLInputElement;
    let parsedID = parseInt(inputId.value, 10); 
    this.searchId = parsedID;
  }

  getPopUpTextForNodeSearch(): string {
    return this.nodeStoreService
      .getNodeTitlesContaining(this.searchText)
      .map(r => `${r.id}-${r.title}`)
      .join('\n');
  }   

  getPopUpTextForTreeSearch(id: number): string {
    const chain = this.nodeStoreService.getParentTitlesFromId(id);
    return chain
      .map(r => `${r.id}-${r.title}`)
      .join('\n ↓\n');   // arrow only between items
  }

}
