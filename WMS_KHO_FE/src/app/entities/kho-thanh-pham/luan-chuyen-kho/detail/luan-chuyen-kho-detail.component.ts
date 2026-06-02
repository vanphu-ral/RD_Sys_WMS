import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, Observable } from 'rxjs';
import {
  LuanChuyenKhoService,
  MinimalLocation,
  WarehouseTransferRequirement,
} from '../service/luan-chuyen-kho.service';
import {
  mapImportPalletScanResponse,
  mapWithDetailsResponse,
  toDisplayScannedItem,
} from '../service/luan-chuyen-kho-scan.mapper';
import { ConfirmDialogComponent } from '../../chuyen-kho/dialog/confirm-dialog.component';
import {
  isMobileViewport,
  LuanChuyenKhoCameraScanner,
} from '../service/luan-chuyen-kho-camera.helper';

interface ScannedItem {
  scanType: 'pallet' | 'thung';
  refId?: number;
  maHangHoa: string;
  tenHangHoa: string;
  serialPallet: string;
  serialThung: string;
  soLuong: number;
  kho: string;
  thoiDiemScan: string;
}

interface OrderInfo {
  id?: number;
  requirementCode?: string;
  khoXuat: string;
  khoNhap: string;
  nguoiTao: string;
  ngayTao: string;
  ghiChu: string;
}

@Component({
  selector: 'app-luan-chuyen-kho-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './luan-chuyen-kho-detail.component.html',
  styleUrls: ['./luan-chuyen-kho-detail.component.scss'],
})
export class LuanChuyenKhoDetailComponent implements OnInit, OnDestroy {
  scanMode: 'pallet' | 'thung' = 'pallet';
  scanValue = '';
  isMobile = false;
  cameraScanner!: LuanChuyenKhoCameraScanner;
  requirementId?: number;
  private locationMap = new Map<string, string>();
  private rawRequirement?: WarehouseTransferRequirement;
  activeScanRequests = 0;

  orderInfo: OrderInfo = {
    khoXuat: '',
    khoNhap: '',
    nguoiTao: '',
    ngayTao: '',
    ghiChu: '',
  };

