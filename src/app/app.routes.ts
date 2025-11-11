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
import { TongHopXuatNhapTonComponent } from './entities/bao-cao-thong-ke/tong-hop-xuat-nhap-ton/tong-hop-xuat-nhap-ton.component';
import { AddXuatHangTheoDonBanHangComponent } from './entities/kho-thanh-pham/xuat-hang-theo-don-ban-hang/add-new/add-xuat-hang-theo-don-ban-hang.component';
import { AuthGuard } from './guards/auth.guard';
import { AuthCallbackComponent } from './entities/auth-callback/auth-callback.component';
import { ThongKeTonKhoComponent } from './entities/bao-cao-thong-ke/thong-ke-ton-kho/thong-ke-ton-kho.component';
import { EncodedRedirectComponent } from './entities/encoded-redirect/encoded-redirect.component';
import { UserInfoComponent } from './user/user-info.component';
import { UnauthorizedComponent } from './entities/unauthorized/unauthorized.component';

export const routes: Routes = [
  {
    path: 'home',
    component: HomepageComponent,
    data: { tabLabel: 'Home', isClosable: false },
  },
  {
    path: 'auth/callback',
    component: AuthCallbackComponent,
  },
  {
    path: 'user-info',
    component: UserInfoComponent,
    canActivate: [AuthGuard],
    data: { tabLabel: 'Thông tin người dùng', isClosable: true },
  },
  {
    path: 'areas',
    component: AreaManagementComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Quản lý Area',
      isClosable: false,
      roles: ['WMS_RD_AREALOC', 'WMS_RD_ADMIN', 'WMS_RD_VIEW']
    }
  },
  {
    path: 'areas/add-new',
    component: AddNewAreaComponentComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Thêm mới Areas',
      isClosable: false,
      roles: ['WMS_RD_AREALOC', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'areas/add-new/:id',
    component: AddNewAreaComponentComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Chỉnh sửa Area',
      isClosable: true,
      roles: ['WMS_RD_AREALOC', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'location',
    component: LocationManagementComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Quản lý Locations',
      isClosable: false,
      roles: ['WMS_RD_AREALOC', 'WMS_RD_ADMIN', 'WMS_RD_VIEW']
    }
  },
  {
    path: 'location/add-new',
    component: AddNewLocationComponentComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Thêm mới Locations',
      isClosable: false,
      roles: ['WMS_RD_AREALOC', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'location/add-new/:id',
    component: AddNewLocationComponentComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Chỉnh sửa Locations',
      isClosable: false,
      roles: ['WMS_RD_AREALOC', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'kho-thanh-pham/chuyen-kho-noi-bo',
    component: ChuyenKhoComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Chuyển kho nội bộ',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN', 'WMS_RD_VIEW']
    }
  },
  {
    path: 'kho-thanh-pham/chuyen-kho-noi-bo/add-new',
    component: AddYeuCauChuyenKhoComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Thêm mới yêu cầu chuyển kho',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'kho-thanh-pham/chuyen-kho-noi-bo/detail/:id',
    component: ChuyenKhoDetailComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Chi tiết yêu cầu chuyển kho',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN', 'WMS_RD_VIEW']
    }
  },
  {
    path: 'kho-thanh-pham/chuyen-kho-noi-bo/detail/:id/scan',
    component: ScanDetailComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Scan chuyển kho',
      roles: ['WMS_RD_STOCKOPS', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'kho-thanh-pham/nhap-kho-sx',
    component: NhapKhoComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Nhập kho sản xuất',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN', 'WMS_RD_VIEW']
    }
  },
  {
    path: 'kho-thanh-pham/nhap-kho-sx/phe-duyet/:id',
    component: PheDuyetComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Phê duyệt nhập kho',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'kho-thanh-pham/nhap-kho-sx/detail/:id',
    component: ChiTietNhapKhoComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Chi tiết nhập kho',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN', 'WMS_RD_VIEW']
    }
  },
  {
    path: 'kho-thanh-pham/nhap-kho-sx/scan',
    component: ScanCheckComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Quét mã nhập kho',
      roles: ['WMS_RD_PUTAWAY', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'kho-thanh-pham/quan-ly-kho',
    component: QuanLyKhoComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Quản lý kho',
      roles: ['WMS_RD_STOCKOPS', 'WMS_RD_ADMIN', 'WMS_RD_VIEW']
    }
  },
  {
    path: 'kho-thanh-pham/xuat-don-ban-hang',
    component: XuatHangTheoDonBanHangComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Xuất đơn bán hàng',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN', 'WMS_RD_VIEW']
    }
  },
  {
    path: 'kho-thanh-pham/xuat-don-ban-hang/add-new',
    component: AddXuatHangTheoDonBanHangComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Thêm mới yêu cầu xuất kho',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'kho-thanh-pham/xuat-don-ban-hang/detail/:id',
    component: XuatHangDetailComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Chi tiết yêu cầu xuất kho',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN', 'WMS_RD_VIEW']
    }
  },
  {
    path: 'kho-thanh-pham/xuat-don-ban-hang/detail/:id/scan',
    component: ScanDetailXuatHangComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Scan xuất kho',
      roles: ['WMS_RD_STOCKOPS', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'bao-cao-thong-ke/tong-hop-xuat-nhap-ton',
    component: TongHopXuatNhapTonComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Tổng hợp xuất nhập tồn',
      roles: ['WMS_RD_VIEW', 'WMS_RD_ADMIN']
    }
  },
  {
    path: 'bao-cao-thong-ke/thong-ke-ton-kho',
    component: ThongKeTonKhoComponent,
    canActivate: [AuthGuard],
    data: {
      tabLabel: 'Thống kê tồn kho',
      roles: ['WMS_RD_VIEW', 'WMS_RD_ADMIN']
    }
  }
  ,
  {
    path: 'encoded/:encodedUrl',
    component: EncodedRedirectComponent,
  },
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    data: { tabLabel: 'Không có quyền truy cập', isClosable: true }
  }
];
