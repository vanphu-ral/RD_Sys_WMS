import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, Observable, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../services/auth.service';
import { ConfirmDialogComponent } from '../../chuyen-kho/dialog/confirm-dialog.component';
import {
  LuanChuyenKhoService,
  MinimalLocation,
  WarehouseTransferRequirementPayload,
} from '../service/luan-chuyen-kho.service';
import { mapImportPalletScanResponse } from '../service/luan-chuyen-kho-scan.mapper';
import {
  isMobileViewport,
  LuanChuyenKhoCameraScanner,
} from '../service/luan-chuyen-kho-camera.helper';

export interface ScannedItem {
  apiScanId?: number;
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

export interface TransferForm {
  khoGui: string;
  khoNhan: string;
  nguoiTao: string;
  ngayTao: string;
  ghiChu: string;
}

@Component({
    selector: 'app-luan-chuyen-kho-add-new',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './luan-chuyen-kho-add-new.component.html',
    styleUrls: ['./luan-chuyen-kho-add-new.component.scss'],
})
export class LuanChuyenKhoAddNewComponent implements OnInit, OnDestroy {
  scanMode: 'pallet' | 'thung' = 'pallet';
  scanValue = '';
  isMobile = false;
  cameraScanner!: LuanChuyenKhoCameraScanner;
  createdRequirementId?: number;
  requirementCode?: string;
  locations: MinimalLocation[] = [];
  currentTime = '';
  activeScanRequests = 0;

  form: TransferForm = {
    khoGui: '',
    khoNhan: '',
    nguoiTao: '',
    ngayTao: '',
    ghiChu: '',
  };

  scannedList: ScannedItem[] = [];


  //pagination
  pageSize = 10;
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

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private luanChuyenKhoService: LuanChuyenKhoService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.initMobileAndCamera();
    this.form.nguoiTao = this.authService.getUsername() || '';
    this.form.ngayTao = this.getTodayForInput();
    this.currentTime = this.getCurrentTime();
    this.loadMinimalLocations();
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

  private getTodayForInput(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private getCurrentTime(): string {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${min}`;
  }

  private loadMinimalLocations(): void {
    this.luanChuyenKhoService.getMinimalLocations().subscribe({
      next: (locations) => {
        this.locations = locations || [];
      },
      error: (err) => {
        console.error('[LuanChuyenKhoAddNew] Lỗi lấy danh sách kho:', err);
        this.locations = [];
      },
    });
  }

  private mapLocationInputToId(value: string): string {
    const raw = (value || '').trim();
    if (!raw) {
      return '';
    }
    const found = this.locations.find((loc) => loc.code.toLowerCase() === raw.toLowerCase());
    return found ? String(found.id) : raw;
  }

  private getLocationCodeById(locationId: number): string {
    const found = this.locations.find((loc) => Number(loc.id) === Number(locationId));
    return found?.code || '';
  }

  private generateRequirementCode(): string {
    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 900 + 100);
    return `GC${dd}${mm}${yy}${random}`;
  }

  private buildPayload(status: string): WarehouseTransferRequirementPayload {
    const numberOfPallet = this.scannedList.filter((item) => item.scanType === 'pallet').length;
    const numberOfBox = this.scannedList.filter((item) => item.scanType === 'thung').length;
    const totalQuantity =
      this.scannedList.reduce((sum, item) => sum + (item.soLuong || 0), 0) || this.scannedList.length;
    return {
      requirement_code: this.requirementCode || this.generateRequirementCode(),
      number_of_pallet: numberOfPallet,
      number_of_box: numberOfBox,
      total_quantity: totalQuantity,
      status,
      source_warehouse: this.mapLocationInputToId(this.form.khoGui),
      destination_warehouse: this.mapLocationInputToId(this.form.khoNhan),
      note: this.form.ghiChu || '',
    };
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
      next: (scanRef: any) => {
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
          kho: this.getLocationCodeById(Number(scanRef.locationId)) || this.form.khoGui,
          thoiDiemScan: formatted,
        };
        this.scannedList = [newItem, ...this.scannedList];
        this.currentPage = 1;
        this.scanValue = '';
        this.activeScanRequests = Math.max(0, this.activeScanRequests - 1);
      },
      error: (err: any) => {
        console.error('[LuanChuyenKhoAddNew] Lỗi tra cứu mã scan:', err);
        this.snackBar.open('Mã scan không hợp lệ hoặc không tìm thấy dữ liệu.', 'Đóng', { duration: 3000 });
        this.activeScanRequests = Math.max(0, this.activeScanRequests - 1);
      },
    });
  }

  private submitScannedItems(requirementId: number): Observable<any> {
    const requests = this.scannedList
      .filter((item) => !!item.refId)
      .map((item) =>
        item.scanType === 'thung'
          ? this.luanChuyenKhoService.addScannedInventory({
              warehouse_transfer_gc_requirement_id: requirementId,
              inventory_id: Number(item.refId),
            })
          : this.luanChuyenKhoService.addScannedPallet({
              warehouse_transfer_gc_requirement_id: requirementId,
              pallet_info_detail_id: Number(item.refId),
            })
      );

    return requests.length ? forkJoin(requests) : of([]);
  }

  private resolveScanReference(
    scannedCode: string,
    mode: 'pallet' | 'thung'
  ): any {
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

  onSubmit(): void {
    this.currentTime = this.getCurrentTime();
    const draftPayload = this.buildPayload('Bản nháp');
    this.luanChuyenKhoService.createRequirement(draftPayload).subscribe({
      next: (draftRes) => {
        this.createdRequirementId = draftRes.id;
        this.requirementCode = draftRes.requirement_code;

        this.submitScannedItems(draftRes.id).subscribe({
          next: () => {
            const approvePayload: WarehouseTransferRequirementPayload = {
              ...this.buildPayload('Chờ duyệt'),
              id: draftRes.id,
            };
            this.luanChuyenKhoService.submitForApproval(approvePayload).subscribe({
              next: () => {
                this.snackBar.open('Đã gửi đơn chuyển kho để phê duyệt.', 'Đóng', { duration: 3000 });
                this.router.navigate(['../list'], { relativeTo: this.route });
              },
              error: (err) => {
                console.error('[LuanChuyenKhoAddNew] Lỗi gửi phê duyệt:', err);
                this.snackBar.open('Không gửi được đơn để phê duyệt.', 'Đóng', { duration: 3000 });
              },
            });
          },
          error: (err) => {
            console.error('[LuanChuyenKhoAddNew] Lỗi lưu danh sách scan:', err);
            this.snackBar.open('Không lưu được danh sách scan vào đơn.', 'Đóng', { duration: 3000 });
          },
        });
      },
      error: (err) => {
        console.error('[LuanChuyenKhoAddNew] Lỗi tạo đơn nháp:', err);
        this.snackBar.open('Không tạo được đơn chuyển kho nháp.', 'Đóng', { duration: 3000 });
      },
    });
  }

  confirmAndSubmit(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: { message: 'Bạn có chắc chắn muốn gửi đơn luân chuyển kho này không?' },
    });
    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.onSubmit();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['../list'], { relativeTo: this.route });
  }
}