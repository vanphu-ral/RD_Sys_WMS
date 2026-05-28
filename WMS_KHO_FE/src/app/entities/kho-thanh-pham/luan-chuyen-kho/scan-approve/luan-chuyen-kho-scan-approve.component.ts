import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  LuanChuyenKhoService,
  MinimalLocation,
  WarehouseTransferRequirement,
} from '../service/luan-chuyen-kho.service';
import { forkJoin, Observable } from 'rxjs';
import { ConfirmDialogComponent } from '../../chuyen-kho/dialog/confirm-dialog.component';

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
export class LuanChuyenKhoScanApproveComponent implements OnInit {
  scanMode: 'pallet' | 'thung' = 'pallet';
  scanValue = '';
  requirementId?: number;
  private locationMap = new Map<string, string>();
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

  // ── Scan ────────────────────────────────────────────────────────────────────
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private luanChuyenKhoService: LuanChuyenKhoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.paramMap.get('id');
    if (orderId) {
      this.requirementId = Number(orderId);
      this.loadRequirement(this.requirementId);
    }
  }

  private loadRequirement(id: number): void {
    forkJoin({
      locations: this.luanChuyenKhoService.getMinimalLocations(),
      requirements: this.luanChuyenKhoService.getRequirements(1, 200),
    }).subscribe({
      next: ({ locations, requirements }) => {
        this.buildLocationMap(locations);
        const requirement = (requirements || []).find((item) => item.id === id);
        if (!requirement) {
          return;
        }
        this.applyRequirementToForm(requirement);
      },
      error: (err) => {
        console.error('[LuanChuyenKhoScanApprove] Lỗi lấy dữ liệu đơn:', err);
      },
    });
  }

  private buildLocationMap(locations: MinimalLocation[]): void {
    this.locationMap.clear();
    (locations || []).forEach((loc) => {
      this.locationMap.set(String(loc.id), loc.code);
    });
  }

  private getLocationCode(rawWarehouse: string): string {
    return this.locationMap.get(String(rawWarehouse)) || rawWarehouse;
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
                console.error('[LuanChuyenKhoScanApprove] Lỗi lưu scan thùng:', err);
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
                console.error('[LuanChuyenKhoScanApprove] Lỗi lưu scan pallet:', err);
                this.snackBar.open('Không lưu được pallet scan vào đơn.', 'Đóng', { duration: 3000 });
                this.activeScanRequests = Math.max(0, this.activeScanRequests - 1);
              },
            });
        }
      },
      error: (err) => {
        console.error('[LuanChuyenKhoScanApprove] Lỗi tra cứu mã scan:', err);
        this.snackBar.open('Mã scan không hợp lệ hoặc không tìm thấy dữ liệu.', 'Đóng', { duration: 3000 });
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
      this.luanChuyenKhoService.scanPalletBySerial(scannedCode).subscribe({
        next: (res: any) => {
          const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
          const firstItem = items[0] || {};
          const palletDetailId = firstItem?.pallet_info_detail_id || firstItem?.pallet_id || firstItem?.id;
          if (!palletDetailId) {
            observer.error(new Error('Pallet detail id not found'));
            return;
          }
          observer.next({
            palletDetailId,
            inventoryIdentifier: firstItem?.identifier || firstItem?.inventory_identifier || '---',
            serialPallet: firstItem?.serial_pallet || scannedCode,
            quantity: firstItem?.quantity_imported ?? firstItem?.quantity ?? 0,
            locationId: firstItem?.location_id,
            sapCode: firstItem?.sap_code || '',
            name: firstItem?.name || '',
          });
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  onApprove(): void {
    if (!this.requirementId) {
      this.snackBar.open('Không xác định được đơn để phê duyệt.', 'Đóng', { duration: 3000 });
      return;
    }
    this.luanChuyenKhoService.updateRequirement({
      id: this.requirementId,
      status: 'Đã duyệt',
    }).subscribe({
      next: () => {
        this.snackBar.open('Đã xác nhận phê duyệt đơn.', 'Đóng', { duration: 3000 });
        this.router.navigate(['../../list'], { relativeTo: this.route });
      },
      error: (err) => {
        console.error('[LuanChuyenKhoScanApprove] Lỗi phê duyệt đơn:', err);
        this.snackBar.open('Không thể phê duyệt đơn.', 'Đóng', { duration: 3000 });
      },
    });
  }

  confirmAndApprove(): void {
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
    this.router.navigate(['../../list'], { relativeTo: this.route });
  }
}