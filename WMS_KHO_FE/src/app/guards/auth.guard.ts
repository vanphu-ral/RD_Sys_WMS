import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const isLoggedIn = this.authService.isAuthenticated();
    const requiredRoles: string[] = route.data['roles'] || [];
    const userRoles: string[] = this.authService.getUserRoles();

    console.log('[AuthGuard] Checking route:', state.url, 'isLoggedIn:', isLoggedIn);

    // Chưa đăng nhập
    if (!isLoggedIn) {
      console.log('[AuthGuard] Not authenticated, trying silent login first...');

      // THÊM: Thử silent login trước
      const silentSuccess = await this.authService.trySilentLogin();

      if (silentSuccess) {
        console.log('[AuthGuard] Silent login successful, checking roles...');

        // Kiểm tra lại roles sau khi silent login thành công
        if (requiredRoles.length > 0) {
          const updatedRoles = this.authService.getUserRoles();
          const hasRole = requiredRoles.some(role => updatedRoles.includes(role));

          if (!hasRole) {
            console.warn('[AuthGuard] Access denied after silent login');
            this.router.navigate(['/unauthorized']);
            return false;
          }
        }

        console.log('[AuthGuard] Access granted after silent login');
        return true;
      }

      // Silent login thất bại, redirect đến login page
      console.log('[AuthGuard] Silent login failed, redirecting to login page');
      this.authService.initiateLogin(state.url);
      return false;
    }

    // Đã đăng nhập, kiểm tra roles
    if (requiredRoles.length > 0) {
      const hasRole = requiredRoles.some(role => userRoles.includes(role));

      if (!hasRole) {
        console.warn('[AuthGuard] Access denied. Required roles:', requiredRoles);
        console.warn('[AuthGuard] User roles:', userRoles);
        this.router.navigate(['/unauthorized']);
        return false;
      }
    }

    console.log('[AuthGuard] Access granted');
    return true;
  }
}