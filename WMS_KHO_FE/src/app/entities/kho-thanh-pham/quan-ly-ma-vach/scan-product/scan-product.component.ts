import { Component, EventEmitter, Output } from '@angular/core';
import { Product } from '../split-main-component/split-management.component';

@Component({
  selector: 'app-scan-product',
  templateUrl: './scan-product.component.html',
  styleUrls: ['./scan-product.component.scss'],
  standalone: false
})
export class ScanProductComponent {
  @Output() productScanned = new EventEmitter<Product>();
  
  scanInput: string = '';
  selectedTab: number = 0;

  onScan() {
    if (this.scanInput!.trim()) {
      const mockProduct: Product = {
        id: '251112160001A',
        name: 'Đèn LED Downlight AT58 90/8W 6500K (G)',
        code: '251112160001A',
        customer: 'Yankon',
        industry: 'SMART',
        totalQuantity: 100,
        unit: 'Cái'
      };
      this.productScanned.emit(mockProduct);
    }
  }

  onInputKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onScan();
    }
  }

  onCameraClick() {
    console.log('Open camera scanner');
  }
}