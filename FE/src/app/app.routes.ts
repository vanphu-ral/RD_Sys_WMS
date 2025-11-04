import { Routes } from '@angular/router';
import { HomepageComponent } from './homepage/homepage.component';
import { ListMaterialComponent } from './modules/material/components/list-material/list-material.component';
import { MaterialUpdateRequestComponent } from './modules/material/components/material-update-request/material-update-request.component';
import { MaterialApprovalHistoryComponent } from './modules/material/components/material-approval-history/material-approval-history.component';
import { UpdateListComponent } from './modules/material/components/update-list/update-list.component';
import { AggregatedPartComponent } from './modules/material/components/aggregated-part/aggregated-part.component';
import { AreaManagementComponent } from './entities/area-component/area-management.component';
import { LocationManagementComponent } from './entities/location-management/location-management.component';
import { AddNewLocationComponentComponent } from './entities/location-management/add-new/add-new-location.component';
import { AddNewAreaComponentComponent } from './entities/area-component/add-new-area/add-new-area.component';
import { XuatHangTheoDonBanHangComponent } from './entities/kho-thanh-pham/xuat-hang-theo-don-ban-hang/xuat-hang-theo-don-ban-hang.component';
import { NhapKhoComponent } from './entities/kho-thanh-pham/nhap-kho/nhap-kho.component';
import { ChuyenKhoComponent } from './entities/kho-thanh-pham/chuyen-kho/chuyen-kho.component';
import { QuanLyKhoComponent } from './entities/kho-thanh-pham/quan-ly-kho/quan-ly-kho.component';
import { PheDuyetComponent } from './entities/kho-thanh-pham/nhap-kho/phe-duyet/phe-duyet.component';
import { ChiTietNhapKhoComponent } from './entities/kho-thanh-pham/nhap-kho/chi-tiet-nhap-kho/chi-tiet-nhap-kho.component';
import { ScanCheckComponent } from './entities/kho-thanh-pham/nhap-kho/scan-check/scan-check.component';
import { AddYeuCauChuyenKhoComponent } from './entities/kho-thanh-pham/chuyen-kho/add-new/add-new-chuyen-kho.component';
import { ChuyenKhoDetailComponent } from './entities/kho-thanh-pham/chuyen-kho/detail/chuyen-kho-detail.component';
import { ScanDetailComponent } from './entities/kho-thanh-pham/chuyen-kho/scanDetail/scan-detail.component';
import { ScanDetailXuatHangComponent } from './entities/kho-thanh-pham/xuat-hang-theo-don-ban-hang/scanDetail/xuat-hang-scan-detail.component';
import { XuatHangDetailComponent } from './entities/kho-thanh-pham/xuat-hang-theo-don-ban-hang/detail/xuat-hang-detail.component'; 
import { BaoCaoThongKeComponent } from './entities/bao-cao-thong-ke/bao-cao-thong-ke.component';


export const routes: Routes = [
  {
    path: 'areas',
    component: AreaManagementComponent,
    data: { tabLabel: 'Quản lý Area', isClosable: false },
  },
  {
    path: 'areas/add-new',
    component: AddNewAreaComponentComponent,
    data: { tabLabel: 'Thêm mới Areas', isClosable: false },
  },
  {
    path: 'areas/add-new:id',
    component: AddNewAreaComponentComponent,
    data: { tabLabel: 'Chỉnh sửa Area', isClosable: true },
  },
  {
    path: 'location',
    component: LocationManagementComponent,
    data: { tabLabel: 'Quản lý Locations', isClosable: false },
  },
  {
    path: 'location/add-new',
    component: AddNewLocationComponentComponent,
    data: { tabLabel: 'Thêm mới Locations', isClosable: false },
  },

  {
    path: 'kho-thanh-pham',
    children: [
      { path: 'chuyen-kho-noi-bo', component: ChuyenKhoComponent },
      {
        path: 'chuyen-kho-noi-bo/add-new',
        component: AddYeuCauChuyenKhoComponent,
        data: { tabLabel: 'Thêm mới yêu cầu chuyển kho', isClosable: true },
      },
      {
        path: 'chuyen-kho-noi-bo/detail/:id',
        component: ChuyenKhoDetailComponent,
        data: { tabLabel: 'Chi tiết yêu cầu chuyển kho', isClosable: true },
      },
      {
        path: 'chuyen-kho-noi-bo/detail/:id/scan/:id',
        component: ScanDetailComponent,
        data: { tabLabel: 'Chi tiết yêu cầu chuyển kho', isClosable: true },
      },
      { path: 'nhap-kho-sx', component: NhapKhoComponent },
      {
        path: 'nhap-kho-sx/phe-duyet/:id',
        component: PheDuyetComponent,
        data: { tabLabel: 'Phê duyệt nhập kho', isClosable: true },
      },
      {
        path: 'nhap-kho-sx/detail/:id',
        component: ChiTietNhapKhoComponent,
        data: { tabLabel: 'Chi tiết nhập kho', isClosable: true },
      },
      {
        path: 'nhap-kho-sx/scan/:id',
        component: ScanCheckComponent,
        data: { tabLabel: 'Quét mã', isClosable: true },
      },
      { path: 'quan-ly-kho', component: QuanLyKhoComponent },
      { path: 'xuat-don-ban-hang', component: XuatHangTheoDonBanHangComponent },
      {
        path: 'xuat-don-ban-hang/detail/:id',
        component: XuatHangDetailComponent,
        data: { tabLabel: 'Chi tiết yêu cầu xuất kho', isClosable: true },
      },
      {
        path: 'xuat-don-ban-hang/detail/:id/scan/:id',
        component: ScanDetailXuatHangComponent,
        data: { tabLabel: 'Scan yêu cầu xuát kho', isClosable: true },
      },

      { path: '', redirectTo: 'nhap-kho-sx', pathMatch: 'full' },
    ],
  },
  {
    path: 'bao-cao-thong-ke',
    component: BaoCaoThongKeComponent,
    data: { tabLabel: 'Báo cáo', isClosable: false },
  },
];
