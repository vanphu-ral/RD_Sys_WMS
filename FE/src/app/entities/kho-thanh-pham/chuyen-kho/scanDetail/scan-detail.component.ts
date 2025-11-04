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
  templateUrl: './scan-detail.component.html',
  styleUrl: './scan-detail.component.scss',
})
export class ScanDetailComponent implements OnInit {
  id: number | undefined;
  currentPage = 1;
  totalPages = 9;
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
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  ngOnInit(): void {
    const chuyenKhoId = this.route.snapshot.paramMap.get('id');
    const scanId = this.route.snapshot.paramMap.get('scanId');
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

    // reset input
    this.scanPallet = '';
    this.scanLocation = '';
    this.selectedMode = null;

    this.snackBar.open('Lưu thành công!', 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom',
      panelClass: ['snackbar-success', 'snackbar-position'],
    });
    // focus lại vào pallet để scan tiếp
    setTimeout(() => this.palletInput?.nativeElement?.focus(), 100);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    // Load data for specific page
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.onPageChange(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.onPageChange(this.currentPage);
    }
  }
}
