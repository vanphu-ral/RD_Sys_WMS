import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core'; // Added AfterViewInit
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MaterialService, RawGraphQLMaterial } from '../../material.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ChangeDetectionStrategy, signal } from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatSort } from '@angular/material/sort';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { FilterDialogComponent } from '../filter-dialog/filter-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';

interface sumary_mode {
  value: string;
  name: string;
}
export interface ColumnConfig {
  name: string;
  matColumnDef: string;
  completed: boolean;
}
export interface columnSelectionGroup {
  name: string;
  completed: boolean;
  subtasks?: ColumnConfig[];
}
export interface AggregatedPartData {
  [key: string]: any;
  totalQuantity: number;
  count: number;
  details: RawGraphQLMaterial[];
  detailDataSource?: MatTableDataSource<RawGraphQLMaterial>;
}

@Component({
  selector: 'app-aggregated-part',
  standalone: true,
  imports: [
    CommonModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    RouterModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatListModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormBuilder],
  templateUrl: './aggregated-part.component.html',
  styleUrl: './aggregated-part.component.scss',
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed',
        style({
          height: '0px',
          minHeight: '0',
          visibility: 'hidden',
          display: 'none',
        })
      ),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class AggregatedPartComponent implements OnInit, AfterViewInit {
  tableWidth: string = '100%';
  value = '';

  checkedCount = signal(0);

  displayedColumns: string[] = [
    'expand',
    'groupingKey',
    'totalQuantity',
    'count',
  ];

  columnSelectionGroup = signal<columnSelectionGroup>({
    name: 'Select all',
    completed: false,
    subtasks: [
      { name: 'Add to list', matColumnDef: 'select', completed: true },

      {
        name: 'Material Identifier',
        matColumnDef: 'materialIdentifier',
        completed: true,
      },
      { name: 'PartId', matColumnDef: 'partId', completed: false },
      { name: 'Part Number', matColumnDef: 'partNumber', completed: true },
      {
        name: 'Calculated Status',
        matColumnDef: 'calculatedStatus',
        completed: false,
      },
      { name: 'Tracking Type', matColumnDef: 'trackingType', completed: false },
      { name: 'InventoryId', matColumnDef: 'inventoryId', completed: true },
      { name: 'Quantity', matColumnDef: 'quantity', completed: true },
      {
        name: 'Material TraceId',
        matColumnDef: 'materialTraceId',
        completed: false,
      },
      { name: 'LocationId', matColumnDef: 'locationId', completed: true },
      {
        name: 'Parent LocationId',
        matColumnDef: 'parentLocationId',
        completed: false,
      },
      {
        name: 'Last LocationId',
        matColumnDef: 'lastLocationId',
        completed: false,
      },
      {
        name: 'Expiration Date',
        matColumnDef: 'expirationDate',
        completed: true,
      },
      { name: 'Received Date', matColumnDef: 'receivedDate', completed: true },
      { name: 'Updated Date', matColumnDef: 'updatedDate', completed: true },
      { name: 'Updated By', matColumnDef: 'updatedBy', completed: false },
      {
        name: 'Manufacturing Date',
        matColumnDef: 'manufacturingDate',
        completed: false,
      },
      { name: 'Material Type', matColumnDef: 'materialType', completed: false },
      { name: 'Checkin Date', matColumnDef: 'checkinDate', completed: false },
    ],
  });

  getColumnDisplayName(colDef: string): string {
    const columnNames: { [key: string]: string } = {
      select: 'Add to list',
      inventoryId: 'Inventory Id',
      partId: 'PartId',
      calculatedStatus: 'Calculated Status',
      partNumber: 'Part Number',
      trackingType: 'Tracking Type',
      materialTraceId: 'Material TraceId',
      quantity: 'Quantity',
      locationId: 'LocationId',
      parentLocationId: 'Parent LocationId',
      lastLocationId: 'Last LocationId',
      expirationDate: 'Expiration Date',
      receivedDate: 'Received Date',
      updatedDate: 'Updated Date',
      updatedBy: 'Updated By',
      manufacturingDate: 'Manufacturing Date',
      materialType: 'Material Type',
      checkinDate: 'Checkin Date',
      locationName: 'Location Name',
      locationFullName: 'Location FullName',
      locationTypeId: 'Location TypeId',
      locationTypeName: 'Location TypeName',
      locationDescription: 'Location Description',
    };
    return columnNames[colDef] || colDef;
  }

  dataSource = new MatTableDataSource<AggregatedPartData>();
  length = 0;
  pageSize = 15;
  pageIndex = 0;
  pageSizeOptions = [10, 15, 25, 50, 100];

  hidePageSize = false;
  showPageSizeOptions = true;
  showFirstLastButtons = true;
  disabled = false;

  pageEvent: PageEvent | undefined;
  groupedData: AggregatedPartData[] = [];
  groupingField: string = 'groupingKey';

  expandedElement: AggregatedPartData | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public searchTerms: { [columnDef: string]: { mode: string; value: string } } =
    {};
  public activeFilters: { [columnDef: string]: any[] } = {};
  public filterModes: { [columnDef: string]: string } = {};
  public filterField = this.groupingField || 'groupingKey';
  public setFilterMode(colDef: string, mode: string): void {
    this.filterModes[colDef] = mode;
    this.applyCombinedFilters();
  }

  private applyCombinedFilters(): void {
    const combinedFilterData = {
      textFilters: this.searchTerms,
      dialogFilters: this.activeFilters,
      timestamp: new Date().getTime(), // Thêm timestamp như một thuộc tính của object
    };
    console.log(
      '[applyCombinedFilters] - combinedFilterData:',
      combinedFilterData
    );
    this.dataSource.filter = JSON.stringify(combinedFilterData);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  ngOnInitFilterPredicate() {
    this.dataSource.filterPredicate = (
      data: AggregatedPartData,
      filter: string
    ): boolean => {
      const combinedFilters = JSON.parse(filter) as {
        textFilters: { [columnDef: string]: { mode: string; value: string } };
        dialogFilters: { [columnDef: string]: any[] };
      };

      // Xử lý bộ lọc text Filters
      if (combinedFilters.textFilters) {
        for (const colDef in combinedFilters.textFilters) {
          if (combinedFilters.textFilters.hasOwnProperty(colDef)) {
            const filterObj = combinedFilters.textFilters[colDef];
            const searchMode = filterObj.mode; // "contains", "not_contains", "equals", "not_equals"
            const searchTerm = filterObj.value.trim().toLowerCase();
            if (searchTerm === '') continue;

            let cellValue = (data as any)[colDef];

            cellValue = cellValue ? String(cellValue).trim().toLowerCase() : '';

            // Áp dụng điều kiện lọc theo mode
            if (searchMode === 'contains') {
              if (!cellValue.includes(searchTerm)) return false;
            } else if (searchMode === 'not_contains') {
              if (cellValue.includes(searchTerm)) return false;
            } else if (searchMode === 'equals') {
              if (cellValue !== searchTerm) return false;
            } else if (searchMode === 'not_equals') {
              if (cellValue === searchTerm) return false;
            } else {
              // Nếu không nhận dạng được mode, mặc định kiểm tra contains
              if (!cellValue.includes(searchTerm)) return false;
            }
          }
        }
      }

      if (combinedFilters.dialogFilters) {
        for (const colDef in combinedFilters.dialogFilters) {
          if (combinedFilters.dialogFilters.hasOwnProperty(colDef)) {
            const selectedValuesFromDialog =
              combinedFilters.dialogFilters[colDef];
            if (
              !selectedValuesFromDialog ||
              selectedValuesFromDialog.length === 0
            )
              continue;

            const normalizedSelectedValues = selectedValuesFromDialog.map(
              (val) => String(val).trim().toLowerCase()
            );
            let cellValue = (data as any)[colDef]
              ? String((data as any)[colDef])
                  .trim()
                  .toLowerCase()
              : '';
            if (!normalizedSelectedValues.includes(cellValue)) return false;
          }
        }
      }
      return true;
    };
  }

  goBackToList(): void {
    this.router.navigate(['/material/list']);
  }
  groupData(data: RawGraphQLMaterial[]): void {
    if (!data || data.length === 0) {
      console.warn('Không có dữ liệu để nhóm.');
      return;
    }

    // Sử dụng Map để nhóm. key của Map là giá trị của trường được chọn
    const groups = new Map<string, AggregatedPartData>();

    data.forEach((item) => {
      // Lấy key nhóm dựa trên trường được chọn (ví dụ: partNumber, locationId, …)
      const key = (item as any)[this.groupingField];
      if (!key) {
        console.warn(`Item không có trường ${this.groupingField}:`, item);
        return;
      }

      if (!groups.has(key)) {
        // Tạo một đối tượng mới cho nhóm:
        // Sử dụng dynamic property để lưu giá trị của trường đã chọn.
        const group: AggregatedPartData = {
          totalQuantity: 0,
          count: 0,
          details: [],
        };
        group[this.groupingField] = key; // Lưu key vào thuộc tính theo tên trường hiện hành
        groups.set(key, group);
      }

      const group = groups.get(key)!;
      group.totalQuantity += item.quantity;
      group.count++;
      group.details.push(item);
    });

    // Chuyển Map thành mảng và cập nhật groupedData
    this.groupedData = Array.from(groups.values());
    // Với mỗi group, tạo detailDataSource dựa trên row.details
    this.groupedData.forEach((row) => {
      row.detailDataSource = new MatTableDataSource(row.details);
    });

    // Gán dữ liệu grouping đã được tổng hợp cho dataSource
    this.dataSource.data = this.groupedData;
    this.length = this.groupedData.length;
    console.log('Grouped Data:', this.groupedData);
  }

  toggleRow(element: AggregatedPartData) {
    this.expandedElement = this.expandedElement === element ? null : element;
  }
  handlePageEvent(e: PageEvent) {
    this.pageEvent = e;
    this.pageSize = e.pageSize;
    this.pageIndex = e.pageIndex;
  }

  setPageSizeOptions(setPageSizeOptionsInput: string) {
    if (setPageSizeOptionsInput) {
      this.pageSizeOptions = setPageSizeOptionsInput
        .split(',')
        .map((str) => +str);
    }
  }

  handleRowToggle(row: RawGraphQLMaterial): void {
    const inventoryId = row.inventoryId;
    console.log(
      `[ListMaterialComponent] handleRowToggle for row. Material ID: ${inventoryId} (type: ${typeof inventoryId})`,
      JSON.stringify(row)
    );
    if (inventoryId === undefined || inventoryId === null) {
      console.error(
        '[ListMaterialComponent] Material ID is undefined or null for row:',
        JSON.stringify(row)
      );
      return;
    }
    this.MaterialService.toggleItemSelection(inventoryId);
  }
  loadData(): void {
    this.MaterialService.materialsData$.subscribe(
      (data: RawGraphQLMaterial[]) => {
        this.groupData(data);
      }
    );
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      // Lấy từ queryParams (ví dụ: ?mode=partNumber) nếu không có thì mặc định 'partNumber'
      this.groupingField =
        params['mode'] ||
        'partNumber' ||
        'locationId' ||
        'updatedBy' ||
        'materialTraceId';
      console.log(
        'AggregatedPartComponent - groupingField:',
        this.groupingField
      );
      this.MaterialService.materialsData$.subscribe(
        (data: RawGraphQLMaterial[]) => {
          console.log('[ngOnInit] Received materialsData:', data);
          this.groupData(data);
          console.log('[ngOnInit] groupedData:', this.groupedData);
          this.applyCombinedFilters();
        }
      );
    });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    // Khởi tạo filter predicate sau khi dữ liệu đã được gán type AggregatedPartData
    this.ngOnInitFilterPredicate();
  }

  form!: FormGroup;

  sumary_modes: sumary_mode[] = [
    { value: 'partNumber', name: 'Part Number' },
    { value: 'locationId', name: 'Location ID' },
    { value: 'updatedBy', name: 'Updated By' },
    { value: 'materialTraceId', name: 'Material Trace ID' },
  ];

  sumary_modeControl = new FormControl();
  selectedAggregated: string = '';

  onLoad(): void {
    const selectedMode: string = this.form.get('sumary_modeControl')?.value;
    if (selectedMode) {
      this.router.navigate(['/material/aggregated-part'], {
        queryParams: { mode: selectedMode },
      });
    } else {
      console.warn('Chưa chọn chế độ tổng hợp.');
    }
  }

  constructor(
    private MaterialService: MaterialService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = new FormGroup({
      sumary_modeControl: new FormControl(null),
    });
  }

  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  openMenuManually() {
    this.menuTrigger.openMenu();
  }

  closeMenuManually() {
    this.menuTrigger.closeMenu();
  }
  public applyFilter(colDef: string, event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    const selectedMode = this.filterModes[colDef] || 'contains';

    // Nếu cột filter là cột nhóm (ví dụ: "groupingKey"), chuyển sang dùng this.groupingField
    const filterKey = colDef === 'groupingKey' ? this.groupingField : colDef;

    if (!this.searchTerms[filterKey]) {
      this.searchTerms[filterKey] = {
        mode: selectedMode,
        value: filterValue,
      };
    } else {
      this.searchTerms[filterKey].value = filterValue;
    }

    console.log(
      `[applyFilter] - Cột ${filterKey}:`,
      this.searchTerms[filterKey]
    );
    this.applyCombinedFilters();
  }

  private ensureDetailDataSource(row: AggregatedPartData) {
    if (!row.detailDataSource) {
      row.detailDataSource = new MatTableDataSource(row.details);
    }
    // DÙNG LUÔN, dù mới tạo hay đã có sẵn, set lại filterPredicate:
    row.detailDataSource.filterPredicate =
      this.detailFilterPredicate.bind(this);
  }
  public detailFilterPredicate(data: any, filter: string): boolean {
    let combined;
    try {
      combined = JSON.parse(filter);
    } catch {
      return true;
    }
    const tf = combined.textFilters || {};
    for (const col in tf) {
      const { mode, value } = tf[col];
      const term = (value || '').trim().toLowerCase();
      if (!term) continue;
      const cell = (data as any)[col]?.toString().toLowerCase() || '';
      let match = false;
      switch (mode) {
        case 'equals':
          match = cell === term;
          break;
        case 'not_equals':
          match = cell !== term;
          break;
        case 'not_contains':
          match = !cell.includes(term);
          break;
        case 'contains':
        default:
          match = cell.includes(term);
      }
      if (!match) return false;
    }
    return true;
  }
  public searchTermsDetail: {
    [colDetail: string]: { mode: string; value: string };
  } = {};
  public activeFiltersDetail: { [colDetail: string]: any[] } = {};
  public filterModesDetail: { [colDetail: string]: string } = {};
  public setFilterModeDetail(
    row: AggregatedPartData,
    colDt: string,
    mode: string
  ): void {
    this.filterModesDetail[colDt] = mode;
    this.applyCombinedFiltersDetail(row);
  }

  private applyCombinedFiltersDetail(row: AggregatedPartData): void {
    if (!row.detailDataSource) {
      row.detailDataSource = new MatTableDataSource(row.details);
      row.detailDataSource.filterPredicate = this.detailFilterPredicate;
    }
    this.ensureDetailDataSource(row);

    // 2) Build JSON filter
    const combinedFilterData = {
      textFilters: this.searchTermsDetail,
      dialogFilters: this.activeFiltersDetail,
      timestamp: Date.now(),
    };

    // 3) Gán filter
    row.detailDataSource.filter = JSON.stringify(combinedFilterData);

    // 4) Reset paginator nếu có
    if (row.detailDataSource.paginator) {
      row.detailDataSource.paginator.firstPage();
    }
  }
  applyDetailFilter(
    row: AggregatedPartData,
    colDetail: string,
    event: Event
  ): void {
    const filterValue = (event.target as HTMLInputElement).value
      .trim()
      .toLowerCase();
    const selectedMode = this.filterModesDetail[colDetail] || 'contains';
    this.searchTermsDetail[colDetail] = {
      mode: selectedMode,
      value: filterValue,
    };
    console.log(
      `[applyDetailFilter] - Cột ${colDetail}:`,
      this.searchTermsDetail[colDetail]
    );

    // Áp dụng filter lên detailDataSource của row đó
    this.applyCombinedFiltersDetail(row);
  }

  // Xuất excel
  export() {
    const formattedData = this.dataSource.filteredData.map((row) => ({
      ...row,
    }));

    this.MaterialService.exportExcel(formattedData, 'customers');
  }
}
