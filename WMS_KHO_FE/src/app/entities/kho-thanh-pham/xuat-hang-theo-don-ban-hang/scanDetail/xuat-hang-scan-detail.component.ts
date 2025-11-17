import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { XuatHangTheoDonBanService } from '../service/xuat-hang-theo-don-ban.service.component';

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
  templateUrl: './xuat-hang-scan-detail.component.html',
  styleUrl: './xuat-hang-scan-detail.component.scss',
})
export class ScanDetailXuatHangComponent implements OnInit {
  id: number | undefined;
  currentPage = 1;
  totalPages = 9;
  
  // Biến scan
  scanPallet: string = '';
  scanLocation: string = '';

  displayedColumns: string[] = [
    'stt',
    'productId',
    'productName',
    'serialPallet',
    'quantity',
    'scanTime',
    'warehouse',
  ];
  
  scannedList: ScannedItem[] = [];
  selectedMode: 'pallet' | 'thung' | null = null;
  chuyenKhoId: number | undefined;
  requestId: any;
  detailList: any;
  
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private xuatKhoService: XuatHangTheoDonBanService
  ) {}
  
  ngOnInit(): void {
    const state = history.state;
    this.requestId = state.requestId;
    this.detailList = state.detailList || [];
    
    // Load danh sách đã scan trước đó (nếu có)
    this.loadExistingScans();
  }

  /**
   * Load danh sách scan đã lưu trước đó
   */
  loadExistingScans(): void {
    if (!this.requestId) return;

    this.xuatKhoService.getScanList(this.requestId).subscribe({
      next: (response) => {
        if (response && Array.isArray(response)) {
          this.scannedList = response.map((item: any) => ({
            productId: item.products_in_osr_id,
            inventoryCode: item.inventory_identifier,
            serialPallet: item.serial_pallet,
            quantity: item.quantity_dispatched,
            originalQuantity: item.quantity_dispatched,
            productName: item.product_name || 'N/A',
            scanTime: this.formatScanTime(item.scan_time),
            warehouse: item.inventory_identifier,
          }));
        }
      },
      error: (err) => {
        console.error('Lỗi khi load danh sách scan:', err);
      }
    });
  }

  /**
   * Chọn mode scan (Pallet hoặc Thùng)
   */
  onSelectMode(mode: 'pallet' | 'thung'): void {
    this.selectedMode = mode;
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  /**
   * Xử lý khi nhấn Enter ở input Pallet
   */
  onPalletScanEnter(): void {
    if (!this.scanPallet || !this.scanPallet.trim()) {
      this.snackBar.open('Vui lòng nhập mã pallet/thùng!', 'Đóng', {
        duration: 2000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    // Gọi API để lấy thông tin pallet
    this.xuatKhoService.getPalletInfo(this.scanPallet.trim()).subscribe({
      next: (palletInfo) => {
        if (!palletInfo || !palletInfo.data) {
          this.snackBar.open('Không tìm thấy thông tin pallet/thùng!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          this.scanPallet = '';
          setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
          return;
        }

        // Kiểm tra xem pallet có trong danh sách detail không
        const matched = this.detailList.find(
          (item: any) => item.productCode === palletInfo.data.product_code
        );

        if (!matched) {
          this.snackBar.open('Mã hàng không có trong đơn xuất kho!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          this.scanPallet = '';
          setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
          return;
        }

        // Chuyển focus sang input location
        this.locationInput?.nativeElement?.focus();
      },
      error: (err) => {
        console.error('Lỗi khi lấy thông tin pallet:', err);
        this.snackBar.open('Lỗi khi kiểm tra mã pallet/thùng!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.scanPallet = '';
        setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
      }
    });
  }

  /**
   * Xử lý khi nhấn Enter ở input Location
   */
  onLocationScanEnter(): void {
    if (!this.scanPallet || !this.scanLocation) {
      this.snackBar.open('Vui lòng nhập đầy đủ thông tin!', 'Đóng', {
        duration: 2000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    // Kiểm tra xem đã scan pallet này chưa
    const alreadyScanned = this.scannedList.some(
      (item) => item.serialPallet === this.scanPallet.trim()
    );

    if (alreadyScanned) {
      this.snackBar.open('Mã pallet/thùng này đã được scan!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      this.scanPallet = '';
      this.scanLocation = '';
      setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
      return;
    }

    // Gọi lại API để lấy thông tin đầy đủ
    this.xuatKhoService.getPalletInfo(this.scanPallet.trim()).subscribe({
      next: (palletInfo) => {
        if (!palletInfo || !palletInfo.data) {
          this.snackBar.open('Không tìm thấy thông tin pallet!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          this.resetInputs();
          return;
        }

        const data = palletInfo.data;

        // Tìm sản phẩm trong detail list
        const matched = this.detailList.find(
          (item: any) => item.productCode === data.product_code
        );

        if (!matched) {
          this.snackBar.open('Sản phẩm không có trong đơn xuất!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          this.resetInputs();
          return;
        }

        const now = new Date();
        const formattedTime = this.formatScanTime(now.toISOString());

        const newItem: ScannedItem = {
          productId: matched.id || 0,
          inventoryCode: this.scanLocation.trim(),
          serialPallet: this.scanPallet.trim(),
          quantity: data.quantity || matched.quantity,
          originalQuantity: matched.quantity,
          productName: data.product_name || matched.productName || 'N/A',
          scanTime: formattedTime,
          warehouse: this.scanLocation.trim(),
        };

        this.scannedList = [...this.scannedList, newItem];

        this.snackBar.open('✓ Scan thành công!', '', {
          duration: 1500,
          panelClass: ['snackbar-success'],
        });

        this.resetInputs();
      },
      error: (err) => {
        console.error('Lỗi khi lấy thông tin pallet:', err);
        this.snackBar.open('Lỗi khi xử lý scan!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.resetInputs();
      }
    });
  }

  /**
   * Reset inputs và focus về pallet
   */
  resetInputs(): void {
    this.scanPallet = '';
    this.scanLocation = '';
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  /**
   * Format thời gian scan
   */
  formatScanTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  /**
   * Xử lý phân trang
   */
  onPageChange(page: number): void {
    this.currentPage = page;
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

  /**
   * Lưu thông tin scan
   */
  submitScan(): void {
    if (this.scannedList.length === 0) {
      this.snackBar.open('Chưa có dữ liệu scan để gửi!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    const payload = {
      scan_details: this.scannedList.map((item) => ({
        products_in_osr_id: item.productId,
        inventory_identifier: item.inventoryCode,
        serial_pallet: item.serialPallet,
        quantity_dispatched: item.quantity >= 0 ? item.quantity : 0,
        scan_time: new Date().toISOString().slice(0, 19),
        scan_by: 'admin', // TODO: Lấy từ user đang login
      })),
    };

    this.xuatKhoService.submitScan(this.requestId, payload).subscribe({
      next: () => {
        this.snackBar.open('✓ Lưu thông tin scan thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
        setTimeout(() => {
          this.router.navigate([
            '/kho-thanh-pham/xuat-don-ban-hang/detail/',
            this.requestId,
          ]);
        }, 2000);
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

  /**
   * Quay lại trang detail
   */
  back(): void {
    this.router.navigate([
      '/kho-thanh-pham/xuat-don-ban-hang/detail/',
      this.requestId,
    ]);
  }
}