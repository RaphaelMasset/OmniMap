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
    
    @Output() csvWriteClicked = new EventEmitter<void>();
    @Output() csvUploadClicked = new EventEmitter<void>();

    constructor() {
        window.addEventListener('nodeClicked', (event: any) => {
            this.lastClickedNodeTitle = event.detail;
            //console.log('nodeClicked received by header')
        });
    }

    downloadCicked(){
        this.csvWriteClicked.emit();
    }
    triggerFileInput(){
        this.csvUploadClicked.emit();
    }

}