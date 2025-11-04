import { Component } from '@angular/core';
import { KhoThanhPhamModule } from '../kho-thanh-pham.module';
import { Router } from '@angular/router';
import { XuatHangTheoDonBanService } from './service/xuat-hang-theo-don-ban.service.component';
export interface SalesExportRequest {
  id: number;
  ma_yc_xk: string;
  kho_xuat: number;
  xuat_toi: number;
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
  selector: 'app-xuat-hang-theo-don-ban-hang',
  standalone: false,
  templateUrl: './xuat-hang-theo-don-ban-hang.component.html',
  styleUrl: './xuat-hang-theo-don-ban-hang.component.scss',
})
export class XuatHangTheoDonBanHangComponent {
  displayedColumns: string[] = [
    'id',
    'ma_yc_xk',
    'kho_xuat',
    'xuat_toi',
    'don_vi_linh',
    'don_vi_nhan',
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
    ma_yc_xk: '',
    kho_xuat: '',
    xuat_toi: '',
    don_vi_linh: '',
    don_vi_nhan: '',
    ly_do_xuat_nhap: '',
    ngay_chung_tu: '',
    so_phieu_xuat: '',
    so_chung_tu: '',
    series_PGH: '',
    scan_status: '',
    status: '',
  };

  filterColumns: string[] = [
    'ma_yc_xk',
    'kho_xuat',
    'xuat_toi',
    'don_vi_linh',
    'don_vi_nhan',
    'ly_do_xuat_nhap',
    'ngay_chung_tu',
    'so_phieu_xuat',
    'so_chung_tu',
    'series_PGH',
    'status',
    'scan_status',
  ];
  salesRequests: SalesExportRequest[] = [];

  //  chuyenKho: Warehouse[] = [
  //    {
  //      id: 1,
  //      code: 'REQ-285875',
  //      from: 'RD',
  //      to: 'RD-02',
  //      unit: 'Kho vật tư TBCS',
  //      reason: 'Xuất chuyển kho',
  //      type: 1,
  //      documentDate: '1/11/2025',
  //      documentNumber: 'RD.PN.CS1.T01.2025',
  //      serialPGH: '6C25NRD',
  //      status: 'Đã duyệt',
  //    },
  //    {
  //      id: 2,
  //      code: 'REQ-285876',
  //      from: 'RD-01',
  //      to: 'RD-02',
  //      unit: 'Kho vật tư TBCS',
  //      reason: 'Xuất chuyển kho',
  //      type: 1,
  //      documentDate: '1/11/2025',
  //      documentNumber: 'RD.PN.CS1.T01.2025',
  //      serialPGH: '6C25NRD',
  //      status: 'Đã scan',
  //    },
  //  ];

  searchTerm: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  totalItems: number = 1200;
  constructor(private router: Router, private xuatDonBanService: XuatHangTheoDonBanService) {}
  ngOnInit(): void {
    this.loadData();
  }

  //load data
  loadData():void {
    this.xuatDonBanService.getSalesExportRequests().subscribe({
    next: (res) => {
      this.salesRequests = res;
    },
    error: (err) => {
      console.error('Lỗi khi lấy danh sách xuất hàng:', err);
    }
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

  onDetail(warehouse: SalesExportRequest): void {
    this.router.navigate([
      '/kho-thanh-pham/xuat-don-ban-hang/detail',
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
