import { Component, OnInit } from '@angular/core';
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
    <div class="callback-container">
      <!-- Loading State -->
      <div *ngIf="!error && !success" class="loading-state">
        <mat-spinner diameter="60"></mat-spinner>
        <h2>Đang xử lý đăng nhập...</h2>
        <p>Vui lòng đợi trong giây lát</p>
      </div>
      
      <!-- Success State -->
      <div *ngIf="success" class="success-state">
        <div class="success-icon">
          <mat-icon>check_circle</mat-icon>
        </div>
        <h2>Đăng nhập thành công!</h2>
        <p>Đang chuyển hướng...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-state">
        <div class="error-icon">
          <mat-icon>error</mat-icon>
        </div>
        <h2>Đăng nhập thất bại</h2>
        <p class="error-message">{{ error }}</p>
        
        <div class="error-actions">
          <button mat-raised-button color="primary" (click)="retryLogin()">
            <mat-icon>refresh</mat-icon>
            Thử lại
          </button>
          <button mat-stroked-button (click)="goHome()">
            <mat-icon>home</mat-icon>
            Về trang chủ
          </button>
        </div>

        <p class="auto-redirect" *ngIf="autoRedirectSeconds > 0">
          Tự động quay về trang chủ sau {{ autoRedirectSeconds }} giây...
        </p>
      </div>
    </div>
  `,
  styles: [`
    .callback-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .loading-state,
    .success-state,
    .error-state {
      background: white;
      border-radius: 16px;
      padding: 48px 40px;
      text-align: center;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .loading-state {
      mat-spinner {
        margin: 0 auto 24px;
      }

      h2 {
        color: #1e293b;
        margin: 0 0 12px 0;
        font-size: 24px;
        font-weight: 600;
      }

      p {
        color: #64748b;
        margin: 0;
        font-size: 14px;
      }
    }

    .success-state {
      .success-icon {
        margin: 0 auto 20px;
        
        mat-icon {
          font-size: 80px;
          width: 80px;
          height: 80px;
          color: #14AE5C;
          animation: scaleIn 0.5s ease-out;
        }
      }

      h2 {
        color: #14AE5C;
        margin: 0 0 12px 0;
        font-size: 24px;
        font-weight: 600;
      }

      p {
        color: #64748b;
        margin: 0;
        font-size: 14px;
      }
    }

    .error-state {
      .error-icon {
        margin: 0 auto 20px;
        
        mat-icon {
          font-size: 80px;
          width: 80px;
          height: 80px;
          color: #ef4444;
          animation: shake 0.5s ease-out;
        }
      }

      h2 {
        color: #ef4444;
        margin: 0 0 16px 0;
        font-size: 24px;
        font-weight: 600;
      }

      .error-message {
        color: #64748b;
        margin: 0 0 24px 0;
        font-size: 14px;
        line-height: 1.6;
        padding: 12px;
        background: #fef2f2;
        border-radius: 8px;
        border-left: 4px solid #ef4444;
      }

      .error-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-bottom: 16px;

        button {
          min-width: 140px;

          mat-icon {
            margin-right: 8px;
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }
      }

      .auto-redirect {
        color: #94a3b8;
        font-size: 12px;
        margin: 0;
      }
    }

    @keyframes scaleIn {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }

    @keyframes shake {
      0%, 100% {
        transform: translateX(0);
      }
      10%, 30%, 50%, 70%, 90% {
        transform: translateX(-10px);
      }
      20%, 40%, 60%, 80% {
        transform: translateX(10px);
      }
    }

    @media (max-width: 600px) {
      .callback-container {
        padding: 16px;
      }

      .loading-state,
      .success-state,
      .error-state {
        padding: 32px 24px;
      }

      .error-state .error-actions {
        flex-direction: column;

        button {
          width: 100%;
        }
      }
    }
  `]
})
export class AuthCallbackComponent implements OnInit {
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

      console.log('[AuthCallback] Params:', { code: !!code, state: !!state, error, errorDescription });

      // Kiểm tra lỗi từ Keycloak
      if (error) {
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

      // Hiển thị success state
      this.success = true;

      // Delay ngắn để user thấy success message
      setTimeout(() => {
        this.router.navigateByUrl(returnUrl);
      }, 1000);

    } catch (err: any) {
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
    const codeVerifier = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
      throw new Error('Không tìm thấy mã xác thực. Vui lòng thử đăng nhập lại.');
    }


    // Start auto redirect countdown
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
   * Retry login - redirect to login page with prompt
   */
  retryLogin(): void {
    console.log('[AuthCallback] Retrying login...');
    this.clearTimer();

    // Clear error state
    this.error = null;

    // Redirect to login with prompt to force re-authentication
    this.authService.login('/home');
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