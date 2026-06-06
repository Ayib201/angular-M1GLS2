import { Routes } from '@angular/router';
import { ProduitComponent } from './components/produit/produit.component';

export const routes: Routes = [
    {
        path: 'produits',
        component: ProduitComponent
    },
    {
        path: '',
        redirectTo: 'produits',
        pathMatch: 'full'
    },
    {
        path: '**',
        redirectTo: 'produits'
    }
];
