import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PackageItem } from '../split-main-component/split-management.component'; 

@Component({
  selector: 'app-packing-complete',
  templateUrl: './packing-complete.component.html',
  styleUrls: ['./packing-complete.component.scss'],
  standalone: false
})
export class PackingCompleteComponent {
  @Input() palletId!: string;
  @Input() packageItems: PackageItem[] = [];
  @Output() newPacking = new EventEmitter<void>();

  get totalCases(): number {
    return this.packageItems.length;
  }

  get totalBoxes(): number {
    return 0;
  }

  onNewPacking() {
    this.newPacking.emit();
  }
}