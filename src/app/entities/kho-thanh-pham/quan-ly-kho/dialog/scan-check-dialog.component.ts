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
import { HttpClient } from '@angular/common/http';
import { QuanLyKhoService } from '../service/quan-ly-kho.service.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
    MatProgressBarModule,
  ],
})
export class ScanCheckDialogComponent implements OnInit {
  isPalletMode = true;
  mode: 'check' | 'update' | 'transfer' = 'check';
  selectedScanMode: 'pallet' | 'box' | null = null;
  isInfoVisible = false;
  isBoxMode = !this.isPalletMode;

  //loader
  isLoading = false;

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
    maSanPham: '',
    maThung: '',
    capNhatBoi: '',
    tenSanPham: '',
    location: '',
    scanBoi: '',
    tenKhachHang: '',
    area: '',
    soLuongGoc: '',
    maKhachHang: '',
    trangThai: '',
    soLuongHienTai: '',
    maPallet: '',
    ngayCapNhat: '',
    po: '',
    lot: '',
    partNumber: '',
    ghiChu: '',
    ngaySanXuat: '',
    hanSuDung: '',
  };
  locations: { id: number; code: string }[] = [];
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  constructor(
    public dialogRef: MatDialogRef<ScanCheckDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private snackBar: MatSnackBar,
    private http: HttpClient,
    private quanLyKhoService: QuanLyKhoService
  ) {}

  ngOnInit(): void {
    this.mode = this.data.mode || 'check';
    this.updatedQuantity = parseInt(this.productInfo.soLuongHienTai);
    if (this.mode === 'transfer') {
      this.quanLyKhoService.getLocations().subscribe({
        next: (data) => {
          this.locations = data;
        },
        error: (err) => {
          console.error('Lỗi khi lấy danh sách kho:', err);
          this.snackBar.open('Không lấy được danh sách kho!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        },
      });
    }
  }

  fetchProductInfo(identifier: string): void {
    this.quanLyKhoService.getInventoryByIdentifier(identifier).subscribe({
      next: (res) => {
        this.productInfo = {
          maSanPham: res.identifier,
          maThung: res.serial_pallet,
          capNhatBoi: res.updated_by,
          tenSanPham: res.material_name,
          location: `Location #${res.location_id}`,
          scanBoi: res.updated_by,
          tenKhachHang: '',
          area: '',
          soLuongGoc: res.initial_quantity?.toString(),
          maKhachHang: res.vendor,
          trangThai: res.calculated_status,
          soLuongHienTai: res.available_quantity?.toString(),
          maPallet: res.serial_pallet,
          ngayCapNhat: new Date(res.updated_date).toLocaleDateString(),
          po: res.po,
          lot: res.lot,
          partNumber: res.part_number,
          ghiChu: res.comments,
          ngaySanXuat: new Date(res.manufacturing_date).toLocaleDateString(),
          hanSuDung: new Date(res.expiration_date).toLocaleDateString(),
        };

        this.isInfoVisible = true;
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Lỗi khi lấy thông tin sản phẩm:', err);
        this.snackBar.open('Không tìm thấy thông tin sản phẩm!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  //cap nhat ton
  onUpdateQuantity(): void {
    if (
      !this.palletScan ||
      !this.updatedQuantity ||
      this.updatedQuantity <= 0
    ) {
      this.snackBar.open('Vui lòng nhập mã và số lượng tồn hợp lệ!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    const payload = {
      available_quantity: this.updatedQuantity,
      inventory_identifier: this.palletScan,
      updated_by: 'admin',
    };

    this.quanLyKhoService.updateInventoryQuantity(payload).subscribe({
      next: () => {
        this.snackBar.open('Cập nhật tồn kho thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
        this.dialogRef.close({ updated: true });
      },
      error: (err) => {
        console.error('Lỗi cập nhật tồn kho:', err);
        this.snackBar.open('Lỗi khi cập nhật tồn kho!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }
  //chuyen kho
  onTransferSubmit(): void {
    if (this.scannedItems.length === 0) return;

    for (const item of this.scannedItems) {
      const locationObj = this.locations.find(
        (loc) =>
          loc.code.trim().toLowerCase() === item.location.trim().toLowerCase()
      );

      if (!locationObj) {
        this.snackBar.open(
          `Không tìm thấy mã kho cho "${item.location}"`,
          'Đóng',
          {
            duration: 3000,
            panelClass: ['snackbar-error'],
          }
        );
        continue;
      }

      const payload = {
        location_id: locationObj.id,
        inventory_identifier: item.code,
        updated_by: item.scannedBy,
      };

      this.quanLyKhoService.updateInventoryLocation(payload).subscribe({
        next: () => {
          console.log(`Đã chuyển kho cho ${item.code}`);
        },
        error: (err) => {
          console.error(`Lỗi chuyển kho cho ${item.code}:`, err);
          this.snackBar.open(`Lỗi chuyển kho cho ${item.code}`, 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        },
      });
    }

    this.snackBar.open('Đã gửi yêu cầu chuyển kho!', 'Đóng', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });

    this.dialogRef.close({ transferred: true });
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
    if (!this.palletScan) return;
    this.isLoading = true;
    if (this.mode === 'check' || this.mode === 'update') {
      this.fetchProductInfo(this.palletScan);
    }

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
      this.selectedScanMode = 'pallet';
    }

    this.isInfoVisible = true;
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
    if (this.mode === 'update') {
      this.onUpdateQuantity();
    }

    if (this.mode === 'transfer') {
      this.onTransferSubmit();
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
