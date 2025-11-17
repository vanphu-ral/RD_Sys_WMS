import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-scan-check-dialog',
  templateUrl: './scan-check-dialog.component.html',
  styleUrls: ['./scan-check-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSelectModule,
    MatSlideToggleModule,
  ],
})
export class ScanCheckDialogComponent implements OnInit {
  isPalletMode = true;
  mode: 'check' | 'update' | 'transfer' = 'check';
  selectedScanMode: 'pallet' | 'box' | null = null;
  isInfoVisible = false;
  isBoxMode = !this.isPalletMode;

  palletScan = '';
  locationScan = '';
  targetWarehouse = '';
  updatedQuantity: number | undefined;
  scannedItems: {
    code: string;
    name: string;
    location: string;
    quantity: string;
    scannedAt: string;
    scannedBy: string;
  }[] = [];
  productInfo = {
    maSanPham: 'Req-285875',
    maThung: 'B20250192',
    capNhatBoi: 'Admin',
    tenSanPham: 'Đèn LED chiếu pha 6500K',
    location: 'RD-01',
    scanBoi: 'Admin',
    tenKhachHang: 'Điện tử tự động',
    area: 'RD-Wharehouse',
    soLuongGoc: '10000',
    maKhachHang: 'DTTD',
    trangThai: 'Đã cập nhật',
    soLuongHienTai: '5000',
    maPallet: 'P20250192',
    ngayCapNhat: '31/10/2025',
  };
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  constructor(
    public dialogRef: MatDialogRef<ScanCheckDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.mode = this.data.mode || 'check';
    this.updatedQuantity = parseInt(this.productInfo.soLuongHienTai);
  }
  toggleScanMode(mode: 'pallet' | 'box') {
    this.selectedScanMode = this.selectedScanMode === mode ? null : mode;
    if (this.selectedScanMode) {
      setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
    }
  }
  focusLocationInput() {
    setTimeout(() => this.locationInput?.nativeElement?.focus(), 100);
  }

  onScanComplete(): void {
    this.isInfoVisible = true;

    if (this.mode === 'transfer') {
      const newItem = {
        code: this.palletScan,
        name: this.productInfo.tenSanPham || '',
        quantity: this.productInfo.soLuongHienTai || '',
        location: this.locationScan,
        scannedAt: new Date().toLocaleString(),
        scannedBy: 'Admin',
      };

      this.scannedItems.push(newItem);
      this.palletScan = '';
      this.locationScan = '';
      setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);

      setTimeout(() => {
        this.selectedScanMode = 'pallet'; 
        this.palletInput?.nativeElement?.focus();
      }, 100);
    } else {
      this.isInfoVisible = true;
    }
  }

  removeScannedItem(index: number): void {
    this.scannedItems.splice(index, 1);
  }
  onModeChange(): void {
    console.log('Mode changed:', this.isPalletMode ? 'Pallet' : 'Box');
  }

  selectPalletMode(): void {
    this.isPalletMode = true;
  }

  selectBoxMode(): void {
    this.isPalletMode = false;
  }

  onSave(): void {
    const result = {
      mode: this.mode,
      palletScan: this.palletScan,
      locationScan: this.locationScan,
      updatedQuantity: this.updatedQuantity,
      targetWarehouse: this.targetWarehouse,
    };
    this.dialogRef.close(result);
    this.snackBar.open('Lưu thành công!', 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-success', 'snackbar-position'],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
