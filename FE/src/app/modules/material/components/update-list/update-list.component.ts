import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MaterialService, RawGraphQLMaterial } from '../../material.service';
import { MatTableDataSource } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ChangeDetectionStrategy, inject, computed, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
// import { MatMenuTrigger } from '@angular/material/menu';
import { ViewChild } from '@angular/core';
// import { MatSort } from '@angular/material/sort';
import { PageEvent, MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { Subscription } from 'rxjs';
import { MatButton } from '@angular/material/button';
import { MaterialUpdateService } from '../../material-update.service'; // Import MaterialSharedService




export interface columnSelectionGroup {
  name: string;
  completed: boolean;
  subtasks?: ColumnConfig[];
}

export interface ColumnConfig {
  name: string;
  matColumnDef: string;
  completed: boolean;
}

@Component({
  selector: 'app-update-list',
 standalone: true,
  imports: [MatButton,CommonModule,MatSlideToggleModule, MatPaginatorModule, MatButtonModule, MatIconModule, MatTableModule, MatCheckboxModule,
    FormsModule, ReactiveFormsModule, MatFormFieldModule, RouterModule, MatInputModule, MatSelectModule, MatMenuModule, MatListModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
 
  templateUrl: './update-list.component.html',
  styleUrls: ['./update-list.component.scss']
})
export class UpdateListComponent implements OnInit, OnDestroy, AfterViewInit {
  // initialDisplayedColumns: string[] = ['select_update', 'Material ID', 'Part Number', 'Material Name', 'Quantity'];
  dataSource = new MatTableDataSource<RawGraphQLMaterial>([]);
  selection = new SelectionModel<RawGraphQLMaterial>(true, []); 

  displayedColumns: string[] = []; 


getColumnDisplayName(colDef: string): string {
    const columnNames: { [key: string]: string } = {
      // 'select': 'Add to list', 
    'select_update': 'Chọn',
    'materialTraceId': 'Material TraceId',
    'inventoryId': 'InventoryId',
    'partId': 'PartId',
    'partNumber': 'Part Number',
    'calculatedStatus': 'Calculated Status',
    'trackingType': 'Tracking Type',
    'quantity': 'Quantity',
    'locationId': 'LocationId',
    'parentLocationId': 'Parent LocationId',
    'lastLocationId': 'Last LocationId',
    'expirationDate': 'Expiration Date',
    'receivedDate': 'Received Date',
    'updatedDate': 'Updated Date',
    'updatedBy': 'Updated By',
    'manufacturingDate': 'Manufacturing Date',
    'materialType': 'Material Type',
    'checkinDate': 'Checkin Date',
    'locationName': 'Location Name',
    'locationFullName': 'Location FullName',
    'locationTypeId': 'Location TypeId',
    'locationTypeName': 'Location TypeName',
    'locationDescription': 'Location Description',
    };
    return columnNames[colDef] || colDef.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  update(completed: boolean, index?: number): void {
    const currentGroup = this.columnSelectionGroup();
    if (index === undefined) { // Checkbox "Select All Columns" thay đổi
      currentGroup.completed = completed;
      currentGroup.subtasks!.forEach(subtask => (subtask.completed = completed));
    } else { // Một checkbox cột riêng lẻ thay đổi
      currentGroup.subtasks![index].completed = completed;
      this.updateMasterCheckboxStatus();
    }
    this.columnSelectionGroup.set({ ...currentGroup });
    this.updateDisplayedColumns();
  }

  updateMasterCheckboxStatus(): void {
    const currentGroup = this.columnSelectionGroup();
    const allCompleted = currentGroup.subtasks!.every(subtask => subtask.completed);
    currentGroup.completed = allCompleted;
    // Không cần set indeterminate ở đây, template sẽ dùng partiallyComplete()
    this.columnSelectionGroup.set({ ...currentGroup });
  }

  columnSelectionGroup  = signal<columnSelectionGroup>({
      name: 'Select all',
      completed: false,
     subtasks: [
    { name: 'Chọn', matColumnDef: 'select_update', completed: true },
    // { name: 'Add to list', matColumnDef: 'select', completed: true },
   
    { name: 'Material Identifier', matColumnDef: 'materialIdentifier', completed: true },
    { name: 'PartId', matColumnDef: 'partId', completed: false },
    { name: 'Part Number', matColumnDef: 'partNumber', completed: true },
    { name: 'Calculated Status', matColumnDef: 'calculatedStatus', completed: true },
    { name: 'Tracking Type', matColumnDef: 'trackingType', completed: false },
    { name: 'InventoryId', matColumnDef: 'inventoryId', completed: true },
    { name: 'Quantity', matColumnDef: 'quantity', completed: true },  
    { name: 'Material TraceId', matColumnDef: 'materialTraceId', completed: true },
    { name: 'LocationId', matColumnDef: 'locationId', completed: true },
    { name: 'Parent LocationId', matColumnDef: 'parentLocationId', completed: false },
    { name: 'Last LocationId', matColumnDef: 'lastLocationId', completed: false },
    { name: 'Expiration Date', matColumnDef: 'expirationDate', completed: true },
    { name: 'Received Date', matColumnDef: 'receivedDate', completed: true },
    { name: 'Updated Date', matColumnDef: 'updatedDate', completed: false },
    { name: 'Updated By', matColumnDef: 'updatedBy', completed: false },
    { name: 'Manufacturing Date', matColumnDef: 'manufacturingDate', completed: false },
    { name: 'Material Type', matColumnDef: 'materialType', completed: false },
    { name: 'Checkin Date', matColumnDef: 'checkinDate', completed: false },
  ],
    });

  private dataSubscription: Subscription | undefined;
  // public currentCheckedCount: number = 0;
  // private checkedCountSubscription: Subscription | undefined;
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

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Paginator properties (nếu bạn bỏ comment phần paginator trong HTML)
  // length = 0;
  // pageSize = 10;
  // pageIndex = 0;
  // pageSizeOptions = [5, 10, 25, 100];
  // hidePageSize = false;
  // showPageSizeOptions = true;
  // showFirstLastButtons = true;
  // disabled = false;

  constructor(
    private materialService: MaterialService,
    private cdr: ChangeDetectorRef,
    private materialUpdateService: MaterialUpdateService, 
    private router: Router 
    ) {}

  ngOnInit(): void {
    this.dataSubscription = this.materialService.getItemsForUpdate().subscribe(itemsToUpdate => {
      let processedItems: RawGraphQLMaterial[] = [];

      if (itemsToUpdate && itemsToUpdate.length > 0) {

        processedItems = itemsToUpdate.map(item => ({
          ...item,
          select_update: true 
        }));
        this.dataSource.data = processedItems;

        this.selection.clear(); 
        processedItems.forEach(row => this.selection.select(row)); 

        this.initializeColumnSelection(processedItems);
      } else {
        this.dataSource.data = [];
        this.selection.clear();
        this.initializeColumnSelection([]); 
      }
      this.updateDisplayedColumns(); 
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

    // this.checkedCountSubscription = this.materialUpdateService.getCheckedCount$().subscribe(count => {
    //   this.currentCheckedCount = count;
    //   this.cdr.markForCheck(); 
    // });
  }
removeRowFromUpdate(row: RawGraphQLMaterial): void {
    this.selection.deselect(row); 
    this.materialService.removeItemFromUpdate(row.inventoryId);

  }
    handleRowToggle(row: RawGraphQLMaterial): void {
    this.selection.toggle(row);

        row.select_update = this.selection.isSelected(row);
    this.cdr.markForCheck(); 

  }
  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
  }

  ngOnDestroy(): void {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
  }

  initializeColumnSelection(dataItems: RawGraphQLMaterial[]): void {
    let availableColDefs: string[] = [];
    if (dataItems.length > 0) {
        availableColDefs = Object.keys(dataItems[0]).filter(key => !key.startsWith('_'));
    } else {
        // availableColDefs = this.initialDisplayedColumns.filter(c => c !== 'select');
        availableColDefs = this.columnSelectionGroup().subtasks
                                ?.filter(st => st.matColumnDef !== 'select_update')
                                .map(st => st.matColumnDef) ?? [];
    
      }

  }
  //  checkedCount(): number {
  //   return this.currentCheckedCount;
  // }
checkedCount(): number {
    // return this.currentCheckedCount;
    return this.selection.selected.length; // Use local selection count
  }

  openEditSelectedDialog(): void {
     const itemsToUpdate = this.selection.selected;
      
    if (itemsToUpdate.length > 0) {
      const dialogRef = this.materialUpdateService.openEditSelectedDialog(itemsToUpdate);
      autoFocus: false
      if (dialogRef) {
        dialogRef.afterClosed().subscribe(result => {
          if (result && result.updatedItems && result.updatedItems.length > 0) {
            console.log('UpdateSelectedDialog closed with data:', result);
          const payload = {
              items: result.updatedItems,
              warehouseInfo: result.selectedWarehouse, 
              approvers: result.approvers,
            };
            this.materialUpdateService.sendRequestUpdate(payload).subscribe({
              next: (response) => console.log('Update request successful from UpdateListComponent', response),
              error: (err) => console.error('Error in update request from UpdateListComponent', err),
            });
          }
        });
      }
    } else {
      console.warn("UpdateListComponent: No items selected for update.");
    }
  }

  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  someItemsSelected(): boolean {
    console.log('someItemsSelected called');
    console.log('this.selection.selected:', this.selection.selected);
    return this.selection.hasValue() && !this.isAllSelected();
   }

  partiallyComplete(): boolean {
    const subtasks = this.columnSelectionGroup().subtasks;
    if (!subtasks || subtasks.length === 0) return false;
    const numCompleted = subtasks.filter(t => t.completed).length;
    return numCompleted > 0 && numCompleted < subtasks.length;
  }

  toggleAllRows(shouldSelectAll: boolean): void { 
    if (shouldSelectAll) {
      this.dataSource.data.forEach(row => {
        this.selection.select(row);
        row.select_update = true;
      });
    } else {
      this.dataSource.data.forEach(row => {
        if (this.selection.isSelected(row)) { // Kiểm tra trạng thái trong SelectionModel trước khi clear
           row.select_update = false;
        }
      });
      this.selection.clear();
     this.dataSource.data.forEach(row => row.select_update = false);
    }
    this.cdr.markForCheck(); 
  }
  updateDisplayedColumns(): void {
    this.displayedColumns = this.columnSelectionGroup().subtasks!
        .filter(col => col.completed)
        .map(col => col.matColumnDef);
    this.cdr.detectChanges();
  }

  
  // --- Lọc ---
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
   

  isRowSelectedForUpdate(row: RawGraphQLMaterial): boolean {
    return !!row.select_update; 
  }

  toggleRowSelectedForUpdate(row: RawGraphQLMaterial, isChecked: boolean): void {
    row.select_update = isChecked;
    if (isChecked) {
      this.selection.select(row);
    } else {
      this.selection.deselect(row);
    }
    // this.updateCheckedCount();
  }

 toggleAllRowsForUpdate(checked: boolean): void {
    if (checked) {
      this.selection.select(...this.dataSource.data);
    } else {
      this.selection.clear();
    }
    this.dataSource.data.forEach(row => row.select_update = checked);
   
  }


  goBackToList(): void {
    this.router.navigate(['/material/list']);
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
}
