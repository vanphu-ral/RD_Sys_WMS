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
  warehouses: { id: number; name: string }[] = [];
  pagedTransfers: InternalTransferRequest[] = [];

  searchTerm: string = '';
  totalPages: number = 0;
  pageNumbers: number[] = [];
  totalItems: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  constructor(
    private router: Router,
    private chuyenKhoService: ChuyenKhoService
  ) {}
  ngOnInit(): void {
    this.loadDataChuyenKho();
    this.loadAreaData();
  }
  //danh sach kho
  loadAreaData(): void {
    this.chuyenKhoService.getWarehouses().subscribe({
      next: (data) => {
        this.warehouses = data;
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách kho:', err);
      },
    });
  }

  //load danh sach chuyen kho
  loadDataChuyenKho(): void {
    this.chuyenKhoService.getInternalTransfers().subscribe({
      next: (res) => {
        this.internalTransfers = res;
        this.totalItems = res.length;
        this.applyPagination(); // cập nhật trang hiện tại
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách chuyển kho:', err);
      },
    });
  }

  //phan tran
  applyPagination(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedTransfers = this.internalTransfers.slice(startIndex, endIndex);

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

  getWarehouseName(id: number): string {
    const warehouse = this.warehouses.find((w) => w.id === id);
    return warehouse?.name || `#${id}`;
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

  applyFilter() {
    //code
  }
}
