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
  status: boolean;
  note: string;
  scan_status: boolean;
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
  filteredData: any;
  originalData: any;
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
        const sorted = [...res].sort((a, b) => b.id - a.id);

        this.internalTransfers = sorted;
        this.filteredData = [...sorted];
        this.totalItems = sorted.length;
        this.updatePagedTransfers();
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
  convertLabelToBoolean(label: string): boolean | null {
    switch (label) {
      case 'Đã duyệt':
      case 'Đã scan':
        return true;
      case 'Chưa duyệt':
      case 'Chưa scan':
        return false;
      default:
        return null;
    }
  }

  getStatusClass(value: boolean): string {
    return value ? 'approved' : 'pending';
  }

  getScanClass(value: boolean): string {
    return value ? 'scanned' : 'not-scanned';
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

  applyFilter(): void {
    // Chuyển đổi label sang boolean cho status và scan_status
    const statusFilter: boolean | null = this.convertLabelToBoolean(
      this.filterValues.status
    );
    const scanFilter: boolean | null = this.convertLabelToBoolean(
      this.filterValues.scan_status
    );

    // Lọc dữ liệu gốc theo tất cả điều kiện
    this.filteredData = this.internalTransfers.filter((item) => {
      // Lọc các trường text (ngoại trừ status và scan_status)
      const matchTextFields = this.filterColumns
        .filter((key) => key !== 'status' && key !== 'scan_status')
        .every((key) => {
          const filterValue = this.filterValues[
            key as keyof typeof this.filterValues
          ]
            ?.toString()
            .toLowerCase()
            .trim();

          const itemValue = item[key as keyof InternalTransferRequest]
            ?.toString()
            .toLowerCase()
            .trim();

          return !filterValue || itemValue.includes(filterValue);
        });

      // Lọc theo status và scan_status
      const matchStatus = statusFilter === null || item.status === statusFilter;
      const matchScan = scanFilter === null || item.scan_status === scanFilter;

      return matchTextFields && matchStatus && matchScan;
    });

    // Cập nhật dữ liệu hiển thị theo trang
    this.updatePagedTransfers();
  }

  updatePagedTransfers(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedTransfers = this.filteredData.slice(startIndex, endIndex);
  }
}
