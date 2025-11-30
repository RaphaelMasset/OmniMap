// a ts class must be exported so it can be used in other files aswell
import { Component, EventEmitter, Output, ViewChild, ElementRef, OnInit, OnDestroy  } from '@angular/core'
import { CommonModule} from  '@angular/common';
import { NodeStoreService } from '../model_service_utils/node-store';
import { Subscription } from 'rxjs';
@Component({
    selector: 'map-header',
    standalone : true,
    //use template instead of templateUrl for few line of html that you directly write here
    templateUrl: './header.component.html',
    //use style for writing the css directly here
    styleUrls:['./header.component.css']

})
export class HeaderComponent implements  OnInit, OnDestroy {
    lastClickedNodeTitle : String = '';
    hiddenChildren : boolean = false;
    
    @Output() csvWriteClicked = new EventEmitter<void>();
    @Output() csvUploadClicked = new EventEmitter<void>();
    private sub?: Subscription;

    constructor(private nodeStoreService: NodeStoreService) {
        /*window.addEventListener('nodeClicked', (event: any) => {
            this.lastClickedNodeTitle = event.detail.title;
            this.hiddenChildren = event.detail.hiddenChildren;
            //console.log('nodeClicked received by header')
        });*/
    }

    ngOnInit() {
      this.sub = this.nodeStoreService.selectedNode$.subscribe(info => {
        if (info) {
          this.lastClickedNodeTitle = info.title;
          this.hiddenChildren = info.hiddenTree;
        } else {
          this.lastClickedNodeTitle = '';
          this.hiddenChildren = false;
        }
      });
    }
    
    ngOnDestroy() {
      this.sub?.unsubscribe();
    }

    getext(){
        return `${this.lastClickedNodeTitle} ${this.hiddenChildren?'(Have hidden Children!)':''}`
    }

    downloadCicked(){
        this.csvWriteClicked.emit();
    }
    triggerFileInput(){
        this.csvUploadClicked.emit();
    }

}