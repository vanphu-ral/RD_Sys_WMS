import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column; font-family: Arial, sans-serif;">
      
      <!-- Loading State -->
      <div *ngIf="!error && !success" style="text-align: center;">
        <div class="spinner"></div>
        <h2 style="color: #333; margin: 20px 0;">Đang xử lý đăng nhập...</h2>
        <p style="color: #666;">Vui lòng đợi trong giây lát</p>
      </div>

      <!-- Success State -->
      <div *ngIf="success" style="text-align: center;">
        <div class="success-icon">✓</div>
        <h2 style="color: #4caf50; margin: 20px 0;">Đăng nhập thành công!</h2>
        <p style="color: #666;">Đang chuyển hướng...</p>
      </div>
      
      <!-- Error State -->
      <div *ngIf="error" style="text-align: center; padding: 20px; background: #fee; border-radius: 8px; max-width: 500px;">
        <div class="error-icon">✕</div>
        <h2 style="color: #d32f2f; margin-bottom: 15px;">Lỗi đăng nhập</h2>
        <p style="color: #666; margin-bottom: 20px;">{{ error }}</p>
        
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
          <button 
            (click)="retryLogin()" 
            style="padding: 12px 24px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
            🔄 Thử lại
          </button>
          <button 
            (click)="goHome()" 
            style="padding: 12px 24px; background: #757575; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">
            🏠 Về trang chủ
          </button>
        </div>

        <p *ngIf="autoRedirectSeconds > 0" style="color: #999; margin-top: 15px; font-size: 12px;">
          Tự động quay về trang chủ sau {{ autoRedirectSeconds }} giây...
        </p>
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

    .success-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #4caf50;
      color: white;
      font-size: 36px;
      line-height: 60px;
      margin: 0 auto 20px;
      animation: scaleIn 0.5s ease-out;
    }

    .error-icon {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: #f44336;
      color: white;
      font-size: 36px;
      line-height: 60px;
      margin: 0 auto 20px;
      animation: shake 0.5s ease-out;
    }

    @keyframes scaleIn {
      0% { transform: scale(0); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-10px); }
      75% { transform: translateX(10px); }
    }

    button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.2s;
    }
  `]
})
export class AuthCallbackComponent implements OnInit, OnDestroy {
  error: string | null = null;
  success: boolean = false;
  autoRedirectSeconds: number = 0;
  private autoRedirectTimer: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  async ngOnInit() {
    try {
      // Lấy params từ URL
      const code = this.route.snapshot.queryParamMap.get('code');
      const state = this.route.snapshot.queryParamMap.get('state');
      const error = this.route.snapshot.queryParamMap.get('error');
      const errorDescription = this.route.snapshot.queryParamMap.get('error_description');

      const isSilentLogin = sessionStorage.getItem('silent_login') === 'true';

      console.log('[AuthCallback] Params:', {
        hasCode: !!code,
        hasState: !!state,
        error,
        errorDescription,
        isSilentLogin
      });

      // Kiểm tra lỗi từ Keycloak
      if (error) {
        if (isSilentLogin) {
          if (error === 'login_required' || error === 'interaction_required') {
            console.log('[AuthCallback] Silent login failed - user interaction required');
            window.parent.postMessage({ type: 'SILENT_LOGIN_FAILED' }, window.location.origin);
            return;
          }
        }
        throw new Error(this.getErrorMessage(error, errorDescription));
      }

      // Kiểm tra code và state
      if (!code || !state) {
        throw new Error('Thiếu thông tin xác thực. Vui lòng thử đăng nhập lại.');
      }

      console.log('[AuthCallback] Processing OAuth callback...');

      // Xử lý callback và đổi code lấy token
      const returnUrl = await this.authService.handleCallback(code, state);

      console.log('[AuthCallback] Login successful! Redirecting to:', returnUrl);

      //Nếu là silent login, gửi message về parent window
      if (isSilentLogin) {
        window.parent.postMessage({ type: 'SILENT_LOGIN_SUCCESS' }, window.location.origin);
        return;
      }

      // Hiển thị success state
      this.success = true;

      // Delay ngắn để user thấy success message
      setTimeout(() => {
        this.router.navigateByUrl(returnUrl);
      }, 1000);

    } catch (err: any) {

      //Nếu là silent login và có lỗi
      const isSilentLogin = sessionStorage.getItem('silent_login') === 'true';
      if (isSilentLogin) {
        window.parent.postMessage({ type: 'SILENT_LOGIN_FAILED' }, window.location.origin);
        return;
      }
      console.error('[AuthCallback] Error:', err);
      this.handleError(err);
    }
  }

  /**
   * Xử lý lỗi và hiển thị thông báo
   */
  private handleError(err: any): void {
    // Parse error message
    this.error = err.message || 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';

    // Clear any existing auth data
    this.authService.clearAuthData();

    // Start auto redirect countdown (10 giây)
    this.autoRedirectSeconds = 10;
    this.autoRedirectTimer = setInterval(() => {
      this.autoRedirectSeconds--;
      if (this.autoRedirectSeconds <= 0) {
        this.clearTimer();
        this.goHome();
      }
    }, 1000);
  }

  /**
   * Get user-friendly error message
   */
  private getErrorMessage(error: string, description: string | null): string {
    const errorMessages: Record<string, string> = {
      'access_denied': 'Bạn đã từ chối quyền truy cập. Vui lòng thử lại và chấp nhận để tiếp tục.',
      'invalid_request': 'Yêu cầu không hợp lệ. Vui lòng thử đăng nhập lại.',
      'unauthorized_client': 'Ứng dụng không được phép. Vui lòng liên hệ quản trị viên.',
      'unsupported_response_type': 'Lỗi cấu hình. Vui lòng liên hệ quản trị viên.',
      'invalid_scope': 'Quyền truy cập không hợp lệ. Vui lòng liên hệ quản trị viên.',
      'server_error': 'Lỗi máy chủ. Vui lòng thử lại sau.',
      'temporarily_unavailable': 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
    };

    const message = errorMessages[error] || description || 'Đã xảy ra lỗi trong quá trình đăng nhập.';
    return message;
  }

  /**
   * Retry login - redirect to login page
   */
  retryLogin(): void {
    console.log('[AuthCallback] Retrying login...');
    this.clearTimer();
    this.error = null;

    // Gọi initiateLogin để redirect đến Keycloak login
    this.authService.initiateLogin('/home');
  }

  /**
   * Go back to home page
   */
  goHome(): void {
    console.log('[AuthCallback] Navigating to home...');
    this.clearTimer();
    this.router.navigate(['/home'], { replaceUrl: true });
  }

  /**
   * Clear auto redirect timer
   */
  private clearTimer(): void {
    if (this.autoRedirectTimer) {
      clearInterval(this.autoRedirectTimer);
      this.autoRedirectTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }
}