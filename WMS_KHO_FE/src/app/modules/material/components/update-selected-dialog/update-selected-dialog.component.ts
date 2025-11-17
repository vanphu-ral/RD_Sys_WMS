import {
  Component,
  ElementRef,
  Inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatLabel } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { ListMaterialComponent } from '../list-material/list-material.component';
import { RawGraphQLMaterial } from '../../material.service';
import { MatTableModule } from '@angular/material/table';
import { MatTableDataSource } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule, FormControl } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import {
  DialogContentExampleDialog,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog.component'; // Use ConfirmDialogData
import { MatMenuTrigger } from '@angular/material/menu';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatMenu } from '@angular/material/menu';
import { signal, WritableSignal } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MaterialUpdateService } from '../../material-update.service';
import { MaterialService, RawGraphQLLocation } from '../../material.service';

interface Warehouse {
  value: string;
  name: string;
}

export interface MaterialItem {
  enable_input_expirated?: boolean;
  materialIdentifier: string;
  partNumber: string;
  calculatedStatus: string;
  trackingType?: string;
  materialTraceId?: string;
  quantity: number;
  locationId: string;
  // locationName: string;
  expirationDate?: string;
  receivedDate?: string;
  updatedDate?: string;
  updatedBy?: string;
  checkinDate?: string;
  extendExpiration?: boolean;
  selectedWarehouse?: Warehouse;
}

export interface sub {
  name: string;
  completed: boolean;
}

export interface SelectApproverpprover {
  name: string;
  completed: boolean;
  sub: sub[];
}

@Component({
  selector: 'app-update-selected-dialog',
  standalone: true,
  imports: [
    MatAutocompleteModule,
    MatMenuModule,
    MatListModule,
    MatMenu,
    MatCheckbox,
    MatMenuTrigger,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatDialogModule,
    MatFormFieldModule,
    MatDividerModule,
    MatInputModule,
  ],
  templateUrl: './update-selected-dialog.component.html',
  styleUrls: ['./update-selected-dialog.component.scss'],
})
export class UpdateSelectedDialogComponent implements OnInit {
  dialogForm: FormGroup;
  // items!: RawGraphQLMaterial[]; // Không còn được sử dụng trực tiếp sau khi mapped
  locations$: Observable<RawGraphQLLocation[]>;

  @ViewChild('input') input!: ElementRef<HTMLInputElement>;
  myControl = new FormControl('');
  filteredOptions!: string[];

  selectApprover: WritableSignal<SelectApproverpprover> =
    signal<SelectApproverpprover>({
      name: 'Select all',
      completed: false,
      sub: [
        { name: 'admin1', completed: false },
        { name: 'admin2', completed: false },
        { name: 'admin3', completed: false },
        { name: 'admin4', completed: false },
        { name: 'admin5', completed: false },
      ],
    });

  warehouseSelection: Array<{ value: string; name: string }> = [];

  filteredWarehouses!: Observable<Array<{ value: string; name: string }>>;
  displayableItemKeys: string[][] = [];
  itemsDataSource: MatTableDataSource<MaterialItem>;
  displayedColumns: string[] = [
    'materialIdentifier',
    'partNumber',
    'calculatedStatus',
    'quantity',
    'locationId',
    'expirationDate',
  ];

  editableFields: string[] = ['quantity', 'locationName'];
  headerEnableInputRenewal: boolean = false;
  headerInputRenewal: string = '';

  // private originalItems: MaterialItem[]; // Xem xét lại nếu cần thiết

  itemFormGroups: Map<any, FormGroup> = new Map();

  handleEnterKey(event: KeyboardEvent) {
    (event.target as HTMLInputElement)?.blur();
  }

