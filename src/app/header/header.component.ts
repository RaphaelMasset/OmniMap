// a ts class must be exported so it can be used in other files aswell
import { Component } from '@angular/core'

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

    constructor() {
        window.addEventListener('nodeClicked', (event: any) => {
            this.lastClickedNodeTitle = event.detail;
            console.log('received')
        });
    }

}