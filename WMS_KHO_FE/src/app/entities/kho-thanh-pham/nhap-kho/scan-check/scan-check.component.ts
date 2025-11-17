import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NhapKhoService, PushInventoryPayload } from '../service/nhap-kho.service';
import { AuthService } from '../../../../services/auth.service';

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
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 1;

  // Loading
  isLoading = false;
  originalList: ScannedInventory[] = [];
  // ViewChild
  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  locations: { id: number; code: string }[] = [];
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private nhapKhoService: NhapKhoService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
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

  // Thực hiện scan
  performScan(): void {
    const scannedCode = this.scanPallet.trim();
    const username = this.authService.getUsername();
    const dateString = this.formatDateForAPI(new Date());
    const locationCode = this.scanLocation.trim().toUpperCase();
    const location = this.locations.find(l => l.code.toUpperCase() === locationCode);

    if (!location) {
      this.snackBar.open('Location không tồn tại!', 'Đóng', { duration: 3000 });
      this.resetScanInputs();
      return;
    }
    const locationId = location.id;

    this.nhapKhoService.getImportRequirement(this.requestId!).subscribe({
      next: (res) => {
        const containers: ContainerInfo[] = res.data.containers;

        if (this.selectedMode === 'pallet') {
          // tìm pallet trong yêu cầu nhập
          const pallet = containers.find(c => c.serial_pallet?.trim().toUpperCase() === scannedCode.toUpperCase());
          if (!pallet) {
            this.snackBar.open('Pallet không tồn tại trong danh sách yêu cầu nhập!', 'Đóng', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
            this.resetScanInputs();
            return;
          }

          // tìm trong scannedList
          const existing = this.scannedList.find(item => item.serialPallet?.trim().toUpperCase() === scannedCode.toUpperCase());
          if (existing && !existing.confirmed) {
            const payload = {
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
            };

            this.isLoading = true;
            this.nhapKhoService.postScannedInventory(payload).subscribe({
              next: () => {
                this.snackBar.open('✓ Pallet đã được xác nhận scan!', '', { duration: 1500 });
                this.loadScannedList();
                this.resetScanInputs();
              },
              error: (err) => {
                console.error('Lỗi khi xác nhận pallet:', err);
                this.snackBar.open(err.error?.message || 'Lỗi khi xác nhận pallet!', 'Đóng', { duration: 3000 });
                this.isLoading = false;
                this.resetScanInputs();
              },
            });
            return;
          }

          // nếu chưa có trong scannedList thì tạo mới
          // nếu chưa có trong scannedList thì tạo mới
          const payload = {
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


          this.isLoading = true;
          this.nhapKhoService.postScannedInventory(payload).subscribe({
            next: () => {
              this.snackBar.open('✓ Scan pallet thành công!', '', { duration: 1500 });
              this.loadScannedList();
              this.resetScanInputs();
            },
            error: (err) => {
              console.error('Lỗi scan pallet:', err);
              this.snackBar.open(err.error?.message || 'Lỗi khi scan pallet!', 'Đóng', { duration: 3000 });
              this.isLoading = false;
              this.resetScanInputs();
            },
          });

        } else {
          // quét thùng
          const box = containers.find(c => c.box_code?.trim().toUpperCase() === scannedCode.toUpperCase());
          if (!box) {
            this.snackBar.open('Thùng không tồn tại trong danh sách yêu cầu nhập!', 'Đóng', {
              duration: 3000,
              panelClass: ['snackbar-error'],
            });
            this.resetScanInputs();
            return;
          }

          const existing = this.scannedList.find(item => item.inventoryIdentifier?.trim().toUpperCase() === scannedCode.toUpperCase());
          if (existing && !existing.confirmed) {
            const payload = {
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
            };

            this.isLoading = true;
            this.nhapKhoService.postScannedInventory(payload).subscribe({
              next: () => {
                this.snackBar.open('✓ Thùng đã được xác nhận scan!', '', { duration: 1500 });
                this.loadScannedList();
                this.resetScanInputs();
              },
              error: (err) => {
                console.error('Lỗi khi xác nhận thùng:', err);
                this.snackBar.open(err.error?.message || 'Lỗi khi xác nhận thùng!', 'Đóng', { duration: 3000 });
                this.isLoading = false;
                this.resetScanInputs();
              },
            });
            return;
          }

          // nếu chưa có thì tạo payload mới
          const payload = {
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

          this.isLoading = true;
          this.nhapKhoService.postScannedInventory(payload).subscribe({
            next: () => {
              this.snackBar.open('✓ Scan thùng thành công!', '', { duration: 1500 });
              this.loadScannedList();
              this.resetScanInputs();
            },
            error: (err) => {
              console.error('Lỗi scan thùng:', err);
              this.snackBar.open(err.error?.message || 'Lỗi khi scan thùng!', 'Đóng', { duration: 3000 });
              this.isLoading = false;
              this.resetScanInputs();
            },
          });
        }
      },
      error: (err) => {
        console.error('Lỗi khi gọi import-requirements:', err);
        this.snackBar.open('Không thể kiểm tra dữ liệu yêu cầu nhập!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      }
    });
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
        sap_code: item.sapCode,
        serial_pallet: item.serialPallet,
      })),
    };

    this.isLoading = true;
    this.nhapKhoService.confirmAndSyncInventories(
      batchPayload,
      inventoriesPayload,
      this.requestId!,
      'Đã nhập',
      username
    ).subscribe({
      next: () => {
        this.snackBar.open('✓ Cập nhật thay đổi thành công!', '', { duration: 3000, panelClass: ['snackbar-success'] });
        setTimeout(() => this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']), 1500);
      },
      error: (err) => {
        this.snackBar.open('Lỗi khi cập nhật! Vui lòng thử lại.', 'Đóng', { duration: 3000 });
        this.isLoading = false;
      },
    });
  }


  // Đẩy tồn hàng lên hệ thống
  pushInventoriesToSystem(): void {
    const inventories = this.scannedList.map((item) => ({
      identifier: item.inventoryIdentifier || item.serialPallet,
      initial_quantity: item.quantityImported,
      location_id: item.locationId,
      name: item.name,
      sap_code: item.sapCode,
      serial_pallet: item.serialPallet,
    }));

    this.nhapKhoService
      .pushInventoriesToSystem({ inventories })
      .subscribe({
        next: () => {
          // Cập nhật trạng thái import requirement
          this.updateImportRequirementStatus();
        },
        error: (err) => {
          console.error('Lỗi đẩy tồn hàng:', err);
          // Vẫn tiếp tục cập nhật trạng thái
          this.updateImportRequirementStatus();
        },
      });
  }

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
    this.currentPage = page;
    this.loadScannedList();
  }

  // Hủy
  onCancel(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }
}