import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProduitService } from '../../service/produit.service';
import { Produit } from '../../model/produit/produit';

@Component({
  selector: 'app-produit',
  imports: [CommonModule],
  templateUrl: './produit.component.html',
  styleUrl: './produit.component.css'
})
export class ProduitComponent implements OnInit {
  produits: Produit[] = [];
  loading: boolean = true;
  error: string | null = null;

  constructor(private produitService: ProduitService) {}

  ngOnInit(): void {
    this.loadProduits();
  }

  async loadProduits(): Promise<void> {
    try {
      this.loading = true;
      this.produits = await this.produitService.findAll();
    } catch (err) {
      this.error = 'Erreur lors du chargement des produits';
      console.error(err);
    } finally {
      this.loading = false;
    }
  }
}
