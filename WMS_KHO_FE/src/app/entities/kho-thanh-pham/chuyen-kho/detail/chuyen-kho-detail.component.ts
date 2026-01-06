import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ChuyenKhoService } from '../service/chuyen-kho.service.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmDialogXuatHangComponent } from '../../xuat-hang-theo-don-ban-hang/dialog/confirm-dialog.component';
import { MatDialog } from '@angular/material/dialog';
export interface TransferItemDetail {
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
  templateUrl: './chuyen-kho-detail.component.html',
  styleUrl: './chuyen-kho-detail.component.scss',
})
export class ChuyenKhoDetailComponent implements OnInit {
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
  detailList: TransferItemDetail[] = [];
  pageSizeOptions = [5, 10, 20];
  pageSize = 10;
  currentPage = 1;
  globalQuantity: number | null = null;
  Math = Math;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chuyenKhoService: ChuyenKhoService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,

  ) { }
  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    if (!id) return;

    this.id = id; // <-- gán vào property của class

    this.chuyenKhoService.getTransferItemsById(id).subscribe({
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

  get totalPages(): number {
    return Math.ceil(this.detailList.length / this.pageSize);
  }

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

  nextPage(): void {
    if (this.canGoNext()) {
      this.currentPage++;
    }
  }

  applyGlobalQuantity(): void {
    if (this.globalQuantity == null || this.globalQuantity < 0) return;

    this.detailList.forEach((item) => {
      item.quantity = this.globalQuantity!;
    });
  }
  onScan(item: TransferItemDetail): void {
    const requestId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(
      ['/kho-thanh-pham/chuyen-kho-noi-bo/detail', requestId, 'scan', item.id]
    );
  }
  getTotalQuantity(): number {
    return this.detailList.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }
  get pagedDetailList(): TransferItemDetail[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.detailList.slice(start, end);
  }
  onScanCheck(): void {
    this.router.navigate(['/kho-thanh-pham/chuyen-kho-noi-bo/scan'], {
      state: { detailList: this.detailList },
    });
  }
  back(): void {
    this.router.navigate(['/kho-thanh-pham/chuyen-kho-noi-bo'], {
      state: { detailList: this.detailList },
    });
  }
  //format date column
  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }
  onScanAll(): void {
    const requestId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(
      ['/kho-thanh-pham/chuyen-kho-noi-bo/detail', requestId, 'scan', 'all'], // Thêm 'all' để đánh dấu scan tất cả
      {
        queryParams: {
          mode: 'all'
        }
      }
    );
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

    this.chuyenKhoService.patchRequestScanStatus(this.id, { status: true }).subscribe({
      next: () => {
        this.snackBar.open('Phê duyệt thành công!', 'Đóng', {
          duration: 3000,
          panelClass: ['snackbar-success'],
        });
        // quay lại hoặc reload
        this.router.navigate(['/kho-thanh-pham/chuyen-kho']);
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
