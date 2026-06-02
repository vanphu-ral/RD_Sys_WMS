import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

export interface Product {
  id: string;
  name: string;
  code: string;
  customer: string;
  industry: string;
  totalQuantity: number;
  unit: string;
}

export interface PackageItem {
  barcode: string;
  productName: string;
  stackQuantity: number;
}

@Component({
  selector: 'app-split-management',
  templateUrl: './split-management.component.html',
  styleUrls: ['./split-management.component.scss'],
  standalone: false
})
export class SplitManagementComponent {
  currentStep: 'scan' | 'configure' | 'packing' | 'complete' = 'scan';
  scannedProduct: Product | null = null;
  palletId: string = '';
  packageItems: PackageItem[] = [];
  constructor(
    private router: Router,
  ) { }
  onProductScanned(product: Product) {
    this.scannedProduct = product;
    this.currentStep = 'configure';
  }

  onPackageConfigured(data: { productQuantity: number; boxQuantity: number; storageLocation: string; note: string }) {
    this.currentStep = 'packing';
    this.palletId = this.generatePalletId();
  }

  onPackageAdded(item: PackageItem) {
    this.packageItems.push(item);
  }

  onPackageRemoved(index: number) {
    this.packageItems.splice(index, 1);
  }

  onComplete() {
    this.currentStep = 'complete';
  }

  onBackToScan() {
    this.currentStep = 'scan';
    this.scannedProduct = null;
    this.packageItems = [];
    this.palletId = '';
  }
  onBack() {
    this.router.navigate(
      ['kho-thanh-pham/quan-ly-ma-vach'],
    );
  }
  private generatePalletId(): string {
    return 'P' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }

}