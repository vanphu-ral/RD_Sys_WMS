import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { take } from 'rxjs';

interface MenuItem {
  title: string;
  icon: string;
  route: string;
  description: string;
  roles: string[];
  color: string;
}

@Component({
  selector: 'app-homepage',
  imports: [MatButtonModule, MatIconModule, MatCardModule, CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})
export class HomepageComponent implements OnInit {
  isLoggedIn = false;
  isLoggedIn$ = this.authService.isLoggedIn$;
  username$ = this.authService.username$;
  private hasTriedSilentLogin = false;
  private isProcessingToken = false;
  isCheckingAuth = true;

  menuItems: MenuItem[] = [
    {
      title: 'Quản lý Kho',
      icon: 'map',
      route: '/areas',
      description: 'Quản lý các khu vực trong kho',
      roles: ['WMS_RD_AREALOC', 'WMS_RD_ADMIN', 'WMS_RD_VIEW'],
      color: '#2196F3'
    },
    {
      title: 'Quản lý Vị trí',
      icon: 'place',
      route: '/location',
      description: 'Quản lý vị trí lưu trữ',
      roles: ['WMS_RD_AREALOC', 'WMS_RD_ADMIN', 'WMS_RD_VIEW'],
      color: '#4CAF50'
    },
    {
      title: 'Nhập kho SX',
      icon: 'input',
      route: '/kho-thanh-pham/nhap-kho-sx',
      description: 'Nhập kho từ sản xuất',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN', 'WMS_RD_VIEW'],
      color: '#FF9800'
    },
    {
      title: 'Chuyển kho',
      icon: 'swap_horiz',
      route: '/kho-thanh-pham/chuyen-kho-noi-bo',
      description: 'Chuyển kho nội bộ',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN', 'WMS_RD_VIEW'],
      color: '#9C27B0'
    },
    {
      title: 'Quản lý Kho',
      icon: 'inventory_2',
      route: '/kho-thanh-pham/quan-ly-kho',
      description: 'Quản lý tồn kho',
      roles: ['WMS_RD_STOCKOPS', 'WMS_RD_ADMIN', 'WMS_RD_VIEW'],
      color: '#F44336'
    },
    {
      title: 'Xuất hàng',
      icon: 'local_shipping',
      route: '/kho-thanh-pham/xuat-don-ban-hang',
      description: 'Xuất hàng theo đơn bán',
      roles: ['WMS_RD_APPROVEIO', 'WMS_RD_ADMIN', 'WMS_RD_VIEW'],
      color: '#00BCD4'
    },
    {
      title: 'XNT',
      icon: 'assessment',
      route: '/bao-cao-thong-ke/tong-hop-xuat-nhap-ton',
      description: 'Tổng hợp xuất nhập tồn',
      roles: ['WMS_RD_VIEW', 'WMS_RD_ADMIN'],
      color: '#795548'
    },
    {
      title: 'Tồn kho',
      icon: 'bar_chart',
      route: '/bao-cao-thong-ke/thong-ke-ton-kho',
      description: 'Thống kê tồn kho',
      roles: ['WMS_RD_VIEW', 'WMS_RD_ADMIN'],
      color: '#607D8B'
    }
  ];

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) { }

  async ngOnInit(): Promise<void> {
    console.log('[HomePage] Initializing...');

    // Kiểm tra callback parameters trước
    const queryParams = await this.route.queryParams.pipe(take(1)).toPromise();
    const code = queryParams?.['code'];
    const error = queryParams?.['error'];

    if (error) {
      console.error('Keycloak error:', queryParams['error_description']);
      alert('Lỗi đăng nhập: ' + queryParams['error_description']);
      this.isCheckingAuth = false;
      return;
    }

    if (code && !this.isProcessingToken) {
      console.log('[HomePage] Processing authorization code...');
      this.isProcessingToken = true;
      this.exchangeCodeForToken(code);
      return;
    }

    // Kiểm tra đã authenticated chưa
    this.isLoggedIn = this.authService.isAuthenticated();

    // Nếu chưa login, thử silent login NGAY
    if (!this.isLoggedIn && !this.hasTriedSilentLogin) {
      console.log('[HomePage] Not authenticated, trying silent login...');
      this.hasTriedSilentLogin = true;

      try {
        const silentSuccess = await this.authService.trySilentLogin();

        if (silentSuccess) {
          console.log('[HomePage] Silent login successful - Auto logged in from SSO');

          // Delay để token được lưu
          await new Promise(resolve => setTimeout(resolve, 500));

          // CẬP NHẬT STATE quan trọng
          this.isLoggedIn = this.authService.isAuthenticated();

          console.log('[HomePage] User auto-authenticated, isLoggedIn:', this.isLoggedIn);
        } else {
          console.log('[HomePage] Silent login failed - User needs to click login button');
        }
      } catch (error) {
        console.error('[HomePage] Silent login error:', error);
      }
    } else if (this.isLoggedIn) {
      console.log('[HomePage] Already logged in');
    }

    // Kết thúc checking
    this.isCheckingAuth = false;
  }

  exchangeCodeForToken(code: string): void {
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', window.location.origin + '/home');
    body.set('client_id', 'RD_KHO');

    console.log('[HomePage] Exchanging code for token...');

    this.http
      .post(
        'https://ssosys.rangdong.com.vn:9002/realms/rangdong/protocol/openid-connect/token',
        body.toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      )
      .subscribe({
        next: (response: any) => {
          console.log('[HomePage] Token received successfully');

          this.authService.setToken(
            response.access_token,
            response.refresh_token,
            response.id_token
          );
          this.isLoggedIn = true;
          this.getUserInfo(response.access_token);

          const returnUrl = localStorage.getItem('returnUrl') || '/home';
          localStorage.removeItem('returnUrl');

          console.log('[HomePage] Navigating to:', returnUrl);

          setTimeout(() => {
            this.router.navigate([returnUrl], {
              replaceUrl: true,
            });
          }, 500);
        },
        error: (err) => {
          console.error('[HomePage] Error exchanging token:', err);
          alert('Đăng nhập thất bại. Vui lòng thử lại.');
          this.isProcessingToken = false;
        },
      });
  }

  getUserInfo(accessToken: string): void {
    this.http
      .get(
        'https://ssosys.rangdong.com.vn:9002/realms/rangdong/protocol/openid-connect/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .subscribe({
        next: (userInfo: any) => {
          console.log('[HomePage] User info received:', userInfo);
          const username =
            userInfo.preferred_username || userInfo.name || 'User';

          this.authService.setUsername(username);
          localStorage.setItem('user_info', JSON.stringify(userInfo));
        },
        error: (err) => {
          console.error('[HomePage] Error getting user info:', err);
        },
      });
  }

  redirectToLogin(): void {
    const clientId = 'RD_KHO';
    const realm = 'rangdong';
    const redirectUri = encodeURIComponent(window.location.origin + '/home');
    const loginUrl = `https://ssosys.rangdong.com.vn:9002/realms/${realm}/protocol/openid-connect/auth?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=openid`;

    console.log('[HomePage] Redirecting to login:', loginUrl);
    window.location.href = loginUrl;
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  login() {
    this.authService.initiateLogin();
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/home']);
    });
  }
}