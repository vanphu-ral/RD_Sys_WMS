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
  status: boolean;
  note: string;
  scan_status: boolean;
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
    // 'id',
    'stt',
    'ma_yc_xk',
    'kho_xuat',
    // 'xuat_toi',
    'don_vi_linh',
    'don_vi_nhan',
    'ly_do_xuat_nhap',
    'ngay_chung_tu',
    'so_phieu_xuat',
    'so_chung_tu',
    // 'series_PGH',
    'status',
    // 'scan_status',
    'actions',
  ];
  filterValues = {
    ma_yc_xk: '',
    kho_xuat: '',
    // xuat_toi: '',
    don_vi_linh: '',
    don_vi_nhan: '',
    ly_do_xuat_nhap: '',
    ngay_chung_tu: '',
    so_phieu_xuat: '',
    so_chung_tu: '',
    // series_PGH: '',
    // scan_status: '',
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
    // 'series_PGH',
    // 'status',
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
  filteredData: SalesExportRequest[] = [];
  warehouses: { id: number; name: string }[] = [];
  //mobile
  pagedTransfers: SalesExportRequest[] = [];
  showMobileFilters: boolean = false;
  constructor(
    private router: Router,
    private xuatDonBanService: XuatHangTheoDonBanService
  ) { }
  ngOnInit(): void {
    this.xuatDonBanService.getAreas().subscribe({
      next: (res) => {
        this.areas = res.data;
        this.loadSalesRequests();
      },
      error: (err) => console.error('Lỗi khi lấy kho:', err),
    });
  }
  //mobile
  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
  }

  clearFilters(): void {
    this.filterValues = {
      ma_yc_xk: '',
      kho_xuat: '',
      // xuat_toi: '',
      don_vi_linh: '',
      don_vi_nhan: '',
      ly_do_xuat_nhap: '',
      ngay_chung_tu: '',
      so_chung_tu: '',
      so_phieu_xuat: '',
      // series_PGH: '',
      status: '',
      // scan_status: '',
    };
    this.searchTerm = '';
    this.applyFilter();
  }
  getWarehouseName(id: number): string {
    const warehouse = this.areas.find((w) => w.id === id);
    return warehouse?.name || `#${id}`;
  }
  //load data
  loadSalesRequests(): void {
    this.xuatDonBanService.getSalesExportRequests().subscribe({
      next: (res) => {
        const mapped = res.map((item) => {
          const scanStatusBool =
            item.scan_status === true;

          return {
            ...item,
            scan_status: scanStatusBool, // ép về boolean
            ten_kho_xuat: this.getAreaName(item.kho_xuat),
            ten_kho_nhan: this.getAreaName(item.xuat_toi),
          };
        });

        this.salesRequests = mapped.sort((a, b) => b.id - a.id);
        this.filteredData = [...this.salesRequests];
        this.totalItems = this.salesRequests.length;
        this.updatePagedSalesRequests();
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

  isApproved(value: any): boolean { return value === true || value === 'true' || value === 1 || value === '1'; }
  getStatusClass(value: any): { [klass: string]: boolean } { return { approved: this.isApproved(value), pending: !this.isApproved(value) }; }
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
    this.loadSalesRequests();
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

  applyFilter(): void {
    // Chuyển đổi label sang boolean cho status và scan_status
    // const statusFilter: boolean | null = this.convertLabelToBoolean(
    //   this.filterValues.status
    // );
    const scanFilter: boolean | null = this.convertLabelToBoolean(
      this.filterValues.status
    );

    // Lọc dữ liệu gốc theo tất cả điều kiện
    this.filteredData = this.salesRequests.filter((item) => {
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

          const itemValue = item[key as keyof SalesExportRequest]
            ?.toString()
            .toLowerCase()
            .trim();

          return !filterValue || itemValue.includes(filterValue);
        });

      // Lọc theo status và scan_status
      // const matchStatus = statusFilter === null || item.status === statusFilter;
      const matchScan = scanFilter === null || item.scan_status === scanFilter;

      // return matchTextFields && matchStatus && matchScan;
    });

    // Cập nhật dữ liệu hiển thị theo trang
    this.updatePagedSalesRequests();
  }

  updatePagedSalesRequests(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pagedSalesRequests = (this.filteredData || []).slice(
      startIndex,
      endIndex
    );
  }
}
