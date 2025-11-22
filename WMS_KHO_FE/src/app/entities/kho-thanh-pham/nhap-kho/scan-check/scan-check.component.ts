import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NhapKhoService, PushInventoryPayload } from '../service/nhap-kho.service';
import { AuthService } from '../../../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../dialog/alert-dialog.component';
import { forkJoin } from 'rxjs';
import { BarcodeFormat } from '@zxing/library';

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
  locationId: number;
  serialPallet: string;
  quantityImported: number;
  scanBy: string;
  timeChecked: string;
  confirmed: boolean;
  part_number?: string;
}
export interface ContainerInfo {
  id: number;
  warehouse_import_requirement_id: number;
  serial_pallet: string;
  box_code: string;
  box_quantity: number;
  updated_by: string;
  updated_date: string;
}

@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './scan-check.component.html',
  styleUrl: './scan-check.component.scss',
})
export class ScanCheckComponent implements OnInit {
  // Route params
  requestId: number | undefined; // import_requirement_id
  containerId: number | undefined; // container_id từ detail

  // Container & Requirement info
  importRequirementInfo: any;
  containerInfo: any;

  // Scan inputs
  scanPallet: string = '';
  scanLocation: string = '';
  selectedMode: 'pallet' | 'thung' | null = null;
  globalQuantity: number | null = null;
  lastScannedCode: string | null = null;

  // Scanned list
  scannedList: ScannedInventory[] = [];

  // Table
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

  // Pagination
  pageSize: number = 10;
  pageSizeOptions: number[] = [5, 10, 15, 20];
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  pagedList: any[] = [];

