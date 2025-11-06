import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ChuyenKhoService } from '../service/chuyen-kho.service.component';
import { ActivatedRoute, Router } from '@angular/router';
export interface DetailItem {
  id: number;
  maHangHoa: string;
  tenHangHoa: string;
  ngayGiaoHang: string;
  maPO: string;
  khoXuatBan: string;
  soLuongSP: number;
  donViTinh: string;
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
    'maHangHoa',
    'tenHangHoa',
    'ngayGiaoHang',
    'maPO',
    'khoXuatBan',
    'soLuongSP',
    'donViTinh',
    'actions',
  ];
  totalPages = 0;
  detailList: DetailItem[] = [];
  pageSizeOptions = [5, 10, 20];
  pageSize = 10;
  currentPage = 1;
  constructor(private route: ActivatedRoute, private router: Router, private chuyenKhoService: ChuyenKhoService) {}
  ngOnInit(): void {
    this.id = +this.route.snapshot.paramMap.get('id')!;
    this.id = +this.route.snapshot.paramMap.get('id')!;
    if (!this.id) return;

    this.chuyenKhoService.getTransferRequestById(this.id).subscribe({
      next: (res) => {
        const wtr1 = res.WTR1 || [];

        this.detailList = wtr1.map((item: any, index: number) => ({
          id: index + 1,
          productName: item.Dscription || '',
          from: res.OWTR?.Filler || '', // giả định trường "from" là OWTR.Filler
          to: res.OWTR?.ToWhsCode || '', // giả định trường "to" là OWTR.ToWhsCode
          quantity: item.Quantity || 0,
          unit: item.UomCode || '',
        }));
      },
      error: (err) => {
        console.error('Lỗi khi lấy chi tiết chuyển kho:', err);
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
  onScan(scan: DetailItem): void {
    const chuyenKhoId = this.route.snapshot.paramMap.get('id');
    this.router.navigate([
      '/kho-thanh-pham/chuyen-kho-noi-bo/detail',
      chuyenKhoId,
      'scan',
      scan.id,
    ]);
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }
  get pagedDetailList(): DetailItem[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.detailList.slice(start, end);
  }
}
