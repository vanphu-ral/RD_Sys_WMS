import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { XuatHangTheoDonBanService } from '../service/xuat-hang-theo-don-ban.service.component';
import { MatSnackBar } from '@angular/material/snack-bar';
export interface SalesItemDetail {
  id: number;
  productCode: string;
  productName: string;
  quantity: number;
  originalQuantity: number;
  unit: string;
  updatedBy: string;
  updatedDate: string;
}
@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './xuat-hang-detail.component.html',
  styleUrl: './xuat-hang-detail.component.scss',
})
export class XuatHangDetailComponent implements OnInit {
  id: number | undefined;
  displayedColumns: string[] = [
    'stt',
    'productCode',
    'productName',
    'quantity',
    'unit',
    'updatedBy',
    'updatedDate',
  ];
  totalPages = 0;
  pageSizeOptions = [5, 10, 20];
  pageSize = 10;
  currentPage = 1;
  globalQuantity: number | null = null;
  detailList: SalesItemDetail[] = [];
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private xuatKhoService: XuatHangTheoDonBanService,
    private snackBar: MatSnackBar
  ) {}
  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    if (!id) return;
    this.xuatKhoService.getSalesItemsById(id).subscribe({
      next: (items) => {
        this.detailList = items.map((item: any) => ({
          id: item.id,
          productCode: item.product_code,
          productName: item.product_name,
          quantity: item.total_quantity,
          originalQuantity: item.total_quantity,
          unit: item.dvt,
          updatedBy: item.updated_by,
          updatedDate: item.updated_date,
        }));
      },
      error: (err) => {
        console.error('Lỗi khi lấy chi tiết:', err);
        this.snackBar.open('Không lấy được dữ liệu chi tiết!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      },
    });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    // Load data for specific page
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.onPageChange(this.currentPage);
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.onPageChange(this.currentPage);
    }
  }

  applyGlobalQuantity(): void {
    if (this.globalQuantity == null || this.globalQuantity < 0) return;

    this.detailList.forEach((item) => {
      item.quantity = this.globalQuantity!;
    });
  }
  onScan(scan: SalesItemDetail): void {
    const chuyenKhoId = this.route.snapshot.paramMap.get('id');
    this.router.navigate([
      '/kho-thanh-pham/xuat-don-ban-hang/detail',
      chuyenKhoId,
      'scan',
      scan.id,
    ]);
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }
  get pagedDetailList(): SalesItemDetail[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.detailList.slice(start, end);
  }
  back(): void {
    this.router.navigate(['/kho-thanh-pham/xuat-don-ban-hang'], {
      state: { detailList: this.detailList },
    });
  }
}
