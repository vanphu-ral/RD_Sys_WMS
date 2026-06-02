import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../split-main-component/split-management.component'; 

@Component({
  selector: 'app-package-config',
  templateUrl: './package-config.component.html',
  styleUrls: ['./package-config.component.scss'],
  standalone: false
})
export class PackageConfigComponent {
  @Input() product!: Product;
  @Output() packageConfigured = new EventEmitter<{
    productQuantity: number;
    boxQuantity: number;
    storageLocation: string;
    note: string;
  }>();
  @Output() back = new EventEmitter<void>();

  productQuantity: number = 0;
  boxQuantity: number = 0;
  storageLocation: string = '';
  note: string = '';

  onPackage() {
    this.packageConfigured.emit({
      productQuantity: this.productQuantity,
      boxQuantity: this.boxQuantity,
      storageLocation: this.storageLocation,
      note: this.note
    });
  }

  onBack() {
    this.back.emit();
  }
}