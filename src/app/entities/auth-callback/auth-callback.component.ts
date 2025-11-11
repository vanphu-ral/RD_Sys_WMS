import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
      <div *ngIf="!error" style="text-align: center;">
        <div class="spinner"></div>
        <h2 style="color: #333; margin: 20px 0;">Đang xử lý đăng nhập...</h2>
        <p style="color: #666;">Vui lòng đợi trong giây lát</p>
      </div>
      
      <div *ngIf="error" style="text-align: center; padding: 20px; background: #fee; border-radius: 8px; max-width: 500px;">
        <h2 style="color: #d32f2f; margin-bottom: 15px;"> Lỗi đăng nhập</h2>
        <p style="color: #666; margin-bottom: 20px;">{{ error }}</p>
        <button 
          (click)="goHome()" 
          style="padding: 12px 24px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
          Quay về trang chủ
        </button>
      </div>
    </div>
  `,
  styles: [`
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #1976d2;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    button:hover {
      background: #1565c0 !important;
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    try {
      // Lấy code và state từ URL query params
      const code = this.route.snapshot.queryParamMap.get('code');
      const state = this.route.snapshot.queryParamMap.get('state');
      const error = this.route.snapshot.queryParamMap.get('error');
      const errorDescription = this.route.snapshot.queryParamMap.get('error_description');

      // Kiểm tra lỗi từ Keycloak
      if (error) {
        throw new Error(`Keycloak error: ${error}${errorDescription ? ' - ' + errorDescription : ''}`);
      }

      // Kiểm tra code và state
      if (!code || !state) {
        throw new Error('Missing authorization code or state parameter');
      }

      console.log('[AuthCallback] Processing OAuth callback...');

      // Xử lý callback và đổi code lấy token
      const returnUrl = await this.authService.handleCallback(code, state);

      console.log('[AuthCallback]  Login successful! Redirecting to:', returnUrl);

      // Delay ngắn để user thấy success message
      setTimeout(() => {
        this.router.navigateByUrl(returnUrl);
      }, 500);

    } catch (err: any) {
      console.error('[AuthCallback]  Error:', err);
      this.error = err.message || 'Đã xảy ra lỗi trong quá trình đăng nhập. Vui lòng thử lại.';
      
      // Tự động quay về home sau 5 giây khi có lỗi
      setTimeout(() => {
        this.goHome();
      }, 5000);
    }
  }

  goHome() {
    this.router.navigate(['/home']);
  }
}