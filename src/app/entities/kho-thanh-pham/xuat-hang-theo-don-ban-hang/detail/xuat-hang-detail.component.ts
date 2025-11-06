import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
export interface DetailItem {
    id: number;
    productName: string;
    from: string;
    to: number;
    quantity: number;
    unit: string;
}
@Component({
    selector: 'app-nhap-kho-component',
    standalone: false,
    templateUrl: './xuat-hang-detail.component.html',
    styleUrl: './xuat-hang-detail.component.scss',
})
export class XuatHangDetailComponent implements OnInit {
    id: number | undefined;
    displayedColumns: string[] = ['stt', 'productName', 'from', 'to', 'quantity', 'unit'];
    currentPage = 1;
    totalPages = 9;
    detailList: DetailItem[] = [
        { id: 1, productName: 'KHHTTK-202510W5', from: 'KHTT', to: 10, quantity: 10, unit: 'Cái' },
    ];
    constructor(private route: ActivatedRoute, private router: Router) { }
    ngOnInit(): void {
        this.id = +this.route.snapshot.paramMap.get('id')!;
        console.log('ID nhận được:', this.id);
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
            '/kho-thanh-pham/xuat-don-ban-hang/detail',
            chuyenKhoId,
            'scan',
            scan.id
        ]);
    }
      back():void{
    this.router.navigate(['/kho-thanh-pham/xuat-don-ban-hang'], {
      state: { detailList: this.detailList },
    });
  }
}