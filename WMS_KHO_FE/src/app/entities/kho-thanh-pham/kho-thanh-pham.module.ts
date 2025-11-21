import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { XuatHangTheoDonBanHangComponent } from './xuat-hang-theo-don-ban-hang/xuat-hang-theo-don-ban-hang.component';
import { NhapKhoComponent } from './nhap-kho/nhap-kho.component';
import { ChuyenKhoComponent } from './chuyen-kho/chuyen-kho.component';
import { QuanLyKhoComponent } from './quan-ly-kho/quan-ly-kho.component';
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
import { PheDuyetComponent } from './nhap-kho/phe-duyet/phe-duyet.component';
import { ScanCheckComponent } from './nhap-kho/scan-check/scan-check.component';
import { ChiTietNhapKhoComponent } from './nhap-kho/chi-tiet-nhap-kho/chi-tiet-nhap-kho.component';
import { ScanCheckDialogComponent } from './quan-ly-kho/dialog/scan-check-dialog.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { AddYeuCauChuyenKhoComponent } from './chuyen-kho/add-new/add-new-chuyen-kho.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {ChuyenKhoDetailComponent} from "./chuyen-kho/detail/chuyen-kho-detail.component";
import { ScanDetailComponent } from './chuyen-kho/scanDetail/scan-detail.component';
import { ScanDetailXuatHangComponent } from './xuat-hang-theo-don-ban-hang/scanDetail/xuat-hang-scan-detail.component';
import { XuatHangDetailComponent } from './xuat-hang-theo-don-ban-hang/detail/xuat-hang-detail.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AddXuatHangTheoDonBanHangComponent } from './xuat-hang-theo-don-ban-hang/add-new/add-xuat-hang-theo-don-ban-hang.component';
import { ConfirmDialogComponent } from './chuyen-kho/dialog/confirm-dialog.component';
import { ConfirmDialogXuatHangComponent } from './xuat-hang-theo-don-ban-hang/dialog/confirm-dialog.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AlertDialogComponent } from './nhap-kho/dialog/alert-dialog.component';

@NgModule({
  declarations: [
    ChuyenKhoComponent,
    NhapKhoComponent,
    XuatHangTheoDonBanHangComponent,
    PheDuyetComponent,
    AlertDialogComponent,
    ChiTietNhapKhoComponent,
    // ScanCheckDialogComponent,
    QuanLyKhoComponent,
    ScanCheckComponent,
    AddYeuCauChuyenKhoComponent,
    ChuyenKhoDetailComponent,
    ScanDetailComponent,
    ScanDetailXuatHangComponent,
    XuatHangDetailComponent,
    AddXuatHangTheoDonBanHangComponent,
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    RouterLinkWithHref,
    MatSelectModule,
    FormsModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatAutocompleteModule,
    MatSnackBarModule,
    ConfirmDialogComponent,
    MatTooltipModule,
    ConfirmDialogXuatHangComponent,
  ],
  exports: [MatIconModule,MatTableModule, MatDialogModule, ConfirmDialogComponent],
})
export class KhoThanhPhamModule {}
