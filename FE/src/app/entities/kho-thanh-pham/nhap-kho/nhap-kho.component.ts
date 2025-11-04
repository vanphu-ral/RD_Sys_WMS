import { Component } from '@angular/core';
import { KhoThanhPhamModule } from '../kho-thanh-pham.module';
import { Router } from '@angular/router';
export interface NhapKho {
  id: number;
  maSanPham: string;
  maKhachHang: string;
  tenSanPham: string;
  palletQuantity: number;
  boxQuantity: number;
  productQuantity: number;
  woId: number;
  lotNumber: string;
  status: string;
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
    'maSanPham',
    'maKhachHang',
    'tenSanPham',
    'lotNumber',
    'palletQuantity',
    'boxQuantity',
    'productQuantity',
    'woId',
    'status',
    'actions',
  ];

  filterValues = {
    maSanPham: '',
    maKhachHang: '',
    tenSanPham: '',
    lotNumber: '',
    status: '',
  };
  filterColumns: string[] = [
    'maSanPham',
    'maKhachHang',
    'tenSanPham',
    'lotNumber',
    'status',
  ];
  nhapKhoList: NhapKho[] = [
    {
      id: 1,
      maSanPham: 'KHHTTK-202510WS',
      maKhachHang: 'KHTT',
      tenSanPham: 'Đèn LED chiếu pha 6500k 8W',
      lotNumber: '20252075640A',
      palletQuantity: 10,
      boxQuantity: 10,
      productQuantity: 20,
      woId: 112345,
      status: 'Chờ nhập',
    },
    {
      id: 2,
      maSanPham: 'KHHTTK-202510WS',
      maKhachHang: 'KHTT',
      tenSanPham: 'Đèn LED chiếu pha 6500k 8W',
      lotNumber: '20252075640A',
      palletQuantity: 10,
      boxQuantity: 10,
      productQuantity: 20,
      woId: 112345,
      status: 'Đã nhập',
    },
    {
      id: 3,
      maSanPham: 'KHHTTK-202510WS',
      maKhachHang: 'KHTT',
      tenSanPham: 'Đèn LED chiếu pha 6500k 8W',
      lotNumber: '20252075640A',
      palletQuantity: 10,
      boxQuantity: 10,
      productQuantity: 20,
      woId: 112345,
      status: 'Đã nhập',
    },
    {
      id: 4,
      maSanPham: 'KHHTTK-202510WS',
      maKhachHang: 'KHTT',
      tenSanPham: 'Đèn LED chiếu pha 6500k 8W',
      lotNumber: '20252075640A',
      palletQuantity: 10,
      boxQuantity: 10,
      productQuantity: 20,
      woId: 112345,
      status: 'Đã nhập',
    },
    {
      id: 5,
      maSanPham: 'KHHTTK-202510WS',
      maKhachHang: 'KHTT',
      tenSanPham: 'Đèn LED chiếu pha 6500k 8W',
      lotNumber: '20252075640A',
      palletQuantity: 10,
      boxQuantity: 10,
      productQuantity: 20,
      woId: 112345,
      status: 'Đã nhập',
    },
    {
      id: 6,
      maSanPham: 'KHHTTK-202510WS',
      maKhachHang: 'KHTT',
      tenSanPham: 'Đèn LED chiếu pha 6500k 8W',
      lotNumber: '20252075640A',
      palletQuantity: 10,
      boxQuantity: 10,
      productQuantity: 20,
      woId: 112345,
      status: 'Đã nhập',
    },
  ];
  searchTerm: string = '';
  pageSize: number = 10;
  currentPage: number = 1;
  totalItems: number = 1200;
  constructor(private router: Router) { }
  ngOnInit(): void { }
  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'Chờ nhập': 'status-warn-label',
      'Đã nhập': 'status-active-label',
    };
    return statusClasses[status] || '';
  }

  //naviagte
  onApprove(nhapkho: NhapKho): void {
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/phe-duyet', nhapkho.id],
      // {
      //   queryParams: {
      //     maSanPham: nhapkho.maSanPham,
      //     status: nhapkho.status,
      //   },
      // }
    );
  }

  // Navigate đến trang chi tiết
  onViewDetail(nhapkho: NhapKho): void {
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/detail', nhapkho.id],
      // {
      //   queryParams: {
      //     maSanPham: nhapkho.maSanPham,
      //     status: nhapkho.status,
      //   },
      // }
    );
  }

  // Navigate đến trang scan
  onScan(nhapkho: NhapKho): void {
    this.router.navigate(
      ['/kho-thanh-pham/nhap-kho-sx/scan', nhapkho.id],
      // {
      //   queryParams: {
      //     maSanPham: nhapkho.maSanPham,
      //     status: nhapkho.status,
      //   },
      // }
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

  onPageChange(page: number): void {
    this.currentPage = page;
    console.log('Page changed to:', page);
  }

  applyFilter() {
    const filtered = this.nhapKhoList.filter((loc) => {
      return (
        loc.maSanPham
          .toLowerCase()
          .includes(this.filterValues.maSanPham.toLowerCase()) &&
        loc.maKhachHang
          .toLowerCase()
          .includes(this.filterValues.maKhachHang.toLowerCase()) &&
        loc.tenSanPham
          .toLowerCase()
          .includes(this.filterValues.tenSanPham.toLowerCase()) &&
        loc.status
          .toLowerCase()
          .includes(this.filterValues.status.toLowerCase()) &&
        loc.lotNumber
          .toLowerCase()
          .includes(this.filterValues.lotNumber.toLowerCase())
      );
    });

    this.nhapKhoList = filtered;
  }
  toggleMobileFilters(): void {
    this.showMobileFilters = !this.showMobileFilters;
  }

  clearFilters(): void {
    this.filterValues = {
      maSanPham: '',
      maKhachHang: '',
      tenSanPham: '',
      lotNumber: '',
      status: ''
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
