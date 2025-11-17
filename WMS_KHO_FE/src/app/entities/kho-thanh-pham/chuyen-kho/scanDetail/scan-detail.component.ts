import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChuyenKhoService } from '../service/chuyen-kho.service.component';

export interface ScannedItem {
  id?: number;
  productId: number;
  inventoryCode: string;
  serialPallet: string;
  quantity: number;
  originalQuantity: number;
  productName?: string;
  scanTime?: string;
  warehouse: string;
  confirmed?: boolean;
}

export interface DetailItem {
  id: number;
  internal_warehouse_transfer_requests_id: number;
  product_code: string;
  product_name: string;
  total_quantity: number;
  DVT: string;
  scanned_quantity?: number;
  status?: 'pending' | 'partial' | 'completed';
}

@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './scan-detail.component.html',
  styleUrl: './scan-detail.component.scss',
})
export class ScanDetailComponent implements OnInit {
  requestId: number | undefined;
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
  detailList: DetailItem[] = [];
  selectedMode: 'pallet' | 'thung' | null = null;
  globalQuantity: number | null = null;
  
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private chuyenKhoService: ChuyenKhoService
  ) {}

  ngOnInit(): void {
    const state = history.state;
    this.requestId = state.requestId || this.route.snapshot.params['id'];
    
    if (this.requestId) {
      this.loadDetailList();
      this.loadScannedData();
    }
  }

  // Load danh sách chi tiết sản phẩm cần xuất
  loadDetailList(): void {
    this.chuyenKhoService.getTransferItemsById(this.requestId!).subscribe({
      next: (res) => {
        this.detailList = res.map(item => ({
          ...item,
          scanned_quantity: 0,
          status: 'pending'
        }));
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách chi tiết:', err);
        this.snackBar.open('Không thể tải danh sách sản phẩm!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  // Load dữ liệu đã scan trước đó
  loadScannedData(): void {
    this.chuyenKhoService.getScannedData(this.requestId!).subscribe({
      next: (res) => {
        this.scannedList = res.map((item: any) => ({
          id: item.id,
          productId: item.product_in_iwtr_id,
          inventoryCode: item.inventory_identifier,
          serialPallet: item.serial_pallet,
          quantity: item.quantity_dispatched,
          originalQuantity: item.quantity_dispatched,
          scanTime: this.formatDateTime(item.scan_time),
          warehouse: item.new_location_id || 'N/A',
          confirmed: item.confirmed,
        }));
        
        // Cập nhật trạng thái cho detailList
        this.updateDetailStatus();
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu scan:', err);
      },
    });
  }

  onSelectMode(mode: 'pallet' | 'thung'): void {
    this.selectedMode = mode;
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  onPalletScanEnter(): void {
    this.locationInput?.nativeElement?.focus();
  }

  applyGlobalQuantity(): void {
    if (this.globalQuantity == null || this.globalQuantity < 0) return;

    this.scannedList.forEach((item) => {
      item.quantity = this.globalQuantity!;
    });
  }

  onLocationScanEnter(): void {
    if (!this.scanPallet || !this.scanLocation) {
      this.snackBar.open('Vui lòng nhập đầy đủ thông tin scan!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    // Kiểm tra mode scan
    if (this.selectedMode === 'pallet') {
      this.scanPalletMode();
    } else if (this.selectedMode === 'thung') {
      this.scanThungMode();
    }
  }

  // Scan mode Pallet - lấy tất cả thùng trong pallet
  
  scanPalletMode(): void {
    this.chuyenKhoService.scanPallet(this.scanPallet).subscribe({
      next: (inventories) => {
        if (!inventories || inventories.length === 0) {
          this.snackBar.open('Không tìm thấy thùng nào trong pallet này!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-warning'],
          });
          return;
        }

        // Kiểm tra và thêm từng thùng
        inventories.forEach((inventory: any) => {
          this.addScannedItem(inventory);
        });

        this.clearScanInputs();
      },
      error: (err) => {
        console.error('Lỗi khi scan pallet:', err);
        this.snackBar.open('Không tìm thấy pallet này!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  // Scan mode Thùng - lấy thông tin 1 thùng
  scanThungMode(): void {
    this.chuyenKhoService.getInventoryByIdentifier(this.scanPallet).subscribe({
      next: (inventory) => {
        this.addScannedItem(inventory);
        this.clearScanInputs();
      },
      error: (err) => {
        console.error('Lỗi khi scan thùng:', err);
        this.snackBar.open('Không tìm thấy thùng này!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  // Thêm item đã scan vào danh sách
  addScannedItem(inventory: any): void {
    // Kiểm tra xem mã này đã được scan chưa
    const existingItem = this.scannedList.find(
      (item) => item.inventoryCode === inventory.identifier
    );

    if (existingItem) {
      this.snackBar.open('Mã này đã được scan trước đó!', 'Đóng', {
        duration: 2000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    // Kiểm tra mã có trong danh sách detail không
    const detailItem = this.detailList.find(
      (item) => item.product_code === inventory.sap_code
    );

    if (!detailItem) {
      this.snackBar.open('Mã sản phẩm không nằm trong yêu cầu chuyển kho!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    const now = new Date();
    const formattedTime = this.formatDateTime(now.toISOString());

    const newItem: ScannedItem = {
      productId: detailItem.id,
      inventoryCode: inventory.identifier,
      serialPallet: inventory.serial_pallet,
      quantity: inventory.quantity,
      originalQuantity: inventory.initial_quantity,
      productName: inventory.name || detailItem.product_name,
      scanTime: formattedTime,
      warehouse: this.scanLocation,
      confirmed: false,
    };

    this.scannedList = [...this.scannedList, newItem];
    this.updateDetailStatus();

    this.snackBar.open('Scan thành công!', 'Đóng', {
      duration: 2000,
      panelClass: ['snackbar-success'],
    });
  }

  // Cập nhật trạng thái cho detail list
  updateDetailStatus(): void {
    this.detailList.forEach((detail) => {
      const scannedItems = this.scannedList.filter(
        (scan) => scan.productId === detail.id
      );
      
      const totalScanned = scannedItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      
      detail.scanned_quantity = totalScanned;
      
      if (totalScanned === 0) {
        detail.status = 'pending';
      } else if (totalScanned < detail.total_quantity) {
        detail.status = 'partial';
      } else {
        detail.status = 'completed';
      }
    });
  }

  clearScanInputs(): void {
    this.scanPallet = '';
    this.scanLocation = '';
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

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

  // Lưu thông tin scan
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
        products_in_IWTR_id: item.productId,
        inventory_identifier: item.inventoryCode,
        serial_pallet: item.serialPallet,
        quantity_dispatched: item.quantity,
        scan_time: new Date().toISOString().slice(0, 19),
        scan_by: 'admin', // TODO: Lấy từ user hiện tại
      })),
    };

    this.chuyenKhoService.submitScan(this.requestId!, payload).subscribe({
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
        }, 1500);
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