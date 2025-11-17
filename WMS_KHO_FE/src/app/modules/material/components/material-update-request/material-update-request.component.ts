import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MaterialService, updateManageData } from '../../material.service';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  ChangeDetectionStrategy,
  inject,
  computed,
  signal,
} from '@angular/core';
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
import { MatListModule } from '@angular/material/list';
import { MatMenuTrigger } from '@angular/material/menu';
import { ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core'; // Import module này
import { CommonModule } from '@angular/common';

import { MatExpansionModule } from '@angular/material/expansion';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { RawGraphQLMaterial } from '../../material.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog'; // Keep MatDialog
import {
  DialogContentExampleDialog,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog.component'; // Import ConfirmDialogData

interface sumary_mode {
  value: string;
  name: string;
}

export interface updateDetailData {
  requestID: string;
  request_detail_ID: string;
  'Material ID': number;
  State: string;
  Location: string;
  'Expiration Date': string;
  RequestType: string;
  Status: string;
  RequestDate: string;
  User: string;
}

@Component({
  selector: 'app-material-update-request',
  standalone: true,
  imports: [
    MatExpansionModule,
    MatProgressSpinnerModule,
    RouterModule,
    CommonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatListModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormBuilder],
  templateUrl: './material-update-request.component.html',
  styleUrl: './material-update-request.component.scss',
  animations: [
    trigger('detailExpand', [
      state(
        'collapsed, void',
        style({
          height: '0px',
          minHeight: '0' /* display: 'none' has been removed */,
        })
      ),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
      transition(
        'expanded <=> void',
        animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
  ],
})
export class MaterialUpdateRequestComponent implements OnInit {
  expandedElement: any | null;
  selection = new SelectionModel<RawGraphQLMaterial>(true, []);

  displayedColumnsDetails: string[] = [
    'select',
    'materialId',
    'updatedBy',
    'createdTime',
    'updatedTime',
    'productCode',
    'productName',
    'quantity',
    'type',
    'locationId',
    'locationName',
    'status',
  ];

  isExpansionDetailRow = (i: number, row: Object) =>
    row.hasOwnProperty('detailRow');

  tableWidth: string = '100%';
  value = '';
  // checkedCount: number = 0;
  displayedColumns: string[] = [
    'detail',
    'requestCode',
    'createdTime',
    'updatedTime',
    'updatedBy',
    'approvedBy',
    'status',
    'action',
  ];
  dataSource_update_manage = new MatTableDataSource<updateManageData>();
  dataSoure_update_detail = new MatTableDataSource<RawGraphQLMaterial>();
  // dataSource = new MatTableDataSource
  columnFilters: { [key: string]: string } = {};
  ngOnInit() {
    this.loadData();
    this.MaterialService.updateManageData$.subscribe((data) => {
      this.dataSource_update_manage.data = data;
      this.dataSource_update_manage.sort = this.sort;
    });

    this.dataSource_update_manage.filterPredicate = (data, filter) => {
      const searchTerms = JSON.parse(filter) as { [key: string]: string };
      return Object.keys(searchTerms).every((columnName) => {
        const key = columnName as keyof updateManageData;
        const value = data[key] ? data[key].toString().toLowerCase() : '';
        return value.includes(searchTerms[columnName].toLowerCase());
      });
    };
  }
  loadData() {
    this.MaterialService.getData_updateManage().subscribe((items) => {
      this.dataSource_update_manage.data = items;
    });
  }

  loadDetailData() {
    this.MaterialService.getData_updateDetail().subscribe((items) => {
      this.dataSoure_update_detail.data = items;
    });
  }

  toggleRowExpansion(
    element: updateManageData & {
      materialChanges?: RawGraphQLMaterial[];
      isLoadingDetails?: boolean;
    }
  ) {
    if (this.expandedElement === element) {
      this.expandedElement = null;
      this.dataSoure_update_detail.data = [];
    } else {
      this.expandedElement = element;

      if (element.materialChanges) {
        this.dataSoure_update_detail.data = element.materialChanges;
      } else {
        this.loadMaterialChanges(element); // Tải dữ liệu nếu chưa có
      }
    }
  }

  constructor(
    private MaterialService: MaterialService,
    private dialog: MatDialog
  ) {}

  onLoad() {}

  export() {
    this.MaterialService.exportExcel(
      this.dataSource_update_manage.data,
      'danhsachdenghicapnhatvattu'
    );
  }

  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger;

  openMenuManually() {
    this.menuTrigger.openMenu();
  }

  closeMenuManually() {
    this.menuTrigger.closeMenu();
  }

  @ViewChild(MatSort) sort!: MatSort;

  applyFilter(column: string, event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.columnFilters[column] = filterValue.trim().toLowerCase();
    this.dataSource_update_manage.filter = JSON.stringify(this.columnFilters); // Gửi vào filterPredicate
  }

  refuseRequest(requestId: string): void {
    const dialogData: ConfirmDialogData = {
      message: 'Bạn có chắc chắn muốn từ chối yêu cầu cập nhật này không?',
      confirmText: 'Từ chối',
      cancelText: 'Hủy',
    };

    const dialogRef = this.dialog.open(DialogContentExampleDialog, {
      width: '500px',
      data: dialogData,
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        console.log(`Yêu cầu ${requestId} đã bị từ chối.`);
      }
    });
  }

  acceptRequest(requestId: string): void {
    const dialogData: ConfirmDialogData = {
      message: 'Bạn có chắc chắn muốn chấp thuận yêu cầu cập nhật này không?',
      confirmText: 'Chấp thuận',
      cancelText: 'Hủy',
    };
    const dialogRef = this.dialog.open(DialogContentExampleDialog, {
      width: '500px',
      data: dialogData,
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        console.log(`Yêu cầu ${requestId} đã được chấp thuận.`);
      }
    });
  }
  exportExpandedDetails(element: updateManageData): void {
    if (
      this.expandedElement &&
      this.expandedElement.requestID === element.requestID &&
      this.dataSoure_update_detail.data &&
      this.dataSoure_update_detail.data.length > 0
    ) {
      const fileName = `ChiTietYeuCau_${element.requestID || 'data'}`;
      this.MaterialService.exportExcel(
        this.dataSoure_update_detail.data,
        fileName
      );
    } else {
      console.warn('Không thể xuất dữ liệu chi tiết', {
        currentExpandedId: this.expandedElement?.requestID,
        targetElementId: element.requestID,
        detailDataCount: this.dataSoure_update_detail.data.length,
      });
    }
  }

  loadMaterialChanges(
    element: updateManageData & {
      materialChanges?: RawGraphQLMaterial[];
      isLoadingDetails?: boolean;
    }
  ) {
    if (typeof element.requestID === 'undefined') {
      console.error('Element is missing a requestID for fetching details.');
      element.isLoadingDetails = false;
      element.materialChanges = [];
      if (this.expandedElement === element) {
        this.dataSoure_update_detail.data = [];
      }
      return;
    }

    element.isLoadingDetails = true;
    this.dataSoure_update_detail.data = [];
    this.MaterialService.getRequestDetailsById(element.requestID).subscribe({
      next: (data: RawGraphQLMaterial[]) => {
        element.materialChanges = data;
        if (this.expandedElement === element) {
          // Chỉ cập nhật dataSource nếu element này vẫn đang được mở rộng
          this.dataSoure_update_detail.data = data;
        }
        element.isLoadingDetails = false;
      },
      error: (error: any) => {
        console.error(
          `Error fetching material changes for request ${element.requestID}:`,
          error
        );
        element.materialChanges = [];
        if (this.expandedElement === element) {
          this.dataSoure_update_detail.data = []; // Xóa dữ liệu nếu lỗi
        }
        element.isLoadingDetails = false;
      },
    });
  }
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSoure_update_detail.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSoure_update_detail.data);
  }

  checkboxLabel(row?: RawGraphQLMaterial): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row`;
  }
}
