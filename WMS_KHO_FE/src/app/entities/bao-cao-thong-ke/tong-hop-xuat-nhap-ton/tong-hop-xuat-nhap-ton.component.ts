import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
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
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { interval, Subject, takeUntil } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

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
    MatDialogModule,
    MatMenuModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './tong-hop-xuat-nhap-ton.component.html',
  styleUrl: './tong-hop-xuat-nhap-ton.component.scss',
})
export class TongHopXuatNhapTonComponent implements OnInit, AfterViewInit {
  @ViewChild('inventoryTrendChart')
  inventoryChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('warehouseStatusChart')
  statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productCategoryChart')
  categoryChartCanvas!: ElementRef<HTMLCanvasElement>;

  private inventoryChart?: Chart;
  private statusChart?: Chart;
  private categoryChart?: Chart;
  private destroy$ = new Subject<void>();

  // Real-time data
  private maxDataPoints = 20; // Giới hạn số điểm dữ liệu hiển thị
  isRealTimeEnabled = true;
  totalInventory = 150000;
  monthlyImport = 45000;
  monthlyExport = 38000;
  warehouseUtilization = 78;

  topProducts = [
    {
      code: 'SP001',
      name: 'Product 1',
      customer: 'KH001',
      quantity: 5000,
      value: 500000000,
      area: 'A1',
    },
    {
      code: 'SP002',
      name: 'Product 2',
      customer: 'KH002',
      quantity: 4500,
      value: 450000000,
      area: 'A2',
    },
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
  ];

  constructor() {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    // Bắt đầu lắng nghe real-time data
    this.startRealTimeUpdate();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initInventoryChart();
      this.initStatusChart();
      this.initCategoryChart();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    if (this.inventoryChart) this.inventoryChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
  }

  // ==================== REAL-TIME UPDATE ====================

