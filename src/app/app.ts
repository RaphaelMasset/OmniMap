import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { Map } from './map/map.component';


// the decorator add metadata to the App class
// the component decorator receive an object {}
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, Map],  //list of the component i want to use in the maint comp
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('OmniMap');
}
