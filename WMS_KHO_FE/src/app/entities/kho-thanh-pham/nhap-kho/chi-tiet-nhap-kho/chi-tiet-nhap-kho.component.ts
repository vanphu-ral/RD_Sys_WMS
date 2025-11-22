import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { NhapKhoService } from '../service/nhap-kho.service';
export interface DetailItem {
  id: number;
  warehouse_import_requirement_id: number;
  palletCode: string;
  boxCode: string;
  boxQuantity: number;
  updatedBy: string;
  updatedDate: string;
  scanStatus: 'Đã scan' | 'Chưa scan';
}

export interface MainInfo {
  maPO: string;
  maSanPham: string;
  maKhachHang: string;
  tenSanPham: string;
  soPallet: number;
  soThung: number;
  soLuongSP: number;
  maWO: number;
  soLOT: string;
  ngayNhap: string;
  ghiChu: string;
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

  showApproveButton: boolean = true;

  displayedColumns: string[] = [
    'stt',
    'palletCode',
    'boxCode',
    'boxQuantity',
    'updatedBy',
    'updatedDate',
    // 'scanStatus',
    // 'actions'
  ];


  mainInfo: MainInfo = {
    maPO: '',
    maSanPham: '',
    maKhachHang: '',
    tenSanPham: '',
    soPallet: 0,
    soThung: 0,
    soLuongSP: 0,
    maWO: 0,
    soLOT: '',
    ngayNhap: '',
    ghiChu: '',
  };

  pageSize: number = 10;
  currentPage: number = 1;
  totalItems: number = 0;
  totalPages: number = 0;
  pagedDetailList: DetailItem[] = [];

  detailList: DetailItem[] = [];
  selectedMode: 'pallet' | 'thung' | null = null;

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
        const info = res.data.import_requirement;
        this.showApproveButton = !info.status;

        const containers = res.data.containers || [];

        // Tính toán từ containers
        const uniquePallets = new Set(containers.map((c: any) => c.serial_pallet));
        const soPallet = uniquePallets.size;
        const soThung = containers.length;
        const soLuongSP = containers.reduce((sum: number, c: any) => sum + (c.box_quantity || 0), 0);

        this.mainInfo = {
          maPO: info.po_code || '',
          maSanPham: '',
          maKhachHang: String(info.client_id),
          tenSanPham: info.inventory_name || '',
          soPallet: soPallet,
          soThung: soThung,
          soLuongSP: soLuongSP,
          maWO: Number(info.wo_code) || 0,
          soLOT: info.lot_number || '',
          ngayNhap: this.formatDate(info.updated_date),
          ghiChu: info.note || '',
        };

        this.detailList = containers.map((c: any): DetailItem => ({
          id: c.id,
          warehouse_import_requirement_id: c.warehouse_import_requirement_id,
          palletCode: c.serial_pallet,
          boxCode: c.box_code,
          boxQuantity: c.box_quantity,
          updatedBy: c.updated_by,
          updatedDate: this.formatDate(c.updated_date),
          scanStatus: 'Chưa scan',
        }));
        this.totalItems = this.detailList.length;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);

        // Lấy dữ liệu trang đầu tiên
        this.setPagedData();
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu nhập kho:', err);
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

    this.router.navigate([
      '/kho-thanh-pham/nhap-kho-sx/phe-duyet',
      this.importId,
      'scan',
      item.id
    ]);
  }



  onPalletScanEnter() {
    // chuyển focus sang input location
    this.locationInput?.nativeElement?.focus();
  }

  // onLocationScanEnter() {
  //   if (!this.scanPallet || !this.scanLocation) return;

  //   const now = new Date();
  //   const formattedTime = now.toLocaleString('vi-VN', {
  //     hour: '2-digit',
  //     minute: '2-digit',
  //     day: '2-digit',
  //     month: '2-digit',
  //     year: 'numeric',
  //   });

  //   const newItem: ScannedItem = {
  //     maHangHoa: 'LED000035',
  //     tenHangHoa: 'Đèn LED cắm ứng 8W',
  //     serialPallet: this.scanPallet,
  //     serialBox: this.selectedMode === 'thung' ? this.scanPallet : '',
  //     soLuong: 1,
  //     area: 'RD-01',
  //     location: this.scanLocation,
  //     thoiDiemScan: formattedTime,
  //   };

  //   this.snackBar.open('Lưu thành công!', 'Đóng', {
  //     duration: 3000,
  //     horizontalPosition: 'right',
  //     verticalPosition: 'bottom',
  //     panelClass: ['snackbar-success', 'snackbar-position'],
  //   });

  //   // reset input
  //   this.scanPallet = '';
  //   this.scanLocation = '';
  //   this.selectedMode = null;

  //   // focus lại vào pallet để scan tiếp
  //   setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  // }

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
    if (this.importId !== undefined) {
      this.nhapKhoService.updateStatus(this.importId, true).subscribe({
        next: () => {
          this.snackBar.open('Phê duyệt thành công!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-success'],
          });
          this.loadData(this.importId!);
        },
        error: (err) => {
          console.error('Lỗi khi phê duyệt:', err);
          this.snackBar.open('Phê duyệt thất bại!', 'Đóng', {
            duration: 3000,
            panelClass: ['snackbar-error'],
          });
        }
      });
    } else {
      this.snackBar.open('Không tìm thấy ID yêu cầu nhập kho!', 'Đóng', {
        duration: 3000,
        panelClass: ['snackbar-error'],
      });
    }
  }



  goBack(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }
}
