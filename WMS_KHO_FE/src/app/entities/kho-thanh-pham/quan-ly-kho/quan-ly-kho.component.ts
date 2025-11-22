import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ScanCheckDialogComponent } from './dialog/scan-check-dialog.component';
import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { InventoryGraphqlService } from './service/inventory-graphql.service'; 
import { ErrorHandlerService } from './service/error-handler.service';
import { LoadingService } from './service/loading.service';

interface WarehouseItem {
  id?: string;
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
  isLoadingChildren?: boolean;
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
  isLoadingChildren?: boolean;
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
  isLoadingChildren?: boolean;
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
  isLoadingChildren?: boolean;
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
export class QuanLyKhoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  pageSize = 10;
  currentPage = 1;
  totalItems = 0;
  totalPages = 0;
  isLoading = false;

  filterValues: { [key: string]: any } = {
    name: '',
    client_id: null,
    serial_pallet: '',
    identifier: '',
    po: '',
    location_id: null,
    area_id: null,
    status: '',
    updated_by: ''
  };
  filterMode: string = 'constraint';
  displayedColumns: string[] = [];
  
  //mobile
  showMobileFilter: boolean = false;

  //view mode:
  selectedViewMode: 'area' | 'po' | 'customer' | 'product' | null = null;
  currentViewMode: 'default' | 'po' | 'product' | 'area' | 'customer' = 'default';

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

  // Data sources
  warehouseList: WarehouseItem[] = [];
  poDataSource: POParent[] = [];
  productDataSource: ProductParent[] = [];
  areaDataSource: AreaParent[] = [];
  customerDataSource: CustomerParent[] = [];
  filteredList: WarehouseItem[] | undefined;

