import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScanCheckComponent } from '../scan-check/scan-check.component';
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
  templateUrl: './phe-duyet.component.html',
  styleUrl: './phe-duyet.component.scss',
})
export class PheDuyetComponent implements OnInit {
  importId: number | undefined;
  // nhapKhoData: ScannedItem | undefined;
  currentPage = 1;
  //bien scan
  scanPallet: string = '';
  scanLocation: string = '';

  displayedColumns: string[] = [
    'stt',
    'palletCode',
    'boxCode',
    'boxQuantity',
    'updatedDate',
    // 'scanStatus',
    'actions'
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

        // console.log(' Calculated:', {
        //   soPallet,
        //   soThung,
        //   soLuongSP,
        // });
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

  onPageChange(page: number): void {
    // Load data for new page
  }

  onCancel(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }

  onReject(): void {
    // Xử lý từ chối
  }

  onConfirm(): void {
    // Xử lý xác nhận
  }
  goBack(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }
}
