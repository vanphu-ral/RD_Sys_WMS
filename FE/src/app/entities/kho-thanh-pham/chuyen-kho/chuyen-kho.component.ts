import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChuyenKhoService } from './service/chuyen-kho.service.component';
export interface InternalTransferRequest {
  id: number;
  ma_yc_cknb: string;
  tu_kho: number;
  den_kho: number;
  don_vi_linh: string;
  don_vi_nhan: string;
  ly_do_xuat_nhap: string;
  ngay_chung_tu: string;
  so_phieu_xuat: string;
  so_chung_tu: string;
  series_PGH: string;
  status: string;
  note: string;
  scan_status: string;
  updated_by: string;
  updated_date: string;
}

@Component({
  selector: 'app-chuyen-kho-component',
  standalone: false,
  templateUrl: './chuyen-kho.component.html',
  styleUrl: './chuyen-kho.component.scss',
})
export class ChuyenKhoComponent {
  displayedColumns: string[] = [
    'id',
    'ma_yc_cknb',
    'tu_kho',
    'den_kho',
    'don_vi_linh',
    'ly_do_xuat_nhap',
    'ngay_chung_tu',
    'so_phieu_xuat',
    'so_chung_tu',
    'series_PGH',
    'status',
    'scan_status',
    'actions',
  ];
  filterValues = {
    ma_yc_cknb: '',
    tu_kho: '',
    den_kho: '',
    don_vi_linh: '',
    ly_do_xuat_nhap: '',
    ngay_chung_tu: '',
    so_phieu_xuat: '',
    so_chung_tu: '',
    series_PGH: '',
    status: '',
    scan_status: '',
  };

  filterColumns: string[] = [
    'ma_yc_cknb',
    'tu_kho',
    'den_kho',
    'don_vi_linh',
    'ly_do_xuat_nhap',
    'ngay_chung_tu',
    'so_phieu_xuat',
    'so_chung_tu',
    'series_PGH',
    'status',
    'scan_status',
  ];
  internalTransfers: InternalTransferRequest[] = [];
  // chuyenKho: Warehouse[] = [
  //   {
  //     id: 1,
  //     code: 'REQ-285875',
  //     from: 'RD',
  //     to: 'RD-02',
  //     unit: 'Kho vật tư TBCS',
  //     reason: 'Xuất chuyển kho',
  //     type: 1,
  //     documentDate: '1/11/2025',
  //     documentNumber: 'RD.PN.CS1.T01.2025',
  //     serialPGH: '6C25NRD',
  //     status: 'Đã duyệt',
  //   },
  //   {
  //     id: 2,
  //     code: 'REQ-285876',
  //     from: 'RD-01',
  //     to: 'RD-02',
  //     unit: 'Kho vật tư TBCS',
  //     reason: 'Xuất chuyển kho',
  //     type: 1,
  //     documentDate: '1/11/2025',
  //     documentNumber: 'RD.PN.CS1.T01.2025',
  //     serialPGH: '6C25NRD',
  //     status: 'Đã scan',
  //   },
  // ];

  searchTerm: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  totalItems: number = 1200;
  constructor(
    private router: Router,
    private chuyenKhoService: ChuyenKhoService
  ) {}
  ngOnInit(): void {
    this.chuyenKhoService.getInternalTransfers().subscribe({
      next: (res) => {
        this.internalTransfers = res;
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách chuyển kho:', err);
      },
    });
  }
  //naviagte
  onAddNew(): void {
    this.router.navigate(
      ['/kho-thanh-pham/chuyen-kho-noi-bo/add-new']
      // {
      //   queryParams: {
      //     maSanPham: nhapkho.maSanPham,
      //     status: nhapkho.status,
      //   },
      // }
    );
  }
  getTypeClass(type: number): string {
    const typeClasses: { [key: number]: string } = {
      1: 'type-move',
    };
    return typeClasses[type] || '';
  }
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'Đã scan': 'status-active-scan',
      'Đã duyệt': 'status-active-approve',
    };
    return statusClasses[status] || '';
  }

  getTypeLabel(status: number): string {
    const statusLabels: { [key: number]: string } = {
      1: 'Chuyển kho',
    };
    return statusLabels[status] || 'Unknown';
  }

  onSearch(): void {
    console.log('Searching for:', this.searchTerm);
  }

  onRefresh(): void {
    console.log('Refreshing data...');
  }

  onDetail(warehouse: InternalTransferRequest): void {
    this.router.navigate([
      '/kho-thanh-pham/chuyen-kho-noi-bo/detail',
      warehouse.id,
    ]);
  }

  onDelete(location: Location): void {
    console.log('Delete location:', location);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    console.log('Page changed to:', page);
  }
  applyFilter() {
    //code
  }
}
