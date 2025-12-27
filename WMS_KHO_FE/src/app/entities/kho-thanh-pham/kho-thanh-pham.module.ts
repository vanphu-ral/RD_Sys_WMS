// kho-thanh-pham.module.ts - CẬP NHẬT

import { Injector, NgModule } from '@angular/core';
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
import { ChuyenKhoDetailComponent } from "./chuyen-kho/detail/chuyen-kho-detail.component";
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
import { HttpClientModule } from '@angular/common/http';

import { APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink } from 'apollo-angular/http';
import { InMemoryCache, ApolloClientOptions, ApolloLink } from '@apollo/client/core';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { InventoryGraphqlService } from './quan-ly-kho/service/inventory-graphql.service';
import { inject } from '@angular/core';
import { AuthService } from '../../services/auth.service'; 
import { Router } from '@angular/router';
// import { ApolloModule } from 'apollo-angular';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BoxListDialogComponent } from './nhap-kho/dialog/box-list-dialog.component';
import { MatDialogContent } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
  declarations: [
    ChuyenKhoComponent,
    NhapKhoComponent,
    XuatHangTheoDonBanHangComponent,
    PheDuyetComponent,
    AlertDialogComponent,
    ChiTietNhapKhoComponent,
    QuanLyKhoComponent,
    ScanCheckComponent,
    AddYeuCauChuyenKhoComponent,
    ChuyenKhoDetailComponent,
    ScanDetailComponent,
    ScanDetailXuatHangComponent,
    XuatHangDetailComponent,
    AddXuatHangTheoDonBanHangComponent,
    BoxListDialogComponent,
  ],
  imports: [
    CommonModule,
    MatDialogModule,
    RouterLinkWithHref,
    MatSelectModule,
    MatProgressBarModule,
    // ApolloModule,
    FormsModule,
    MatTabsModule,
    MatDialogContent,
    ZXingScannerModule,
    MatCheckboxModule,
    MatInputModule,
    MatFormFieldModule,
    HttpClientModule,
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
  exports: [MatIconModule, MatTableModule, MatDialogModule, ConfirmDialogComponent],
  providers: [
    InventoryGraphqlService,
  ]
})
export class KhoThanhPhamModule { }