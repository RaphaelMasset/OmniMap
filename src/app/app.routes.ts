import { Routes } from '@angular/router';
import { MapComponent } from './map/map.component';

export const routes: Routes = [         // ← RACINE / (OBLIGATOIRE)
  { path: ':anything', component: MapComponent }          // ← Fallback
];