  constructor(
    public dialogRef: MatDialogRef<UpdateSelectedDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      items: RawGraphQLMaterial[];
      warehouses: Array<{ value: string; name: string }>;
    },
    private dialog: MatDialog,
    private fb: FormBuilder,
    private materialUpdateService: MaterialUpdateService,
    private materialService: MaterialService
  ) {
    this.locations$ = this.materialService.locationsData$;

    const mappedItems: MaterialItem[] = data.items.map(
      (rawItem: RawGraphQLMaterial) => {
        const formatDate = (dateString: string | null | undefined) => {
          if (!dateString) return 'N/A';
          const date = new Date(dateString);
          return isNaN(date.getTime())
            ? 'Invalid Date'
            : date.toLocaleDateString();
        };

        return {
          materialIdentifier: rawItem.materialIdentifier,
          partNumber: rawItem.partNumber,
          calculatedStatus: rawItem.calculatedStatus,
          quantity: Number(rawItem.quantity), // Đảm bảo quantity là number
          locationId: rawItem.locationId,
          // locationName: rawItem.locationName,
          // lastLocationId: rawItem.lastLocationId, // Không có trong MaterialItem
          expirationDate: rawItem.expirationDate
            ? formatDate(rawItem.expirationDate)
            : undefined,
          extendExpiration: false,
        };
      }
    );
    // this.originalItems = JSON.parse(JSON.stringify(mappedItems));
    this.itemsDataSource = new MatTableDataSource<MaterialItem>(mappedItems);

    this.dialogForm = this.fb.group({
      selectedWarehouseControl: [null],
    });
    this.warehouseSelection = this.data.warehouses;
    this.data.items.forEach((item) => {
      this.getFormGroupForItem(item);
    });
    this.filteredWarehouses = this.dialogForm
      .get('selectedWarehouseControl')!
      .valueChanges.pipe(
        startWith(''),
        map((value) => (typeof value === 'string' ? value : value?.name)),
        map((name) =>
          name ? this._filterWarehouses(name) : this.warehouseSelection.slice()
        )
      );
  }
  rowWarehouseChanged(selectedWarehouse: Warehouse, item: MaterialItem): void {
    const formGroup = this.getFormGroupForItem(item);
    formGroup
      .get('selectedWarehouseItem')
      ?.setValue(selectedWarehouse, { emitEvent: true });
    item.locationId = selectedWarehouse.value;
    console.log(
      `Row change: Item ${item.materialIdentifier} locationId updated to: ${item.locationId}`
    );
    this.isSelectHeader = false;
  }

  // Hàm displayFn cho mat-autocomplete
  // displayWarehouseFn(warehouse: Warehouse): string {
  //   return warehouse && warehouse.name ? warehouse.name : '';
  // }

  // ... (onSave, onCancel, và các hàm khác của bạn)
  // Ví dụ về destroy$ để unsubscribe
  // private destroy$ = new Subject<void>();

  // ngOnDestroy(): void {
  //   this.destroy$.next();
  //   this.destroy$.complete();
  // }

  ngOnInit(): void {
    // this.items = this.data.items.map(item => ({ ...item })); // Không cần thiết

    this.locations$.subscribe((locations) => {
      this.warehouseSelection = locations.map((loc) => ({
        value: loc.locationId,
        name: loc.locationName,
      }));

      // Khởi tạo FormGroups cho từng item SAU KHI warehouseSelection đã sẵn sàng
      // và gán giá trị ban đầu cho các form control của từng hàng.
      this.itemsDataSource.data.forEach((item) => {
        const formGroup = this.getFormGroupForItem(item);
        const initialWarehouseObject = this.warehouseSelection.find(
          (w) => w.value === item.locationId
        );
        // Set giá trị ban đầu mà không trigger valueChanges ngay để tránh vòng lặp không cần thiết nếu có
        formGroup
          .get('selectedWarehouseControl')
          ?.setValue(initialWarehouseObject || null, { emitEvent: false });
      });

      // Cập nhật filteredWarehouses cho autocomplete chung ở đầu dialog
      this.dialogForm
        .get('selectedWarehouseControl')
        ?.updateValueAndValidity({ emitEvent: true });
    });

    this.filteredWarehouses = this.dialogForm
      .get('selectedWarehouseControl')!
      .valueChanges.pipe(
        startWith(this.dialogForm.get('selectedWarehouseControl')?.value || ''), // Khởi tạo với giá trị hiện tại nếu có
        map((value) => (typeof value === 'string' ? value : value?.name)),
        map((name) =>
          name
            ? this._filterWarehouses(name)
            : this.warehouseSelection?.slice() || []
        )
      );

    this.itemsDataSource.filterPredicate = (
      data: MaterialItem,
      filter: string
    ): boolean => {
      const combinedFilters = JSON.parse(filter) as {
        textFilters: { [column: string]: { mode: string; value: string } };
        dialogFilters: { [column: string]: any[] };
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

  getFormGroupForItem(item: MaterialItem): FormGroup {
    const itemIdentifier = item.materialIdentifier; // dùng id duy nhất của item
    if (!this.itemFormGroups.has(itemIdentifier)) {
      const control = new FormControl();
      control.valueChanges.subscribe((selectedWarehouseObj) => {
        // Khi chọn riêng dòng, cập nhật item.locationId nếu giá trị thay đổi
        if (
          selectedWarehouseObj &&
          typeof selectedWarehouseObj === 'object' &&
          selectedWarehouseObj.value !== undefined
        ) {
          if (item.locationId !== selectedWarehouseObj.value) {
            item.locationId = selectedWarehouseObj.value;
            console.log(
              `Row: Item ${item.materialIdentifier} locationId updated to: ${item.locationId}`
            );
          }
        } else if (
          selectedWarehouseObj === null ||
          selectedWarehouseObj === ''
        ) {
          if (item.locationId !== '' && item.locationId !== null) {
            item.locationId = '';
            console.log(
              `Row: Item ${item.materialIdentifier} locationId cleared.`
            );
          }
        }
      });
      // Chú ý: Sử dụng key 'selectedWarehouseItem' cho dòng
      const group = this.fb.group({ selectedWarehouseItem: control });
      this.itemFormGroups.set(itemIdentifier, group);
    }
    return this.itemFormGroups.get(itemIdentifier)!;
  }

  private _filterWarehouses(
    name: string
  ): Array<{ value: string; name: string }> {
    const filterValue = name.toLowerCase();
    return this.warehouseSelection.filter((warehouse) =>
      warehouse.name.toLowerCase().includes(filterValue)
    );
  }

  globalWarehouseChanged(selectedWarehouse: Warehouse): void {
    // Cập nhật control của header (dialogForm)
    this.dialogForm
      .get('selectedWarehouseControl')
      ?.setValue(selectedWarehouse, { emitEvent: false });
    console.log(`Header: Warehouse selected: ${selectedWarehouse.value}`);
    if (this.itemsDataSource && this.itemsDataSource.data) {
      this.itemsDataSource.data.forEach((item) => {
        const formGroup = this.getFormGroupForItem(item);
        formGroup
          .get('selectedWarehouseItem')
          ?.setValue(selectedWarehouse, { emitEvent: true });
        item.locationId = selectedWarehouse.value;
        console.log(
          `Header update: Item ${item.materialIdentifier} locationId updated to: ${item.locationId}`
        );
      });
    }
    // Đánh dấu rằng lựa chọn header được dùng cho toàn bộ cột
    this.isSelectHeader = true;
  }
  toggleAllRenewal() {
    // Khi check header, tất cả hàng sẽ được check hoặc bỏ check
    this.itemsDataSource.data.forEach(
      (row) => (row.enable_input_expirated = this.headerEnableInputRenewal)
    );
    if (this.headerEnableInputRenewal && this.headerInputRenewal) {
      this.applyHeaderInputRenewal();
    }
  }
  applyHeaderInputRenewal() {
    // Nếu headerEnableInputRenewal là true và headerInputRenewal có giá trị thì áp dụng giá trị này cho tất cả các hàng có enable_input_renewal là true
    if (this.headerEnableInputRenewal && this.headerInputRenewal) {
      this.itemsDataSource.data.forEach((element) => {
        if (element.enable_input_expirated) {
          element.expirationDate = this.headerInputRenewal;
        }
      });
    }
  }

  applyHeaderSelectNewlocation: string = '';
  filteredlocations: string[] = [];
  optionslocation: string[] = [];

  filterlocations(value: string) {
    const filterValue = value ? value.toLowerCase() : '';
    this.filteredlocations = this.optionslocation.filter((location) =>
      location.toLowerCase().includes(filterValue)
    );
    if (this.applyHeaderSelectNewlocation !== value) {
      this.applyHeaderSelectNewlocation = value;
      this.isSelectHeader = true;
    }
  }
  applyFilter(column: string, event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    // Nếu chưa chọn mode, mặc định là contains
    const selectedMode = this.filterModes[column] || 'contains';

    // Cập nhật searchTerms với kiểu là object chứa { mode, value }
    this.searchTerms[column] = {
      mode: selectedMode,
      value: filterValue.trim().toLowerCase(),
    };
    this.applyCombinedFilters();
  }
  public searchTerms: { [column: string]: { mode: string; value: string } } =
    {};
  public activeFilters: { [column: string]: any[] } = {};
  filterModes: { [key: string]: string } = {};
  setFilterMode(column: any, mode: string) {
    this.filterModes[column] = mode;
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
    this.itemsDataSource.filter = JSON.stringify(combinedFilterData);

    if (this.itemsDataSource.paginator) {
      this.itemsDataSource.paginator.firstPage();
    }
  }

  displayWarehouseFn(warehouse: { value: string; name: string }): string {
    return warehouse && warehouse.name ? warehouse.name : '';
  }
  private isSelectHeader: boolean = false;
  onSave(): void {
    const selectedWarehouseValue = this.dialogForm.get(
      'selectedWarehouseControl'
    )?.value;
    const selectedApprovers = this.selectApprover()
      .sub.filter((s) => s.completed)
      .map((s) => s.name);

    console.log('onSave() called');
    console.log(
      'Items to be sent to server:',
      JSON.parse(JSON.stringify(this.itemsDataSource.data))
    );

    const dialogData: ConfirmDialogData = {
      message: 'Bạn có muốn gửi đề nghị cập nhật cho các vật tư này không?',
      confirmText: 'Xác nhận',
      cancelText: 'Hủy',
    };

    const confirmDialogRef = this.dialog.open(DialogContentExampleDialog, {
      width: '450px',
      data: dialogData,
      disableClose: true,
      autoFocus: false,
    });

    confirmDialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        if (this.isSelectHeader) {
          // Nếu header được chọn, gửi giá trị header cho tất cả các row
          this.dialogRef.close({
            updatedItems: this.itemsDataSource.data,
            selectedWarehouse: selectedWarehouseValue,
            approvers: selectedApprovers,
          });
        } else {
          // Nếu từng row được chọn riêng
          this.dialogRef.close({
            updatedItems: this.itemsDataSource.data,
            selectedWarehouse: null, // hoặc không gửi trường này
            approvers: selectedApprovers,
          });
        }
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCellBlur(element: MaterialItem, columnName: keyof MaterialItem): void {
    // Hàm này có thể vẫn hữu ích cho các cột khác (ví dụ: quantity)
    // Đối với locationId, việc cập nhật đã được xử lý trong valueChanges
    // console.log(
    //   `Cell blurred for item ID: ${element.materialIdentifier}, column: ${columnName}, new value: ${element[columnName]}`
    // );
    // if (originalItem && originalItem[columnName] !== element[columnName]) {
    //   element._isChanged = true;
    // }
  }

  partiallyComplete(): boolean {
    const subtasks = this.selectApprover().sub;
    if (!subtasks) {
      return false;
    }
    const allCompleted = subtasks.every((sub) => sub.completed);
    const anyCompleted = subtasks.some((sub) => sub.completed);
    return anyCompleted && !allCompleted;
  }

  update(completed: boolean, index?: number): void {
    const currentGroup = this.selectApprover();

    if (index === undefined) {
      currentGroup.completed = completed;
      currentGroup.sub!.forEach((sub) => (sub.completed = completed));
    } else {
      currentGroup.sub![index].completed = completed;
    }

    this.selectApprover.set({ ...currentGroup });
  }

  toggleAllExtendExpiration(checked: boolean): void {
    if (this.itemsDataSource && this.itemsDataSource.data) {
      this.itemsDataSource.data.forEach((row) => {
        if (row.extendExpiration !== checked) {
          row.extendExpiration = checked;
          // row._isChanged = true;
        }
      });
    }
  }

  isAllExtendExpirationSelected(): boolean {
    if (
      !this.itemsDataSource ||
      !this.itemsDataSource.data ||
      this.itemsDataSource.data.length === 0
    ) {
      return false;
    }
    return this.itemsDataSource.data.every((row) => row.extendExpiration);
  }

  isSomeExtendExpirationSelected(): boolean {
    if (
      !this.itemsDataSource ||
      !this.itemsDataSource.data ||
      this.itemsDataSource.data.length === 0
    ) {
      return false;
    }
    const numSelected = this.itemsDataSource.data.filter(
      (row) => row.extendExpiration
    ).length;
    return numSelected > 0 && numSelected < this.itemsDataSource.data.length;
  }
}
