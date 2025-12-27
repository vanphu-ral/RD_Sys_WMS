import { Component } from '@angular/core';
import { KhoThanhPhamModule } from '../kho-thanh-pham.module';
import { Router } from '@angular/router';
import { NhapKhoService } from './service/nhap-kho.service';
export interface NhapKhoItem {
  id: number;
  po_code: string | null;
  client_id: number;
  inventory_name: string;
  number_of_pallet: number;
  number_of_box: number;
  box_scan_progress?: number;
  quantity: number;
  wo_code: string;
  lot_number: string;
  import_date: string;
  status: boolean;
  note: string;
  approved_by: string | null;
  is_check_all: boolean;
  updated_by: string;
  updated_date: string;

  scannedCount: number; // số đã scan
  totalCount: number;
}

@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './nhap-kho.component.html',
  styleUrl: './nhap-kho.component.scss',
})
export class NhapKhoComponent {
  showMobileFilters: boolean = false;
  displayedColumns: string[] = [
    // 'id',
    'stt',
    'inventory_name',
    // 'order_id',
    'client_id',
    'wo_code',
    'lot_number',
    'branch',
    'number_of_pallet',
    'number_of_box',
    'production_team',
    'production_decision_number',
    'item_no_sku',
    // 'approved_by',
    'note',
    'updated_by',
    'updated_date',
    'status',
    'progress',
    'actions',
  ];


  filterValues = {
    inventory_name: '',
    lot_number: '',
    wo_code: '',
    status: '',
  };

  filterColumns: string[] = [
    'inventory_name',
    'lot_number',
    'wo_code',
    'status',
  ];

  nhapKhoList: NhapKhoItem[] = [];
  originalList: NhapKhoItem[] = [];
  searchTerm: string = '';
  totalItems: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  constructor(private router: Router, private nhapKhoService: NhapKhoService) { }
  ngOnInit(): void {
    this.loadDanhSachNhapKho();
  }
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }
  loadDanhSachNhapKho(): void {
    this.nhapKhoService.getDanhSachNhapKho().subscribe({
      next: (res) => {
        // Sắp xếp theo id giảm dần
        const sorted = [...res].sort((a, b) => b.id - a.id);

        // Map sang NhapKhoItem, đảm bảo có scannedCount/totalCount
        const mapped: NhapKhoItem[] = sorted.map((r: any) => ({
          ...r,

          // Nếu API trả trực tiếp:
          scannedCount: 1,
          totalCount: 10,
        }));

        this.originalList = mapped;
        this.nhapKhoList = mapped.slice(0, this.pageSize);
        this.totalItems = mapped.length;
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách nhập kho:', err);
      },
    });
  }

  getStatusClass(status: boolean): string {
    return status ? 'status-active-label' : 'status-warn-label';
  }

  computeProgressPercent(item: NhapKhoItem): number {
    const total = Number(item.number_of_box ?? 0);
    const scanned = Number(item.box_scan_progress ?? 0);
    if (!total || total <= 0) return 0;
    const pct = Math.round((scanned / total) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  //naviagte
  onApprove(nhapkho: NhapKhoItem): void {
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/phe-duyet', nhapkho.id]
      // {
      //   queryParams: {
      //     maSanPham: nhapkho.maSanPham,
      //     status: nhapkho.status,
      //   },
      // }
    );
  }

  // Navigate đến trang chi tiết
  onViewDetail(nhapkho: NhapKhoItem): void {
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/detail', nhapkho.id]
      // {
      //   queryParams: {
      //     maSanPham: nhapkho.maSanPham,
      //     status: nhapkho.status,
      //   },
      // }
    );
  }

  // Navigate đến trang scan
  onScan(nhapkho: NhapKhoItem): void {
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/phe-duyet', nhapkho.id, 'scan'],
    );
  }


  onSearch(): void {
    console.log('Searching for:', this.searchTerm);
  }

  onRefresh(): void {
    console.log('Refreshing data...');
  }

  onAddNew(): void {
    console.log('Add new location');
  }

  onDelete(location: Location): void {
    console.log('Delete location:', location);
  }
  slicePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.nhapKhoList = this.originalList.slice(start, end);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.slicePage();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    this.slicePage();
  }

  applyFilter(): void {
    const filtered = this.originalList.filter((item) => {
      const statusText = item.status ? 'Đã nhập' : 'Chưa nhập';

      return (
        item.inventory_name
          ?.toLowerCase()
          .includes(this.filterValues.inventory_name.toLowerCase()) &&
        item.lot_number
          ?.toLowerCase()
          .includes(this.filterValues.lot_number.toLowerCase()) &&
        item.wo_code
          ?.toLowerCase()
          .includes(this.filterValues.wo_code.toLowerCase()) &&
        statusText
          .toLowerCase()
          .includes(this.filterValues.status.toLowerCase())
      );
    });

    this.nhapKhoList = filtered;
    this.totalItems = filtered.length;
  }


  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
  }

  clearFilters(): void {
    this.filterValues = {
      inventory_name: '',
      lot_number: '',
      wo_code: '',
      status: '',
    };
    this.searchTerm = '';
    this.applyFilter();
  }

  // getStatusClass(status: string): string {
  //   const statusMap: { [key: string]: string } = {
  //     'Chờ nhập': 'cho-nhap',
  //     'Đã nhập': 'da-nhap',
  //     'Đang xử lý': 'dang-xu-ly'
  //   };
  //   return statusMap[status] || '';
  // }
}
