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
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { InventoryGraphqlService } from './service/inventory-graphql.service';
import { ErrorHandlerService } from './service/error-handler.service';
import { LoadingService } from './service/loading.service';
import { QuanLyKhoService } from './service/quan-ly-kho.service.component';


interface WarehouseItem {
  id?: string;
  identifier: string;          // mã thùng / mã sản phẩm
  name: string;                // tên sản phẩm
  vendor: string;              // mã KH / tên KH
  serialPallet: string;        // mã pallet
  sapCode: string;             // mã SAP
  po: string;                  // số PO
  availableQuantity: number;   // số lượng tồn
  initialQuantity: number;     // số lượng gốc
  locationId: number;          // khu vực / location
  calculatedStatus: string;    // trạng thái
  receivedDate: string;        // ngày nhập
  updatedDate: string;         // ngày cập nhật
  updatedBy: string;           // người cập nhật
}


// Interfaces cho các ViewMode
interface POParent {
  po: string;
  itemCount: number;              // số lượng sản phẩm
  totalAvailableQuantity: number; // tổng SL tồn
  totalInitialQuantity: number;   // tổng SL gốc
  totalPallets: number;
  totalContainers: number;
  totalClients: number;
  earliestReceivedDate: string;
  lastUpdatedDate: string;
  expanded?: boolean;
  children?: POChild[];
  isLoadingChildren?: boolean;
}

interface POChild {
  identifier: string;
  name: string;
  vendor: string;
  po: string;
  availableQuantity: number;
  initialQuantity: number;
  totalPallets: number;
  totalContainers: number;
  locationId: number;
  calculatedStatus: string;
}

interface ProductParent {
  identifier: string;
  name: string;
  totalAvailableQuantity: number;
  totalInitialQuantity: number;
  totalPos: number;
  totalClients: number;
  totalLocations: number;
  totalPallets: number;
  totalContainers: number;
  earliestReceivedDate: string;
  expanded?: boolean;
  children?: ProductChild[];
  isLoadingChildren?: boolean;
}
interface ProductChild {
  po: string;
  vendor: string;
  availableQuantity: number;
  initialQuantity: number;
  locationId: number;
  serialPallet: string;
  identifier: string;
  calculatedStatus: string;
  receivedDate: string;
}

interface AreaParent {
  locationId: number;
  totalAvailableQuantity: number;
  totalInitialQuantity: number;
  totalUniqueProducts: number;
  totalClients: number;
  totalPos: number;
  totalPallets: number;
  totalContainers: number;
  totalLocations: number;
  lastUpdatedDate: string;
  expanded?: boolean;
  children?: AreaChild[];
  isLoadingChildren?: boolean;
}

interface AreaChild {
  locationId: number;
  identifier: string;
  name: string;
  vendor: string;
  po: string;
  availableQuantity: number;
  initialQuantity: number;
  serialPallet: string;
  calculatedStatus: string;
  receivedDate: string;
}
interface CustomerParent {
  vendor: string;                  // groupValue
  totalAvailableQuantity: number;  // totalAvailableQuantity
  itemCount: number;               // itemCount
  totalClients: number;            // totalClients
  expanded?: boolean;
  children?: CustomerChild[];
  isLoadingChildren?: boolean;
}

