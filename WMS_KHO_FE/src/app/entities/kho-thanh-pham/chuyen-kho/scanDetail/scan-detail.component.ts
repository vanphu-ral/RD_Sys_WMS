import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChuyenKhoService } from '../service/chuyen-kho.service.component';
import { AuthService } from '../../../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';

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
  isNew?: boolean; // Flag để đánh dấu item mới scan (chưa lưu DB)
}

export interface DetailItem {
  id: number;
  internal_warehouse_transfer_requests_id: number;
  product_code: string;
  product_name: string;
  total_quantity: number;
  dvt: string;
  scanned_quantity?: number;
  status?: 'pending' | 'partial' | 'completed';
}

@Component({
  selector: 'app-scan-detail',
  standalone: false,
  templateUrl: './scan-detail.component.html',
  styleUrl: './scan-detail.component.scss',
})
export class ScanDetailComponent implements OnInit {
  // ===== ROUTE PARAMS =====
  requestId: number | undefined;

  // ===== SCAN INPUTS =====
  scanPallet: string = '';
  scanLocation: string = '';
  selectedMode: 'pallet' | 'thung' | null = null;
  globalQuantity: number | null = null;

  // ===== DATA =====
  scannedList: ScannedItem[] = [];
  detailList: DetailItem[] = [];

  // ===== TABLE =====
  displayedColumns: string[] = [
    'stt',
    'productId',
    'productName',
    'serialPallet',
    'quantity',
    'scanTime',
    'warehouse',
  ];

