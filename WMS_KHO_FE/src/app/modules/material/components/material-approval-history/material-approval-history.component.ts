
import { Component , OnInit} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatTableModule} from '@angular/material/table';
import { MaterialService, updateHistoryData, approvalHistoryDetailData } from '../../material.service'; // Added approvalHistoryDetailData
import { MatTableDataSource } from '@angular/material/table';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {ChangeDetectionStrategy } from '@angular/core'; 
import {FormBuilder, FormsModule, ReactiveFormsModule, FormGroup, FormControl} from '@angular/forms';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatMenuModule} from '@angular/material/menu';
import {MatListModule} from '@angular/material/list';
import { MatMenuTrigger } from '@angular/material/menu'; 
import { ViewChild } from '@angular/core'; 
import { MatSort } from '@angular/material/sort';
import { CommonModule } from '@angular/common'; 
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; 
import { animate, state, style, transition, trigger } from '@angular/animations'; 

type ExpandedHistoryData = updateHistoryData & { approvalHistoryDetails?: approvalHistoryDetailData[], isLoadingDetails?: boolean };

@Component({
    selector: 'app-material-approval-history',
    standalone: true,
    imports: [
        CommonModule,
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
        MatProgressSpinnerModule
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        FormBuilder
    ],
    templateUrl: './material-approval-history.component.html',
    styleUrl: './material-approval-history.component.scss',
    animations: [ // Added animations for row expansion
        trigger('detailExpand', [
          state('collapsed, void', style({ height: '0px', minHeight: '0' })),
          state('expanded', style({ height: '*' })),
          transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
          transition('expanded <=> void', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
        ]),
      ],
})

export class MaterialApprovalHistoryComponent implements OnInit {
  expandedElement: ExpandedHistoryData | null = null;
   value = '';
   displayedColumns: string[] = [
     "detail", "Status","User","RequestDate","approver", "timeaction"];
   dataSource_approval_history = new MatTableDataSource<updateHistoryData>();
  dataSource_approval_history_detail = new MatTableDataSource<approvalHistoryDetailData>();
  displayedColumns_approval_history_detail: string[] = ["Material ID", "Status", "Part Number", "State", "Location", "RequestType" ]; 
   columnFilters: { [key: string]: string } = {};
  ngOnInit() {
     this.loadData();
     this.MaterialService.updateHistoryData$.subscribe(data => {
       this.dataSource_approval_history.data = data;
       this.dataSource_approval_history.sort = this.sort;
     });
 
     
 
    this.dataSource_approval_history.filterPredicate = (data: updateHistoryData, filter: string) => {
       const searchTerms = JSON.parse(filter) as { [key: string]: string };
       return Object.keys(searchTerms).every(columnName => {
         const key = columnName as keyof updateHistoryData;
         const value = data[key] != null ? String(data[key]).toLowerCase() : '';
         return value.includes(searchTerms[columnName].toLowerCase());
       });
     };
   }
    loadData() {
    this.MaterialService.fetchUpdateHistoryData();
   }

  constructor(private MaterialService: MaterialService) {}
  onLoad(){

 }
 
  export() {
     this.MaterialService.exportExcel(this.dataSource_approval_history.data, 'lichsudenghicapnhatvattu');
   }
 
  @ViewChild('menuTrigger') menuTrigger!: MatMenuTrigger; // Keep if menu is used in template
 
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
   this.dataSource_approval_history.filter = JSON.stringify(this.columnFilters); // Gửi vào filterPredicate
 }
  isExpansionDetailRow = (i: number, row: Object): boolean => row.hasOwnProperty('detailRow');

  toggleRowExpansion(element: ExpandedHistoryData) {
     if (this.expandedElement === element) {
       this.expandedElement = null;
       this.dataSource_approval_history_detail.data = []; // Clear detail data when collapsing
     } else {
       this.expandedElement = element;
       // Check for cached data
       if (element.approvalHistoryDetails) {
         this.dataSource_approval_history_detail.data = element.approvalHistoryDetails;
       } else {
         this.loadApprovalHistoryDetails(element); 
       }
     }
   }

 exportExpandedDetails(element: updateHistoryData): void {
    if (this.expandedElement && this.expandedElement.requestID === element.requestID && this.dataSource_approval_history_detail.data && this.dataSource_approval_history_detail.data.length > 0) {
      const fileName = `ChiTietLichSuYeuCau_${element.requestID || 'data'}`;
      this.MaterialService.exportExcel(this.dataSource_approval_history_detail.data, fileName);
    } else {
      console.warn('Không thể xuất dữ liệu chi tiết', {
        currentExpandedId: this.expandedElement?.requestID,
        targetElementId: element.requestID,
        detailDataCount: this.dataSource_approval_history_detail.data.length
      });
    }
  }

  loadApprovalHistoryDetails(element: ExpandedHistoryData) {
    if (typeof element.requestID === 'undefined') {
      console.error("Element is missing a requestID for fetching approval history details.", element);
      element.isLoadingDetails = false;
      element.approvalHistoryDetails = [];
      if (this.expandedElement === element) {
        this.dataSource_approval_history_detail.data = [];
      }
      return;
    }

    element.isLoadingDetails = true;
    this.dataSource_approval_history_detail.data = []; 
    this.MaterialService.fetchApprovalHistoryDetail(element.requestID);

    this.MaterialService.approvalHistoryDetailData$.subscribe({
      next: (data: approvalHistoryDetailData[]) => {
        element.approvalHistoryDetails = data; 
        if (this.expandedElement === element) { 
          this.dataSource_approval_history_detail.data = data;
        }
        element.isLoadingDetails = false;
      },
      error: (error: any) => {
        console.error(`Error fetching approval history details for request ${element.requestID}:`, error);
        element.approvalHistoryDetails = [];
        if (this.expandedElement === element) {
          this.dataSource_approval_history_detail.data = [];
        }
        element.isLoadingDetails = false;
      }
    });
  }
}
