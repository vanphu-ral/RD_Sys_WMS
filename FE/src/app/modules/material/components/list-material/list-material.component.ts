import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core'; // Added AfterViewInit
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MaterialService, RawGraphQLMaterial } from '../../material.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ChangeDetectionStrategy, signal } from '@angular/core';
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
export interface FilterDialogData {
  columnName: string;
  currentValues: any[];
  selectedValues: any[];
}

@Component({
  selector: 'app-list-material',
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
  templateUrl: './list-material.component.html',
  styleUrls: ['./list-material.component.scss'],
})
export class ListMaterialComponent implements OnInit, AfterViewInit {
  tableWidth: string = '100%';
  value = '';

  checkedCount = signal(0);

  selection = new SelectionModel<RawGraphQLMaterial>(true, []);

  displayedColumns: string[] = [
    'select',
    // "checked",

    'materialTraceId',
    'inventoryId',
    'partId',
    'partNumber',
    'calculatedStatus',
    'trackingType',
    'quantity',
    'locationId',
    'parentLocationId',
    'lastLocationId',
    'expirationDate',
    'receivedDate',
    'updatedDate',
    'updatedBy',
    'manufacturingDate',
    'materialType',
    'checkinDate',
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

  dataSource = new MatTableDataSource<RawGraphQLMaterial>();
  length = 0;
  pageSize = 15;
  pageIndex = 0;
  pageSizeOptions = [10, 15, 25, 50, 100];

  hidePageSize = false;
  showPageSizeOptions = true;
  showFirstLastButtons = true;
  disabled = false;

  pageEvent: PageEvent | undefined;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public searchTerms: { [columnDef: string]: { mode: string; value: string } } =
    {};
  public activeFilters: { [columnDef: string]: any[] } = {};
  public filterModes: { [columnDef: string]: string } = {};
  public setFilterMode(colDef: string, mode: string): void {
    this.filterModes[colDef] = mode; // Lưu trạng thái mode được chọn
    console.log(`[setFilterMode] - Cột ${colDef} đã chọn mode: ${mode}`);
  }

  private applyCombinedFilters(): void {
    const combinedFilterData = {
      textFilters: this.searchTerms,
      dialogFilters: this.activeFilters,
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
    // const inventoryId = row["inventoryId"];
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

  ngOnInit() {
    this.updateDisplayedColumns();
    this.MaterialService.materialsData$.subscribe((data) => {
      this.dataSource.data = data;
      const newSelection = new SelectionModel<RawGraphQLMaterial>(true, []);
      data.forEach((item) => {
        if (item.checked) {
          newSelection.select(item);
        }
      });
      this.selection = newSelection;
    });

    this.MaterialService.selectedIds$.subscribe((ids) => {
      this.checkedCount.set(ids.length);
    });

    this.MaterialService.totalCount$.subscribe((count) => {
      this.length = count; // Update paginator length
    });

    // Chỉnh sửa phần filterPredicate để xử lý textFilters là object chứa { mode, value }
    this.dataSource.filterPredicate = (
      data: RawGraphQLMaterial,
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
            if (colDef === 'Expiration Date' && cellValue) {
              try {
                cellValue = new Date(cellValue)
                  .toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                  .toLowerCase();
              } catch (e) {
                cellValue = String(cellValue).trim().toLowerCase();
              }
            } else {
              cellValue = cellValue
                ? String(cellValue).trim().toLowerCase()
                : '';
            }

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
            if (colDef === 'Expiration Date' && (data as any)[colDef]) {
              try {
                cellValue = new Date((data as any)[colDef])
                  .toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })
                  .toLowerCase();
              } catch (e) {}
            }
            if (!normalizedSelectedValues.includes(cellValue)) return false;
          }
        }
      }
      return true;
    };
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort; // Ensure sort is also set after view init
  }
  update(completed: boolean, index?: number): void {
    const currentGroup = this.columnSelectionGroup();

    if (index === undefined) {
      currentGroup.completed = completed;
      currentGroup.subtasks!.forEach(
        (subtask) => (subtask.completed = completed)
      );
    } else {
      currentGroup.subtasks![index].completed = completed;
      this.updateMasterCheckboxStatus();
    }

    this.columnSelectionGroup.set({ ...currentGroup });
    this.updateDisplayedColumns();
  }

  updateMasterCheckboxStatus(): void {
    const currentGroup = this.columnSelectionGroup();
    const allCompleted = currentGroup.subtasks!.every(
      (subtask) => subtask.completed
    );
    const anyCompleted = currentGroup.subtasks!.some(
      (subtask) => subtask.completed
    );
    currentGroup.completed = allCompleted;
    this.columnSelectionGroup.set({ ...currentGroup });
  }

  partiallyComplete(): boolean {
    const subtasks = this.columnSelectionGroup().subtasks;
    if (!subtasks) {
      return false;
    }
    const allCompleted = subtasks.every((subtask) => subtask.completed);
    const anyCompleted = subtasks.some((subtask) => subtask.completed);
    return anyCompleted && !allCompleted;
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
    private router: Router
  ) {
    this.form = new FormGroup({
      sumary_modeControl: new FormControl(null),
    });
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  updateChecked(element: any, isChecked: boolean): void {
    this.MaterialService.toggleItemSelection(element.inventoryId);

    console.log('Current checked count:', this.checkedCount);
    console.log('Updated dataSource:', this.dataSource.data);
  }

  isAllChecked(): boolean {
    return this.dataSource.data.every((item) => item.checked);
  }

  updateSelectedItemsCount() {
    this.checkedCount.set(
      this.dataSource.data.filter((item) => item.checked).length
    );
  }

  toggleCheckbox(inventoryId: string) {
    this.MaterialService.toggleItemSelection(inventoryId);
  }

  checkboxLabel(): string {
    return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
  }

  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  openMenuManually() {
    this.menuTrigger.openMenu();
  }

  closeMenuManually() {
    this.menuTrigger.closeMenu();
  }

  allItemsSelected(): boolean {
    return this.dataSource.data.every((item) => item.checked);
  }

  someItemsSelected(): boolean {
    const numSelected = this.selection.selected.length;
    return numSelected > 0 && numSelected < this.dataSource.data.length;
  }

  toggleAllRows(checked: boolean): void {
    const currentData = this.dataSource.data;
    // Update the local SelectionModel first
    if (checked) {
      // Select all items in the SelectionModel that are not already selected
      const itemsToSelect = currentData.filter(
        (row) => !this.selection.isSelected(row)
      );
      if (itemsToSelect.length > 0) {
        this.selection.select(...itemsToSelect);
      }
    } else {
      // Deselect all items in the SelectionModel
      if (this.selection.hasValue()) {
        this.selection.clear();
      }
    }

    // Synchronize the state with the MaterialService
    currentData.forEach((row) => {
      const serviceKnowsSelected = row.checked; // Current state known by the service
      const modelWantsSelected = this.selection.isSelected(row); // Desired state based on UI interaction
      if (serviceKnowsSelected !== modelWantsSelected) {
        this.MaterialService.toggleItemSelection(row.inventoryId);
        // The subscription to materialsData$ (in ngOnInit) will then re-sync
        // this.selection based on the updated data from the service.
      }
    });
  }
  @ViewChild('scanInput') scanInput!: ElementRef;
  isScanMode = false;
  public scanResult: string = '';

  focusScanInput() {
    this.isScanMode = true;
    setTimeout(() => this.scanInput?.nativeElement.focus(), 0);
  }

  exitScanMode() {
    this.isScanMode = false;
  }
  filteredValues: any = {
    materialIdentifier: '',
  };
  handleScanInput(scanString: string, event?: KeyboardEvent) {
    // Tách chuỗi scan thành các phần dựa theo ký tự #
    const parts = scanString.split('#');
    // Lấy phần đầu tiên trong chuỗi scan, ví dụ "25052309473100006"
    const inventoryTerm = parts[0] || '';
    if (!inventoryTerm) {
      console.warn('[handleScanInput] - Chuỗi scan không hợp lệ hoặc rỗng');
      return;
    }
    this.scanResult = inventoryTerm.trim().toLowerCase();
    const mode = this.filterModes['materialIdentifier'] || 'contains';
    this.searchTerms['materialIdentifier'] = {
      mode: mode,
      value: inventoryTerm.trim().toLowerCase(),
    };
    const filterObject = {
      textFilters: this.searchTerms,
      dialogFilters: {},
    };

    console.log('[handleScanInput] - filterObject:', filterObject);
    this.dataSource.filter = JSON.stringify(filterObject);
    if (event != null) {
      event.stopPropagation();
      event.preventDefault();
    }
  }
  refreshScan() {
    this.scanResult = '';
    if (this.searchTerms.hasOwnProperty('materialIdentifier')) {
      delete this.searchTerms['materialIdentifier'];
    }
    const filterObject = {
      textFilters: this.searchTerms,
      dialogFilters: {},
    };

    console.log('[refreshScan] - Dữ liệu filter mới:', filterObject);
    this.dataSource.filter = JSON.stringify(filterObject);
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.exitScanMode();
  }

  updateDisplayedColumns(): void {
    this.displayedColumns = this.columnSelectionGroup()
      .subtasks!.filter((col) => col.completed)
      .map((col) => col.matColumnDef);
  }

  public applyFilter(colDef: string, event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    // Nếu chưa chọn mode, mặc định là contains
    const selectedMode = this.filterModes[colDef] || 'contains';

    // Cập nhật searchTerms với kiểu là object chứa { mode, value }
    this.searchTerms[colDef] = {
      mode: selectedMode,
      value: filterValue.trim().toLowerCase(),
    };
    console.log(`[applyFilter] - Cột ${colDef}:`, this.searchTerms[colDef]);

    this.applyCombinedFilters();
  }

  openFilterDialog(colDef: string): void {
    const currentColumnValues = this.dataSource.data.map(
      (item) => (item as any)[colDef]
    );
    const selectedValuesForColumn = this.activeFilters[colDef] || [];

    const dialogRef = this.dialog.open(FilterDialogComponent, {
      width: 'auto',
      data: {
        columnName: this.getColumnDisplayName(colDef),
        currentValues: currentColumnValues,
        selectedValues: selectedValuesForColumn,
      },
    });

    dialogRef.afterClosed().subscribe((result: string[] | undefined) => {
      if (result) {
        this.activeFilters[colDef] = result;
        this.applyCombinedFilters();
      } else {
        // Người dùng nhấn Cancel hoặc đóng dialog mà không chọn gì
        // Nếu muốn xóa filter khi cancel
        // delete this.activeFilters[colDef]; this.applyCombinedFilters();
        // Có thể reset bộ lọc cho cột này nếu cần, hoặc giữ nguyên trạng thái trước đó
      }
    });
  }

  // Xuất excel
  export() {
    const formattedData = this.dataSource.filteredData.map((row) => ({
      ...row,
      expirationDate: `'${row.expirationDate}`,
      updatedDate: `'${row.updatedDate}`, // Chuyển đổi số lớn thành dạng chuỗi
    }));

    this.MaterialService.exportExcel(formattedData, 'customers');
  }
}
