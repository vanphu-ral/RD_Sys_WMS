import { Component, NgModule, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { RouterLinkWithHref } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
// import { Chart } from 'chart.js';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-bao-cao-thong-ke',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    MatNativeDateModule,
    // RouterLinkWithHref,
    MatDialogModule,
    MatMenuModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './bao-cao-thong-ke.component.html',
  styleUrl: './bao-cao-thong-ke.component.scss',
})
export class BaoCaoThongKeComponent implements OnInit {
  // Data properties
  totalInventory = 150000;
  monthlyImport = 45000;
  monthlyExport = 38000;
  warehouseUtilization = 78;

  // startDate: Date;
  // endDate: Date;

  topProducts = [
    {
      code: 'SP001',
      name: 'Product 1',
      customer: 'KH001',
      quantity: 5000,
      value: 500000000,
      area: 'A1',
    },
    // ...
  ];

  recentActivities = [
    {
      type: 'import',
      title: 'Nhập kho',
      description: 'Nhập 1000 SP từ NCC',
      time: '2 giờ trước',
      status: 'success',
      statusLabel: 'Hoàn thành',
    },
    // ...
  ];

  warehouseAreas = [
    {
      name: 'Khu A',
      capacity: 85,
      totalLocations: 100,
      usedLocations: 85,
      emptyLocations: 15,
      products: 50,
    },
    // ...
  ];
  ngOnInit(): void {
      
  }

  ngAfterViewInit() {
    this.initInventoryChart();
    // this.initStatusChart();
  }

  initInventoryChart() {
    const ctx = document.getElementById('inventoryTrendChart');
    // new Chart(ctx, {
    //   type: 'line',
    //   data: {
    //     labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
    //     datasets: [
    //       {
    //         label: 'Tồn kho',
    //         data: [12000, 15000, 13000, 17000, 16000, 18000],
    //         borderColor: '#667eea',
    //         tension: 0.4,
    //       },
    //     ],
    //   },
    // });
  }

  // getActivityIcon(type: string): string {
  //   const icons = {
  //     import: 'arrow_downward',
  //     export: 'arrow_upward',
  //     transfer: 'sync_alt',
  //     check: 'fact_check',
  //   };
  //   return icons[type] || 'info';
  // }

  getCapacityClass(capacity: number): string {
    if (capacity < 60) return 'low';
    if (capacity < 85) return 'medium';
    return 'high';
  }

  onExportReport() {
    // Export logic
  }
}
