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
    'id',
    'inventory_name',
    'lot_number',
    'number_of_pallet',
    'number_of_box',
    'quantity',
    'wo_code',
    'import_date',
    'status',
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
  filteredList: NhapKhoItem[] = [];
  searchTerm: string = '';
  totalItems: number = 0;
  pageSize: number = 10;
  currentPage: number = 1;
  totalPages: number = 1;
  pageJumpInput: number | null = null;
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

        this.originalList = sorted;
        this.filteredList = sorted;
        this.totalItems = sorted.length;
        this.currentPage = 1;
        this.updatePagination();
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách nhập kho:', err);
      },
    });
  }

  getStatusClass(status: boolean): string {
    return status ? 'status-active-label' : 'status-warn-label';
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
  updatePagination(): void {
    this.totalPages = Math.max(1, Math.ceil(this.totalItems / this.pageSize) || 1);
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    this.slicePage();
  }

  slicePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.nhapKhoList = this.filteredList.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.slicePage();
  }

  previousPage(): void {
    this.onPageChange(this.currentPage - 1);
  }

  nextPage(): void {
    this.onPageChange(this.currentPage + 1);
  }

  jumpToPage(): void {
    const page = Number(this.pageJumpInput);
    if (!Number.isFinite(page) || page < 1 || page > this.totalPages) {
      this.pageJumpInput = null;
      return;
    }
    this.onPageChange(page);
    this.pageJumpInput = null;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updatePagination();
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

    this.filteredList = filtered;
    this.totalItems = filtered.length;
    this.currentPage = 1;
    this.updatePagination();
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
