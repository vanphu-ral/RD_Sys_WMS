import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
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
@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './scan-check.component.html',
  styleUrl: './scan-check.component.scss',
})
export class ScanCheckComponent implements OnInit {
  nhapKhoId: number | undefined;
  nhapKhoData: ScannedItem | undefined;
  currentPage = 1;

  //bien scan
  scanPallet: string = '';
  scanLocation: string = '';

  displayedColumns: string[] = [
    'stt',
    'maHangHoa',
    'tenHangHoa',
    'serialPallet',
    'serialBox',
    'soLuong',
    'area',
    'location',
    'thoiDiemScan',
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
  selectedMode: 'pallet' | 'thung' | null = null;

  @ViewChild('palletInput') palletInput!: ElementRef;
  @ViewChild('locationInput') locationInput!: ElementRef;
  detailList: any;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
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
    this.detailList = state.detailList || [];

    // Gắn mặc định trạng thái nếu chưa có
    this.detailList = this.detailList.map((item: { scanStatus: any }) => ({
      ...item,
      scanStatus: item.scanStatus || 'Chưa scan',
    }));
  }
  onSelectMode(mode: 'pallet' | 'thung'): void {
    if (this.selectedMode === mode) {
      // Bỏ chọn mode - reset và clear focus
      this.selectedMode = null;
      this.scanPallet = '';
      this.scanLocation = '';
      this.palletInput?.nativeElement?.blur();
    } else {
      // Chọn mode mới
      this.selectedMode = mode;
      this.scanPallet = '';
      this.scanLocation = '';

      // Focus vào input pallet sau khi chọn mode
      setTimeout(() => {
        this.palletInput?.nativeElement?.focus();
      }, 100);
    }
  }

  onPalletScanEnter(): void {
    if (!this.scanPallet.trim()) return;

    // Chuyển focus sang input location
    setTimeout(() => {
      this.locationInput?.nativeElement?.focus();
    }, 50);
  }

  onLocationScanEnter(): void {
    if (!this.scanPallet.trim() || !this.scanLocation.trim()) return;

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
      panelClass: ['snackbar-success'],
    });

    // Reset CHỈ input values, GIỮ NGUYÊN selectedMode
    this.scanPallet = '';
    this.scanLocation = '';

    // Focus lại về pallet để tiếp tục scan
    setTimeout(() => {
      this.palletInput?.nativeElement?.focus();
    }, 100);
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
  clearScanMode(): void {
    this.selectedMode = null;
    this.scanPallet = '';
    this.scanLocation = '';
  }

  onConfirm(): void {
    this.detailList = this.detailList.map((item: any) => ({
      ...item,
      scanStatus: 'Đã scan',
    }));

    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx'], {
      state: { updatedList: this.detailList },
    });
  }
}
