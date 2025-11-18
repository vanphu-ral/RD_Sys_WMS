import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-homepage',
  imports: [MatButtonModule, CommonModule],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
})
export class HomepageComponent implements OnInit {
  isLoggedIn = false;
  isLoggedIn$ = this.authService.isLoggedIn$;
  username$ = this.authService.username$;
  private isProcessingToken = false;
  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Kiểm tra đăng nhập từ AuthService
    this.isLoggedIn = this.authService.isAuthenticated();

    this.route.queryParams.subscribe((params) => {
      const code = params['code'];
      const error = params['error'];

      // Nếu có error
      if (error) {
        console.error('Keycloak error:', params['error_description']);
        alert('Lỗi đăng nhập: ' + params['error_description']);
        return;
      }

      if (code && !this.isProcessingToken) {
        console.log('[HomePage] Processing authorization code...');
        this.isProcessingToken = true;
        this.exchangeCodeForToken(code);
        return;
      }

      if (this.isLoggedIn && !code) {
        console.log('[HomePage] Already logged in, redirecting to areas...');
        this.router.navigate(['/home']);
      }
    });
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

          // Lưu token qua AuthService
          this.authService.setToken(
            response.access_token,
            response.refresh_token,
            response.id_token
          );
          this.isLoggedIn = true;
          // Lấy thông tin user
          this.getUserInfo(response.access_token);

          // Navigate về trang đã lưu hoặc areas
          const returnUrl = localStorage.getItem('returnUrl') || '/home';
          localStorage.removeItem('returnUrl');

          console.log('[HomePage] Navigating to:', returnUrl);

          // Xóa code khỏi URL và navigate
          setTimeout(() => {
            this.router.navigate([returnUrl], {
              replaceUrl: true, // QUAN TRỌNG: thay thế history thay vì push
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

          // Lưu username qua AuthService
          this.authService.setUsername(username);

          // Backup vào localStorage
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
  redirectToArea(): void {
    this.router.navigate(['/areas']);
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