  startRealTimeUpdate(): void {
    // Cập nhật mỗi 5 giây (hoặc theo yêu cầu)
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.fetchRealTimeData();
      });
  }
  toggleRealTime(): void {
    this.isRealTimeEnabled = !this.isRealTimeEnabled;

    if (this.isRealTimeEnabled) {
      this.startRealTimeUpdate();
    } else {
      this.destroy$.next();
    }
  }
  fetchRealTimeData(): void {
    // Gọi API để lấy dữ liệu mới
    // this.reportService.getRealTimeData().subscribe(data => {
    //   this.updateCharts(data);
    // });

    // Mock data để demo
    this.updateChartsWithNewData();
  }

  private updateChartsWithNewData(): void {
    const now = new Date();
    const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

    // Tạo dữ liệu ngẫu nhiên để demo
    const newInventory = 15000 + Math.random() * 5000;
    const newImport = 10000 + Math.random() * 3000;
    const newExport = 8000 + Math.random() * 3000;

    // Cập nhật Line Chart
    if (this.inventoryChart) {
      const chart = this.inventoryChart;

      // Thêm label mới
      chart.data.labels?.push(timeLabel);

      // Thêm data mới cho từng dataset
      chart.data.datasets[0].data.push(newInventory);
      chart.data.datasets[1].data.push(newImport);
      chart.data.datasets[2].data.push(newExport);

      // Xóa data cũ nếu vượt quá giới hạn
      if (chart.data.labels && chart.data.labels.length > this.maxDataPoints) {
        chart.data.labels.shift();
        chart.data.datasets.forEach((dataset) => {
          dataset.data.shift();
        });
      }

      chart.update('none'); // 'none' = không animate, update nhanh hơn
    }

    // Cập nhật Doughnut Chart
    if (this.statusChart) {
      const newData = [
        75 + Math.random() * 10,
        15 + Math.random() * 5,
        5 + Math.random() * 5,
      ];
      this.statusChart.data.datasets[0].data = newData;
      this.statusChart.update('none');
    }

    // Cập nhật Bar Chart
    if (this.categoryChart) {
      const newData = [
        40 + Math.random() * 10,
        30 + Math.random() * 10,
        20 + Math.random() * 10,
        15 + Math.random() * 5,
        10 + Math.random() * 5,
      ];
      this.categoryChart.data.datasets[0].data = newData;
      this.categoryChart.update('none');
    }

    // Cập nhật stats cards
    this.updateStatsCards();
  }

  private updateStatsCards(): void {
    this.totalInventory = 150000 + Math.floor(Math.random() * 10000);
    this.monthlyImport = 45000 + Math.floor(Math.random() * 5000);
    this.monthlyExport = 38000 + Math.floor(Math.random() * 5000);
    this.warehouseUtilization = 75 + Math.floor(Math.random() * 10);
  }

  // ==================== CHARTS INITIALIZATION ====================

  initInventoryChart(): void {
    if (!this.inventoryChartCanvas?.nativeElement) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['00:00', '00:05', '00:10', '00:15', '00:20'],
        datasets: [
          {
            label: 'Tồn kho',
            data: [12000, 15000, 13000, 17000, 16000],
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Nhập kho',
            data: [8000, 10000, 9000, 12000, 11000],
            borderColor: '#34d399',
            backgroundColor: 'rgba(52, 211, 153, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Xuất kho',
            data: [6000, 8000, 7500, 10000, 9500],
            borderColor: '#f87171',
            backgroundColor: 'rgba(248, 113, 113, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750, // Animation mượt hơn
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            mode: 'index',
            intersect: false,
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

    this.inventoryChart = new Chart(
      this.inventoryChartCanvas.nativeElement,
      config
    );
  }

  initStatusChart(): void {
    if (!this.statusChartCanvas?.nativeElement) return;

    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Đang sử dụng', 'Trống', 'Bảo trì'],
        datasets: [
          {
            data: [78, 15, 7],
            backgroundColor: [
              'rgba(102, 126, 234, 0.8)',
              'rgba(52, 211, 153, 0.8)',
              'rgba(251, 191, 36, 0.8)',
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
        },
      },
    };

    this.statusChart = new Chart(this.statusChartCanvas.nativeElement, config);
  }

  initCategoryChart(): void {
    if (!this.categoryChartCanvas?.nativeElement) return;

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: ['Điện tử', 'Gia dụng', 'Thực phẩm', 'Văn phòng', 'Khác'],
        datasets: [
          {
            label: 'Số lượng',
            data: [45, 30, 25, 15, 10],
            backgroundColor: [
              'rgba(102, 126, 234, 0.8)',
              'rgba(52, 211, 153, 0.8)',
              'rgba(251, 191, 36, 0.8)',
              'rgba(248, 113, 113, 0.8)',
              'rgba(156, 163, 175, 0.8)',
            ],
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
          y: { beginAtZero: true },
        },
      },
    };

    this.categoryChart = new Chart(
      this.categoryChartCanvas.nativeElement,
      config
    );
  }

  // ==================== EXPORT REPORT ====================

  async onExportReport(): Promise<void> {
    // Phương án 1: Export PDF với jsPDF + html2canvas
    await this.exportToPDF();

    // Phương án 2: Export Excel
    // await this.exportToExcel();
  }

  private async exportToPDF(): Promise<void> {
    try {
      // Cài đặt: npm install jspdf html2canvas
      const { jsPDF } = await import('jspdf');
      const html2canvas = (await import('html2canvas')).default;

      const element = document.querySelector(
        '.dashboard-container'
      ) as HTMLElement;
      if (!element) return;

      // Hiển thị loading
      // this.snackBar.open('Đang tạo báo cáo...', '', { duration: 0 });

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Thêm trang đầu tiên
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height

      // Thêm các trang tiếp theo nếu nội dung dài
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      const fileName = `Bao_cao_kho_${
        new Date().toISOString().split('T')[0]
      }.pdf`;
      pdf.save(fileName);

      // Ẩn loading
      // this.snackBar.open('Xuất báo cáo thành công!', 'Đóng', { duration: 3000 });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      // this.snackBar.open('Lỗi khi xuất báo cáo', 'Đóng', { duration: 3000 });
    }
  }

  private async exportToExcel(): Promise<void> {
    try {
      // Cài đặt: npm install xlsx file-saver
      const XLSX = await import('xlsx');
      const FileSaver = await import('file-saver');

      // Tạo workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Top Products
      const ws1 = XLSX.utils.json_to_sheet(this.topProducts);
      XLSX.utils.book_append_sheet(wb, ws1, 'Top Products');

      // Sheet 2: Warehouse Areas
      const ws2 = XLSX.utils.json_to_sheet(this.warehouseAreas);
      XLSX.utils.book_append_sheet(wb, ws2, 'Warehouse Areas');

      // Sheet 3: Statistics
      const statsData = [
        { metric: 'Tổng tồn kho', value: this.totalInventory },
        { metric: 'Nhập kho tháng', value: this.monthlyImport },
        { metric: 'Xuất kho tháng', value: this.monthlyExport },
        { metric: 'Tỷ lệ lấp đầy', value: `${this.warehouseUtilization}%` },
      ];
      const ws3 = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Statistics');

      // Export
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const fileName = `Bao_cao_kho_${
        new Date().toISOString().split('T')[0]
      }.xlsx`;
      FileSaver.saveAs(blob, fileName);
    } catch (error) {
      console.error('Error exporting Excel:', error);
    }
  }

  // ==================== HELPER METHODS ====================

  getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      import: 'arrow_downward',
      export: 'arrow_upward',
      transfer: 'sync_alt',
      check: 'fact_check',
    };
    return icons[type] ?? 'info';
  }

  getCapacityClass(capacity: number): string {
    if (capacity < 60) return 'low';
    if (capacity < 85) return 'medium';
    return 'high';
  }

  refreshData(): void {
    this.fetchRealTimeData();
  }
}
