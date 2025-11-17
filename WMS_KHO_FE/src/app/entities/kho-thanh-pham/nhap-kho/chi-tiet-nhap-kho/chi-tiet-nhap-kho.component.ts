import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
export interface MainInfo {
  maPO: string;
  maSanPham: string;
  maKhachHang: string;
  tenSanPham: string;
  soPallet: number;
  soThung: number;
  soLuongSP: number;
  maWO: number;
  soLOT: string;
  ngayNhap: string;
  ghiChu: string;
}

export interface DetailItem {
  palletCode: string;
  boxCode: string;
  soPallet: number;
}
@Component({
  selector: 'app-nhap-kho-component',
  standalone: false,
  templateUrl: './chi-tiet-nhap-kho.component.html',
  styleUrl: './chi-tiet-nhap-kho.component.scss',
})
export class ChiTietNhapKhoComponent implements OnInit {
  nhapKhoId: number | undefined;
  currentPage = 1;
  totalPages = 9;
  displayedColumns: string[] = ['stt', 'palletCode', 'boxCode', 'soPallet'];
  mainInfo: MainInfo = {
    maPO: '253233',
    maSanPham: 'KHHTTK-202510W5',
    maKhachHang: 'KHTT',
    tenSanPham: 'Đèn LED chiếu pha 6500k',
    soPallet: 10,
    soThung: 10,
    soLuongSP: 10,
    maWO: 10,
    soLOT: '2025207564OA',
    ngayNhap: '29/10/2025',
    ghiChu: 'Ghi chú',
  };

  detailList: DetailItem[] = [
    { palletCode: 'KHHTTK-202510W5', boxCode: 'KHTT', soPallet: 10 },
    { palletCode: 'KHHTTK-202510W5', boxCode: 'KHTT', soPallet: 10 },
    { palletCode: 'KHHTTK-202510W5', boxCode: 'KHTT', soPallet: 10 },
    { palletCode: 'KHHTTK-202510W5', boxCode: 'KHTT', soPallet: 10 },
    { palletCode: 'KHHTTK-202510W5', boxCode: 'KHTT', soPallet: 10 },
  ];

  constructor(private route: ActivatedRoute, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.nhapKhoId = +params['id'];
    });

    this.route.queryParams.subscribe((queryParams) => {
      console.log('Mã sản phẩm:', queryParams['maSanPham']);
      console.log('Status:', queryParams['status']);
    });
  }

  loadData(): void {
    // TODO: Load data from service using nhapKhoId
    // this.nhapKhoService.getById(this.nhapKhoId).subscribe(data => {
    //   this.mainInfo = data.mainInfo;
    //   this.detailList = data.detailList;
    // });
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

  onCancel(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }

  onSelectWarehouse(): void {
    // TODO: Open dialog or navigate to warehouse selection
    console.log('Chọn kho nhập');
  }

  onConfirm(): void {
   this.snackBar.open('Lưu thành công!', 'Đóng', {
      duration: 3000,
      horizontalPosition: 'right',
      verticalPosition: 'bottom', 
      panelClass: ['snackbar-success', 'snackbar-position'],
    });
  }
  goBack(): void {
    this.router.navigate(['/kho-thanh-pham/nhap-kho-sx']);
  }
}