  // Loading
  isScanning: boolean = false;
  isMobile: boolean = false;
  isLoading = false;
  originalList: ScannedInventory[] = [];
  scannerActive: 'pallet' | 'location' | null = null;
  // ViewChild
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  @ViewChild('qrReaderDiv') qrReaderDiv?: ElementRef;
  locations: { id: number; code: string }[] = [];
  currentDevice: MediaDeviceInfo | undefined = undefined;
  availableDevices: MediaDeviceInfo[] = [];
  formats: BarcodeFormat[] = [BarcodeFormat.QR_CODE];
  private readonly qrReaderId = 'qr-reader';
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private nhapKhoService: NhapKhoService,
    private authService: AuthService,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.checkIfMobile();
    this.route.params.subscribe((params) => {
      this.requestId = +params['id']; // import_requirement_id
      this.containerId = +params['reqId']; // container_id

      if (this.requestId && this.containerId) {
        this.loadImportRequirementInfo();
        this.loadLocationCode();
        this.loadScannedList();
      }
    });
  }
  // ngOnDestroy(): void {
  //   this.stopScanning();
  // }

  checkIfMobile(): void {
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }
  //load thông tin locaiton minimal
  loadLocationCode(): void {
    this.nhapKhoService.getMinimalLocations().subscribe({
      next: (res) => {
        this.locations = res;
      },
      error: (err) => {
        console.error('Lỗi khi load locations:', err);
        this.snackBar.open('Không thể tải danh sách location!', 'Đóng', { duration: 3000 });
      }
    });
  }
  getLocationCode(locationId: number): string {
    const loc = this.locations.find(l => l.id === locationId);
    return loc ? loc.code : 'N/A';
  }

  // Load thông tin import requirement và container
  loadImportRequirementInfo(): void {
    if (!this.requestId) return;

    this.isLoading = true;
    this.nhapKhoService.getImportRequirement(this.requestId).subscribe({
      next: (res) => {
        this.importRequirementInfo = res.data.import_requirement;

        // Tìm container theo containerId
        this.containerInfo = res.data.containers.find(
          (c: any) => c.id === this.containerId
        );

        if (!this.containerInfo) {
          this.snackBar.open('Không tìm thấy container!', 'Đóng', {
            duration: 3000,
          });
          this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
        }

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi tải thông tin:', err);
        this.snackBar.open('Không thể tải thông tin!', 'Đóng', {
          duration: 3000,
        });
        this.isLoading = false;
      },
    });
  }

  // Load danh sách đã scan
  // Load danh sách đã scan
  loadScannedList(): void {
    if (!this.containerId) return;

    this.isLoading = true;
    this.nhapKhoService
      .getScannedContainers(this.containerId, {
        page: this.currentPage,
        size: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          const mapped = res.data.map((item): ScannedInventory => ({
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
            timeChecked: item.time_checked,
            confirmed: item.confirmed,
          }));

          this.scannedList = mapped;

          // tạo bản copy gốc 
          this.originalList = mapped.map(item => ({ ...item }));

          this.totalItems = res.meta.total_items;
          this.totalPages = res.meta.total_pages;

          this.isLoading = false;
        },
        error: (err) => {
          console.error('Lỗi khi tải danh sách:', err);
          this.isLoading = false;
        },
      });
  }


  // Format date
  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  // Chọn mode scan
  onSelectMode(mode: 'pallet' | 'thung'): void {
    this.selectedMode = mode;
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
    this.scanPallet = '';
    this.scanLocation = '';
    this.stopScanning();
  }

  // Enter từ pallet input

  onPalletScanEnter(): void {
    this.locationInput?.nativeElement?.focus();
  }

  // Enter từ location input → Thực hiện scan
  onLocationScanEnter(): void {
    if (!this.selectedMode) {
      this.snackBar.open('Vui lòng chọn mode scan!', 'Đóng', {
        duration: 3000,
      });
      return;
    }

    if (!this.scanPallet.trim() || !this.scanLocation.trim()) {
      this.snackBar.open('Vui lòng nhập đầy đủ thông tin!', 'Đóng', {
        duration: 3000,
      });
      return;
    }

    this.performScan();
  }
  async openCameraScanner(field: 'pallet' | 'location'): Promise<void> {
    if (!this.selectedMode && field === 'pallet') {
      this.snackBar.open('Vui lòng chọn mode scan!', 'Đóng', { duration: 3000 });
      return;
    }
    this.scannerActive = field;
    this.isScanning = true;
  }
  onScanSuccess(decodedText: string): void {
    const code = decodedText.trim();
    if (code === this.lastScannedCode) return;
    this.lastScannedCode = code;

    if (code.startsWith('P')) {
      this.scanPallet = code;
      this.snackBar.open('✓ Đã scan pallet!', '', { duration: 1500 });
    } else if (code.startsWith('B')) {
      this.scanPallet = code;
      this.snackBar.open('✓ Đã scan thùng!', '', { duration: 1500 });
    } else {
      this.scanLocation = code;
      this.snackBar.open('✓ Đã scan location!', '', { duration: 1500 });
    }

    if (this.scanPallet && this.scanLocation) {
      this.stopScanning();
      setTimeout(() => this.performScan(), 100);
    }
  }

  stopScanning(): void {
    this.lastScannedCode = null;
    this.isScanning = false;
    this.scannerActive = null;
  }
  ngOnDestroy(): void {
    this.stopScanning();
  }

  // Thực hiện scan
  performScan(): void {
    const scannedCode = this.scanPallet.trim();
    const username = this.authService.getUsername();
    const dateString = this.formatDateForAPI(new Date());
    const locationCode = this.scanLocation.trim().toUpperCase();
    const location = this.locations.find(l => l.code.toUpperCase() === locationCode);

    if (!location) {
      this.playAudio('assets/audio/beep_warning.mp3');
      this.dialog.open(AlertDialogComponent, { data: 'Location không tồn tại!' });
      this.resetScanInputs();
      return;
    }
    const locationId = location.id;

    this.nhapKhoService.getImportRequirement(this.requestId!).subscribe({
      next: (res) => {
        const containers: ContainerInfo[] = res.data.containers;
        let payload: any;

        if (this.selectedMode === 'pallet') {
          const pallet = containers.find(c => c.serial_pallet?.trim().toUpperCase() === scannedCode.toUpperCase());
          if (!pallet) {
            this.playAudio('assets/audio/beep_warning.mp3');
            this.dialog.open(AlertDialogComponent, { data: 'Pallet không tồn tại trong danh sách yêu cầu nhập!' });
            this.resetScanInputs();
            return;
          }

          const existing = this.scannedList.find(item =>
            item.serialPallet?.trim().toUpperCase() === scannedCode.toUpperCase()
          );

          if (existing && existing.confirmed) {
            this.playAudio('assets/audio/beep_warning.mp3');
            this.dialog.open(AlertDialogComponent, { data: 'Pallet này đã được scan trước đó!' });
            this.resetScanInputs();
            return;
          }

          payload = existing ? {
            import_container_id: existing.importContainerId,
            inventory_identifier: existing.inventoryIdentifier,
            serial_pallet: existing.serialPallet,
            location_id: locationId,
            quantity_imported: existing.quantityImported ?? 0,
            scan_by: username,
            confirmed: true,
            sap_code: existing.sapCode,
            po: existing.po,
            lot: existing.lot,
            name: existing.name,
            manufacturing_date: existing.manufacturingDate,
            expiration_date: existing.expirationDate,
            vendor: existing.vendor,
            msd_level: existing.msdLevel,
            comments: existing.comments,
          } : {
            import_container_id: pallet.id,
            inventory_identifier: pallet.serial_pallet,
            serial_pallet: pallet.serial_pallet,
            location_id: locationId,
            quantity_imported: pallet.box_quantity ?? 0,
            scan_by: username,
            confirmed: true,
            sap_code: this.importRequirementInfo?.sap_code || '',
            po: this.importRequirementInfo?.po_code || '',
            lot: this.importRequirementInfo?.lot_number || '',
            name: this.importRequirementInfo?.inventory_name || '',
            manufacturing_date: dateString,
            expiration_date: dateString,
            vendor: '',
            msd_level: '',
            comments: '',
          };
        } else {
          const box = containers.find(c => c.box_code?.trim().toUpperCase() === scannedCode.toUpperCase());
          if (!box) {
            this.playAudio('assets/audio/beep_warning.mp3');
            this.dialog.open(AlertDialogComponent, { data: 'Thùng không tồn tại trong danh sách yêu cầu nhập!' });
            this.resetScanInputs();
            return;
          }

          const existing = this.scannedList.find(item =>
            item.inventoryIdentifier?.trim().toUpperCase() === scannedCode.toUpperCase()
          );

          if (existing && existing.confirmed) {
            this.playAudio('assets/audio/beep_warning.mp3');
            this.dialog.open(AlertDialogComponent, { data: 'Thùng này đã được scan trước đó!' });
            this.resetScanInputs();
            return;
          }

          payload = existing ? {
            import_container_id: existing.importContainerId,
            inventory_identifier: existing.inventoryIdentifier,
            serial_pallet: existing.serialPallet,
            location_id: existing.locationId,
            quantity_imported: existing.quantityImported ?? 0,
            scan_by: username,
            confirmed: true,
            sap_code: existing.sapCode,
            po: existing.po,
            lot: existing.lot,
            name: existing.name,
            manufacturing_date: existing.manufacturingDate,
            expiration_date: existing.expirationDate,
            vendor: existing.vendor,
            msd_level: existing.msdLevel,
            comments: existing.comments,
          } : {
            import_container_id: this.containerId!,
            inventory_identifier: scannedCode,
            serial_pallet: box.serial_pallet,
            location_id: locationId,
            quantity_imported: box.box_quantity ?? 0,
            scan_by: username,
            confirmed: true,
            sap_code: this.importRequirementInfo?.sap_code || '',
            po: this.importRequirementInfo?.po_code || '',
            lot: this.importRequirementInfo?.lot_number || '',
            name: this.importRequirementInfo?.inventory_name || '',
            manufacturing_date: dateString,
            expiration_date: dateString,
            vendor: '',
            msd_level: '',
            comments: '',
          };
        }

        // Payload cho pushInventoriesToSystem
        const pushPayload: PushInventoryPayload = {
          inventories: [
            {
              identifier: payload.inventory_identifier,
              initial_quantity: payload.quantity_imported,
              location_id: payload.location_id,
              name: payload.name,
              serial_pallet: payload.serial_pallet,
              updated_by: username,
              sap_code: payload.sapCode || '',
              part_number: payload.part_number || ''
            }
          ]
        };

        this.isLoading = true;
        forkJoin([
          this.nhapKhoService.postScannedInventory(payload),
          this.nhapKhoService.pushInventoriesToSystem(pushPayload)
        ]).subscribe({
          next: () => {
            this.playAudio('assets/audio/successed-295058.mp3');
            this.loadScannedList();
            this.resetScanInputs();
          },
          error: (err) => {
            this.playAudio('assets/audio/beep_warning.mp3');
            this.dialog.open(AlertDialogComponent, { data: err.error?.message || 'Lỗi khi scan!' });
            this.isLoading = false;
            this.resetScanInputs();
          }
        });
      },
      error: () => {
        this.playAudio('assets/audio/beep_warning.mp3');
        this.dialog.open(AlertDialogComponent, { data: 'Không thể kiểm tra dữ liệu yêu cầu nhập!' });
      }
    });
  }

  playAudio(file: string): void {
    const audio = new Audio(file);
    audio.play();
  }


  formatDateForAPI(date: Date): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');

    // Format: "2025-11-14 07:53:21" (không có timezone)
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
  }
  // Reset scan inputs
  resetScanInputs(): void {
    this.scanPallet = '';
    this.scanLocation = '';
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }

  // Áp dụng số lượng global cho tất cả
  applyGlobalQuantity(): void {
    if (this.globalQuantity == null || this.globalQuantity < 0) return;

    this.scannedList.forEach((item) => {
      if (!item.confirmed) {
        item.quantityImported = this.globalQuantity!;
      }
    });

    this.snackBar.open('Đã áp dụng số lượng cho tất cả!', '', {
      duration: 1500,
    });
  }

  // Xác nhận nhập kho
  confirmScannedItems(): void {
    // So sánh với danh sách gốc
    const changedItems = this.scannedList.filter(item => {
      const original = this.originalList.find(o => o.id === item.id);
      if (!original) return false;

      // Kiểm tra thay đổi số lượng hoặc location
      const quantityChanged = item.quantityImported !== original.quantityImported;
      const locationChanged = item.locationId !== original.locationId;

      return quantityChanged || locationChanged;
    });

    if (changedItems.length === 0) {
      this.snackBar.open('Không có thay đổi nào để cập nhật!', 'Đóng', { duration: 3000 });
      return;
    }

    const username = this.authService.getUsername();

    // Payload chỉ chứa item thay đổi
    const batchPayload = {
      updates: changedItems.map(item => ({
        import_container_id: item.importContainerId,   // từ scannedList
        inventory_identifier: item.inventoryIdentifier || item.serialPallet,
        quantity_imported: item.quantityImported,
        location_id: item.locationId,
        confirmed: true,
      })),
    };


    // Payload inventories cũng chỉ chứa item thay đổi
    const inventoriesPayload: PushInventoryPayload = {
      inventories: changedItems.map(item => ({
        identifier: item.inventoryIdentifier || item.serialPallet,
        initial_quantity: item.quantityImported,
        location_id: item.locationId,
        name: item.name,
        serial_pallet: item.serialPallet,
        updated_by: username,
        sap_code: item.sapCode || '',
        part_number: item.part_number || ''
      })),
    };

    this.isLoading = true;
    this.nhapKhoService.confirmAndSyncInventories(
      batchPayload,
      inventoriesPayload,
      this.requestId!,
      // 'Đã nhập',
      username
    ).subscribe({
      next: () => {
        this.snackBar.open('✓ Cập nhật thay đổi thành công!', '', { duration: 3000, panelClass: ['snackbar-success'] });
        setTimeout(() => this.router.navigate(['/kho-thanh-pham/nhap-kho-sx/phe-duyet/', this.requestId]), 1500);
      },
      error: (err) => {
        if (err.status === 404) {
          // Workaround: API trả 404 nhưng thực tế đã cập nhật
          this.snackBar.open('✓ Cập nhật thay đổi thành công', '', { duration: 3000, panelClass: ['snackbar-success'] });
          setTimeout(() => this.router.navigate(['/kho-thanh-pham/nhap-kho-sx/phe-duyet/', this.requestId]), 1500);
        } else {
          this.snackBar.open('Lỗi khi cập nhật! Vui lòng thử lại.', 'Đóng', { duration: 3000 });
          this.isLoading = false;
        }
      },
    });
  }


  // Đẩy tồn hàng lên hệ thống
  // pushInventoriesToSystem(): void {
  //   const inventories = this.scannedList.map((item) => ({
  //     identifier: item.inventoryIdentifier || item.serialPallet,
  //     initial_quantity: item.quantityImported,
  //     location_id: item.locationId,
  //     name: item.name,
  //     sap_code: item.sapCode,
  //     serial_pallet: item.serialPallet,
  //   }));

  //   this.nhapKhoService
  //     .pushInventoriesToSystem({ inventories })
  //     .subscribe({
  //       next: () => {
  //         // Cập nhật trạng thái import requirement
  //         this.updateImportRequirementStatus();
  //       },
  //       error: (err) => {
  //         console.error('Lỗi đẩy tồn hàng:', err);
  //         // Vẫn tiếp tục cập nhật trạng thái
  //         this.updateImportRequirementStatus();
  //       },
  //     });
  // }

  // Cập nhật trạng thái import requirement
  updateImportRequirementStatus(): void {
    this.nhapKhoService
      .updateImportRequirementStatus(this.requestId!, 'Đã nhập')
      .subscribe({
        next: () => {
          this.snackBar.open('✓ Xác nhận nhập kho thành công!', '', {
            duration: 3000,
            panelClass: ['snackbar-success'],
          });

          setTimeout(() => {
            this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
          }, 1500);
        },
        error: (err) => {
          console.error('Lỗi cập nhật trạng thái:', err);
          this.snackBar.open(
            'Đã xác nhận nhưng lỗi cập nhật trạng thái!',
            'Đóng',
            { duration: 3000 }
          );
          this.isLoading = false;
        },
      });
  }

  // Track by
  trackById(index: number, item: ScannedInventory): number {
    return item.id;
  }

  // Phân trang
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadScannedList();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1; // reset về trang đầu
    this.loadScannedList();
  }


  // Hủy
  onCancel(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx/phe-duyet/', this.requestId]);
  }
}