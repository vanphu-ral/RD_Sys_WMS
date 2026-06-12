import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  LuanChuyenKhoService,
  MinimalLocation,
  WarehouseTransferRequirement,
  WarehouseTransferRequirementPayload,
} from '../service/luan-chuyen-kho.service';
import {
  mapImportPalletScanResponse,
  mapWithDetailsResponse,
  toDisplayScannedItem,
} from '../service/luan-chuyen-kho-scan.mapper';
import { forkJoin, Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../../chuyen-kho/dialog/confirm-dialog.component';
import {
  isMobileViewport,
  LuanChuyenKhoCameraScanner,
} from '../service/luan-chuyen-kho-camera.helper';

export interface ScannedItem {
  scanType: 'pallet' | 'thung';
  refId?: number;
  maHangHoa: string;
  tenHangHoa: string;
  serialPallet: string;
  serialThung: string;
  soLuong: number;
  kho: string;
  thoiDiemScan: string;
  /** Đã scan lại đúng hiện vật khi phê duyệt */
  verified: boolean;
}

export interface OrderInfo {
  id?: number;
  requirementCode?: string;
  khoXuat: string;
  khoNhap: string;
  nguoiTao: string;
  ngayTao: string;
  ghiChu: string;
}

@Component({
  selector: 'app-luan-chuyen-kho-scan-approve',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './luan-chuyen-kho-scan-approve.component.html',
  styleUrls: ['./luan-chuyen-kho-scan-approve.component.scss'],
})
export class LuanChuyenKhoScanApproveComponent implements OnInit, OnDestroy {
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

  // ── Pagination ──────────────────────────────────────────────────────────────
  pageSize = 5;
  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.scannedList.length / this.pageSize);
  }

  get pagedList(): ScannedItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.scannedList.slice(start, start + this.pageSize);
  }

  /** Tính dãy trang hiển thị: 1 2 3 ... 8 9 */
  get visiblePages(): number[] {
    const total = this.totalPages;
    const cur = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Luôn hiện trang 1 và 2
    pages.push(1, 2, 3);

    if (cur > 4) pages.push(-1); // ellipsis

    // Trang xung quanh currentPage
    for (let p = Math.max(4, cur - 1); p <= Math.min(total - 2, cur + 1); p++) {
      if (!pages.includes(p)) pages.push(p);
    }

    if (cur < total - 3) pages.push(-1); // ellipsis

    // Luôn hiện 2 trang cuối
    [total - 1, total].forEach((p) => {
      if (!pages.includes(p)) pages.push(p);
    });

    return pages;
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  get verifiedCount(): number {
    return this.scannedList.filter((item) => item.verified).length;
  }

  get totalScanItems(): number {
    return this.scannedList.length;
  }

  /** Chỉ cho phê duyệt khi đã scan xác nhận đủ mọi mã trong danh sách */
  get canApprove(): boolean {
    return this.totalScanItems > 0 && this.verifiedCount === this.totalScanItems;
  }

  get approveProgressLabel(): string {
    if (this.totalScanItems === 0) {
      return 'Chưa có mã cần xác nhận';
    }
    return `Đã xác nhận ${this.verifiedCount}/${this.totalScanItems} mã`;
  }

  // ── Scan ────────────────────────────────────────────────────────────────────
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
      detail: this.luanChuyenKhoService.getApprovalWithDetails(id),
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
        console.error('[LuanChuyenKhoScanApprove] Lỗi lấy chi tiết đơn phê duyệt:', err);
        this.snackBar.open('Không tải được chi tiết đơn phê duyệt.', 'Đóng', { duration: 3000 });
      },
    });
  }

  private applyScannedRows(rows: ReturnType<typeof mapWithDetailsResponse>['scannedRows']): void {
    this.scannedList = rows.map((row) => ({
      ...toDisplayScannedItem(row, (id) => this.getLocationCode(String(id ?? '')), this.orderInfo.khoXuat),
      verified: false,
    }));
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
    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }
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

  private markItemVerified(item: ScannedItem): void {
    item.verified = true;
  }

  /** Khớp theo serial hiển thị trên danh sách đơn */
  private tryMarkVerifiedBySerial(scanCode: string, mode: 'pallet' | 'thung'): boolean {
    const normalized = this.normalizeCode(scanCode);
    const item = this.scannedList.find((row) => {
      if (row.scanType !== mode || row.verified) return false;
      if (mode === 'pallet') {
        return this.normalizeCode(row.serialPallet) === normalized;
      }
      return this.normalizeCode(row.serialThung) === normalized;
    });
    if (!item) return false;
    this.markItemVerified(item);
    return true;
  }

  /** Khớp theo refId sau khi tra cứu API (mã vật lý có thể khác serial hiển thị) */
  private tryMarkVerifiedByRef(scanRef: any, mode: 'pallet' | 'thung'): boolean {
    const refId =
      mode === 'thung' ? Number(scanRef.inventoryId) : Number(scanRef.palletDetailId);
    if (!refId) return false;

    const item = this.scannedList.find(
      (row) => row.scanType === mode && !row.verified && Number(row.refId) === refId
    );
    if (!item) return false;
    this.markItemVerified(item);
    return true;
  }

  onScan(): void {
    const value = this.scanValue.trim();
    if (!value) return;

    if (this.tryMarkVerifiedBySerial(value, this.scanMode)) {
      this.scanValue = '';
      this.snackBar.open('✓ Đã xác nhận mã trong danh sách.', '', { duration: 2000 });
      return;
    }

    this.activeScanRequests++;
    this.resolveScanReference(value, this.scanMode).subscribe({
      next: (scanRef) => {
        const verified = this.tryMarkVerifiedByRef(scanRef, this.scanMode);
        this.scanValue = '';
        this.activeScanRequests = Math.max(0, this.activeScanRequests - 1);
        if (verified) {
          this.snackBar.open('✓ Đã xác nhận mã trong danh sách.', '', { duration: 2000 });
        } else {
          this.snackBar.open('Mã không có trong danh sách đơn hoặc đã được xác nhận.', 'Đóng', {
            duration: 3000,
          });
        }
      },
      error: (err) => {
        console.error('[LuanChuyenKhoScanApprove] Lỗi tra cứu mã scan:', err);
        this.scanValue = '';
        this.activeScanRequests = Math.max(0, this.activeScanRequests - 1);
      },
    });
  }

  private resolveScanReference(
    scannedCode: string,
    mode: 'pallet' | 'thung'
  ): Observable<any> {
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

  onApprove(): void {
    if (!this.canApprove) {
      this.snackBar.open(
        `Vui lòng scan xác nhận đủ tất cả mã (${this.verifiedCount}/${this.totalScanItems}).`,
        'Đóng',
        { duration: 4000 }
      );
      return;
    }
    if (!this.requirementId || !this.rawRequirement) {
      this.snackBar.open('Không xác định được đơn để phê duyệt.', 'Đóng', { duration: 3000 });
      return;
    }
    const approvePayload: WarehouseTransferRequirementPayload = {
      id: this.requirementId,
      requirement_code: this.rawRequirement.requirement_code,
      number_of_pallet: this.rawRequirement.number_of_pallet,
      number_of_box: this.rawRequirement.number_of_box,
      total_quantity: this.rawRequirement.total_quantity,
      status: 'Đã duyệt',
      source_warehouse: this.rawRequirement.source_warehouse,
      destination_warehouse: this.rawRequirement.destination_warehouse,
      note: this.rawRequirement.note || '',
    };

    this.luanChuyenKhoService.updateApproval(this.requirementId, approvePayload).subscribe({
        next: () => {
          this.snackBar.open('Đã xác nhận phê duyệt đơn.', 'Đóng', { duration: 3000 });
          this.router.navigate(['../../list'], {
            relativeTo: this.route,
            queryParams: { mode: 'approve' },
          });
        },
        error: (err) => {
          console.error('[LuanChuyenKhoScanApprove] Lỗi phê duyệt đơn:', err);
          this.snackBar.open('Không thể phê duyệt đơn.', 'Đóng', { duration: 3000 });
        },
      });
  }

  confirmAndApprove(): void {
    if (!this.canApprove) {
      this.snackBar.open(
        `Vui lòng scan xác nhận đủ tất cả mã trong danh sách (${this.verifiedCount}/${this.totalScanItems}).`,
        'Đóng',
        { duration: 4000 }
      );
      return;
    }
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { message: 'Bạn có chắc chắn muốn xác nhận phê duyệt đơn này không?' },
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.onApprove();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['../../list'], {
      relativeTo: this.route,
      queryParams: { mode: 'approve' },
    });
  }
}