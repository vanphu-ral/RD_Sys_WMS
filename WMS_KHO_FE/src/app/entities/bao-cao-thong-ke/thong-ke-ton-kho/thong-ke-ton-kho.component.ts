import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule } from '@angular/forms';
import { Chart, registerables, ChartConfiguration } from 'chart.js';

@Component({
  selector: 'app-thong-ke-ton-kho',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatMenuModule,
    MatChipsModule,
    FormsModule,
  ],
  templateUrl: './thong-ke-ton-kho.component.html',
  styleUrls: ['./thong-ke-ton-kho.component.scss'],
})
export class ThongKeTonKhoComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('inventoryByAreaChart') inventoryByAreaCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('inventoryTrendChart') inventoryTrendCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('stockAgeChart') stockAgeCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('turnoverRateChart') turnoverRateCanvas!: ElementRef<HTMLCanvasElement>;

  private inventoryByAreaChart?: Chart;
  private inventoryTrendChart?: Chart;
  private stockAgeChart?: Chart;
  private turnoverRateChart?: Chart;

  // Filter options
  selectedWarehouse = 'all';
  selectedCategory = 'all';
  selectedTimeRange = '30days';

  warehouses = [
    { value: 'all', label: 'Tất cả kho' },
    { value: 'kho-a', label: 'Kho A' },
    { value: 'kho-b', label: 'Kho B' },
    { value: 'kho-c', label: 'Kho C' },
  ];

  categories = [
    { value: 'all', label: 'Tất cả danh mục' },
    { value: 'electronics', label: 'Điện tử' },
    { value: 'home', label: 'Gia dụng' },
    { value: 'food', label: 'Thực phẩm' },
  ];

  timeRanges = [
    { value: '7days', label: '7 ngày qua' },
    { value: '30days', label: '30 ngày qua' },
    { value: '90days', label: '90 ngày qua' },
    { value: 'custom', label: 'Tùy chỉnh' },
  ];

  // Summary stats
  totalStock = 245678;
  totalValue = 15670000000;
  lowStockItems = 23;
  overStockItems = 12;
  avgTurnoverRate = 4.5;

  // Inventory by location
  inventoryByLocation = [
    { location: 'Khu A', quantity: 45000, value: 4500000000, usage: 85, items: 120 },
    { location: 'Khu B', quantity: 38000, value: 3800000000, usage: 72, items: 95 },
    { location: 'Khu C', quantity: 52000, value: 5200000000, usage: 94, items: 150 },
    { location: 'Khu D', quantity: 30000, value: 3000000000, usage: 65, items: 80 },
  ];

  // Stock alerts
  stockAlerts = [
    {
      type: 'low',
      product: 'Đèn LED 9W',
      code: 'LED009',
      currentStock: 50,
      minStock: 200,
      status: 'warning',
    },
    {
      type: 'overstock',
      product: 'Bóng đèn compact',
      code: 'CFL015',
      currentStock: 5000,
      maxStock: 3000,
      status: 'danger',
    },
    {
      type: 'low',
      product: 'Ổ cắm 3 chấu',
      code: 'PLG003',
      currentStock: 120,
      minStock: 300,
      status: 'warning',
    },
  ];

  // Top products by turnover
  topTurnoverProducts = [
    { name: 'Đèn LED 12W', code: 'LED012', turnover: 8.5, value: 250000000 },
    { name: 'Quạt trần', code: 'FAN001', turnover: 7.2, value: 180000000 },
    { name: 'Bóng đèn tròn', code: 'BLB020', turnover: 6.8, value: 150000000 },
    { name: 'Ổ cắm thông minh', code: 'PLG010', turnover: 6.5, value: 140000000 },
  ];

  // Slow-moving items
  slowMovingItems = [
    { name: 'Quạt công nghiệp cũ', code: 'FAN099', daysInStock: 180, quantity: 45 },
    { name: 'Đèn huỳnh quang T8', code: 'FLT008', daysInStock: 150, quantity: 230 },
    { name: 'Ổ cắm 2 chấu', code: 'PLG002', daysInStock: 120, quantity: 180 },
  ];

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initAllCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.inventoryByAreaChart) this.inventoryByAreaChart.destroy();
    if (this.inventoryTrendChart) this.inventoryTrendChart.destroy();
    if (this.stockAgeChart) this.stockAgeChart.destroy();
    if (this.turnoverRateChart) this.turnoverRateChart.destroy();
  }

  initAllCharts(): void {
    this.initInventoryByAreaChart();
    this.initInventoryTrendChart();
    this.initStockAgeChart();
    this.initTurnoverRateChart();
  }

  initInventoryByAreaChart(): void {
    if (!this.inventoryByAreaCanvas?.nativeElement) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Khu A', 'Khu B', 'Khu C', 'Khu D'],
        datasets: [
          {
            label: 'Số lượng tồn',
            data: [45000, 38000, 52000, 30000],
            backgroundColor: 'rgba(102, 126, 234, 0.8)',
            borderColor: '#667eea',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `Số lượng: ${context.parsed.y != null ? context.parsed.y.toLocaleString('vi-VN') : 'N/A'}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => value.toLocaleString('vi-VN'),
            },
          },
        },
      },
    };

    this.inventoryByAreaChart = new Chart(this.inventoryByAreaCanvas.nativeElement, config);
  }

  initInventoryTrendChart(): void {
    if (!this.inventoryTrendCanvas?.nativeElement) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6'],
        datasets: [
          {
            label: 'Tồn kho',
            data: [220000, 235000, 240000, 238000, 242000, 245678],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => value.toLocaleString('vi-VN'),
            },
          },
        },
      },
    };

    this.inventoryTrendChart = new Chart(this.inventoryTrendCanvas.nativeElement, config);
  }

  initStockAgeChart(): void {
    if (!this.stockAgeCanvas?.nativeElement) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['0-30 ngày', '31-60 ngày', '61-90 ngày', '>90 ngày'],
        datasets: [
          {
            data: [45, 30, 15, 10],
            backgroundColor: [
              'rgba(20, 174, 92, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(107, 114, 128, 0.8)',
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
          tooltip: {
            callbacks: {
              label: (context) => `${context.label}: ${context.parsed}%`,
            },
          },
        },
      },
    };

    this.stockAgeChart = new Chart(this.stockAgeCanvas.nativeElement, config);
  }

  initTurnoverRateChart(): void {
    if (!this.turnoverRateCanvas?.nativeElement) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Đèn LED', 'Quạt', 'Bóng đèn', 'Ổ cắm', 'Dây điện'],
        datasets: [
          {
            label: 'Tỷ lệ luân chuyển',
            data: [8.5, 7.2, 6.8, 6.5, 5.2],
            backgroundColor: 'rgba(52, 211, 153, 0.8)',
            borderColor: '#34d399',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
          },
        },
      },
    };

    this.turnoverRateChart = new Chart(this.turnoverRateCanvas.nativeElement, config);
  }

  onFilterChange(): void {
    console.log('Filter changed:', {
      warehouse: this.selectedWarehouse,
      category: this.selectedCategory,
      timeRange: this.selectedTimeRange,
    });
    // Reload data based on filters
  }

  onExportReport(): void {
    console.log('Exporting inventory statistics report...');
    // Export logic
  }

  getStockStatusClass(usage: number): string {
    if (usage < 60) return 'low';
    if (usage < 85) return 'medium';
    return 'high';
  }

  getAlertClass(type: string): string {
    return type === 'low' ? 'warning' : 'danger';
  }
}