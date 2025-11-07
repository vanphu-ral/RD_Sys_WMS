// Trong quan-ly-kho.component.ts

import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ScanCheckDialogComponent } from './dialog/scan-check-dialog.component';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';

interface WarehouseItem {
  maSanPham: string;
  tenSP: string;
  maKH: string;
  tenKH: string;
  maPallet: string;
  maThung: string;
  po: string;
  soLuongTon: number;
  soLuongGoc: number;
  khuVuc: string;
  area: string;
  status: string;
  createdDate: string;
  updatedDate: string;
  updatedBy: string;
}
// Interfaces cho các ViewMode
interface POParent {
  po: string;
  soLuongSP: number;
  tongSLTon: number;
  tongSLGoc: number;
  soPallet: number;
  soThung: number;
  soKH: number;
  ngayNhapSomNhat: string;
  ngayCapNhat: string;
  expanded?: boolean;
  children?: POChild[];
}

interface POChild {
  maSanPham: string;
  tenSP: string;
  maKH: string;
  tenKH: string;
  slTon: number;
  slGoc: number;
  soPallet: number;
  soThung: number;
  khuVuc: string;
  status: string;
}

interface ProductParent {
  maSanPham: string;
  tenSP: string;
  tongSLTon: number;
  tongSLGoc: number;
  soPO: number;
  soKH: number;
  soKhuVuc: number;
  soPallet: number;
  soThung: number;
  ngayNhapSomNhat: string;
  expanded?: boolean;
  children?: ProductChild[];
}

interface ProductChild {
  po: string;
  maKH: string;
  tenKH: string;
  slTon: number;
  slGoc: number;
  khuVuc: string;
  location: string;
  maPallet: string;
  maThung: string;
  status: string;
  ngayNhap: string;
}

interface AreaParent {
  khuVuc: string;
  tongSLTon: number;
  tongSLGoc: number;
  soSP: number;
  soKH: number;
  soPO: number;
  soPallet: number;
  soThung: number;
  soLocation: number;
  ngayCapNhat: string;
  expanded?: boolean;
  children?: AreaChild[];
}

interface AreaChild {
  location: string;
  maSanPham: string;
  tenSP: string;
  maKH: string;
  tenKH: string;
  po: string;
  slTon: number;
  slGoc: number;
  maPallet: string;
  maThung: string;
  status: string;
  ngayNhap: string;
}

interface CustomerParent {
  maKH: string;
  tenKH: string;
  tongSLTon: number;
  tongSLGoc: number;
  soSP: number;
  soPO: number;
  soKhuVuc: number;
  soPallet: number;
  soThung: number;
  ngayNhapSomNhat: string;
  expanded?: boolean;
  children?: CustomerChild[];
}