interface CustomerChild {
  identifier: string;
  name: string;
  po: string;
  availableQuantity: number;
  initialQuantity: number;
  locationId: number;
  locationCode: number;
  serialPallet: string;
  calculatedStatus: string;
  receivedDate: string;
  updatedDate: string;
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
    identifier: '',
    name: '',
    vendor: '',
    serialPallet: '',
    sapCode: '',
    po: '',
    availableQuantity: null,
    initialQuantity: null,
    locationId: null,
    calculatedStatus: '',
    updatedBy: '',
    receivedDate: '',
    updatedDate: ''
  };


  filterMode: string = 'constraint';
  displayedColumns: string[] = [];

  //mobile
  showMobileFilter: boolean = false;

  //get location
  locationsMap = new Map<number, string>();

  //view mode:
  selectedViewMode: 'area' | 'po' | 'customer' | 'product' | null = null;
  currentViewMode: 'default' | 'po' | 'product' | 'area' | 'customer' = 'default';

  // Columns cho các ViewMode
  poParentColumns = [
    { key: 'expand', label: '' },
    { key: 'po', label: 'PO' },
    { key: 'itemCount', label: 'Số lượng SP' },
    { key: 'totalAvailableQuantity', label: 'Tổng SL Tồn' },
    { key: 'totalInitialQuantity', label: 'Tổng SL Gốc' },
    { key: 'totalPallets', label: 'Tổng Pallet' },
    { key: 'totalContainers', label: 'Tổng Thùng' },
    { key: 'totalClients', label: 'Khách hàng' },
    { key: 'earliestReceivedDate', label: 'Ngày nhập sớm nhất' },
    { key: 'lastUpdatedDate', label: 'Ngày cập nhật' },
  ];

  poChildColumns = [
    { key: 'identifier', label: 'Mã SP' },
    { key: 'name', label: 'Tên SP' },
    { key: 'vendor', label: 'Khách hàng' },
    { key: 'availableQuantity', label: 'SL Tồn' },
    { key: 'initialQuantity', label: 'SL Gốc' },
    { key: 'totalPallets', label: 'Pallet' },
    { key: 'totalContainers', label: 'Thùng' },
    { key: 'locationId', label: 'Khu vực' },
    { key: 'calculatedStatus', label: 'Trạng thái' },
  ];

  productParentColumns = [
    { key: 'expand', label: '' },
    { key: 'identifier', label: 'Mã SP' },
    { key: 'name', label: 'Tên SP' },
    { key: 'totalAvailableQuantity', label: 'Tổng SL Tồn' },
    { key: 'totalInitialQuantity', label: 'Tổng SL Gốc' },
    { key: 'totalPos', label: 'PO' },
    { key: 'totalClients', label: 'Khách hàng' },
    { key: 'totalLocations', label: 'Khu vực' },
    { key: 'totalPallets', label: 'Tổng Pallet' },
    { key: 'totalContainers', label: 'Tổng Thùng' },
    { key: 'earliestReceivedDate', label: 'Ngày nhập sớm nhất' },
  ];

  productChildColumns = [
    { key: 'po', label: 'PO' },
    { key: 'vendor', label: 'Khách hàng' },
    { key: 'availableQuantity', label: 'SL Tồn' },
    { key: 'initialQuantity', label: 'SL Gốc' },
    { key: 'locationId', label: 'Khu vực' },
    { key: 'serialPallet', label: 'Mã pallet' },
    { key: 'identifier', label: 'Mã thùng' },
    { key: 'calculatedStatus', label: 'Trạng thái' },
    { key: 'receivedDate', label: 'Ngày nhập' },
  ];

  areaParentColumns = [
    { key: 'expand', label: '' },
    { key: 'locationCode', label: 'Kho' },
    { key: 'totalAvailableQuantity', label: 'Tổng SL Tồn' },
    { key: 'totalInitialQuantity', label: 'Tổng SL Gốc' },
    { key: 'totalUniqueProducts', label: 'Sản phẩm' },
    { key: 'totalClients', label: 'Khách hàng' },
    { key: 'totalPos', label: 'PO' },
    { key: 'totalPallets', label: 'Tổng Pallet' },
    { key: 'totalContainers', label: 'Tổng Thùng' },
    { key: 'totalLocations', label: 'Location' },
    { key: 'lastUpdatedDate', label: 'Ngày cập nhật' },
  ];

  areaChildColumns = [
    { key: 'locationCode', label: 'Kho' },
    { key: 'identifier', label: 'Mã Identifier' },
    { key: 'name', label: 'Tên SP' },
    { key: 'vendor', label: 'Khách hàng' },
    { key: 'po', label: 'PO' },
    { key: 'availableQuantity', label: 'SL Tồn' },
    { key: 'initialQuantity', label: 'SL Gốc' },
    { key: 'serialPallet', label: 'Mã pallet' },
    { key: 'calculatedStatus', label: 'Trạng thái' },
    { key: 'receivedDate', label: 'Ngày nhập' },
  ];

  customerParentColumns = [
    { key: 'expand', label: '' },
    { key: 'vendor', label: 'Khách hàng' },
    { key: 'totalAvailableQuantity', label: 'Tổng SL Tồn' },
    { key: 'itemCount', label: 'Tổng số lượng SP' },
    { key: 'totalClients', label: 'Tổng KH' },
  ];

  customerChildColumns = [
    { key: 'identifier', label: 'Mã SP' },
    { key: 'name', label: 'Tên SP' },
    { key: 'po', label: 'PO' },
    { key: 'availableQuantity', label: 'SL Tồn' },
    { key: 'initialQuantity', label: 'SL Gốc' },
    { key: 'locationCode', label: 'Khu vực' },
    { key: 'serialPallet', label: 'Mã pallet' },
    { key: 'calculatedStatus', label: 'Trạng thái' },
    { key: 'receivedDate', label: 'Ngày nhập' },
    { key: 'updatedDate', label: 'Ngày cập nhật' },
  ];



  //mobile
  mobileDefaultFields = [
    { key: 'name', label: 'Tên SP' },
    { key: 'vendor', label: 'Khách hàng' },
    { key: 'po', label: 'PO' },
    { key: 'locationId', label: 'Kho', badge: true },
    { key: 'serialPallet', label: 'Mã pallet', badge: true },
    { key: 'identifier', label: 'Mã thùng', badge: true },
  ];

  mobileQuantityFields = [
    { key: 'availableQuantity', label: 'SL Tồn', class: 'stock' },
    { key: 'initialQuantity', label: 'SL Gốc' },
  ];

  mobilePOStats = [
    { key: 'totalAvailableQuantity', label: 'SL Tồn' },
    { key: 'totalPallets', label: 'Pallet' },
    { key: 'totalContainers', label: 'Thùng' },
  ];

  mobilePOChildFields = [
    { key: 'identifier', label: 'Mã SP', bold: true },
    { key: 'name', label: 'Tên SP' },
    { key: 'vendor', label: 'Khách hàng' },
    { key: 'availableQuantity', label: 'SL Tồn' },
    { key: 'locationCode', label: 'Khu vực' },
    { key: 'calculatedStatus', label: 'Status', badge: true },
  ];


  allColumns = [
    { key: 'stt', label: 'STT', visible: true },
    { key: 'identifier', label: 'Identifier', visible: true },
    { key: 'name', label: 'Tên SP', visible: true },
    { key: 'vendor', label: 'Khách hàng', visible: true },
    { key: 'serialPallet', label: 'Mã pallet', visible: true },
    { key: 'po', label: 'PO', visible: true },
    { key: 'availableQuantity', label: 'Số lượng tồn', visible: true },
    { key: 'initialQuantity', label: 'Số lượng gốc', visible: true },
    { key: 'locationCode', label: 'Kho', visible: true },
    { key: 'calculatedStatus', label: 'Status', visible: true },
    { key: 'updatedBy', label: 'Cập nhật bởi', visible: true },
    { key: 'receivedDate', label: 'Ngày nhập', visible: true },
    { key: 'updatedDate', label: 'Ngày cập nhật', visible: true },
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
    private loadingService: LoadingService,
    private quanLyKhoService: QuanLyKhoService
  ) { }

  ngOnInit(): void {
    this.quanLyKhoService.getLocations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (locations) => {
          this.locationsMap = new Map(locations.map(l => [l.id, l.code]));
        },
        error: (err) => console.error('[getLocations] Error:', err)
      });
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
      identifier: this.filterValues['identifier'] || undefined,
      po: this.filterValues['po'] || undefined
    };

    this.inventoryService
      .getAllInventories(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          //  FIX: response.data.allInventories thay vì response.data
          const inventories = response.data.allInventories;

          this.warehouseList = inventories.data.map(item => {
            const locId = item.locationId ?? 0;
            return {
              id: item.id,
              identifier: item.identifier || '',
              name: item.name || '',
              vendor: item.vendor || '',
              serialPallet: item.serialPallet || '',
              sapCode: item.sapCode || '',
              po: item.po || '',
              availableQuantity: item.availableQuantity || 0,
              initialQuantity: item.initialQuantity || 0,
              locationId: locId,
              locationCode: this.locationsMap.get(locId) || 'N/A',
              calculatedStatus: item.calculatedStatus || '',
              updatedBy: item.updatedBy || '',
              receivedDate: this.formatDate(item.receivedDate),
              updatedDate: this.formatDate(item.updatedDate)
            };
          });

          this.totalItems = inventories.meta.totalItems;
          this.totalPages = inventories.meta.totalPages;
          this.isLoading = false;

          console.log('[LoadDefaultView] Loaded items:', this.warehouseList.length);
        },
        error: (error) => {
          console.error('[LoadDefaultView] Error:', error);
          this.isLoading = false;
        }
      });
  }


  /**
   * Load view nhóm (area, po, customer, product)
   */
  get poParentColumnKeys(): string[] {
    return this.poParentColumns.map(c => c.key);
  }

  get productParentColumnKeys(): string[] {
    return this.productParentColumns.map(c => c.key);
  }

  get areaParentColumnKeys(): string[] {
    return this.areaParentColumns.map(c => c.key);
  }

  get customerParentColumnKeys(): string[] {
    return this.customerParentColumns.map(c => c.key);
  }


  /**
 * Load view nhóm (area, po, customer, product)
 */
  private loadGroupedView(): void {
    const groupBy = this.getGroupByParam();

    let query$: Observable<any>;

    switch (groupBy) {
      case 'po':
        query$ = this.inventoryService.getGroupedPo().pipe(
          map(result => result.data)
        );
        break;
      case 'product':
        query$ = this.inventoryService.getGroupedSapCode().pipe(
          map(result => result.data)
        );
        break;
      case 'area':
        query$ = this.inventoryService.getGroupedArea().pipe(
          map(result => result.data)
        );
        break;
      case 'client':
        query$ = this.inventoryService.getGroupedClient().pipe(
          map(result => result.data)
        );
        break;
      default:
        console.warn('[LoadGroupedView] Unsupported groupBy:', groupBy);
        this.isLoading = false;
        return;
    }

    query$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          //  Giờ response đã là data rồi, không cần .data nữa
          const grouped = response.inventoryDashboardGrouped;

          switch (this.currentViewMode) {
            case 'po':
              this.poDataSource = grouped.data.map((item: any) => ({
                po: item.groupValue,
                itemCount: item.itemCount,
                totalAvailableQuantity: item.totalAvailableQuantity,
                totalInitialQuantity: 0,
                totalPallets: item.totalPallets,
                totalContainers: 0,
                totalClients: 0,
                earliestReceivedDate: '',
                lastUpdatedDate: '',
                expanded: false,
                children: []
              }));
              break;

            case 'product':
              this.productDataSource = grouped.data.map((item: any) => ({
                identifier: item.groupKey,
                name: item.groupValue,
                totalAvailableQuantity: item.totalAvailableQuantity,
                totalInitialQuantity: 0,
                totalPos: item.totalPos || 0,
                totalClients: item.totalClients || 0,
                totalLocations: item.totalLocations || 0,
                totalPallets: item.totalPallets || 0,
                totalContainers: item.totalContainers || 0,
                earliestReceivedDate: '',
                expanded: false,
                children: []
              }));
              break;

            case 'area':
              this.areaDataSource = grouped.data.map((item: any) => ({
                locationCode: item.groupValue || 'N/A',
                totalAvailableQuantity: item.totalAvailableQuantity,
                totalInitialQuantity: 0,
                totalUniqueProducts: item.totalUniqueProducts,
                totalClients: item.totalClients,
                totalPos: item.totalPos,
                totalPallets: item.totalPallets,
                totalContainers: item.totalContainers,
                totalLocations: item.totalLocations,
                lastUpdatedDate: '',
                expanded: false,
                children: []
              }));
              break;



            case 'customer':
              this.customerDataSource = grouped.data.map((item: any) => ({
                vendor: item.groupValue,
                totalAvailableQuantity: item.totalAvailableQuantity,
                itemCount: item.itemCount,
                totalClients: item.totalClients,
                expanded: false,
                children: []
              }));
              break;
          }

          this.totalItems = grouped.meta.totalItems;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[LoadGroupedView] Error:', error);
          this.isLoading = false;
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
      .getAllInventories({
        page: 1,
        size: 100,
        ...childFilters
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const inventories = response.data.allInventories;
          parent.children = this.mapChildData(inventories.data);
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
        filters.locationId = parent.locationId;
        break;
      case 'customer':
        filters.vendor = parent.vendor;
        break;
      case 'product':
        filters.identifier = parent.identifier;
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
          identifier: item.identifier || '',
          name: item.name || '',
          vendor: item.vendor || '',
          po: item.po || '',
          availableQuantity: item.availableQuantity || 0,
          initialQuantity: item.initialQuantity || 0,
          locationId: item.locationId || 0,
          locationCode: this.locationsMap.get(item.locationId) || 'N/A',
          calculatedStatus: this.mapStatus(item.calculatedStatus)
        }));

      case 'product':
        return data.map(item => ({
          po: item.po || '',
          vendor: item.vendor || '',
          availableQuantity: item.availableQuantity || 0,
          initialQuantity: item.initialQuantity || 0,
          locationId: item.locationId || 0,
          locationCode: this.locationsMap.get(item.locationId) || 'N/A',
          serialPallet: item.serialPallet || '',
          identifier: item.identifier || '',
          calculatedStatus: this.mapStatus(item.calculatedStatus),
          receivedDate: this.formatDate(item.receivedDate)
        }));

      case 'area':
        return data.map(item => ({
          locationId: item.locationId || 0,
          locationCode: this.locationsMap.get(item.locationId) || 'N/A',
          identifier: item.identifier || '',
          name: item.name || '',
          vendor: item.vendor || '',
          po: item.po || '',
          availableQuantity: item.availableQuantity || 0,
          initialQuantity: item.initialQuantity || 0,
          serialPallet: item.serialPallet || '',
          calculatedStatus: this.mapStatus(item.calculatedStatus),
          receivedDate: this.formatDate(item.receivedDate)
        }));

      case 'customer':
        return data.map(item => ({
          identifier: item.identifier || '',
          name: item.name || '',
          po: item.po || '',
          availableQuantity: item.availableQuantity || 0,
          initialQuantity: item.initialQuantity || 0,
          locationId: item.locationId || 0,
          locationCode: this.locationsMap.get(item.locationId) || 'N/A',
          serialPallet: item.serialPallet || '',
          calculatedStatus: this.mapStatus(item.calculatedStatus),
          receivedDate: this.formatDate(item.receivedDate),
          updatedDate: this.formatDate(item.updatedDate)
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

  getFilterColumn(): { key: string; label: string }[] {
    return this.customerParentColumns.filter(col =>
      col.key !== 'expand' && col.key !== 'vendor'
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
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadData();
  }

  // Hàm thay đổi pageSize
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1; // reset về trang đầu
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