  constructor(
    private dialog: MatDialog,
    private inventoryService: InventoryGraphqlService,
    private errorHandler: ErrorHandlerService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.updateDisplayedColumns();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load dữ liệu từ GraphQL dựa trên view mode
   */
  loadData(): void {
    this.isLoading = true;

    if (this.currentViewMode === 'default') {
      this.loadDefaultView();
    } else {
      this.loadGroupedView();
    }
  }

  /**
   * Load view mặc định (chi tiết từng inventory)
   */
  private loadDefaultView(): void {
    const params = {
      page: this.currentPage,
      size: this.pageSize,
      ...this.getActiveFilters()
    };

    this.inventoryService
      .getInventoryDashboard(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.warehouseList = response.data.map(item => ({
            id: item.id,
            maSanPham: item.identifier || '',
            tenSP: item.name || '',
            maKH: item.client_id?.toString() || '',
            tenKH: '', // Cần join từ bảng client
            maPallet: item.serial_pallet || '',
            maThung: '', // Cần lấy từ container
            po: item.po || '',
            soLuongTon: item.available_quantity || 0,
            soLuongGoc: item.initial_quantity || 0,
            khuVuc: item.area_code || '',
            area: item.area_name || '',
            status: this.mapStatus(item.status),
            updatedBy: item.updated_by || '',
            createdDate: this.formatDate(item.received_date),
            updatedDate: this.formatDate(item.updated_date)
          }));

          this.totalItems = response.meta.total_items;
          this.totalPages = response.meta.total_pages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading inventory dashboard:', error);
          this.isLoading = false;
          // TODO: Show error message to user
        }
      });
  }

  /**
   * Load view nhóm (area, po, customer, product)
   */
  private loadGroupedView(): void {
    const groupBy = this.getGroupByParam();
    const params = {
      group_by: groupBy,
      page: this.currentPage,
      size: this.pageSize,
      ...this.getActiveFilters()
    };

    this.inventoryService
      .getInventoryDashboardGrouped(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          switch (this.currentViewMode) {
            case 'po':
              this.poDataSource = response.data.map(item => ({
                po: item.group_value,
                soLuongSP: item.total_unique_products,
                tongSLTon: item.total_available_quantity,
                tongSLGoc: item.total_initial_quantity,
                soPallet: item.total_pallets,
                soThung: item.total_containers,
                soKH: item.total_clients,
                ngayNhapSomNhat: this.formatDate(item.last_received),
                ngayCapNhat: this.formatDate(item.last_updated),
                expanded: false,
                children: []
              }));
              break;

            case 'product':
              this.productDataSource = response.data.map(item => ({
                maSanPham: item.group_key,
                tenSP: item.group_value,
                tongSLTon: item.total_available_quantity,
                tongSLGoc: item.total_initial_quantity,
                soPO: item.total_pos,
                soKH: item.total_clients,
                soKhuVuc: item.total_locations,
                soPallet: item.total_pallets,
                soThung: item.total_containers,
                ngayNhapSomNhat: this.formatDate(item.last_received),
                expanded: false,
                children: []
              }));
              break;

            case 'area':
              this.areaDataSource = response.data.map(item => ({
                khuVuc: item.group_value,
                tongSLTon: item.total_available_quantity,
                tongSLGoc: item.total_initial_quantity,
                soSP: item.total_unique_products,
                soKH: item.total_clients,
                soPO: item.total_pos,
                soPallet: item.total_pallets,
                soThung: item.total_containers,
                soLocation: item.total_locations,
                ngayCapNhat: this.formatDate(item.last_updated),
                expanded: false,
                children: []
              }));
              break;

            case 'customer':
              this.customerDataSource = response.data.map(item => ({
                maKH: item.group_key,
                tenKH: item.group_value,
                tongSLTon: item.total_available_quantity,
                tongSLGoc: item.total_initial_quantity,
                soSP: item.total_unique_products,
                soPO: item.total_pos,
                soKhuVuc: item.total_locations,
                soPallet: item.total_pallets,
                soThung: item.total_containers,
                ngayNhapSomNhat: this.formatDate(item.last_received),
                expanded: false,
                children: []
              }));
              break;
          }

          this.totalItems = response.meta.total_items;
          this.totalPages = response.meta.total_pages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading grouped inventory:', error);
          this.isLoading = false;
          // TODO: Show error message to user
        }
      });
  }

  /**
   * Load dữ liệu con khi expand row
   */
  toggleRow(item: any): void {
    item.expanded = !item.expanded;

    // Load children data nếu chưa có và đang expand
    if (item.expanded && (!item.children || item.children.length === 0)) {
      this.loadChildData(item);
    }
  }

  /**
   * Load child data based on parent row
   */
  private loadChildData(parent: any): void {
    parent.isLoadingChildren = true;

    const childFilters = this.getChildFilters(parent);
    
    this.inventoryService
      .getInventoryDashboard({
        page: 1,
        size: 100, // Load nhiều items cho children
        ...childFilters
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          parent.children = this.mapChildData(response.data);
          parent.isLoadingChildren = false;
        },
        error: (error) => {
          console.error('Error loading child data:', error);
          parent.isLoadingChildren = false;
        }
      });
  }

  /**
   * Get filters for loading child data
   */
  private getChildFilters(parent: any): any {
    const filters: any = {};

    switch (this.currentViewMode) {
      case 'po':
        filters.po = parent.po;
        break;
      case 'area':
        // Cần map khuVuc về area_id
        filters.area_id = this.getAreaIdByCode(parent.khuVuc);
        break;
      case 'customer':
        filters.client_id = parseInt(parent.maKH);
        break;
      case 'product':
        filters.identifier = parent.maSanPham;
        break;
    }

    return filters;
  }

  /**
   * Map child data based on view mode
   */
  private mapChildData(data: any[]): any[] {
    switch (this.currentViewMode) {
      case 'po':
        return data.map(item => ({
          maSanPham: item.identifier || '',
          tenSP: item.name || '',
          maKH: item.client_id?.toString() || '',
          tenKH: '', // TODO: Get from client table
          slTon: item.available_quantity || 0,
          slGoc: item.initial_quantity || 0,
          soPallet: item.serial_pallet || '',
          soThung: '', // TODO: Get from container
          khuVuc: item.area_code || '',
          status: this.mapStatus(item.status)
        }));

      case 'product':
        return data.map(item => ({
          po: item.po || '',
          maKH: item.client_id?.toString() || '',
          tenKH: '', // TODO: Get from client table
          slTon: item.available_quantity || 0,
          slGoc: item.initial_quantity || 0,
          khuVuc: item.area_code || '',
          location: item.location_id?.toString() || '',
          maPallet: item.serial_pallet || '',
          maThung: '', // TODO: Get from container
          status: this.mapStatus(item.status),
          ngayNhap: this.formatDate(item.received_date)
        }));

      case 'area':
        return data.map(item => ({
          location: item.location_id?.toString() || '',
          maSanPham: item.identifier || '',
          tenSP: item.name || '',
          maKH: item.client_id?.toString() || '',
          tenKH: '', // TODO: Get from client table
          po: item.po || '',
          slTon: item.available_quantity || 0,
          slGoc: item.initial_quantity || 0,
          maPallet: item.serial_pallet || '',
          maThung: '', // TODO: Get from container
          status: this.mapStatus(item.status),
          ngayNhap: this.formatDate(item.received_date)
        }));

      case 'customer':
        return data.map(item => ({
          maSanPham: item.identifier || '',
          tenSP: item.name || '',
          po: item.po || '',
          slTon: item.available_quantity || 0,
          slGoc: item.initial_quantity || 0,
          khuVuc: item.area_code || '',
          location: item.location_id?.toString() || '',
          maPallet: item.serial_pallet || '',
          maThung: '', // TODO: Get from container
          status: this.mapStatus(item.status),
          ngayNhap: this.formatDate(item.received_date),
          ngayCapNhat: this.formatDate(item.updated_date)
        }));

      default:
        return [];
    }
  }

  /**
   * Helper methods
   */
  private getGroupByParam(): 'area' | 'po' | 'client' | 'product' {
    switch (this.currentViewMode) {
      case 'customer':
        return 'client';
      default:
        return this.currentViewMode as 'area' | 'po' | 'product';
    }
  }

  private getActiveFilters(): any {
    const filters: any = {};
    
    Object.keys(this.filterValues).forEach(key => {
      const value = this.filterValues[key];
      if (value !== null && value !== undefined && value !== '') {
        filters[key] = value;
      }
    });

    return filters;
  }

  private mapStatus(status: string | null): string {
    if (!status) return 'Không xác định';
    
    const statusMap: { [key: string]: string } = {
      'available': 'Có sẵn',
      'reserved': 'Đã đặt',
      'expired': 'Hết hạn',
      'damaged': 'Hư hỏng'
    };

    return statusMap[status.toLowerCase()] || status;
  }

  private formatDate(dateString: string | null): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private getAreaIdByCode(areaCode: string): number | null {
    // TODO: Implement mapping từ area code sang area ID
    // Có thể cache mapping này hoặc call API riêng
    return null;
  }

  /**
   * View mode handling
   */
  onSelectView(viewMode: 'area' | 'po' | 'customer' | 'product'): void {
    this.currentViewMode = viewMode;
    this.currentPage = 1;
    this.loadData();
    console.log('Selected view mode:', viewMode);
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

  /**
   * Mobile filter handling
   */
  toggleMobileFilter(): void {
    this.showMobileFilter = !this.showMobileFilter;
  }

  getFilterColumn(): string[] {
    return this.customerParentColumns.filter(col =>
      col !== 'expand' && col !== 'maKH'
    );
  }

  getColumnLabel(col: string): string {
    const labels: { [key: string]: string } = {
      'tenKH': 'Tên KH',
      'tongSLTon': 'Tổng SL Tồn',
      'tongSLGoc': 'Tổng SL Gốc',
      'soSP': 'Số SP',
      'soPO': 'Số PO',
      'soKhuVuc': 'Số Khu Vực',
      'soPallet': 'Số Pallet',
      'soThung': 'Số thùng',
      'ngayNhapSomNhat': 'Ngày Nhập',
      'ngayCapNhat': 'Ngày cập nhật',
      'maSanPham': 'Mã sản phẩm',
      'tenSP': 'Tên SP',
      'po': 'PO',
      'khuVuc': 'Khu vực',
    };
    return labels[col] || col;
  }

  /**
   * Filter handling
   */
  clearFilters(): void {
    this.filterValues = {
      name: '',
      client_id: null,
      serial_pallet: '',
      identifier: '',
      po: '',
      location_id: null,
      area_id: null,
      status: '',
      updated_by: ''
    };
    this.currentPage = 1;
    this.loadData();
  }

  setFilterMode(mode: string): void {
    this.filterMode = mode;
    this.applyFilter();
  }

  applyFilter(): void {
    this.currentPage = 1;
    this.loadData();
  }

  /**
   * Dialog handling
   */
  openScanDialog(mode: 'check' | 'update' | 'transfer'): void {
    const dialogRef = this.dialog.open(ScanCheckDialogComponent, {
      width: '1200px',
      maxWidth: '95vw',
      panelClass: 'scan-check-dialog',
      data: { mode },
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
    console.log('Mode:', result.mode);
    console.log('Pallet Scan:', result.palletScan);
    console.log('Location Scan:', result.locationScan);
    console.log('Updated Quantity:', result.updatedQuantity);

    // Reload data sau khi cập nhật
    this.loadData();
  }

  /**
   * Pagination
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadData();
  }

  /**
   * Status styling
   */
  getStatusClass(status: string): string {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('có sẵn') || statusLower === 'available') {
      return 'status-available';
    }
    return 'status-unavailable';
  }

  /**
   * Export functionality
   */
  exportData(): void {
    // TODO: Implement export với dữ liệu từ API
    console.log('Exporting data...');
  }
}