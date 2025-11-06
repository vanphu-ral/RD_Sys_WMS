import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ScanCheckComponent } from '../scan-check/scan-check.component';
import { MatDialog } from '@angular/material/dialog';
export interface ScannedItem {
  maHangHoa: string;
  tenHangHoa: string;
  serialPallet: string;
  serialBox: string;
  soLuong: number;
  area: string;
  location: string;
  thoiDiemScan: string;
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

export interface DetailItem {
  palletCode: string;
  boxCode: string;
  soPallet: number;
  scanStatus: 'Chưa scan' | 'Đã scan';
}
@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './phe-duyet.component.html',
  styleUrl: './phe-duyet.component.scss',
})
export class PheDuyetComponent implements OnInit {
  nhapKhoId: number | undefined;
  nhapKhoData: ScannedItem | undefined;
  currentPage = 1;
  //bien scan
  scanPallet: string = '';
  scanLocation: string = '';

  displayedColumns: string[] = [
    'stt',
    'palletCode',
    'boxCode',
    'soPallet',
    'scanStatus',
  ];
  scannedList: ScannedItem[] = [
    {
      maHangHoa: 'LED000035',
      tenHangHoa: 'Đèn LED cắm ứng 8W',
      serialPallet: 'P202500191',
      serialBox: 'B202500191',
      soLuong: 10,
      area: 'RD-01',
      location: '01-B01-01-001',
      thoiDiemScan: '31/10/2025 08:35',
    },
  ];
  mainInfo: MainInfo = {
    maPO: '253233',
    maSanPham: 'KHHTTK-202510W5',
    maKhachHang: 'KHTT',
    tenSanPham: 'Đèn LED chiếu pha 6500k',
    soPallet: 10,
    soThung: 10,
    soLuongSP: 10,
    maWO: 10,
    soLOT: '2025207564OA',
    ngayNhap: '29/10/2025',
    ghiChu: 'Ghi chú',
  };

  detailList: DetailItem[] = [
    {
      palletCode: 'KHHTTK-202510W5',
      boxCode: 'KHTT',
      soPallet: 10,
      scanStatus: 'Đã scan',
    },
    {
      palletCode: 'KHHTTK-202510W5',
      boxCode: 'KHTT',
      soPallet: 10,
      scanStatus: 'Chưa scan',
    },
    {
      palletCode: 'KHHTTK-202510W5',
      boxCode: 'KHTT',
      soPallet: 10,
      scanStatus: 'Chưa scan',
    },
    {
      palletCode: 'KHHTTK-202510W5',
      boxCode: 'KHTT',
      soPallet: 10,
      scanStatus: 'Chưa scan',
    },
    {
      palletCode: 'KHHTTK-202510W5',
      boxCode: 'KHTT',
      soPallet: 10,
      scanStatus: 'Chưa scan',
    },
  ];
  selectedMode: 'pallet' | 'thung' | null = null;

  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.nhapKhoId = +params['id'];
    });

    this.route.queryParams.subscribe((queryParams) => {
      console.log('Mã sản phẩm:', queryParams['maSanPham']);
      console.log('Status:', queryParams['status']);
    });
    const state = history.state;
    if (state.updatedList) {
      this.detailList = state.updatedList;
    }
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
  onScan(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx/scan'], {
      state: { detailList: this.detailList },
    });
  }

  onPalletScanEnter() {
    // chuyển focus sang input location
    this.locationInput?.nativeElement?.focus();
  }

  onLocationScanEnter() {
    if (!this.scanPallet || !this.scanLocation) return;

    const now = new Date();
    const formattedTime = now.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const newItem: ScannedItem = {
      maHangHoa: 'LED000035',
      tenHangHoa: 'Đèn LED cắm ứng 8W',
      serialPallet: this.scanPallet,
      serialBox: this.selectedMode === 'thung' ? this.scanPallet : '',
      soLuong: 1,
      area: 'RD-01',
      location: this.scanLocation,
      thoiDiemScan: formattedTime,
    };

    this.scannedList.unshift(newItem);
    this.snackBar.open('Lưu thành công!', 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-success', 'snackbar-position'],
    });

    // reset input
    this.scanPallet = '';
    this.scanLocation = '';
    this.selectedMode = null;

    // focus lại vào pallet để scan tiếp
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }
  loadData(): void {
    // Load dữ liệu từ service
  }

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
