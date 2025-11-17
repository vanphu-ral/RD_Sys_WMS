import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChuyenKhoService } from '../service/chuyen-kho.service.component';
export interface ScannedItem {
  productId: number;
  inventoryCode: string;
  serialPallet: string;
  quantity: number;
  originalQuantity: number;
  productName?: string;
  scanTime?: string;
  warehouse: string;
}

@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './scan-detail.component.html',
  styleUrl: './scan-detail.component.scss',
})
export class ScanDetailComponent implements OnInit {
  id: number | undefined;
  currentPage = 1;
  totalPages = 9;
  //bien scan
  scanPallet: string = '';
  scanLocation: string = '';

  displayedColumns: string[] = [
    'stt',
    'productId',
    'productName',
    // 'inventoryCode',
    'serialPallet',
    'quantity',
    'scanTime',
    'warehouse',
  ];
  total_quantity: number = 1;
  scannedList: ScannedItem[] = [];
  selectedMode: 'pallet' | 'thung' | null = null;
  globalQuantity: number | null = null;
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  requestId: any;
  detailList: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private chuyenKhoService: ChuyenKhoService
  ) { }
  ngOnInit(): void {
    const state = history.state;
    this.requestId = state.requestId;
    this.detailList = state.detailList || [];
  }
  onSelectMode(mode: 'pallet' | 'thung') {
    this.selectedMode = mode;
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  onPalletScanEnter() {
    // chuyển focus sang input location
    this.locationInput?.nativeElement?.focus();
  }

  applyGlobalQuantity(): void {
    if (this.globalQuantity == null || this.globalQuantity < 0) return;

    this.scannedList.forEach((item) => {
      item.quantity = this.globalQuantity!;
    });
  }

  onLocationScanEnter(): void {
    if (!this.scanPallet || !this.scanLocation) return;

    const identifier = this.selectedMode === 'pallet' ? this.scanPallet : this.scanLocation;

    this.chuyenKhoService.getInventoryByIdentifier(identifier).subscribe({
      next: (res) => {
        const now = new Date();
        const formattedTime = now.toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        const newItem: ScannedItem = {
          productId: res.id,
          inventoryCode: res.identifier,
          serialPallet: res.serial_pallet,
          quantity: res.quantity,
          originalQuantity: res.initial_quantity,
          productName: res.material_name || res.name || 'Không xác định',
          scanTime: formattedTime,
          warehouse: this.scanLocation,
        };

        this.scannedList = [...this.scannedList, newItem];
        this.scanPallet = '';
        this.scanLocation = '';
        setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
      },
      error: (err) => {
        console.error('Lỗi khi lấy thông tin inventory:', err);
        this.snackBar.open('Không tìm thấy thông tin pallet/thùng!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }




  onPageChange(page: number): void {
    this.currentPage = page;
    // Load data for specific page
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.onPageChange(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.onPageChange(this.currentPage);
    }
  }

  //lưu thông tin scan
  submitScan(): void {
    if (this.scannedList.length === 0) {
      this.snackBar.open('Chưa có dữ liệu scan để gửi!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    const payload = {
      scan_details: this.scannedList.map((item) => {
        const dispatched = item.originalQuantity - item.quantity;

        return {
          products_in_iwtr_id: item.productId,
          inventory_identifier: item.inventoryCode,
          serial_pallet: item.serialPallet,
          quantity_dispatched: dispatched >= 0 ? dispatched : 0, // ✅ không âm
          scan_time: new Date().toISOString().slice(0, 19), // "2025-11-08T03:28:01"
          scan_by: 'admin',
        };
      }),
    };

    this.chuyenKhoService.submitScan(this.requestId, payload).subscribe({
      next: () => {
        this.snackBar.open('Lưu thông tin scan thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
        setTimeout(() => {
          this.router.navigate([
            '/kho-thanh-pham/chuyen-kho-noi-bo/detail/',
            this.requestId,
          ]);
        }, 3000);
        // this.router.navigate(['/kho-thanh-pham/chuyen-kho-noi-bo']);
      },
      error: (err) => {
        console.error('Lỗi khi gửi scan:', err);
        this.snackBar.open('Lỗi khi gửi dữ liệu scan!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  back(): void {
    this.router.navigate([
      '/kho-thanh-pham/chuyen-kho-noi-bo/detail/',
      this.requestId,
    ]);
  }
}
