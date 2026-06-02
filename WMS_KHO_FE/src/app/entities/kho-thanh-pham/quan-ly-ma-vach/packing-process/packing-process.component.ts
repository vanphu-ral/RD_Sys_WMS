import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PackageItem } from '../split-main-component/split-management.component'; 

@Component({
  selector: 'app-packing-process',
  templateUrl: './packing-process.component.html',
  styleUrls: ['./packing-process.component.scss'],
  standalone: false
})
export class PackingProcessComponent {
  @Input() palletId!: string;
  @Input() packageItems: PackageItem[] = [];
  @Output() packageAdded = new EventEmitter<PackageItem>();
  @Output() packageRemoved = new EventEmitter<number>();
  @Output() complete = new EventEmitter<void>();

  scanInput: string = '';

  get totalCases(): number {
    return this.packageItems.length;
  }

  get totalBoxes(): number {
    return 0;
  }

  onScan() {
    if (this.scanInput.trim()) {
      const newItem: PackageItem = {
        barcode: this.scanInput,
        productName: 'Đèn LED Downlight AT58 8W',
        stackQuantity: 5
      };
      this.packageAdded.emit(newItem);
      this.scanInput = '';
    }
  }

  onInputKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onScan();
    }
  }

  onRemoveItem(index: number) {
    this.packageRemoved.emit(index);
  }

  onComplete() {
    this.complete.emit();
  }

  onNext() {
    console.log('Next action');
  }
}