  // ===== PAGINATION =====
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 15, 20];
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  pagedList: any[] = [];

  // ===== UI STATE =====
  isLoading = false;

  // ===== VIEWCHILD =====
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private chuyenKhoService: ChuyenKhoService,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    const state = history.state;
    this.requestId = state.requestId || this.route.snapshot.params['id'];

    if (this.requestId) {
      this.loadDetailList();
      this.loadScannedData();
    }
  }

  // ===== LOAD DETAIL LIST =====
  loadDetailList(): void {
    this.isLoading = true;
    this.chuyenKhoService.getTransferItemsById(this.requestId!).subscribe({
      next: (res) => {
        this.detailList = res.map((item) => ({
          ...item,
          scanned_quantity: 0,
          status: 'pending' as const,
        }));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách chi tiết:', err);
        this.snackBar.open('Không thể tải danh sách sản phẩm!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.isLoading = false;
      },
    });
  }

  // ===== LOAD SCANNED DATA (Đã lưu trong DB) =====
  loadScannedData(): void {
    this.chuyenKhoService.getScannedData(this.requestId!).subscribe({
      next: (res) => {
        this.scannedList = res.map((item: any) => ({
          id: item.id,
          productId: item.products_in_IWTR_id,
          inventoryCode: item.inventory_identifier,
          serialPallet: item.serial_pallet,
          quantity: item.quantity_dispatched,
          originalQuantity: item.quantity_dispatched,
          scanTime: this.formatDateTime(item.scan_time),
          warehouse: item.scan_by || 'N/A',
          confirmed: true,
          isNew: false,
        }));
        this.totalItems = this.scannedList.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);

        this.setPagedData();
        this.updateDetailStatus();
      },
      error: (err) => {
        console.error('Lỗi khi tải dữ liệu scan:', err);
      },
    });
  }
  // ===== SELECT MODE =====
  onSelectMode(mode: 'pallet' | 'thung'): void {
    this.selectedMode = mode;
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  // ===== GET PLACEHOLDER TEXT =====
  getPalletPlaceholder(): string {
    return this.selectedMode === 'pallet' ? 'Scan mã Pallet...' : 'Scan mã Thùng...';
  }

  // ===== ENTER HANDLERS =====
  onPalletScanEnter(): void {
    this.locationInput?.nativeElement?.focus();
  }

  onLocationScanEnter(): void {
    if (!this.selectedMode) {
      this.snackBar.open('Vui lòng chọn mode scan!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    if (!this.scanPallet || !this.scanLocation) {
      this.snackBar.open('Vui lòng nhập đầy đủ thông tin scan!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    if (this.selectedMode === 'pallet') {
      this.scanPalletMode();
    } else {
      this.scanThungMode();
    }
  }

  // ===== SCAN MODE PALLET =====
  scanPalletMode(): void {
    const palletCode = this.scanPallet.trim().toUpperCase();

    this.isLoading = true;
    this.chuyenKhoService.scanPallet(palletCode).subscribe({
      next: (inventories) => {
        if (!inventories || inventories.length === 0) {
          this.snackBar.open('Không tìm thấy thùng nào trong pallet này!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-warning'],
          });
          this.isLoading = false;
          return;
        }

        let addedCount = 0;
        inventories.forEach((inventory: any) => {
          const added = this.addScannedItem(inventory);
          if (added) addedCount++;
        });

        if (addedCount > 0) {
          this.snackBar.open(
            `✓ Đã thêm ${addedCount} thùng từ pallet vào danh sách!`,
            '',
            {
              duration: 2000,
              panelClass: ['snackbar-success'],
            }
          );
        }

        this.clearScanInputs();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi scan pallet:', err);
        this.snackBar.open('Không tìm thấy pallet này trong hệ thống!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.isLoading = false;
      },
    });
  }

  // ===== SCAN MODE THÙNG =====
  scanThungMode(): void {
    const thungCode = this.scanPallet.trim().toUpperCase();

    this.isLoading = true;
    this.chuyenKhoService.getInventoryByIdentifier(thungCode).subscribe({
      next: (inventory) => {
        const added = this.addScannedItem(inventory);

        if (added) {
          this.snackBar.open('✓ Đã thêm thùng vào danh sách!', '', {
            duration: 1500,
            panelClass: ['snackbar-success'],
          });
        }

        this.clearScanInputs();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi scan thùng:', err);
        this.snackBar.open('Không tìm thấy thùng này trong hệ thống!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.isLoading = false;
      },
    });
  }

  // ===== ADD SCANNED ITEM (CHƯA LƯU DB) =====
  addScannedItem(inventory: any): boolean {
    // CHECK TRÙNG MÃ THÙNG
    const existingItem = this.scannedList.find(
      (item) => item.inventoryCode.toUpperCase() === inventory.identifier.toUpperCase()
    );

    if (existingItem) {
      // Đã confirmed → Không cho scan lại
      if (existingItem.confirmed) {
        this.snackBar.open(
          `Thùng ${inventory.identifier} đã được scan và xác nhận trước đó!`,
          'Đóng',
          {
            duration: 3000,
            panelClass: ['snackbar-warning'],
          }
        );
        return false;
      }

      // Chưa confirmed → Cập nhật location
      existingItem.warehouse = this.scanLocation;
      existingItem.scanTime = this.formatDateTime(new Date().toISOString());

      this.snackBar.open(
        `Thùng ${inventory.identifier} đã có trong danh sách! Đã cập nhật kho.`,
        '',
        {
          duration: 2000,
          panelClass: ['snackbar-info'],
        }
      );
      return false;
    }

    // KIỂM TRA MÃ CÓ TRONG DETAIL LIST KHÔNG
    const detailItem = this.detailList.find(
      (item) => item.product_code === inventory.sap_code
    );

    if (!detailItem) {
      this.snackBar.open(
        `Sản phẩm ${inventory.sap_code} không nằm trong yêu cầu chuyển kho!`,
        'Đóng',
        {
          duration: 3000,
          panelClass: ['snackbar-error'],
        }
      );
      return false;
    }

    //KIỂM TRA TỔNG SỐ LƯỢNG SCAN
    const currentScannedQty = this.scannedList
      .filter((item) => item.productId === detailItem.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    const newTotalQty = currentScannedQty + (inventory.available_quantity || 0);

    if (newTotalQty > detailItem.total_quantity) {
      this.snackBar.open(
        `Vượt quá số lượng yêu cầu! Còn lại: ${detailItem.total_quantity - currentScannedQty
        } ${detailItem.dvt}`,
        'Đóng',
        {
          duration: 4000,
          panelClass: ['snackbar-error'],
        }
      );
      return false;
    }

    // THÊM ITEM MỚI VÀO DANH SÁCH
    const now = new Date();
    const newItem: ScannedItem = {
      id: undefined,
      productId: detailItem.id,
      inventoryCode: inventory.identifier,
      serialPallet: inventory.serial_pallet || 'N/A',
      quantity: inventory.available_quantity || 0,
      originalQuantity: inventory.initial_quantity || 0,
      productName: inventory.name || detailItem.product_name,
      scanTime: this.formatDateTime(now.toISOString()),
      warehouse: this.scanLocation,
      confirmed: false,
      isNew: true, // Đánh dấu item mới
    };

    this.scannedList = [...this.scannedList, newItem];
    this.updateDetailStatus();

    return true;
  }

  // ===== UPDATE DETAIL STATUS =====
  updateDetailStatus(): void {
    this.detailList.forEach((detail) => {
      const scannedItems = this.scannedList.filter(
        (scan) => scan.productId === detail.id
      );

      const totalScanned = scannedItems.reduce((sum, item) => sum + item.quantity, 0);

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

  // ===== APPLY GLOBAL QUANTITY =====
  applyGlobalQuantity(): void {
    if (this.globalQuantity == null || this.globalQuantity < 0) return;

    this.scannedList.forEach((item) => {
      if (!item.confirmed) {
        item.quantity = this.globalQuantity!;
      }
    });

    this.snackBar.open('Đã áp dụng số lượng cho tất cả!', '', { duration: 1500 });
  }

  // ===== CLEAR INPUTS =====
  clearScanInputs(): void {
    this.scanPallet = '';
    this.scanLocation = '';
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  // ===== FORMAT DATETIME =====
  formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  // ===== SUBMIT SCAN (LƯU VÀO DB) =====
  submitScan(): void {
    const newItems = this.scannedList.filter((item) => item.isNew === true);

    if (newItems.length === 0) {
      this.snackBar.open('Không có dữ liệu mới để lưu!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    const username = this.authService.getUsername();

    const payload = {
      scan_details: newItems.map((item) => ({
        products_in_IWTR_id: item.productId,
        inventory_identifier: item.inventoryCode,
        serial_pallet: item.serialPallet,
        quantity_dispatched: item.quantity,
        scan_time: new Date().toISOString().slice(0, 19),
        scan_by: username,
      })),
    };

    this.isLoading = true;

    this.chuyenKhoService.submitScan(this.requestId!, payload).subscribe({
      next: () => {
        this.snackBar.open('✓ Lưu thông tin scan thành công!', '', {
          duration: 2000,
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
        this.snackBar.open(
          err.error?.message || 'Lỗi khi gửi dữ liệu scan!',
          'Đóng',
          {
            duration: 3000,
            panelClass: ['snackbar-error'],
          }
        );
        this.isLoading = false;
      },
    });
  }

  // ===== PAGINATION =====
  setPagedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedList = this.scannedList.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.setPagedData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.setPagedData();
  }
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  // ===== BACK =====
  back(): void {
    this.router.navigate([
      '/kho-thanh-pham/chuyen-kho-noi-bo/detail/',
      this.requestId,
    ]);
  }
}