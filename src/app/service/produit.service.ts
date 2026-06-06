import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import { Produit } from '../model/produit/produit';
import { CreateProduit } from '../model/produit/create-produit';
import { UpdateProduit } from '../model/produit/update-produit';

@Injectable({
  providedIn: 'root',
})
export class ProduitService extends BaseService<
  Produit,
  CreateProduit,
  UpdateProduit
> {
  constructor() {
    super('/api/produits');
  }
}
