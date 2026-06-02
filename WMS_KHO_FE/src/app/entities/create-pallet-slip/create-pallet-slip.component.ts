import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { RouterLinkWithHref } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

export interface PalletSlipForm {
  khachHang: string;
  tenSanPham: string;
  poNumber: string;
  itemSku: string;
  nganh: string;
  to: string;
  soQdsx: string;
  ngaySanXuat: Date | null;
  dateCode: string;
  slSanPhamPallet: number | null;
  slSpThung: number | null;
  slThungPallet: number | null;
  thuTuGia: number | null;
  nguoiKiemTra: string;
  kqKiemTra: string;
  ghiChu: string;
}
export interface ProductionTeam {
  id: number;
  branchCode: string;
  productionTeamCode: string;
  productionTeamName: string;
}

export interface Branch {
  id: number;
  workshopCode: string;
  branchCode: string;
  branchName: string;
  productionTeams: ProductionTeam[];
}

export interface Workshop {
  id: number;
  workshopCode: string;
  workShopName: string;
  description: string | null;
  branchs: Branch[];
}
@Component({
  selector: 'app-create-pallet-slip',
  imports: [
    MatIconModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatSelectModule,
    CommonModule,
    RouterLinkWithHref,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './create-pallet-slip.component.html',
  styleUrl: './create-pallet-slip.component.scss',
})
export class CreatePalletSlipComponent {

  soLuongPhieu = 1;

  readonly workshopData: Workshop[] = [
    {
      id: 1, workshopCode: '01', workShopName: 'Xưởng LED DT & TBCS', description: null,
      branchs: [
        {
          id: 1, workshopCode: '01', branchCode: 'DTTD', branchName: 'Điện tử tự động', productionTeams: [
            { id: 1, branchCode: 'DTTD', productionTeamCode: 'Tổ SMT', productionTeamName: 'SMT' },
            { id: 2, branchCode: 'DTTD', productionTeamCode: 'THT', productionTeamName: 'Tổ THT' },
            { id: 3, branchCode: 'DTTD', productionTeamCode: 'LK1', productionTeamName: 'Tổ LK 1' },
            { id: 4, branchCode: 'DTTD', productionTeamCode: 'LK2', productionTeamName: 'Tổ LK 2' },
          ]
        },
        {
          id: 2, workshopCode: '01', branchCode: 'CNPT', branchName: 'Công nghệ phụ trợ', productionTeams: [
            { id: 5, branchCode: 'CNPT', productionTeamCode: 'BTP1', productionTeamName: 'Tổ BTP 1' },
            { id: 6, branchCode: 'CNPT', productionTeamCode: 'BTP2', productionTeamName: 'Tổ BTP 2' },
          ]
        },
        {
          id: 3, workshopCode: '01', branchCode: 'LR LED', branchName: 'Lắp ráp sản phẩm LED', productionTeams: [
            { id: 7, branchCode: 'LR LED', productionTeamCode: 'LR LED1', productionTeamName: 'LR LED1' },
            { id: 8, branchCode: 'LR LED', productionTeamCode: 'LR LED2', productionTeamName: 'LR LED2' },
            { id: 9, branchCode: 'LR LED', productionTeamCode: 'LR LED3', productionTeamName: 'LR LED3' },
            { id: 10, branchCode: 'LR LED', productionTeamCode: 'LR LED4', productionTeamName: 'LR LED4' },
            { id: 11, branchCode: 'LR LED', productionTeamCode: 'LR LED5', productionTeamName: 'LR LED5' },
          ]
        },
        {
          id: 4, workshopCode: '01', branchCode: 'TBCS', branchName: 'LED2-Thiết bị chiếu sáng', productionTeams: [
            { id: 12, branchCode: 'TBCS', productionTeamCode: 'LRTBCS1', productionTeamName: 'LRTBCS1' },
            { id: 13, branchCode: 'TBCS', productionTeamCode: 'LRTBCS2', productionTeamName: 'LRTBCS2' },
            { id: 14, branchCode: 'TBCS', productionTeamCode: 'LRTBCS3', productionTeamName: 'LRTBCS3' },
          ]
        },
        {
          id: 5, workshopCode: '01', branchCode: 'SMART', branchName: 'Smart lighting', productionTeams: [
            { id: 15, branchCode: 'SMART', productionTeamCode: 'SMART 1', productionTeamName: 'SMART 1' },
            { id: 16, branchCode: 'SMART', productionTeamCode: 'SMART 2', productionTeamName: 'SMART 2' },
            { id: 17, branchCode: 'SMART', productionTeamCode: 'SMART 3', productionTeamName: 'SMART 3' },
          ]
        },
      ]
    },
    { id: 2, workshopCode: '02', workShopName: 'Xưởng Phích nước thủy tinh', description: null, branchs: [] },
  ];

  formData: PalletSlipForm = {
    khachHang: '',
    tenSanPham: '',
    poNumber: '',
    itemSku: '',
    nganh: '',
    to: '',
    soQdsx: '',
    ngaySanXuat: null,
    dateCode: '',
    slSanPhamPallet: null,
    slSpThung: null,
    slThungPallet: null,
    thuTuGia: 1,
    nguoiKiemTra: '',
    kqKiemTra: '',
    ghiChu: '',
  };

  constructor(private snackBar: MatSnackBar) { }

  onTaoPhieu(): void {
    if (!this.formData.khachHang || !this.formData.tenSanPham || !this.formData.poNumber) {
      this.snackBar.open('Vui lòng điền đầy đủ các trường bắt buộc!', 'Đóng', {
        duration: 3000,
      });
      return;
    }
    const count = this.soLuongPhieu || 1;
    // TODO: integrate jsPDF + html2canvas on #palletSlip element
    this.snackBar.open(`Đang tạo ${count} phiếu...`, 'OK', { duration: 3000 });
  }
  get allBranches(): Branch[] {
    return this.workshopData.flatMap(w => w.branchs);
  }

  // Tổ lọc theo ngành đang chọn
  get filteredTeams(): ProductionTeam[] {
    if (!this.formData.nganh) return [];
    return this.allBranches
      .find(b => b.branchCode === this.formData.nganh)
      ?.productionTeams ?? [];
  }

  // Khi đổi ngành → reset tổ
  onNganhChange(): void {
    this.formData.to = '';
  }
}