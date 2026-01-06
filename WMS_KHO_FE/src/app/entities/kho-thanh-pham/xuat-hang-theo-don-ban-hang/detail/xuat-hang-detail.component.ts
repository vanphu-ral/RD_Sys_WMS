import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { XuatHangTheoDonBanService } from '../service/xuat-hang-theo-don-ban.service.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogXuatHangComponent } from '../dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
export interface SalesItemDetail {
  id: number;
  productCode: string;
  productName: string;
  quantity: number;
  originalQuantity: number;
  unit: string;
  quantityScanned: number;
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
    'quantityScanned',
    'updatedBy',
    'updatedDate',
    'actions',
  ];
  // totalPages = 0;
  pageSizeOptions = [5, 10, 20];
  pageSize = 10;
  currentPage = 1;
  globalQuantity: number | null = null;
  detailList: SalesItemDetail[] = [];
  Math = Math;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private xuatKhoService: XuatHangTheoDonBanService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
  ) { }
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
          quantityScanned: item.quantity_scanned,
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
  getTotalQuantity(): number {
    return this.detailList.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }
  // Cập nhật onPageChange
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }
  canGoPrevious(): boolean {
    return this.currentPage > 1;
  }
  canGoNext(): boolean {
    return this.currentPage < this.totalPages;
  }
  previousPage(): void {
    if (this.canGoPrevious()) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.canGoNext()) {
      this.currentPage++;
    }
  }
  get totalPages(): number {
    return Math.ceil(this.detailList.length / this.pageSize);
  }
  //helper
  getPageNumbers(): number[] {
    const maxVisible = 5; // Hiển thị tối đa 5 nút page
    const pages: number[] = [];

    if (this.totalPages <= maxVisible) {
      // Nếu tổng số trang <= 5, hiển thị tất cả
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic hiển thị thông minh: ... 3 4 [5] 6 7 ...
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, this.currentPage + 2);

      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push(-1); // -1 để đánh dấu "..."
        }
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < this.totalPages) {
        if (end < this.totalPages - 1) {
          pages.push(-1); // -1 để đánh dấu "..."
        }
        pages.push(this.totalPages);
      }
    }

    return pages;
  }
  applyGlobalQuantity(): void {
    if (this.globalQuantity == null || this.globalQuantity < 0) return;

    this.detailList.forEach((item) => {
      item.quantity = this.globalQuantity!;
    });
  }
  onScan(item: SalesItemDetail): void {
    const requestId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(
      ['/kho-thanh-pham/xuat-don-ban-hang/detail', requestId, 'scan', item.id]
    );
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

  onApprove(): void {
    // kiểm tra có item nào đã scan chưa
    if (!Array.isArray(this.detailList) || this.detailList.length === 0) { this.snackBar.open('Không có sản phẩm trong yêu cầu, không thể phê duyệt!', 'Đóng', { duration: 3000, panelClass: ['snackbar-error'], }); return; }
    const notScanned = this.detailList.filter((item: any) =>
      Number(item.quantityScanned ?? item.scanned_quantity ?? 0) <= 0)
      .map((item: any) => {
        const code = (item.product_code ?? item.productCode ?? '').toString().trim();
        const name = (item.product_name ?? item.productName ?? '').toString().trim();
        return code || name || `ID:${item.id}`;
      });

    if (notScanned.length > 0) {
      const sample = notScanned.slice(0, 5).join(', ');
      const more = notScanned.length > 5 ? ` và ${notScanned.length - 5} mục khác` : '';
      this.snackBar.open(`Không thể phê duyệt: còn ${notScanned.length} sản phẩm chưa scan (${sample}${more}).`, 'Đóng', { duration: 6000, panelClass: ['snackbar-error'] });
      return;
    }
    // mở dialog confirm
    const dialogRef = this.dialog.open(ConfirmDialogXuatHangComponent, {
      width: '400px',
      data: { message: 'Bạn có chắc muốn phê duyệt yêu cầu này?' },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.patchApprove();
      }
    });
  }

  private patchApprove(): void {
    if (!this.id) return;

    this.xuatKhoService.patchSalesScanStatus(this.id, { status: true }).subscribe({
      next: () => {
        this.snackBar.open('Phê duyệt thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
        // quay lại hoặc reload
        this.router.navigate(['/kho-thanh-pham/xuat-don-ban-hang']);
      },
      error: (err) => {
        console.error('Lỗi khi phê duyệt:', err);
        this.snackBar.open('Phê duyệt thất bại!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-error'],
        });
      }
    });
  }
}
