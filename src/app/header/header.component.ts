// a ts class must be exported so it can be used in other files aswell
import { Component, EventEmitter, Output, ViewChild, ElementRef  } from '@angular/core'
import { CommonModule} from  '@angular/common';

@Component({
    selector: 'map-header',
    standalone : true,
    //use template instead of templateUrl for few line of html that you directly write here
    templateUrl: './header.component.html',
    //use style for writing the css directly here
    styleUrls:['./header.component.css']

})
export class HeaderComponent{
    lastClickedNodeTitle : String = '';
    hiddenChildren : boolean = false;
    
    @Output() csvWriteClicked = new EventEmitter<void>();
    @Output() csvUploadClicked = new EventEmitter<void>();

    constructor() {
        window.addEventListener('nodeClicked', (event: any) => {
            this.lastClickedNodeTitle = event.detail.title;
            this.hiddenChildren = event.detail.hiddenChildren;
            //console.log('nodeClicked received by header')
        });
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