interface CustomerChild {
  maSanPham: string;
  tenSP: string;
  po: string;
  slTon: number;
  slGoc: number;
  khuVuc: string;
  location: string;
  maPallet: string;
  maThung: string;
  status: string;
  ngayNhap: string;
  ngayCapNhat: string;
}
@Component({
  selector: 'app-quan-ly-kho',
  templateUrl: './quan-ly-kho.component.html',
  styleUrls: ['./quan-ly-kho.component.scss'],
  standalone: false,
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed',
        style({ height: '0px', minHeight: '0', overflow: 'hidden' })
      ),
      state('expanded', style({ height: '*', overflow: 'hidden' })),
      transition(
        'expanded <=> collapsed',
        animate('300ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class QuanLyKhoComponent implements OnInit {
  pageSize = 10;
  currentPage = 1;
  filterValues: { [key: string]: string } = {};
  filterMode: string = 'constraint';
  displayedColumns: string[] = [];
  //view mode:
  selectedViewMode: 'area' | 'po' | 'customer' | 'product' | null = null;
  currentViewMode: 'default' | 'po' | 'product' | 'area' | 'customer' =
    'default';

  // Columns cho các ViewMode
  poParentColumns: string[] = [
    'expand',
    'po',
    'soLuongSP',
    'tongSLTon',
    'tongSLGoc',
    'soPallet',
    'soThung',
    'soKH',
    'ngayNhapSomNhat',
    'ngayCapNhat',
  ];
  poChildColumns: string[] = [
    'maSanPham',
    'tenSP',
    'maKH',
    'tenKH',
    'slTon',
    'slGoc',
    'soPallet',
    'soThung',
    'khuVuc',
    'status',
  ];

  productParentColumns: string[] = [
    'expand',
    'maSanPham',
    'tenSP',
    'tongSLTon',
    'tongSLGoc',
    'soPO',
    'soKH',
    'soKhuVuc',
    'soPallet',
    'soThung',
    'ngayNhapSomNhat',
  ];
  productChildColumns: string[] = [
    'po',
    'maKH',
    'tenKH',
    'slTon',
    'slGoc',
    'khuVuc',
    'location',
    'maPallet',
    'maThung',
    'status',
    'ngayNhap',
  ];

  areaParentColumns: string[] = [
    'expand',
    'khuVuc',
    'tongSLTon',
    'tongSLGoc',
    'soSP',
    'soKH',
    'soPO',
    'soPallet',
    'soThung',
    'soLocation',
    'ngayCapNhat',
  ];
  areaChildColumns: string[] = [
    'location',
    'maSanPham',
    'tenSP',
    'maKH',
    'tenKH',
    'po',
    'slTon',
    'slGoc',
    'maPallet',
    'maThung',
    'status',
    'ngayNhap',
  ];

  customerParentColumns: string[] = [
    'expand',
    'maKH',
    'tenKH',
    'tongSLTon',
    'tongSLGoc',
    'soSP',
    'soPO',
    'soKhuVuc',
    'soPallet',
    'soThung',
    'ngayNhapSomNhat',
  ];
  customerChildColumns: string[] = [
    'maSanPham',
    'tenSP',
    'po',
    'slTon',
    'slGoc',
    'khuVuc',
    'location',
    'maPallet',
    'maThung',
    'status',
    'ngayNhap',
    'ngayCapNhat',
  ];

  //mobile
  mobileDefaultFields = [
    { key: 'tenSP', label: 'Tên SP' },
    { key: 'tenKH', label: 'Khách hàng' },
    { key: 'po', label: 'PO' },
    { key: 'area', label: 'Kho', badge: true },
    { key: 'maPallet', label: 'Mã pallet', badge: true },
    { key: 'maThung', label: 'Mã thùng', badge: true },
  ];

  mobileQuantityFields = [
    { key: 'soLuongTon', label: 'SL Tồn', class: 'stock' },
    { key: 'soLuongGoc', label: 'SL Gốc' },
  ];
  mobilePOStats = [
    { key: 'tongSLTon', label: 'SL Tồn' },
    { key: 'soPallet', label: 'Pallet' },
    { key: 'soThung', label: 'Thùng' },
  ];

  mobilePOChildFields = [
    { key: 'maSanPham', label: 'Mã SP', bold: true },
    { key: 'tenSP', label: 'Tên SP' },
    { key: 'tenKH', label: 'Khách hàng' },
    { key: 'slTon', label: 'SL Tồn' },
    { key: 'khuVuc', label: 'Khu vực' },
    { key: 'status', label: 'Status', badge: true },
  ];

  allColumns = [
    { key: 'stt', label: 'STT', visible: true },
    { key: 'maSanPham', label: 'Mã sản phẩm', visible: true },
    { key: 'tenSP', label: 'Tên SP', visible: true },
    { key: 'maKH', label: 'Mã KH', visible: true },
    { key: 'tenKH', label: 'Tên KH', visible: false },
    { key: 'maPallet', label: 'Mã pallet', visible: true },
    { key: 'maThung', label: 'Mã thùng', visible: false },
    { key: 'po', label: 'PO', visible: true },
    { key: 'soLuongTon', label: 'Số lượng tồn', visible: true },
    { key: 'soLuongGoc', label: 'Số lượng gốc', visible: false },
    { key: 'khuVuc', label: 'Khu vực', visible: true },
    { key: 'area', label: 'Kho', visible: true },
    { key: 'status', label: 'Status', visible: true },
    { key: 'updatedBy', label: 'Cập nhật bởi', visible: false },
    { key: 'createdDate', label: 'Ngày nhập', visible: false },
    { key: 'updatedDate', label: 'Ngày cập nhật', visible: false },
  ];

  warehouseList: WarehouseItem[] = [];
  poDataSource: POParent[] = [];
  productDataSource: ProductParent[] = [];
  areaDataSource: AreaParent[] = [];
  customerDataSource: CustomerParent[] = [];
  filteredList: WarehouseItem[] | undefined;
  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {
    this.loadMockData();
    this.updateDisplayedColumns();
  }
  loadMockData(): void {
    this.warehouseList = [
      {
        maSanPham: 'Req-285875',
        tenSP: 'Đèn LED chiếu pha 6500k',
        maKH: 'RD-02',
        tenKH: 'KHTT',
        maPallet: 'P202500191',
        maThung: 'P202500191',
        po: '123124',
        soLuongTon: 10,
        soLuongGoc: 10,
        khuVuc: 'RD-Warehouse',
        area: 'RD',
        status: 'Có sẵn',
        updatedBy: 'Nguyen Van A',
        createdDate: '01/11/2025 08:30',
        updatedDate: '01/11/2025 09:00',
      },
      {
        maSanPham: 'Req-285875',
        tenSP: 'Đèn LED chiếu pha 6500k',
        maKH: 'RD-02',
        tenKH: 'KHTT',
        maPallet: 'P202500191',
        maThung: 'P202500191',
        po: '123124',
        soLuongTon: 100,
        soLuongGoc: 100,
        khuVuc: 'RD-Warehouse',
        area: 'RD',
        status: 'Có sẵn',
        updatedBy: 'Nguyen Van B',
        createdDate: '01/11/2025 08:30',
        updatedDate: '01/11/2025 09:00',
      },
      {
        maSanPham: 'Req-285875',
        tenSP: 'Đèn LED chiếu pha 6500k',
        maKH: 'RD-02',
        tenKH: 'KHTT',
        maPallet: 'P202500191',
        maThung: 'P202500191',
        po: '123124',
        soLuongTon: 128,
        soLuongGoc: 128,
        khuVuc: 'RD-Warehouse',
        area: 'RD',
        status: 'Có sẵn',
        updatedBy: 'Tran Thi C',
        createdDate: '01/11/2025 08:30',
        updatedDate: '01/11/2025 09:00',
      },
      {
        maSanPham: 'Req-285875',
        tenSP: 'Đèn LED chiếu pha 6500k',
        maKH: 'RD-02',
        tenKH: 'KHTT',
        maPallet: 'P202500191',
        maThung: 'P202500191',
        po: '123124',
        soLuongTon: 32,
        soLuongGoc: 32,
        khuVuc: 'RD-Warehouse',
        area: 'RD',
        status: 'Có sẵn',
        updatedBy: 'Le Van D',
        createdDate: '01/11/2025 08:30',
        updatedDate: '01/11/2025 09:00',
      },
      {
        maSanPham: 'Req-285875',
        tenSP: 'Đèn LED chiếu pha 6500k',
        maKH: 'RD-02',
        tenKH: 'KHTT',
        maPallet: 'P202500191',
        maThung: 'P202500191',
        po: '123124',
        soLuongTon: 30,
        soLuongGoc: 30,
        khuVuc: 'RD-Warehouse',
        area: 'RD',
        status: 'Có sẵn',
        updatedBy: 'Pham Thi E',
        createdDate: '01/11/2025 08:30',
        updatedDate: '01/11/2025 09:00',
      },
      {
        maSanPham: 'Req-285875',
        tenSP: 'Đèn LED chiếu pha 6500k',
        maKH: 'RD-02',
        tenKH: 'KHTT',
        maPallet: 'P202500191',
        maThung: 'P202500191',
        po: '123124',
        soLuongTon: 0,
        soLuongGoc: 0,
        khuVuc: 'RD-Warehouse',
        area: 'RD',
        status: 'Không có sẵn',
        updatedBy: 'Hoang Van F',
        createdDate: '01/11/2025 08:30',
        updatedDate: '01/11/2025 09:00',
      },
      {
        maSanPham: 'Req-285875',
        tenSP: 'Đèn LED chiếu pha 6500k',
        maKH: 'RD-02',
        tenKH: 'KHTT',
        maPallet: 'P202500191',
        maThung: 'P202500191',
        po: '123124',
        soLuongTon: 100,
        soLuongGoc: 100,
        khuVuc: 'RD-Warehouse',
        area: 'RD',
        status: 'Có sẵn',
        updatedBy: 'Nguyen Thi G',
        createdDate: '01/11/2025 08:30',
        updatedDate: '01/11/2025 09:00',
      },
      {
        maSanPham: 'Req-285875',
        tenSP: 'Đèn LED chiếu pha 6500k',
        maKH: 'RD-02',
        tenKH: 'KHTT',
        maPallet: 'P202500191',
        maThung: 'P202500191',
        po: '123124',
        soLuongTon: 200,
        soLuongGoc: 200,
        khuVuc: 'RD-Warehouse',
        area: 'RD',
        status: 'Có sẵn',
        updatedBy: 'Dang Van H',
        createdDate: '01/11/2025 08:30',
        updatedDate: '01/11/2025 09:00',
      },
      {
        maSanPham: 'Req-285875',
        tenSP: 'Đèn LED chiếu pha 6500k',
        maKH: 'RD-02',
        tenKH: 'KHTT',
        maPallet: 'P202500191',
        maThung: 'P202500191',
        po: '123124',
        soLuongTon: 25,
        soLuongGoc: 25,
        khuVuc: 'RD-Warehouse',
        area: 'RD',
        status: 'Có sẵn',
        updatedBy: 'Bui Thi I',
        createdDate: '01/11/2025 08:30',
        updatedDate: '01/11/2025 09:00',
      },
    ];
    // Mock data cho Product View
    this.productDataSource = [
      {
        maSanPham: 'SP001',
        tenSP: 'Điện thoại iPhone 15',
        tongSLTon: 1500,
        tongSLGoc: 1500,
        soPO: 3,
        soKH: 2,
        soKhuVuc: 2,
        soPallet: 15,
        soThung: 30,
        ngayNhapSomNhat: '01/10/2024',
        expanded: false,
        children: [
          {
            po: 'PO2024001',
            maKH: 'KH001',
            tenKH: 'Công ty ABC',
            slTon: 500,
            slGoc: 500,
            khuVuc: 'A1',
            location: '01-A01-01-001',
            maPallet: 'P001',
            maThung: 'B001',
            status: 'Có sẵn',
            ngayNhap: '01/10/2024',
          },
        ],
      },
    ];
    // Mock data cho Area View
    this.areaDataSource = [
      {
        khuVuc: 'RD-Warehouse',
        tongSLTon: 5000,
        tongSLGoc: 5500,
        soSP: 15,
        soKH: 5,
        soPO: 8,
        soPallet: 50,
        soThung: 100,
        soLocation: 25,
        ngayCapNhat: '02/11/2024',
        expanded: false,
        children: [
          {
            location: '01-B01-01-001',
            maSanPham: 'SP001',
            tenSP: 'Điện thoại iPhone 15',
            maKH: 'KH001',
            tenKH: 'Công ty ABC',
            po: 'PO2024001',
            slTon: 500,
            slGoc: 500,
            maPallet: 'P001',
            maThung: 'B001',
            status: 'Có sẵn',
            ngayNhap: '01/10/2024',
          },
        ],
      },
    ];
    // Mock data cho Customer View
    this.customerDataSource = [
      {
        maKH: 'KH001',
        tenKH: 'Công ty ABC',
        tongSLTon: 3000,
        tongSLGoc: 3000,
        soSP: 10,
        soPO: 5,
        soKhuVuc: 3,
        soPallet: 30,
        soThung: 60,
        ngayNhapSomNhat: '01/10/2024',
        expanded: false,
        children: [
          {
            maSanPham: 'SP001',
            tenSP: 'Điện thoại iPhone 15',
            po: 'PO2024001',
            slTon: 500,
            slGoc: 500,
            khuVuc: 'A1',
            location: '01-A01-01-001',
            maPallet: 'P001',
            maThung: 'B001',
            status: 'Có sẵn',
            ngayNhap: '01/10/2024',
            ngayCapNhat: '02/11/2024',
          },
        ],
      },
    ];
  }
  //chon view mode
  onSelectView(viewMode: 'area' | 'po' | 'customer' | 'product'): void {
    this.currentViewMode = viewMode;
    console.log('Selected view mode:', viewMode);
  }
  toggleRow(item: any): void {
    item.expanded = !item.expanded;
  }
  isParentRow = (index: number, item: any) => {
    return true;
  };

  isChildRow = (index: number, item: any) => {
    return true;
  };
  updateDisplayedColumns(): void {
    this.displayedColumns = this.allColumns
      .filter((col) => col.visible)
      .map((col) => col.key);
  }
  //chọn mode search
  setFilterMode(mode: string): void {
    this.filterMode = mode;
    this.applyFilter();
  }
  applyFilter(): void {
    const { maSanPham, filterMode } = this.filterValues;

    this.filteredList = this.warehouseList.filter((item) => {
      const match = item.maSanPham
        .toLowerCase()
        .includes(maSanPham.toLowerCase());
      if (filterMode === 'constraint') {
        return match; // lọc bình thường
      } else {
        return !match; // loại bỏ kết quả khớp
      }
    });
  }
  //dialog
  openScanDialog(mode: 'check' | 'update' | 'transfer'): void {
    const dialogRef = this.dialog.open(ScanCheckDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'scan-check-dialog',
      data: { mode }, // truyền mode vào dialog
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Dialog result:', result);
        this.handleDialogResult(result);
      }
    });
  }

  onCheckWarehouse(): void {
    this.openScanDialog('check');
  }

  onUpdateInventory(): void {
    this.openScanDialog('update');
  }

  onTransferWarehouse(): void {
    this.openScanDialog('transfer');
  }

  handleDialogResult(result: any): void {
    // TODO: Xử lý dữ liệu trả về từ dialog
    console.log('Mode:', result.mode);
    console.log('Pallet Scan:', result.palletScan);
    console.log('Location Scan:', result.locationScan);
    console.log('Updated Quantity:', result.updatedQuantity);

    // Có thể gọi API để cập nhật dữ liệu
    // this.warehouseService.updateInventory(result).subscribe(...);
  }

  getStatusClass(status: string): string {
    return status === 'Có sẵn' ? 'status-available' : 'status-unavailable';
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // Load data for specific page
  }
}
