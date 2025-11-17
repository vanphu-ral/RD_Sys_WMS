import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService { 
toggled = false;
  
  menus = [
      {
      title: 'Quản Lý Kho',
      type: 'home',
      link: '/areas',
    },
    {
      title: 'Quản Lý Vị Trí',
      active: false,
      icon: 'location_on',
      type: 'location',
      link: '/location',
    },
    {
      title: 'Quản Lý Kho Thành Phẩm',
      icon: 'home_work',
      active: false,
      type: 'dropdown',
      submenus: [
        {
          title: 'Yêu cầu nhập kho từ SX',
          link: '/kho-thanh-pham/nhap-kho-sx',
        },
        {
          title: 'Yêu cầu chuyển kho từ SX',
          link: '/kho-thanh-pham/chuyen-kho-noi-bo',
        },
        {
          title: 'Quản lý kho',
          link: '/kho-thanh-pham/quan-ly-kho',
        },
        {
          title: 'Xuất hàng theo đơn bán',
          link: '/kho-thanh-pham/xuat-don-ban-hang',
        },
      ]
    },
    {
      title: 'Báo cáo',
      active: false,
      icon: 'bar_chart',
      type: 'dropdown',
      submenus: [
        {
          title: 'Tổng hợp xuất/nhập tồn',
          link: '/bao-cao-thong-ke/tong-hop-xuat-nhap-ton'
        },
        {
          title: 'Thống kê tồn kho',
          link: '/bao-cao-thong-ke/thong-ke-ton-kho'
        }
      ]
    },
  ];
  constructor() { }

  toggle() {
    this.toggled = ! this.toggled;
  }

  getSidebarState() {
    return this.toggled;
  }

  setSidebarState(state: boolean) {
    this.toggled = state;
  }

  getMenuList() {
    return this.menus;
  }
}
