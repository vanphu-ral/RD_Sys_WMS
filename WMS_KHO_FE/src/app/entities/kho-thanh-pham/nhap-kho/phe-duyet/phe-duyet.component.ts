import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScanCheckComponent } from '../scan-check/scan-check.component';
import { MatDialog } from '@angular/material/dialog';
import { NhapKhoService } from '../service/nhap-kho.service';
import { BoxListDialogComponent } from '../dialog/box-list-dialog.component';
import { StringLengthRule } from 'devextreme/common';
import { ConfirmDialogComponent } from '../../chuyen-kho/dialog/confirm-dialog.component';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../../services/auth.service';
import { PermissionService } from '../../../../services/permission.service';
import { HasRoleDirective } from '../../../../services/has-role.directive';
import { resolveApiErrorMessage } from '../../../../services/api-error-message.util';
export interface DetailItem {
  id: number;
  // nếu không có trường warehouse_import_requirement_id trong API mới, có thể để optional
  warehouse_import_requirement_id?: number;
  poNumber: string;
  inventoryCode: string;
  palletCode: string;
  boxesInPallet: number;        // num_box_per_pallet hoặc list_box.length
  itemsPerBox: number;         // quantity_per_box
  totalItems: number;          // total_quantity (hoặc boxesInPallet * itemsPerBox)
  itemNoSku: string;
  client: string;              // customer_name hoặc general_info.client_id
  dateCode: string;
  productionDecisionNumber: string; // production_decision_number
  productionTeam: string;      // QDSX (từ general_info.production_team)
  note: string;
  scanStatus: 'Đã scan' | 'Chưa scan';
  listBox?: any[];             // giữ list_box nếu cần hiển thị chi tiết hộp
  confirmed?: boolean;
  locationId?: number;
}

export interface BoxItem {
  id?: number;
  boxCode: string;
  quantity: number;
  note: string;
  importPalletId: number;
  confirm: boolean;
  scanBy: string;
  timeChecked: string;
  listSerialItem: string;
  locationId?: number;
}

export interface MainInfo {
  soPallet: number;
  soThung: number;
  soLuongSP: number;
  wo_code: string;
  lot_number: string;
  updated_date: string;
  production_team: string;
  po_code?: string;
  inventory_name?: string;
  client_id?: string;
  note?: string;
}
@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './phe-duyet.component.html',
  styleUrl: './phe-duyet.component.scss',
})
export class PheDuyetComponent implements OnInit {
  importId: number | undefined;
  // nhapKhoData: ScannedItem | undefined;
  //bien scan
  scanPallet: string = '';
  scanLocation: string = '';
  selectedTabIndex: number = 0;

  showApproveButton: boolean = true;

  displayedColumns: string[] = [
    'stt',
    'poNumber',
    'inventoryCode',
    'palletCode',
    'boxesInPallet',
    'itemsPerBox',
    'totalItems',
    'itemNoSku',
    'client',
    'dateCode',
    'productionDecisionNumber',
    // 'productionTeam',
    'note',
    'scanStatus',
    'actions'
  ];

  displayedBoxColumns: string[] = [
    'stt',
    'boxCode',
    'quantity',
    'timeChecked',
    'scanBy'
  ];


  mainInfo: MainInfo = {
    po_code: '',
    inventory_name: '',
    client_id: '',
    soPallet: 0,
    soThung: 0,
    soLuongSP: 0,
    production_team: '',
    wo_code: '',
    lot_number: '',
    updated_date: '',
    note: '',
  };

  pageSize: number = 10;
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  pagedDetailList: DetailItem[] = [];

  currentPageBox: number = 1;
  pageSizeBox: number = 10;
  totalBoxItems: number = 0;
  totalBoxPages: number = 0;

  boxList: BoxItem[] = [];
  pagedBoxList: BoxItem[] = [];

  detailList: DetailItem[] = [];
  selectedMode: 'pallet' | 'thung' | null = null;

