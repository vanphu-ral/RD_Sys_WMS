import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarService } from './sidebar/sidebar.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter, map, mergeMap } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';
import { MatMenuModule } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import {
  MatRippleModule,
  MAT_RIPPLE_GLOBAL_OPTIONS,
} from '@angular/material/core';
import { KhoThanhPhamModule } from './entities/kho-thanh-pham/kho-thanh-pham.module';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';

export interface TabLink {
  label: string;
  path: string;
  isClosable?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatIconModule,
    CommonModule,
    SidebarComponent,
    RouterModule,
    MatTabsModule,
    MatButtonModule,
    MatRippleModule,
    KhoThanhPhamModule,
    MatDivider,
    MatMenuModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: { disabled: true } },
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'WMS';
  links: TabLink[] = [];
  activeLink: TabLink | null = null;
  isSidebarCollapsed = false; // Trạng thái ban đầu của sidebar

  username = '';
  isLoggedIn = false;
  showMobileMenu = false;
  mobileSubmenuStates: { [key: string]: boolean } = {
    kho: false,
    baocao: false
  };

  private routerSubscription: Subscription | undefined;
  private authSubscription?: Subscription;
  private usernameSubscription?: Subscription;

  constructor(
    public sidebarservice: SidebarService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private apollo: Apollo,
    private authService: AuthService
  ) {
    console.log('[AppComponent] Apollo instance in constructor:', this.apollo); // Log để kiểm tra
  }
  // toggleSidebar() {
  //   this.sidebarservice.setSidebarState(!this.sidebarservice.getSidebarState());
  // }

  getSideBarState() {
    return this.sidebarservice.getSidebarState();
  }

  ngOnInit(): void {
    this.authSubscription = this.authService.isLoggedIn$.subscribe(
      (isLoggedIn) => {
        console.log('[AppComponent] Login state changed:', isLoggedIn);
        this.isLoggedIn = isLoggedIn;
      }
    );

    this.usernameSubscription = this.authService.username$.subscribe(
      (username) => {
        console.log('[AppComponent] Username changed:', username);
        this.username = username;
      }
    );

    // Router subscription (giữ nguyên code cũ)
    this.routerSubscription = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => {
          let route = this.activatedRoute;
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        }),
        filter((route) => route.outlet === 'primary'),
        mergeMap((route) =>
          route.data.pipe(
            map((data) => ({ path: this.router.url.split('?')[0], data }))
          )
        )
      )
      .subscribe((eventData) => {
        console.log('[AppComponent] Processing path for tab:', eventData.path);
        const path = eventData.path;
        const label =
          eventData.data['tabLabel'] || this.generateLabelFromPath(path);

        if (path && label && path !== '/') {
          this.addTab({
            path,
            label,
            isClosable:
              eventData.data['isClosable'] !== undefined
                ? eventData.data['isClosable']
                : true,
          });
        } else if (
          path === '/' &&
          this.links.length === 0 &&
          eventData.data['tabLabel']
        ) {
          this.addTab({
            path,
            label,
            isClosable:
              eventData.data['isClosable'] !== undefined
                ? eventData.data['isClosable']
                : true,
          });
        }
      });
  }
  ngOnDestroy(): void {
    // Cleanup subscriptions
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.usernameSubscription) {
      this.usernameSubscription.unsubscribe();
    }
  }
  //login
  checkLoginStatus(): void {
    this.isLoggedIn = !!localStorage.getItem('access_token');
    if (this.isLoggedIn) {
      this.username = localStorage.getItem('username') || 'User';
    }
  }
  //logout
  login() {
    this.authService.initiateLogin();
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/home']);
    });
  }

  private generateLabelFromPath(path: string): string {
    const submenus = [
      {
        title: 'Danh sách vật tư',
        link: 'material/list',
      },
      {
        title: 'Quản lý đề nghị cập nhật',
        link: 'material/update-request',
      },
      {
        title: 'Lịch sử phê duyệt',
        link: 'material/approval-history',
      },
      {
        title: 'Danh sách cập nhật',
        link: 'material/update-list',
      },
      {
        title: 'Tổng hợp vật tư',
        link: 'material/aggregated-part',
      },
    ];
    if (path === '' || path === '/') return 'Trang chủ';
    const normalizedPath = path.replace(/^\/|\/$/g, '');
    const menuItem = submenus.find((item) => item.link === normalizedPath);
    return menuItem ? menuItem.title : 'Trang chủ';
  }

  addTab(newLink: TabLink): void {
    const existingLink = this.links.find((link) => link.path === newLink.path);
    if (!existingLink) {
      this.links.push(newLink);
    }
    // Đặt tab mới hoặc tab hiện tại (nếu đã tồn tại) làm activeLink
    // Việc điều hướng đã xảy ra, nên chỉ cần cập nhật activeLink
    this.activeLink =
      this.links.find((link) => link.path === newLink.path) || null;
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }
  toggleMobileMenu() {
    this.showMobileMenu = !this.showMobileMenu;

    // Reset submenu states when closing
    if (!this.showMobileMenu) {
      this.resetMobileSubmenuStates();
    }

    // Prevent body scroll when menu is open
    if (this.showMobileMenu) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
  toggleMobileSubmenu(event: Event, key: string) {
    event.preventDefault();
    event.stopPropagation();
    this.mobileSubmenuStates[key] = !this.mobileSubmenuStates[key];
  }


  resetMobileSubmenuStates() {
    Object.keys(this.mobileSubmenuStates).forEach(key => {
      this.mobileSubmenuStates[key] = false;
    });
  }

  navigateToMobile(route: string) {
    this.router.navigate([route]);
    this.showMobileMenu = false;
    this.resetMobileSubmenuStates();
    document.body.style.overflow = '';
  }
  setActiveTabAndNavigate(tab: TabLink): void {
    this.activeLink = tab;
    this.router.navigate([tab.path]);
  }

  removeTab(tabToRemove: TabLink, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation(); // Ngăn sự kiện click lan truyền lên tab cha

    if (tabToRemove.isClosable === false) return; // Không cho đóng nếu isClosable là false

    const index = this.links.findIndex(
      (link) => link.path === tabToRemove.path
    );
    if (index > -1) {
      this.links.splice(index, 1);

      // Nếu tab đang hoạt động bị xóa
      if (this.activeLink && this.activeLink.path === tabToRemove.path) {
        if (this.links.length > 0) {
          // Chuyển sang tab liền trước (hoặc tab đầu tiên nếu tab bị xóa là tab đầu)
          const newActiveIndex = Math.max(
            0,
            Math.min(index, this.links.length - 1)
          );
          this.setActiveTabAndNavigate(this.links[newActiveIndex]);
        } else {
          // Nếu không còn tab nào, điều hướng về trang chủ hoặc trang mặc định
          this.activeLink = null;
          this.router.navigate(['/']); // Thay đổi '/' bằng route mặc định của bạn nếu cần
        }
      }
    }
  }
  info(): void {
    this.router.navigate(['/user-info']);
  }
}
