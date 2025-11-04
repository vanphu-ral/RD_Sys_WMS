import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SidebarService { 
toggled = false;
  
  menus = [
      {
      title: 'Quản lý Area',
      type: 'home',
      link: '/areas',
    },
    {
      title: 'Quản lý Locations',
      active: false,
      icon: 'location_on',
      type: 'location',
      link: '/location',
    },
    {
      title: 'Quản lý kho thành phẩm',
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
          link: '/bao-cao-thong-ke'
        },
        {
          title: 'Thống kê tồn kho'
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