  //confirm
  isProcessingApprove = false;

  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private nhapKhoService: NhapKhoService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.importId = +params['id'];
      if (this.importId) {
        this.loadData(this.importId);
      }
    });
    console.log('User roles:', this.permissionService.getUserRoles());
    console.log('Can approve:', this.canApprove());
    console.log('Show approve button:', this.showApproveButton);

    const state = history.state;
    if (state.updatedList) {
      this.detailList = state.updatedList;
    }
  }


  loadData(id: number): void {
    this.nhapKhoService.getImportRequirement(id).subscribe({
      next: (res) => {
        const info = res?.data?.general_info ?? res?.general_info ?? {};

        this.showApproveButton = info.status === undefined ? true : !info.status;

        const pallets = Array.isArray(info.list_pallet) ? info.list_pallet
          : Array.isArray(info.listPallet) ? info.listPallet
            : [];

        const soPallet = pallets.length;
        const soThung = pallets.reduce((sum: number, p: any) => {
          const boxesFromNum = Number(p.num_box_per_pallet ?? p.numBoxPerPallet ?? 0);
          const boxesFromList = Array.isArray(p.list_box) ? p.list_box.length : (Array.isArray(p.listBox) ? p.listBox.length : 0);
          const boxes = Math.max(boxesFromNum, boxesFromList);
          return sum + boxes;
        }, 0);
        const soLuongSP = pallets.reduce((sum: number, p: any) => sum + Number(p.total_quantity ?? p.totalQuantity ?? 0), 0);

        this.mainInfo = {
          soPallet,
          soThung,
          soLuongSP,
          wo_code: info.wo_code || info.woCode || '',
          lot_number: info.lot_number || info.lotNumber || '',
          updated_date: this.formatDate(info.production_date) || '',
          production_team: info.production_team || info.productionTeam || '',
          po_code: undefined,
          inventory_name: info.inventory_name || info.inventoryName || '',
          client_id: info.client_id || info.clientId || '',
          note: info.note || ''
        };

        // reset danh sách
        this.detailList = [];
        this.boxList = [];
        this.pagedBoxList = [];

        // Map pallets -> detailList (tab pallet) và boxList (tab thùng từ list_box)
        pallets.forEach((p: any, index: number) => {
          const itemsPerBox = Number(p.quantity_per_box ?? p.quantityPerBox ?? 0);
          const listBox = Array.isArray(p.list_box)
            ? p.list_box
            : Array.isArray(p.listBox)
              ? p.listBox
              : [];
          const boxesInPallet = Number(
            p.num_box_per_pallet ?? p.numBoxPerPallet ?? listBox.length
          );
          const totalItems = Number(p.total_quantity ?? p.totalQuantity ?? boxesInPallet * itemsPerBox);

          const serialPallet = (p.serial_pallet ?? p.serialPallet ?? '').trim();

          if (serialPallet) {
            const mapped: DetailItem = {
              id: Number(p.id ?? index),
              warehouse_import_requirement_id: undefined,
              poNumber: p.po_number ?? p.poNumber ?? '',
              inventoryCode: info.inventory_code ?? info.inventoryName ?? '',
              palletCode: serialPallet,
              boxesInPallet,
              itemsPerBox,
              totalItems,
              itemNoSku: p.item_no_sku ?? p.itemNoSku ?? '',
              client: p.customer_name ?? info.client_id ?? '',
              dateCode: p.date_code ?? info.production_date ?? '',
              productionDecisionNumber: p.production_decision_number ?? '',
              productionTeam: (info.production_team ?? '').toString().trim(),
              note: p.note ?? '',
              confirmed: p.confirmed,
              scanStatus: p.scan_status ? 'Đã scan' : 'Chưa scan',
              locationId: this.parseLocationId(p.location_id ?? p.locationId),
              listBox,
            };
            this.detailList.push(mapped);
          }

          listBox.forEach((b: any) => {
            this.boxList.push(this.mapBoxItem(b, p));
          });
        });

        this.totalItems = this.detailList.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize) || 1;
        this.totalBoxItems = this.boxList.length;
        this.totalBoxPages = Math.ceil(this.totalBoxItems / this.pageSizeBox) || 1;

        this.setPagedData();
        this.setPagedBoxData();
      },
      error: (err) => {
        console.error('[loadData] Lỗi khi lấy dữ liệu nhập kho:', err);
      }
    });
  }

  //phan quyen 
  canApprove(): boolean {
    const hasRole = this.permissionService.hasRole(['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN']);
    console.log('canApprove() =', hasRole);
    return hasRole;
  }


  openBoxList(item: DetailItem): void {
    this.dialog.open(BoxListDialogComponent, {
      width: '720px',
      maxWidth: '95vw',
      data: {
        pallet: item
      }
    });
  }
  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
  }

  private mapBoxItem(b: any, pallet?: any): BoxItem {
    const rawTime = b.time_checked ?? b.timeChecked ?? '';
    return {
      id: b.id,
      boxCode: b.box_code ?? b.boxCode ?? '',
      quantity: Number(b.quantity ?? b.quantity_per_box ?? 0),
      note: b.note ?? '',
      importPalletId: Number(b.import_pallet_id ?? b.importPalletId ?? pallet?.id ?? 0),
      confirm: Boolean(b.confirmed ?? b.confirm),
      scanBy: b.scan_by ?? b.scanBy ?? '',
      timeChecked: rawTime ? this.formatDate(rawTime) : '-',
      listSerialItem: b.list_serial_items ?? b.listSerialItems ?? '',
      locationId: this.parseLocationId(b.location_id ?? b.locationId),
    };
  }

  private parseLocationId(value: unknown): number | undefined {
    const id = Number(value);
    return id && !Number.isNaN(id) ? id : undefined;
  }

  private isPalletScannedForApprove(p: DetailItem | any): boolean {
    return (
      p.scan_status === true ||
      ((p.scanStatus ?? '').toString().toLowerCase().includes('đã'))
    );
  }

  /** Các mục sẽ confirm — location_id phải tồn tại trong GET /locations/minimal. */
  private findItemsWithInvalidLocation(
    validLocationIds: Set<number>
  ): { code: string; kind: 'pallet' | 'thùng' }[] {
    const invalid: { code: string; kind: 'pallet' | 'thùng' }[] = [];
    const palletIdsInDetailList = new Set((this.detailList || []).map((p) => p.id));

    for (const p of this.detailList || []) {
      if (!this.isPalletScannedForApprove(p) || p.confirmed === true) {
        continue;
      }
      const locId = this.parseLocationId(p.locationId ?? (p as any).location_id);
      if (!locId || !validLocationIds.has(locId)) {
        invalid.push({ code: p.palletCode || `Pallet #${p.id}`, kind: 'pallet' });
      }
    }

    for (const b of this.boxList || []) {
      if (
        palletIdsInDetailList.has(b.importPalletId) ||
        !this.isBoxScanned(b) ||
        b.confirm === true
      ) {
        continue;
      }
      const locId = this.parseLocationId(b.locationId);
      if (!locId || !validLocationIds.has(locId)) {
        invalid.push({ code: b.boxCode || `Thùng #${b.id}`, kind: 'thùng' });
      }
    }

    for (const p of this.detailList || []) {
      if (!this.isPalletScannedForApprove(p)) {
        continue;
      }
      const listBox = Array.isArray(p.listBox) ? p.listBox : [];
      for (const b of listBox) {
        if (!this.isBoxScanned(b) || b.confirmed === true) {
          continue;
        }
        const locId = this.parseLocationId(b.location_id ?? b.locationId);
        if (!locId || !validLocationIds.has(locId)) {
          const code = b.box_code ?? b.boxCode ?? `Thùng #${b.id}`;
          if (!invalid.some((item) => item.code === code && item.kind === 'thùng')) {
            invalid.push({ code, kind: 'thùng' });
          }
        }
      }
    }

    return invalid;
  }

  private openApproveConfirmDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Xác nhận phê duyệt',
        message:
          'Bạn có chắc chắn muốn phê duyệt yêu cầu nhập kho này? Hành động sẽ không thể hoàn tác.',
        confirmText: 'Phê duyệt',
        cancelText: 'Hủy',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.executeApprove();
      }
    });
  }


  trackByIndex(index: number, item: any): number {
    return index;
  }
  onSelectMode(mode: 'pallet' | 'thung') {
    if (this.selectedMode === mode) {
      this.selectedMode = null;
    } else {
      this.selectedMode = mode;

      // focus vào input pallet sau khi chọn mode
      setTimeout(() => {
        this.palletInput?.nativeElement?.focus();
      }, 100);
    }
  }
  //scan
  onScan(item: DetailItem): void {
    if (!this.importId || !item?.id) {
      console.error('Thiếu dữ liệu để điều hướng:', this.importId, item?.id);
      return;
    }

    // Navigate với mode='single' và truyền palletId
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/phe-duyet', this.importId, 'scan'],
      {
        queryParams: {
          mode: 'single',
          palletId: item.id,
          palletCode: item.palletCode
        }
      }
    );
  }

  onScanAll(): void {
    if (!this.importId) {
      console.error('Thiếu dữ liệu để điều hướng:', this.importId);
      return;
    }

    // Navigate với mode='all'
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/phe-duyet', this.importId, 'scan'],
      {
        queryParams: {
          mode: 'all'
        }
      }
    );
  }


  setPagedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedDetailList = this.detailList.slice(startIndex, endIndex);
  }

  setPagedBoxData(): void {
    const startIndex = (this.currentPageBox - 1) * this.pageSizeBox;
    const endIndex = startIndex + this.pageSizeBox;
    this.pagedBoxList = this.boxList.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.setPagedData();
  }

  onPageChangeBox(page: number): void {
    if (page < 1 || page > this.totalBoxPages) return;
    this.currentPageBox = page;
    this.setPagedBoxData();
  }

  onCancel(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }

  onReject(): void {
    // Xử lý từ chối
  }

  onConfirm(): void {
    if (!this.canApprove()) {
      alert('Bạn không có quyền phê duyệt!');
      return;
    }
    if (this.importId === undefined) {
      this.snackBar.open('Không tìm thấy ID yêu cầu nhập kho!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    // Kiểm tra scan (giữ nguyên logic hiện tại)
    const palletNotScanned = (this.detailList || []).some((p: any) => {
      const palletScanned =
        p.scan_status === true ||
        ((p.scanStatus ?? '').toString().toLowerCase().includes('đã'));
      if (palletScanned) return false;

      const listBox = Array.isArray(p.listBox) ? p.listBox : (Array.isArray(p.list_box) ? p.list_box : []);
      return listBox.some((b: any) => !this.isBoxScanned(b));
    });

    const boxNotScanned = (this.boxList || []).some((b: any) => !this.isBoxScanned(b));

    // if (palletNotScanned || boxNotScanned) {
    //   this.snackBar.open('Vui lòng scan tất cả pallet/thùng trước khi phê duyệt', 'Đóng', {
    //     duration: 4000,
    //     panelClass: ['snackbar-error'],
    //   });
    //   return;
    // }

    // Kiểm tra nếu tất cả đã confirmed rồi -> thông báo và dừng
    const allPalletsConfirmed = (this.detailList || []).every((p: any) => p.confirmed === true);
    // pagedBoxList có thể chứa các box độc lập; nếu không có pagedBoxList thì coi là true
    const allBoxesConfirmed = (this.boxList || []).every((b: any) => b.confirm === true || b.confirmed === true);

    // Nếu trong detailList có pallet chứa list_box, cũng kiểm tra các box trong đó
    const nestedBoxesConfirmed = (this.detailList || []).every((p: any) => {
      const listBox = Array.isArray(p.listBox) ? p.listBox : (Array.isArray(p.list_box) ? p.list_box : []);
      return listBox.every((b: any) => b.confirmed === true);
    });

    // if (nestedBoxesConfirmed) {
    //   this.snackBar.open('Yêu cầu này đã được phê duyệt trước đó.', 'Đóng', {
    //     duration: 3000,
    //     panelClass: ['snackbar-success'],
    //   });
    //   return;
    // }

    this.nhapKhoService
      .getMinimalLocations()
      .pipe(
        catchError((err) => {
          console.error('[onConfirm] Lỗi tải danh sách location:', err);
          this.snackBar.open(
            'Không tải được danh sách kho. Vui lòng thử lại.',
            'Đóng',
            { duration: 4000, panelClass: ['snackbar-error'] }
          );
          return of(null);
        })
      )
      .subscribe((locations) => {
        if (!locations) {
          return;
        }

        const validIds = new Set(
          (locations || []).map((loc) => Number(loc.id)).filter((id) => !Number.isNaN(id))
        );
        const invalidItems = this.findItemsWithInvalidLocation(validIds);

        if (invalidItems.length > 0) {
          const preview = invalidItems
            .slice(0, 3)
            .map((item) => `${item.kind} ${item.code}`)
            .join(', ');
          const more =
            invalidItems.length > 3 ? ` và ${invalidItems.length - 3} mục khác` : '';
          this.snackBar.open(
            `${preview}${more} chưa gán kho hợp lệ. Vui lòng bấm "Scan danh sách" để quét mã kho trước khi phê duyệt.`,
            'Đóng',
            { duration: 9000, panelClass: ['snackbar-error'] }
          );
          return;
        }

        this.openApproveConfirmDialog();
      });
  }





  goBack(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }
  private isBoxScanned(box: any): boolean {
    if (!box) return false;
    const rawTime = box.time_checked ?? box.timeChecked;
    if (rawTime && rawTime !== '-') return true;
    const scanStatus = box.scan_status === true || box.scanStatus === true;
    const confirmed = box.confirmed === true || box.confirm === true;
    return scanStatus || confirmed;
  }

  private computeBoxScanProgress(): number {
    let count = 0;

    const isPalletScanned = (p: any): boolean => {
      if (!p) return false;
      if (p.scan_status === true) return true;
      if ((p.scanStatus ?? '').toString().toLowerCase().includes('đã')) return true;
      return false;
    };

    const isBoxTimeChecked = (b: any): boolean => {
      if (!b) return false;
      const rawTime = b.time_checked ?? b.timeChecked;
      return !!rawTime && rawTime !== '-';
    };

    // 1) Mỗi pallet có 1 box đi kèm → chỉ cộng nếu pallet đã scan
    for (const p of this.detailList || []) {
      if (isPalletScanned(p)) {
        count += 1;
      }
    }

    const palletIdsInDetailList = new Set((this.detailList || []).map((p: any) => p.id));

    // 2) Thùng không thuộc pallet có mã (pallet không có serial) → cộng nếu có time_checked
    for (const b of this.boxList || []) {
      const belongsToDetailPallet = palletIdsInDetailList.has(b.importPalletId);
      if (!belongsToDetailPallet && isBoxTimeChecked(b)) {
        count += 1;
      }
    }

    return count;
  }


  private executeApprove(): void {
    if (this.importId === undefined) return;

    this.isProcessingApprove = true;
    const progress = this.computeBoxScanProgress();
    console.log('[Approve] box_scan_progress to set:', progress);

    const username = this.authService.getUsername();

    // --- Chuẩn bị danh sách chỉ gồm những pallet/box CHƯA confirmed ---
    // Pallet
    const palletsToConfirm = (this.detailList || [])
      .filter((p: any) => {
        const palletScanned =
          p.scan_status === true ||
          ((p.scanStatus ?? '').toString().toLowerCase().includes('đã'));
        return palletScanned && p.confirmed !== true;
      })
      .map((p: any) => ({
        id: p.id,
        serial_pallet: p.serial_pallet ?? p.palletCode ?? p.pallet_code,
        confirmed: true
      }));

    const palletIdsInDetailList = new Set((this.detailList || []).map((p: any) => p.id));

    // Thùng thuộc pallet không có mã serial (không nằm trong detailList)
    const boxesToConfirmFromPaged = (this.boxList || [])
      .filter(
        (b: any) =>
          !palletIdsInDetailList.has(b.importPalletId) &&
          this.isBoxScanned(b) &&
          b.confirm !== true
      )
      .map((b: any) => ({
        id: b.id,
        box_code: b.box_code ?? b.boxCode,
        confirmed: true
      }));

    // Box trong pallet
    const boxesToConfirmFromPallets: any[] = []; (this.detailList || []).forEach((p: any) => {
      const palletScanned = p.scan_status === true || ((p.scanStatus ?? '').toString().toLowerCase().includes('đã'));
      if (palletScanned) {
        const listBox = Array.isArray(p.listBox) ? p.listBox : (Array.isArray(p.list_box) ? p.list_box : []); listBox.forEach((b: any) => {
          if (this.isBoxScanned(b) && b.confirmed !== true) {
            boxesToConfirmFromPallets.push({ id: b.id, box_code: b.box_code ?? b.boxCode, import_pallet_id: b.import_pallet_id ?? b.importPalletId ?? p.id, confirmed: true });
          }
        });
      }
    });


    // Nếu không có gì để confirm (đã được kiểm tra trước nhưng double-check)
    if (palletsToConfirm.length === 0 && boxesToConfirmFromPaged.length === 0 && boxesToConfirmFromPallets.length === 0) {
      this.isProcessingApprove = false;
      this.snackBar.open('Không có mục nào cần phê duyệt.', 'Đóng', { duration: 3000 });
      return;
    }

    // --- Kiểm tra duplicate identifier trong những mục sẽ confirm ---
    const identifiers: string[] = [];
    palletsToConfirm.forEach(p => { if (p.serial_pallet) identifiers.push(String(p.serial_pallet)); });
    boxesToConfirmFromPaged.forEach(b => { if (b.box_code) identifiers.push(String(b.box_code)); });
    boxesToConfirmFromPallets.forEach(b => { if (b.box_code) identifiers.push(String(b.box_code)); });

    const dupes = identifiers.reduce((acc: string[], id: string, idx: number, arr: string[]) => {
      if (id && arr.indexOf(id) !== idx && !acc.includes(id)) acc.push(id);
      return acc;
    }, []);

    if (dupes.length > 0) {
      this.isProcessingApprove = false;
      console.warn('Duplicate identifiers detected in confirm payload:', dupes);
      this.snackBar.open(`Không thể phê duyệt: phát hiện mã trùng  ${dupes.slice(0, 3).join(', ')}. Vui lòng kiểm tra.`, 'Đóng', {
        duration: 8000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    // --- Xây payload API chỉ với phần tử cần confirm ---
    const apiCalls: Observable<any>[] = [];

    if (palletsToConfirm.length > 0) {
      const palletPayload = { updates: palletsToConfirm.map(p => ({ id: p.id, confirmed: true })) };
      console.log('palletPayload', palletPayload);
      apiCalls.push(this.nhapKhoService.updatePalletInfo(palletPayload));
    }

    // Gộp boxes từ paged + nested
    const boxesToConfirm = [...boxesToConfirmFromPaged, ...boxesToConfirmFromPallets];
    if (boxesToConfirm.length > 0) {
      const boxPayload = { updates: boxesToConfirm.map(b => ({ id: b.id, confirmed: true })) };
      const missingBoxIds = boxPayload.updates.filter((u: any) => !u.id);
      if (missingBoxIds.length > 0) {
        console.warn('Missing box id(s) in payload:', missingBoxIds);
        this.isProcessingApprove = false;
        this.snackBar.open('Có thùng/pallet thiếu ID, không thể phê duyệt. Vui lòng kiểm tra dữ liệu.', 'Đóng', {
          duration: 6000,
          panelClass: ['snackbar-error'],
        });
        return;
      }
      console.log('boxPayload', boxPayload);
      apiCalls.push(this.nhapKhoService.updateContainerInventories(boxPayload));
    }

    // 1) Xác nhận pallet/thùng (confirmed) — phải thành công trước
    // 2) Cập nhật box_scan_progress
    // 3) Cập nhật trạng thái đơn phê duyệt
    const confirmStep$: Observable<unknown> = apiCalls.length
      ? forkJoin(apiCalls)
      : of(undefined);

    confirmStep$
      .pipe(
        switchMap(() =>
          this.nhapKhoService.patchImportRequirement(this.importId!, {
            box_scan_progress: progress,
          })
        ),
        switchMap(() =>
          this.nhapKhoService.updateStatus(this.importId!, true, username)
        )
      )
      .subscribe({
        next: () => {
          this.isProcessingApprove = false;
          this.snackBar.open('Phê duyệt thành công!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-success'],
          });
          this.loadData(this.importId!);
        },
        error: (err: unknown) => {
          this.isProcessingApprove = false;
          console.error('Lỗi khi phê duyệt:', err);
          this.snackBar.open(
            resolveApiErrorMessage(err, 'Phê duyệt thất bại'),
            'Đóng',
            { duration: 8000, panelClass: ['snackbar-error'] }
          );
        },
      });
  }

}
