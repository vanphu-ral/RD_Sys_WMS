import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NhapKhoService } from '../service/nhap-kho.service';
export interface ScannedInventory {
  id: number;
  manufacturingDate: string;
  expirationDate: string;
  sapCode: string;
  po: string;
  lot: string;
  vendor: string;
  msdLevel: string;
  comments: string;
  name: string;
  importContainerId: number;
  inventoryIdentifier: string;
  locationId: string;
  serialPallet: string;
  quantityImported: number;
  scanBy: string;
  timeChecked: string;
  confirmed: boolean;
}

@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './scan-check.component.html',
  styleUrl: './scan-check.component.scss',
})
export class ScanCheckComponent implements OnInit {
  nhapKhoId: number | undefined;
  nhapKhoData: ScannedInventory | undefined;
  currentPage = 1;

  //bien scan
  scanPallet: string = '';
  scanLocation: string = '';

  displayedColumns: string[] = [
    'stt',
    'sapCode',
    'name',
    'serialPallet',
    'inventoryIdentifier',
    'quantityImported',
    'locationId',
    'timeChecked',
    'confirmed',
  ];

  scannedList: ScannedInventory[] = [];
  selectedMode: 'pallet' | 'thung' | null = null;
  globalQuantity: number | null = null;
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  detailList: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private nhapKhoService: NhapKhoService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.nhapKhoId = +params['id'];
      if (this.nhapKhoId) {
        this.loadScannedList(this.nhapKhoId);
      }
    });

    this.route.queryParams.subscribe((queryParams) => {
      console.log('Mã sản phẩm:', queryParams['maSanPham']);
      console.log('Status:', queryParams['status']);
    });

    const state = history.state;
    this.detailList = state.detailList || [];

    this.detailList = this.detailList.map((item: { scanStatus: any }) => ({
      ...item,
      scanStatus: item.scanStatus || 'Chưa scan',
    }));
  }
  loadScannedList(nhapKhoId: number): void {
    this.nhapKhoService.getScannedContainers(nhapKhoId).subscribe({
      next: (res) => {
        this.scannedList = res.data.map((item): ScannedInventory => ({
          id: item.id,
          manufacturingDate: item.manufacturing_date,
          expirationDate: item.expiration_date,
          sapCode: item.sap_code,
          po: item.po,
          lot: item.lot,
          vendor: item.vendor,
          msdLevel: item.msd_level,
          comments: item.comments,
          name: item.name,
          importContainerId: item.import_container_id,
          inventoryIdentifier: item.inventory_identifier,
          locationId: item.location_id,
          serialPallet: item.serial_pallet,
          quantityImported: item.quantity_imported,
          scanBy: item.scan_by,
          timeChecked: this.formatDate(item.time_checked),
          confirmed: item.confirmed,
        }));
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách đã scan:', err);
      },
    });
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
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
      item.quantityImported = this.globalQuantity!;
    });
  }

  onLocationScanEnter(): void {
    if (!this.scanPallet || !this.scanLocation) return;

    const identifier = this.selectedMode === 'pallet' ? this.scanPallet : this.scanLocation;
    const trimmedIdentifier = identifier.trim();

    this.nhapKhoService.getInventoryByIdentifier(trimmedIdentifier).subscribe({
      next: (res) => {
        const matchedIndex = this.scannedList.findIndex(
          item => item.inventoryIdentifier === res.identifier
        );

        if (matchedIndex === -1) {
          this.snackBar.open('Mã này không nằm trong danh sách cần nhập!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
          this.resetScanInputs();
          return;
        }

        if (this.scannedList[matchedIndex].confirmed) {
          this.snackBar.open('Mã này đã được scan trước đó!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-warning'],
          });
          this.resetScanInputs();
          return;
        }

        const now = new Date();
        const formattedTime = now.toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        // Cập nhật trực tiếp vào danh sách đã load
        this.scannedList = this.scannedList.map((item, index) =>
          index === matchedIndex
            ? {
              ...item,
              confirmed: true,
              timeChecked: formattedTime,
              locationId: this.scanLocation,
              scanBy: 'admin',
            }
            : item
        );


        this.snackBar.open('Scan thành công!', 'Đóng', {
          duration: 2000,
          panelClass: ['snackbar-success'],
        });

        this.resetScanInputs();
      },
      error: () => {
        this.snackBar.open('Không tìm thấy thông tin mã đã quét!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
        this.resetScanInputs();
      },
    });
  }
  resetScanInputs(): void {
    this.scanPallet = '';
    this.scanLocation = '';
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }
  //trackBY
  trackById(index: number, item: ScannedInventory): number {
    return item.id;
  }

  //lư sau khi scan
  confirmScannedItems(): void {
    const scannedItems = this.scannedList.filter(item => item.confirmed);

    if (scannedItems.length === 0) {
      this.snackBar.open('Chưa có mã nào được scan!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-warning'],
      });
      return;
    }

    const firstItem = scannedItems[0];

    const payload = {
      import_container_id: firstItem.importContainerId,
      inventory_identifier: firstItem.inventoryIdentifier,
      container_inventories: scannedItems.map(item => ({
        manufacturing_date: item.manufacturingDate,
        expiration_date: item.expirationDate,
        sap_code: item.sapCode,
        po: item.po,
        lot: item.lot,
        vendor: item.vendor,
        msd_level: item.msdLevel,
        comments: item.comments,
        name: item.name,
        location_id: item.locationId,
        serial_pallet: item.serialPallet,
        quantity_imported: item.quantityImported,
        scan_by: item.scanBy || 'admin',
        confirmed: true,
      }))
    };
    this.nhapKhoService.confirmScannedInventories(payload).subscribe({
      next: () => {
        this.snackBar.open('Xác nhận thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
      },
      error: (err) => {
        console.error('Lỗi khi xác nhận:', err);
        this.snackBar.open('Xác nhận thất bại!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  onPageChange(page: number): void {
    // Load data for new page
  }

  onCancel(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }

  onReject(): void {
    // Xử lý từ chối
  }
  clearScanMode(): void {
    this.selectedMode = null;
    this.scanPallet = '';
    this.scanLocation = '';
  }

  onConfirm(): void {
    this.detailList = this.detailList.map((item: any) => ({
      ...item,
      scanStatus: 'Đã scan',
    }));

    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx'], {
      state: { updatedList: this.detailList },
    });
  }
}