  scannedList: ScannedItem[] = [];
  pageSize = 5;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.scannedList.length / this.pageSize);
  }

  get pagedList(): ScannedItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.scannedList.slice(start, start + this.pageSize);
  }

  get visiblePages(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    const pages: number[] = [];
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    pages.push(1, 2, 3);
    if (cur > 4) pages.push(-1);
    for (let p = Math.max(4, cur - 1); p <= Math.min(total - 2, cur + 1); p++) {
      if (!pages.includes(p)) pages.push(p);
    }
    if (cur < total - 3) pages.push(-1);
    [total - 1, total].forEach((p) => {
      if (!pages.includes(p)) pages.push(p);
    });
    return pages;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private luanChuyenKhoService: LuanChuyenKhoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initMobileAndCamera();
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.requirementId = Number(orderId);
      this.loadRequirement(this.requirementId);
    }
  }

  ngOnDestroy(): void {
    void this.cameraScanner?.stop();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.isMobile = isMobileViewport();
  }

  private initMobileAndCamera(): void {
    this.isMobile = isMobileViewport();
    this.cameraScanner = new LuanChuyenKhoCameraScanner(this.snackBar, (code) => {
      this.scanValue = code;
      this.onScan();
    });
  }

  openCameraScanner(): void {
    void this.cameraScanner.open(this.scanMode === 'pallet' ? 'Pallet' : 'Thùng');
  }

  stopScanning(): void {
    void this.cameraScanner.stop();
  }

  switchCamera(): void {
    void this.cameraScanner.switchCamera();
  }

  get isScanning(): boolean {
    return this.cameraScanner?.isScanning ?? false;
  }

  get availableCameras() {
    return this.cameraScanner?.availableCameras ?? [];
  }

  get scannerTitle(): string {
    return this.cameraScanner?.scannerTitle ?? '';
  }

  private loadRequirement(id: number): void {
    forkJoin({
      locations: this.luanChuyenKhoService.getMinimalLocations(),
      detail: this.luanChuyenKhoService.getRequirementWithDetails(id),
    }).subscribe({
      next: ({ locations, detail }) => {
        this.buildLocationMap(locations);
        const { requirement, scannedRows } = mapWithDetailsResponse(detail);
        if (!requirement?.id) return;
        this.rawRequirement = requirement;
        this.applyRequirementToForm(requirement);
        this.applyScannedRows(scannedRows);
      },
      error: (err) => {
        console.error('[LuanChuyenKhoDetail] Lỗi lấy chi tiết đơn:', err);
        this.snackBar.open('Không tải được chi tiết đơn.', 'Đóng', { duration: 3000 });
      },
    });
  }

  private applyScannedRows(rows: ReturnType<typeof mapWithDetailsResponse>['scannedRows']): void {
    this.scannedList = rows.map((row) =>
      toDisplayScannedItem(row, (id) => this.getLocationCode(String(id ?? '')), this.orderInfo.khoXuat)
    );
    this.currentPage = 1;
  }

  private buildLocationMap(locations: MinimalLocation[]): void {
    this.locationMap.clear();
    (locations || []).forEach((loc) => {
      this.locationMap.set(String(loc.id), loc.code);
    });
  }

  private getLocationCode(rawWarehouse: string | number): string {
    const key = String(rawWarehouse);
    return this.locationMap.get(key) || key;
  }

  private applyRequirementToForm(requirement: WarehouseTransferRequirement): void {
    this.orderInfo = {
      id: requirement.id,
      requirementCode: requirement.requirement_code,
      khoXuat: this.getLocationCode(requirement.source_warehouse),
      khoNhap: this.getLocationCode(requirement.destination_warehouse),
      nguoiTao: requirement.created_by,
      ngayTao: this.formatDate(requirement.created_at),
      ghiChu: requirement.note || '',
    };
  }

  private formatDate(dateValue: string): string {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
  }

  setScanMode(mode: 'pallet' | 'thung'): void {
    this.scanMode = mode;
    this.scanValue = '';
  }

  private normalizeCode(value: string): string {
    return (value || '').trim().toUpperCase();
  }

  private isDuplicateByCode(scanCode: string, mode: 'pallet' | 'thung'): boolean {
    const normalized = this.normalizeCode(scanCode);
    return this.scannedList.some((item) =>
      mode === 'thung'
        ? this.normalizeCode(item.serialThung) === normalized
        : this.normalizeCode(item.serialPallet) === normalized
    );
  }

  private isDuplicateByRef(refId: number, mode: 'pallet' | 'thung'): boolean {
    return this.scannedList.some((item) => item.scanType === mode && Number(item.refId) === Number(refId));
  }

  onScan(): void {
    if (!this.requirementId) {
      this.snackBar.open('Không xác định được đơn luân chuyển kho.', 'Đóng', { duration: 3000 });
      return;
    }
    const value = this.scanValue.trim();
    if (!value) return;
    if (this.isDuplicateByCode(value, this.scanMode)) {
      this.snackBar.open('Mã đã tồn tại trong danh sách scan.', 'Đóng', { duration: 2500 });
      this.scanValue = '';
      return;
    }

    const now = new Date();
    const formatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()} ${now
      .getHours()
      .toString()
      .padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    this.activeScanRequests++;
    this.resolveScanReference(value, this.scanMode).subscribe({
      next: (scanRef) => {
        const refId = this.scanMode === 'thung' ? Number(scanRef.inventoryId) : Number(scanRef.palletDetailId);
        if (this.isDuplicateByRef(refId, this.scanMode)) {
          this.snackBar.open('Mã đã tồn tại trong danh sách scan.', 'Đóng', { duration: 2500 });
          this.scanValue = '';
          this.activeScanRequests = Math.max(0, this.activeScanRequests - 1);
          return;
        }
        const newItem: ScannedItem = {
          scanType: this.scanMode,
          refId,
          maHangHoa: scanRef.sapCode || '---',
          tenHangHoa: scanRef.name || '---',
          serialPallet: scanRef.serialPallet || (this.scanMode === 'pallet' ? value : '---'),
          serialThung: scanRef.inventoryIdentifier || (this.scanMode === 'thung' ? value : '---'),
          soLuong: scanRef.quantity || 0,
          kho: this.getLocationCode(String(scanRef.locationId)) || this.orderInfo.khoXuat,
          thoiDiemScan: formatted,
        };

        const onSuccess = () => {
          this.scannedList = [newItem, ...this.scannedList];
          this.currentPage = 1;
          this.scanValue = '';
          this.activeScanRequests = Math.max(0, this.activeScanRequests - 1);
        };

        if (this.scanMode === 'thung') {
          this.luanChuyenKhoService
            .addScannedInventory({
              warehouse_transfer_gc_requirement_id: this.requirementId!,
              inventory_id: Number(scanRef.inventoryId),
            })
            .subscribe({
              next: onSuccess,
              error: (err) => {
                console.error('[LuanChuyenKhoDetail] Lỗi lưu scan thùng:', err);
                this.snackBar.open('Không lưu được thùng scan vào đơn.', 'Đóng', { duration: 3000 });
                this.activeScanRequests = Math.max(0, this.activeScanRequests - 1);
              },
            });
        } else {
          this.luanChuyenKhoService
            .addScannedPallet({
              warehouse_transfer_gc_requirement_id: this.requirementId!,
              pallet_info_detail_id: Number(scanRef.palletDetailId),
            })
            .subscribe({
              next: onSuccess,
              error: (err) => {
                console.error('[LuanChuyenKhoDetail] Lỗi lưu scan pallet:', err);
                this.snackBar.open('Không lưu được pallet scan vào đơn.', 'Đóng', { duration: 3000 });
                this.activeScanRequests = Math.max(0, this.activeScanRequests - 1);
              },
            });
        }
      },
      error: (err) => {
        console.error('[LuanChuyenKhoDetail] Lỗi tra cứu mã scan:', err);
        this.snackBar.open('Mã scan không hợp lệ hoặc không tìm thấy dữ liệu.', 'Đóng', { duration: 3000 });
        this.activeScanRequests = Math.max(0, this.activeScanRequests - 1);
      },
    });
  }

  private resolveScanReference(scannedCode: string, mode: 'pallet' | 'thung'): Observable<any> {
    if (mode === 'thung') {
      return new Observable<any>((observer) => {
        this.luanChuyenKhoService.getInventoryByIdentifier(scannedCode).subscribe({
          next: (res: any) => {
            const inventory = res?.data ?? res;
            const inventoryId = inventory?.id;
            if (!inventoryId) {
              observer.error(new Error('Inventory id not found'));
              return;
            }
            observer.next({
              inventoryId,
              inventoryIdentifier: inventory?.identifier || inventory?.inventory_identifier || scannedCode,
              serialPallet: inventory?.serial_pallet || '---',
              quantity: inventory?.available_quantity ?? inventory?.quantity_imported ?? 0,
              locationId: inventory?.location_id,
              sapCode: inventory?.sap_code || '',
              name: inventory?.name || '',
            });
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    }

    return new Observable<any>((observer) => {
      this.luanChuyenKhoService.scanImportPallet(scannedCode).subscribe({
        next: (res: any) => {
          try {
            const mapped = mapImportPalletScanResponse(res);
            observer.next({
              palletDetailId: mapped.palletDetailId,
              inventoryIdentifier: mapped.inventoryIdentifier,
              serialPallet: mapped.serialPallet || scannedCode,
              quantity: mapped.quantity,
              locationId: mapped.locationId,
              sapCode: mapped.sapCode,
              name: mapped.name,
            });
            observer.complete();
          } catch (e) {
            observer.error(e);
          }
        },
        error: (err) => observer.error(err),
      });
    });
  }

  onUpdate(): void {
    if (!this.requirementId || !this.rawRequirement) {
      this.snackBar.open('Không xác định được đơn để cập nhật.', 'Đóng', { duration: 3000 });
      return;
    }

    this.luanChuyenKhoService
      .updateRequirement({
        id: this.requirementId,
        requirement_code: this.rawRequirement.requirement_code,
        number_of_pallet: this.rawRequirement.number_of_pallet,
        number_of_box: this.rawRequirement.number_of_box,
        total_quantity: this.rawRequirement.total_quantity,
        status: this.rawRequirement.status || 'Bản nháp',
        source_warehouse: this.rawRequirement.source_warehouse,
        destination_warehouse: this.rawRequirement.destination_warehouse,
        note: this.orderInfo.ghiChu || '',
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Đã cập nhật thông tin đơn thành công.', 'Đóng', { duration: 3000 });
          this.router.navigate(['../../list'], { relativeTo: this.route });
        },
        error: (err) => {
          console.error('[LuanChuyenKhoDetail] Lỗi cập nhật đơn:', err);
          this.snackBar.open('Không thể cập nhật đơn.', 'Đóng', { duration: 3000 });
        },
      });
  }

  confirmAndUpdate(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { message: 'Bạn có chắc chắn muốn cập nhật đơn này không?' },
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) this.onUpdate();
    });
  }

  goBack(): void {
    this.router.navigate(['../../list'], { relativeTo: this.route });
  }
}
