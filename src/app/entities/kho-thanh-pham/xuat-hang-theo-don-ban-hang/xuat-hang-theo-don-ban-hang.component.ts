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
  pagedSalesRequests: SalesExportRequest[] = [];
  totalPages: number = 0;
  pageNumbers: number[] = [];

  searchTerm: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  totalItems: number = 0;
  areas: any[] = [];
  constructor(
    private router: Router,
    private xuatDonBanService: XuatHangTheoDonBanService
  ) {}
  ngOnInit(): void {
    this.xuatDonBanService.getAreas().subscribe({
      next: (res) => {
        this.areas = res.data;
        this.loadSalesRequests();
      },
      error: (err) => console.error('Lỗi khi lấy kho:', err),
    });
  }

  //load data
  loadSalesRequests(): void {
    this.xuatDonBanService.getSalesExportRequests().subscribe({
      next: (res) => {
        this.salesRequests = res.map((item) => ({
          ...item,
          ten_kho_xuat: this.getAreaName(item.kho_xuat),
          ten_kho_nhan: this.getAreaName(item.xuat_toi),
        }));
        this.totalItems = this.salesRequests.length;
        this.applyPagination();
      },
      error: (err) => console.error('Lỗi khi lấy đơn xuất:', err),
    });
  }

  //phan trang
  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedSalesRequests = this.salesRequests.slice(startIndex, endIndex);

    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.pageNumbers = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyPagination();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.applyPagination();
  }

  getAreaName(id: number): string {
    const area = this.areas.find((a) => a.id === id);
    return area?.name || `Kho #${id}`;
  }
  //naviagte
  onAddNew(): void {
    this.router.navigate(
      ['/kho-thanh-pham/xuat-don-ban-hang/add-new']
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
  
  applyFilter() {
    //code
  }
}
