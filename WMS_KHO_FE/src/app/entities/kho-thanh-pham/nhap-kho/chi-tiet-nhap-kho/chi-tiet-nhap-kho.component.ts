import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NhapKhoService } from '../service/nhap-kho.service';
import { BoxListDialogComponent } from '../dialog/box-list-dialog.component';
import { ConfirmDialogComponent } from '../../chuyen-kho/dialog/confirm-dialog.component';
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
  templateUrl: './chi-tiet-nhap-kho.component.html',
  styleUrl: './chi-tiet-nhap-kho.component.scss',
})
export class ChiTietNhapKhoComponent implements OnInit {
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
    // 'actions'
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
    private nhapKhoService: NhapKhoService
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



  goBack(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }

}
