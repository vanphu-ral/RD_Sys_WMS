import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScanCheckComponent } from '../scan-check/scan-check.component';
import { MatDialog } from '@angular/material/dialog';
import { NhapKhoService } from '../service/nhap-kho.service';
import { BoxListDialogComponent } from '../dialog/box-list-dialog.component';
import { StringLengthRule } from 'devextreme/common';
import { ConfirmDialogComponent } from '../../chuyen-kho/dialog/confirm-dialog.component';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../services/auth.service';
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
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.importId = +params['id'];
      if (this.importId) {
        this.loadData(this.importId);
      }
    });

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
        this.pagedBoxList = [];

        // Map pallets -> detailList hoặc pagedBoxList
        pallets.forEach((p: any, index: number) => {
          const itemsPerBox = Number(p.quantity_per_box ?? p.quantityPerBox ?? 0);
          const boxesInPallet = Number(
            p.num_box_per_pallet ?? p.numBoxPerPallet ??
            (Array.isArray(p.list_box) ? p.list_box.length :
              (Array.isArray(p.listBox) ? p.listBox.length : 0))
          );
          const totalItems = Number(p.total_quantity ?? p.totalQuantity ?? (boxesInPallet * itemsPerBox));

          const serialPallet = p.serial_pallet ?? p.serialPallet ?? '';

          if (serialPallet && serialPallet.trim() !== '') {
            // có mã pallet -> đưa vào detailList (tab pallet)
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
              scanStatus: p.scan_status ? 'Đã scan' : 'Chưa scan',
              listBox: Array.isArray(p.list_box) ? p.list_box : []
            };
            this.detailList.push(mapped);
          } else if (Array.isArray(p.list_box) && p.list_box.length > 0) {
            // không có mã pallet nhưng có box -> đưa từng box vào pagedBoxList (tab thùng)
            p.list_box.forEach((b: any) => {
              const boxItem: BoxItem = {
                id: b.id,
                boxCode: b.box_code ?? '',
                quantity: Number(b.quantity ?? b.quantity_per_box ?? 0),
                note: b.note ?? '',
                importPalletId: Number(b.import_pallet_id ?? p.id ?? 0),
                confirm: Boolean(b.confirmed),
                scanBy: b.scan_by ?? '',
                timeChecked: b.time_checked ?? '',
                listSerialItem: b.list_serial_items ?? ''
              };
              this.pagedBoxList.push(boxItem);
            });
          }
        });

        this.totalItems = this.detailList.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);

        this.setPagedData();
      },
      error: (err) => {
        console.error('[loadData] Lỗi khi lấy dữ liệu nhập kho:', err);
      }
    });
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
    const d = new Date(dateStr);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
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

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.setPagedData();
  }

  onCancel(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }

  onReject(): void {
    // Xử lý từ chối
  }

  onConfirm(): void {
    if (this.importId === undefined) {
      this.snackBar.open('Không tìm thấy ID yêu cầu nhập kho!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    // Kiểm tra: chỉ cần đảm bảo tất cả pallet/box đã được scan (không cần confirmed)
    const palletNotScanned = (this.detailList || []).some((p: any) => {
      // pallet được coi là đã scan nếu scan_status === true hoặc scanStatus chứa 'đã'
      const palletScanned = (p.scan_status === true) ||
        ((p.scanStatus ?? '').toString().toLowerCase().includes('đã'));
      if (palletScanned) return false;

      // nếu pallet chưa có flag scan, kiểm tra từng box trong pallet: nếu có box chưa có time_checked và không có scan_status thì coi pallet chưa scan
      const listBox = Array.isArray(p.listBox) ? p.listBox : [];
      return listBox.some((b: any) => !this.isBoxScanned(b));
    });

    // Kiểm tra các box độc lập trên trang (pagedBoxList): chỉ cần box đã scan (time_checked hoặc scan_status)
    const boxNotScanned = (this.pagedBoxList || []).some((b: any) => !this.isBoxScanned(b));

    if (palletNotScanned || boxNotScanned) {
      this.snackBar.open('Vui lòng scan tất cả pallet/thùng trước khi phê duyệt', 'Đóng', {
        duration: 4000,
        panelClass: ['snackbar-error'],
      });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        title: 'Xác nhận phê duyệt',
        message: 'Bạn có chắc chắn muốn phê duyệt yêu cầu nhập kho này? Hành động sẽ không thể hoàn tác.',
        confirmText: 'Phê duyệt',
        cancelText: 'Hủy'
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.executeApprove();
      }
    });
  }




  goBack(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }
  private isBoxScanned(box: any): boolean {
    // Box được coi là đã scan nếu có time_checked (không null/empty) hoặc scan_status true hoặc confirmed true
    if (!box) return false;
    const hasTimeChecked = !!(box.time_checked || box.timeChecked); // hỗ trợ nhiều tên trường
    const scanStatus = box.scan_status === true || box.scanStatus === true;
    const confirmed = box.confirmed === true || box.confirm === true;
    return hasTimeChecked;
  }

  private computeBoxScanProgress(): number {
    let count = 0;

    // Kiểm tra pallet đã scan (dựa trên scan_status hoặc scanStatus text)
    const isPalletScanned = (p: any): boolean => {
      if (!p) return false;
      if (p.scan_status === true) return true;
      if ((p.scanStatus ?? '').toString().toLowerCase().includes('đã')) return true;
      return false;
    };

    // Kiểm tra box đã scan (hỗ trợ cả snake_case từ API và camelCase bạn map)
    const isBoxScannedFromApi = (b: any): boolean => {
      if (!b) return false;
      // time_checked (API) hoặc timeChecked (map)
      const hasTimeChecked = !!(b.time_checked ?? b.timeChecked);
      const scanBy = !!(b.scan_by ?? b.scanBy);
      const scanStatus = b.scan_status === true || b.scanStatus === true;
      const confirmed = b.confirmed === true || b.confirm === true;
      return hasTimeChecked || scanBy || scanStatus || confirmed;
    };

    // 1) Đếm từ detailList (những pallet có palletCode)
    for (const p of this.detailList || []) {
      const listBox = Array.isArray(p.listBox) ? p.listBox : [];

      if (listBox.length > 0) {
        for (const b of listBox) {
          // listBox có thể chứa object từ API (snake_case) hoặc đã map; dùng isBoxScannedFromApi
          if (isBoxScannedFromApi(b) || isPalletScanned(p)) {
            count++;
          }
        }
      } else {
        // pallet có boxesInPallet nhưng không có listBox: nếu pallet được đánh scan thì cộng boxesInPallet
        const boxesFromNum = Number(p.boxesInPallet ?? 0);
        if (boxesFromNum > 0 && isPalletScanned(p)) {
          count += boxesFromNum;
        }
      }
    }

    // 2) Đếm các box độc lập trong pagedBoxList (những pallet không có serial được map thành box riêng)
    for (const b of this.pagedBoxList || []) {
      // pagedBoxList dùng interface BoxItem: timeChecked, scanBy, confirm
      const hasTimeChecked = !!(b.timeChecked ?? '');
      const hasScanBy = !!(b.scanBy ?? '');
      const confirmed = b.confirm === true;
      if (hasTimeChecked || hasScanBy || confirmed) {
        count++;
      }
    }

    return count;
  }



  private executeApprove(): void {
    if (this.importId === undefined) return;

    this.isProcessingApprove = true;
    const progress = this.computeBoxScanProgress();
    console.log('[Approve] box_scan_progress to set:', progress);

    const apiCalls: Observable<any>[] = [];
    const username = this.authService.getUsername();

    // Pallet payload: đảm bảo có id cho mỗi update
    if ((this.detailList || []).length > 0) {
      const palletPayload = {
        updates: this.detailList.map(p => ({
          id: p.id,            // <-- đảm bảo có id
          confirmed: true,
          updated_by: username,
        }))
      };
      apiCalls.push(this.nhapKhoService.updatePalletInfo(palletPayload));
    }
    // Box payload: phải include id (hoặc trường id đúng theo API)
    if ((this.pagedBoxList || []).length > 0) {
      const boxPayload = {
        updates: this.pagedBoxList.map(b => ({
          id: b.id,
          confirmed: true,
          updated_by: username,
        }))
      };
      // Kiểm tra nhanh: nếu có phần tử nào thiếu id thì log và không gọi API box
      const missingBoxIds = boxPayload.updates.filter((u: any) => !u.id);
      if (missingBoxIds.length > 0) {
        console.warn('Missing box id(s) in payload:', missingBoxIds);
        // Thông báo rõ cho user và dừng quá trình
        this.isProcessingApprove = false;
        this.snackBar.open('Có thùng/pallet thiếu ID, không thể phê duyệt. Vui lòng kiểm tra dữ liệu.', 'Đóng', {
          duration: 6000,
          panelClass: ['snackbar-error'],
        });
        return;
      }
      apiCalls.push(this.nhapKhoService.updateContainerInventories(boxPayload));
    }

    this.nhapKhoService.patchImportRequirement(this.importId, { box_scan_progress: progress })
      .pipe(
        switchMap(() => apiCalls.length ? forkJoin(apiCalls) : of(null)),
        switchMap(() => this.nhapKhoService.updateStatus(this.importId!, true))
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
        error: (err) => {
          this.isProcessingApprove = false;
          console.error('Lỗi khi phê duyệt hoặc cập nhật:', err);

          // --- Xử lý lỗi chi tiết và thân thiện với người dùng ---
          const status = err?.status;
          const errBody = err?.error;

          // 1) Nếu backend trả detail là mảng (ví dụ pydantic validation), gom các msg
          if (Array.isArray(errBody?.detail)) {
            const messages = errBody.detail.map((d: any) => {
              // nếu có loc và msg thì format rõ ràng
              const loc = Array.isArray(d.loc) ? d.loc.join('.') : d.loc;
              return loc ? `${loc}: ${d.msg}` : d.msg || JSON.stringify(d);
            });
            const userMsg = `Lỗi server (${status || '??'}): ${messages.join('; ')}`;
            this.snackBar.open(userMsg, 'Đóng', { duration: 8000, panelClass: ['snackbar-error'] });
            return;
          }

          // 2) Nếu backend trả { detail: '...' } hoặc { message: '...' }
          if (typeof errBody?.detail === 'string' && errBody.detail.trim()) {
            this.snackBar.open(`Lỗi server: ${errBody.detail}`, 'Đóng', { duration: 6000, panelClass: ['snackbar-error'] });
            return;
          }
          if (typeof errBody?.message === 'string' && errBody.message.trim()) {
            this.snackBar.open(`Lỗi server: ${errBody.message}`, 'Đóng', { duration: 6000, panelClass: ['snackbar-error'] });
            return;
          }

          // 3) Nếu err.error là object khác, cố gắng lấy các trường phổ biến
          if (errBody && typeof errBody === 'object') {
            const keys = Object.keys(errBody);
            // lấy giá trị text đầu tiên
            const firstVal = errBody[keys[0]];
            const text = typeof firstVal === 'string' ? firstVal : JSON.stringify(firstVal);
            this.snackBar.open(`Lỗi server (${status || '??'}): ${text}`, 'Đóng', { duration: 6000, panelClass: ['snackbar-error'] });
            return;
          }

          // 4) Fallback: hiển thị message mặc định kèm status
          const fallback = err?.message || `Phê duyệt thất bại (status ${status || '??'})`;
          this.snackBar.open(fallback, 'Đóng', { duration: 6000, panelClass: ['snackbar-error'] });
        }
      });
  }



}
